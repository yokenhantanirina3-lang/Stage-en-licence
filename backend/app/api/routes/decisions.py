from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import date

from app.core.database import get_db
from app.core.deps import get_current_user, require_role
from app.models.user import User
from app.models.reclamation import (
    Reclamation,
    Decision,
    StatutReclamationEnum,
    StatutDecisionEnum,
    TypeDecisionEnum,
    ActionHistorique,
    TypeActionEnum,
)
from app.schemas.reclamation import (
    DecisionCreate,
    DecisionRead,
    DecisionUpdate,
    SoumettreValidation,
    ValiderDecision,
    VisDecision,
    SignerDecision,
)

router = APIRouter()


async def _get_reclamation(db: AsyncSession, reclamation_id: int) -> Reclamation:
    result = await db.execute(
        select(Reclamation).where(Reclamation.id == reclamation_id)
    )
    reclamation = result.scalar_one_or_none()
    if not reclamation:
        raise HTTPException(status_code=404, detail="Reclamation introuvable")
    return reclamation


async def _get_decision(db: AsyncSession, decision_id: int) -> Decision:
    result = await db.execute(select(Decision).where(Decision.id == decision_id))
    decision = result.scalar_one_or_none()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision introuvable")
    return decision


def _check_transition(decision: Decision, *statuts: StatutDecisionEnum) -> None:
    if decision.statut not in statuts:
        labels = ", ".join(s.value for s in statuts)
        raise HTTPException(
            status_code=400,
            detail=f"Statut actuel {decision.statut.value}, transition autorisee seulement depuis : {labels}",
        )


async def _envoyer_email_notification(
    db: AsyncSession,
    reclamation: Reclamation,
    full,
    decision_plein,
) -> bool:
    try:
        from app.core.config import settings
        from app.tasks import notifications as notifications_mod
        from app.services import minio_service

        if not settings.SMTP_HOST:
            return False

        contribuable = getattr(full, "contribuable", None) or getattr(
            reclamation, "contribuable", None
        )
        email = getattr(contribuable, "email", None)
        if not email:
            return False

        nom = (
            getattr(contribuable, "nom_raison_sociale", None)
            or ("{} {}".format(
                getattr(contribuable, "prenom", "") or "",
                getattr(contribuable, "nom", "") or "",
            ).strip())
        )

        octets, nom_pdf = b"", ""
        chemin = getattr(decision_plein, "chemin_pdf", None)
        if chemin:
            try:
                octets = minio_service.download_bytes(chemin)
                nom_pdf = f"decision_{reclamation.numero_dossier}.pdf"
            except Exception:
                octets = b""

        corps = (
            f"Bonjour {nom},\n\n"
            f"Votre reclamation {reclamation.numero_dossier} a fait l'objet d'une decision "
            f"notifiee le {date.today().strftime('%d/%m/%Y')}.\n"
            "Vous la trouverez en piece jointe a ce message, ou vous pouvez en suivre "
            "l'etat via le portail public du centre fiscal.\n\n"
            "Cordialement,\nLe centre fiscal"
        )
        attachments = [(nom_pdf, octets, "application/pdf")] if octets else None

        try:
            notifications_mod.send_email.delay(
                to=email,
                subject=f"{settings.EMAIL_SUJET_PREFIXE} Decision - dossier {reclamation.numero_dossier}",
                body=corps,
                attachments=attachments,
            )
        except Exception as broker_error:
            print(f"[WARN] Broker indisponible, envoi synchrone: {broker_error}")
            await notifications_mod._envoyer_email_async(
                to=email,
                subject=f"{settings.EMAIL_SUJET_PREFIXE} Decision - dossier {reclamation.numero_dossier}",
                body=corps,
                attachments=attachments,
            )
        return True
    except Exception as exc:
        print(f"[WARN] Envoi de l'email de notification impossible: {exc}")
        return False


async def _log(
    db: AsyncSession,
    reclamation: Reclamation,
    agent_id: int,
    action: TypeActionEnum,
    commentaire: str,
) -> None:
    db.add(
        ActionHistorique(
            id_reclamation=reclamation.id,
            id_agent=agent_id,
            action=action,
            commentaire=commentaire,
        )
    )
    await db.flush()


