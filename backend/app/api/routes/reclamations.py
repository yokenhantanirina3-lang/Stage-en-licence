from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from sqlalchemy.orm import selectinload
from datetime import date, timedelta
from app.core.database import get_db
from app.core.deps import get_current_user, require_role
from app.models.user import User
from app.models.contribuable import Contribuable
from app.models.reclamation import (
    Reclamation, StatutReclamationEnum,
    TypeReclamation, MotifReclamation, ActionHistorique, TypeActionEnum,
)
from app.schemas.reclamation import (
    ReclamationCreate, ReclamationRead, ReclamationList,
    QualifierReclamation, ReclamationUpdate,
    TypeReclamationRead, MotifReclamationRead,
    ActionHistoriqueRead, DemanderPieces,
)

router = APIRouter()


@router.get("/types", response_model=list[TypeReclamationRead])
async def list_types_reclamation(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(TypeReclamation)
        .where(TypeReclamation.actif.is_(True))
        .order_by(TypeReclamation.id)
    )
    return result.scalars().all()


@router.get("/motifs", response_model=list[MotifReclamationRead])
async def list_motifs_reclamation(
    id_type: int | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(MotifReclamation)
    if id_type:
        query = query.where(MotifReclamation.id_type == id_type)
    result = await db.execute(query.order_by(MotifReclamation.id))
    return result.scalars().all()


@router.get("/", response_model=ReclamationList)
async def list_reclamations(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    statut: str | None = None,
    id_type: int | None = None,
    search: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN", "SAISIE", "INSTRUCTEUR", "CHEF", "DIRECTEUR")),
):
    query = select(Reclamation).options(
        selectinload(Reclamation.contribuable),
        selectinload(Reclamation.type),
        selectinload(Reclamation.motif),
    )
    count_query = select(func.count(Reclamation.id))

    if statut:
        query = query.where(Reclamation.statut == statut)
        count_query = count_query.where(Reclamation.statut == statut)
    if id_type:
        query = query.where(Reclamation.id_type == id_type)
        count_query = count_query.where(Reclamation.id_type == id_type)
    if search:
        filtre = or_(
            Reclamation.numero_dossier.ilike(f"%{search}%"),
            Reclamation.reference_imposition.ilike(f"%{search}%"),
        )
        query = query.where(filtre)
        count_query = count_query.where(filtre)

    total_result = await db.execute(count_query)
    total = total_result.scalar()

    query = query.offset((page - 1) * size).limit(size).order_by(Reclamation.created_at.desc())
    result = await db.execute(query)
    items = result.scalars().all()

    return ReclamationList(
        items=[ReclamationRead.model_validate(r) for r in items],
        total=total,
        page=page,
        size=size,
    )


@router.post("/", response_model=ReclamationRead, status_code=status.HTTP_201_CREATED)
async def create_reclamation(
    data: ReclamationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN", "SAISIE", "INSTRUCTEUR")),
):
    result = await db.execute(
        select(Reclamation).order_by(Reclamation.id.desc()).limit(1)
    )
    last = result.scalar_one_or_none()
    year = date.today().year
    if last and last.numero_dossier.startswith(f"REC-{year}"):
        num = int(last.numero_dossier.split("-")[-1]) + 1
    else:
        num = 1
    numero_dossier = f"REC-{year}-{num:06d}"

    reclamation = Reclamation(
        numero_dossier=numero_dossier,
        id_contribuable=data.id_contribuable,
        id_type=data.id_type,
        id_motif=data.id_motif,
        canal_entree=data.canal_entree,
        resume_faits=data.resume_faits,
        montant_concerne=data.montant_concerne,
        reference_imposition=data.reference_imposition,
        id_agent_createur=current_user.id,
        statut=StatutReclamationEnum.ENREGISTREE,
    )
    db.add(reclamation)
    await db.flush()

    action = ActionHistorique(
        id_reclamation=reclamation.id,
        id_agent=current_user.id,
        action=TypeActionEnum.CREATION,
        commentaire="Reclamation creee",
    )
    db.add(action)
    await db.flush()

    return ReclamationRead.model_validate(reclamation)


@router.get("/{reclamation_id}/historique", response_model=list[ActionHistoriqueRead])
async def get_historique(
    reclamation_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Reclamation).where(Reclamation.id == reclamation_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Reclamation introuvable")

    actions = await db.execute(
        select(ActionHistorique)
        .where(ActionHistorique.id_reclamation == reclamation_id)
        .order_by(ActionHistorique.created_at.asc())
    )
    return actions.scalars().all()


@router.post("/{reclamation_id}/demander-pieces", response_model=ReclamationRead)
async def demander_pieces(
    reclamation_id: int,
    data: DemanderPieces,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN", "INSTRUCTEUR")),
):
    result = await db.execute(select(Reclamation).where(Reclamation.id == reclamation_id))
    reclamation = result.scalar_one_or_none()
    if not reclamation:
        raise HTTPException(status_code=404, detail="Reclamation introuvable")

    if reclamation.statut in (
        StatutReclamationEnum.CLOTUREE,
        StatutReclamationEnum.REJETEE,
        StatutReclamationEnum.CONTENTIEUX_JUDICIAIRE,
    ):
        raise HTTPException(status_code=400, detail=f"Statut {reclamation.statut.value} clos")

    reclamation.statut = StatutReclamationEnum.EN_ATTENTE_PIECES

    action = ActionHistorique(
        id_reclamation=reclamation_id,
        id_agent=current_user.id,
        action=TypeActionEnum.DEMANDE_PIECES,
        commentaire=data.motif,
        donnees_contexte={"pieces": data.liste_pieces},
    )
    db.add(action)
    await db.flush()

    return ReclamationRead.model_validate(reclamation)


@router.get("/{reclamation_id}", response_model=ReclamationRead)
async def get_reclamation(
    reclamation_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Reclamation).where(Reclamation.id == reclamation_id)
    )
    reclamation = result.scalar_one_or_none()

    if not reclamation:
        raise HTTPException(status_code=404, detail="Reclamation introuvable")

    return ReclamationRead.model_validate(reclamation)


@router.patch("/{reclamation_id}/qualifier", response_model=ReclamationRead)
async def qualifier_reclamation(
    reclamation_id: int,
    data: QualifierReclamation,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN", "SAISIE", "INSTRUCTEUR")),
):
    result = await db.execute(
        select(Reclamation).where(Reclamation.id == reclamation_id)
    )
    reclamation = result.scalar_one_or_none()

    if not reclamation:
        raise HTTPException(status_code=404, detail="Reclamation introuvable")

    if reclamation.statut not in (StatutReclamationEnum.ENREGISTREE, StatutReclamationEnum.A_QUALIFIER):
        raise HTTPException(
            status_code=400,
            detail=f"Statut actuel {reclamation.statut} ne permet pas la qualification",
        )

    type_result = await db.execute(
        select(TypeReclamation).where(TypeReclamation.id == data.id_type)
    )
    type_recl = type_result.scalar_one_or_none()
    if not type_recl:
        raise HTTPException(status_code=400, detail="Type de reclamation introuvable")

    reclamation.id_type = data.id_type
    reclamation.id_motif = data.id_motif
    reclamation.date_limite_reponse = date.today() + timedelta(days=type_recl.delai_legal_jours)
    reclamation.statut = StatutReclamationEnum.EN_INSTRUCTION

    action = ActionHistorique(
        id_reclamation=reclamation.id,
        id_agent=current_user.id,
        action=TypeActionEnum.QUALIFICATION,
        commentaire=f"Type: {type_recl.code}, Date limite: {reclamation.date_limite_reponse}",
    )
    db.add(action)

    return ReclamationRead.model_validate(reclamation)
