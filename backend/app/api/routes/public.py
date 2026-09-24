"""Portail contribuable - acces public au suivi d'une reclamation via son code."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.reclamation import Reclamation, ActionHistorique, TypeActionEnum, StatutReclamationEnum

router = APIRouter()

_LABELS_ACTION = {
    TypeActionEnum.CREATION: "Reclamation enregistree",
    TypeActionEnum.QUALIFICATION: "Dossier qualifie et pris en charge",
    TypeActionEnum.AFFECTATION: "Agent instructeur affecte",
    TypeActionEnum.DEMANDE_PIECES: "Demande de pieces complementaires",
    TypeActionEnum.RECEPTION_PIECES: "Reception des pieces",
    TypeActionEnum.REDACTION: "Projet de reponse redige",
    TypeActionEnum.AVIS_CHEF: "Avis du chef de service",
    TypeActionEnum.VISA_DIR: "Visa de la direction",
    TypeActionEnum.SIGNATURE: "Decision signee",
    TypeActionEnum.ENVOI: "Reponse notifiee",
    TypeActionEnum.CLOTURE: "Dossier cloture",
    TypeActionEnum.ALERTE_DELAI: "Alerte delai",
}

_PIECES_DEMANDEES_TYPES = (
    TypeActionEnum.DEMANDE_PIECES,
)

_STATUTS_CLOS = (
    StatutReclamationEnum.CLOTUREE,
    StatutReclamationEnum.REJETEE,
    StatutReclamationEnum.NOTIFIEE,
    StatutReclamationEnum.CONTENTIEUX_JUDICIAIRE,
)


def _texte_statut(s) -> str:
    return s.value if hasattr(s, "value") else str(s)


@router.get("/reclamations/suivi")
async def suivi_reclamation(
    code: str = Query(..., min_length=6, max_length=20),
    db: AsyncSession = Depends(get_db),
):
    """Retourne l'etat d'avancement public d'une reclamation a partir de son code de suivi."""
    result = await db.execute(
        select(Reclamation)
        .options(
            selectinload(Reclamation.contribuable),
            selectinload(Reclamation.type),
            selectinload(Reclamation.motif),
            selectinload(Reclamation.historique),
            selectinload(Reclamation.decision),
            selectinload(Reclamation.pieces),
        )
        .where(Reclamation.code_suivi.ilike(code.strip()))
    )
    reclamation = result.scalar_one_or_none()
    if not reclamation:
        raise HTTPException(status_code=404, detail="Aucun dossier ne correspond a ce code de suivi")

    evenements = []
    for h in sorted(reclamation.historique, key=lambda x: x.created_at):
        action = h.action
        evenements.append(
            {
                "date": h.created_at.isoformat(),
                "type": _texte_statut(action),
                "libelle": _LABELS_ACTION.get(action, "Mise a jour du dossier"),
                "commentaire": h.commentaire,
            }
        )

    pieces_requises = []
    for h in reclamation.historique:
        if h.action in _PIECES_DEMANDEES_TYPES and isinstance(h.donnees_contexte, dict):
            liste = h.donnees_contexte.get("pieces") or []
            for p in liste:
                if isinstance(p, str) and p not in pieces_requises:
                    pieces_requises.append(p)

    decision = reclamation.decision
    decision_pub = None
    if decision and decision.statut.value in ("NOTIFIEE", "SIGNEE", "VALIDEE"):
        type_decision = getattr(decision, "type_decision", None)
        decision_pub = {
            "type_decision": _texte_statut(type_decision),
            "date_decision": decision.date_decision.isoformat() if decision.date_decision else None,
            "montant_accorde": float(decision.montant_accorde),
            "montant_rejete": float(decision.montant_rejete),
        }

    statut = reclamation.statut
    return {
        "numero_dossier": reclamation.numero_dossier,
        "code_suivi": reclamation.code_suivi,
        "statut": _texte_statut(statut),
        "statut_clos": statut in _STATUTS_CLOS,
        "date_depot": reclamation.date_depot.isoformat() if reclamation.date_depot else None,
        "date_limite_reponse": reclamation.date_limite_reponse.isoformat() if reclamation.date_limite_reponse else None,
        "objet": reclamation.resume_faits,
        "reference_imposition": reclamation.reference_imposition,
        "type": reclamation.type.libelle if reclamation.type else None,
        "motif": reclamation.motif.libelle if reclamation.motif else None,
        "canal_entree": _texte_statut(reclamation.canal_entree),
        "evenements": evenements,
        "pieces_requises": pieces_requises,
        "nb_pieces_deposees": len(reclamation.pieces) if hasattr(reclamation, "pieces") else 0,
        "decision": decision_pub,
    }