@router.get("/reclamations/{reclamation_id}/decision", response_model=DecisionRead)
async def get_decision(
    reclamation_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await _get_reclamation(db, reclamation_id)
    result = await db.execute(
        select(Decision).where(Decision.id_reclamation == reclamation_id)
    )
    decision = result.scalar_one_or_none()
    if not decision:
        raise HTTPException(status_code=404, detail="Aucune decision pour cette reclamation")
    return decision


@router.post(
    "/reclamations/{reclamation_id}/decision",
    response_model=DecisionRead,
    status_code=201,
)
async def create_decision(
    reclamation_id: int,
    data: DecisionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN", "INSTRUCTEUR")),
):
    reclamation = await _get_reclamation(db, reclamation_id)

    if reclamation.statut not in (
        StatutReclamationEnum.EN_INSTRUCTION,
        StatutReclamationEnum.EN_ATTENTE_PIECES,
        StatutReclamationEnum.PROJET_REPONSE,
    ):
        raise HTTPException(
            status_code=400,
            detail=f"Statut {reclamation.statut.value} ne permet pas la redaction d'une decision",
        )

    try:
        type_decision = TypeDecisionEnum(data.type_decision)
    except ValueError:
        raise HTTPException(status_code=400, detail="Type de decision invalide")

    existing = await db.execute(
        select(Decision).where(Decision.id_reclamation == reclamation_id)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Une decision existe deja")

    montant_total = data.montant_accorde + data.montant_rejete
    if data.type_decision == TypeDecisionEnum.ADMIS_TOTAL.value and data.montant_rejete > 0:
        raise HTTPException(status_code=400, detail="Montant rejete incoherent avec ADMIS_TOTAL")
    if data.type_decision == TypeDecisionEnum.REJETE.value and data.montant_accorde > 0:
        raise HTTPException(status_code=400, detail="Montant accorde incoherent avec REJETE")

    decision = Decision(
        id_reclamation=reclamation_id,
        type_decision=type_decision,
        fondement_juridique=data.fondement_juridique,
        motivation=data.motivation,
        montant_accorde=data.montant_accorde,
        montant_rejete=data.montant_rejete,
        date_decision=date.today(),
        id_redacteur=current_user.id,
        statut=StatutDecisionEnum.BROUILLON,
    )
    db.add(decision)

    reclamation.statut = StatutReclamationEnum.PROJET_REPONSE
    await _log(db, reclamation, current_user.id, TypeActionEnum.REDACTION,
               f"Projet de decision {type_decision.value} redige")
    await db.flush()

    return decision


@router.patch("/decisions/{decision_id}", response_model=DecisionRead)
async def update_decision(
    decision_id: int,
    data: DecisionUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN", "INSTRUCTEUR")),
):
    decision = await _get_decision(db, decision_id)
    _check_transition(decision, StatutDecisionEnum.BROUILLON)

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(decision, field, value)
    await db.flush()

    return decision


@router.get("/decisions/{decision_id}/pdf")
async def telecharger_pdf_decision(
    decision_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN", "CHEF", "DIRECTEUR", "SAISIE")),
):
    decision = await _get_decision(db, decision_id)
    if not decision.chemin_pdf:
        raise HTTPException(status_code=404, detail="PDF de decision non genere")

    from app.services import minio_service

    chemin = decision.chemin_pdf
    if chemin.startswith("local:"):
        filename = chemin.split(":", 1)[1]
        filepath = minio_service.get_local_file(filename)
        if not filepath.exists():
            raise HTTPException(status_code=404, detail="Fichier absent du disque")
        return FileResponse(
            path=str(filepath),
            filename=f"decision_{decision_id}.pdf",
            media_type="application/pdf",
        )

    return {"url": minio_service.presigned_download(chemin)}


@router.post("/decisions/{decision_id}/soumettre", response_model=DecisionRead)
async def soumettre_validation(
    decision_id: int,
    data: SoumettreValidation,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN", "INSTRUCTEUR")),
):
    decision = await _get_decision(db, decision_id)
    _check_transition(decision, StatutDecisionEnum.BROUILLON)

    reclamation = await _get_reclamation(db, decision.id_reclamation)
    reclamation.statut = StatutReclamationEnum.EN_VALIDATION

    commentaire = data.commentaire or "Soumission a la validation du chef de service"
    await _log(db, reclamation, current_user.id, TypeActionEnum.REDACTION, commentaire)
    await db.flush()

    return decision


@router.post("/decisions/{decision_id}/valider", response_model=DecisionRead)
async def valider_decision(
    decision_id: int,
    data: ValiderDecision,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN", "CHEF")),
):
    decision = await _get_decision(db, decision_id)
    _check_transition(decision, StatutDecisionEnum.BROUILLON)

    reclamation = await _get_reclamation(db, decision.id_reclamation)

    decision.statut = StatutDecisionEnum.VALIDEE
    decision.id_validateur = current_user.id
    reclamation.statut = StatutReclamationEnum.EN_VISA_DIRECTEUR

    commentaire = data.commentaire or f"Avis {data.avis} du chef de service"
    await _log(db, reclamation, current_user.id, TypeActionEnum.AVIS_CHEF, commentaire)
    await db.flush()

    return decision


@router.post("/decisions/{decision_id}/visa", response_model=DecisionRead)
async def viser_decision(
    decision_id: int,
    data: VisDecision,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN", "DIRECTEUR")),
):
    decision = await _get_decision(db, decision_id)
    _check_transition(decision, StatutDecisionEnum.VALIDEE)

    reclamation = await _get_reclamation(db, decision.id_reclamation)

    commentaire = "Visa du directeur" + (f" - {data.signature}" if data.signature else "")
    await _log(db, reclamation, current_user.id, TypeActionEnum.VISA_DIR, commentaire)
    await db.flush()

    return decision


@router.post("/decisions/{decision_id}/signer", response_model=DecisionRead)
async def signer_decision(
    decision_id: int,
    data: SignerDecision,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN", "DIRECTEUR")),
):
    decision = await _get_decision(db, decision_id)
    _check_transition(decision, StatutDecisionEnum.VALIDEE)

    reclamation = await _get_reclamation(db, decision.id_reclamation)

    decision.statut = StatutDecisionEnum.SIGNEE
    decision.id_signataire = current_user.id
    reclamation.statut = StatutReclamationEnum.SIGNEE

    commentaire = "Decision signee" + (f" par {data.signature}" if data.signature else "")
    await _log(db, reclamation, current_user.id, TypeActionEnum.SIGNATURE, commentaire)
    await db.flush()

    return decision


@router.post("/decisions/{decision_id}/notifier", response_model=DecisionRead)
async def notifier_decision(
    decision_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN", "CHEF", "DIRECTEUR")),
):
    decision = await _get_decision(db, decision_id)
    _check_transition(decision, StatutDecisionEnum.SIGNEE)

    reclamation = await _get_reclamation(db, decision.id_reclamation)

    decision.statut = StatutDecisionEnum.NOTIFIEE
    reclamation.statut = StatutReclamationEnum.CLOTUREE

    await _log(db, reclamation, current_user.id, TypeActionEnum.ENVOI, "Decision notifiee au contribuable")
    await _log(db, reclamation, current_user.id, TypeActionEnum.CLOTURE, "Dossier cloture")

    try:
        from sqlalchemy.orm import selectinload
        from app.services import pdf_service

        full = (
            await db.execute(
                select(Reclamation)
                .options(
                    selectinload(Reclamation.contribuable),
                    selectinload(Reclamation.decision),
                )
                .where(Reclamation.id == reclamation.id)
            )
        ).scalar_one()
        decision_pdf = await db.execute(
            select(Decision).options(selectinload(Decision.signataire)).where(Decision.id == decision_id)
        )
        decision_plein = decision_pdf.scalar_one()
        decision_plein.chemin_pdf = pdf_service.generer_et_stocker_decision(full, decision_plein)
    except Exception as exc:
        print(f"[WARN] Generation du PDF de decision impossible: {exc}")

    await _envoyer_email_notification(
        db, reclamation, locals().get("full"), locals().get("decision_plein")
    )

    await db.flush()

    return decision
