from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from sqlalchemy.orm import selectinload
from datetime import date, timedelta
from collections import defaultdict
from io import BytesIO
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
    date_debut: date | None = None,
    date_fin: date | None = None,
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
    if date_debut:
        query = query.where(Reclamation.date_depot >= date_debut)
        count_query = count_query.where(Reclamation.date_depot >= date_debut)
    if date_fin:
        query = query.where(Reclamation.date_depot <= date_fin)
        count_query = count_query.where(Reclamation.date_depot <= date_fin)

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


TERMINAUX = ["CLOTUREE", "REJETEE", "NOTIFIEE"]


@router.get("/stats")
async def stats_reclamations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN", "CHEF", "DIRECTEUR", "INSTRUCTEUR")),
):
    today = date.today()
    six_mois = (today.replace(day=1) - timedelta(days=150)).replace(day=1)

    total = await db.scalar(select(func.count(Reclamation.id))) or 0

    rows_statut = await db.execute(
        select(Reclamation.statut, func.count(Reclamation.id)).group_by(Reclamation.statut)
    )
    par_statut = {str(r[0].value if hasattr(r[0], 'value') else r[0]): r[1] for r in rows_statut}

    rows_type = await db.execute(
        select(TypeReclamation.libelle, func.count(Reclamation.id))
        .outerjoin(Reclamation, Reclamation.id_type == TypeReclamation.id)
        .group_by(TypeReclamation.libelle)
    )
    par_type = [{"libelle": r[0], "total": r[1]} for r in rows_type]

    rows_canal = await db.execute(
        select(Reclamation.canal_entree, func.count(Reclamation.id))
        .group_by(Reclamation.canal_entree)
    )
    par_canal = {str(r[0].value if hasattr(r[0], 'value') else r[0]): r[1] for r in rows_canal}

    rows_mois = await db.execute(
        select(
            func.to_char(Reclamation.date_depot, 'YYYY-MM').label('mois'),
            func.count(Reclamation.id),
        )
        .where(Reclamation.date_depot >= six_mois)
        .group_by('mois')
        .order_by('mois')
    )
    par_mois = [{"mois": r[0], "total": r[1]} for r in rows_mois]

    en_retard = await db.scalar(
        select(func.count(Reclamation.id)).where(
            Reclamation.statut.not_in(TERMINAUX),
            Reclamation.date_limite_reponse < today,
        )
    ) or 0

    en_cours = await db.scalar(
        select(func.count(Reclamation.id)).where(
            Reclamation.statut.not_in(TERMINAUX),
        )
    ) or 0

    cloturees_rows = await db.execute(
        select(Reclamation.date_depot).where(Reclamation.statut.in_(["CLOTUREE", "NOTIFIEE"]))
    )
    delais = [(today - r[0]).days for r in cloturees_rows if r[0]]
    delai_moyen = round(sum(delais) / len(delais), 1) if delais else 0

    rows_agent = await db.execute(
        select(
            User.nom,
            User.id,
            func.count(Reclamation.id).label('traitees'),
        )
        .outerjoin(Reclamation, Reclamation.id_agent_createur == User.id)
        .group_by(User.id, User.nom)
        .having(func.count(Reclamation.id) > 0)
    )
    par_agent = [{"nom": r[0], "traitees": r[2]} for r in rows_agent]

    return {
        "total": total,
        "en_cours": en_cours,
        "en_retard": en_retard,
        "delai_moyen_jours": delai_moyen,
        "par_statut": par_statut,
        "par_type": par_type,
        "par_canal": par_canal,
        "par_mois": par_mois,
        "par_agent": par_agent,
    }


@router.get("/export")
async def export_reclamations(
    format: str = Query("xlsx", regex="^(xlsx|csv)$"),
    statut: str | None = None,
    id_type: int | None = None,
    date_debut: date | None = None,
    date_fin: date | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN", "CHEF", "DIRECTEUR", "INSTRUCTEUR")),
):
    query = select(Reclamation).options(
        selectinload(Reclamation.contribuable),
        selectinload(Reclamation.type),
    )
    if statut:
        query = query.where(Reclamation.statut == statut)
    if id_type:
        query = query.where(Reclamation.id_type == id_type)
    if date_debut:
        query = query.where(Reclamation.date_depot >= date_debut)
    if date_fin:
        query = query.where(Reclamation.date_depot <= date_fin)
    query = query.order_by(Reclamation.created_at.desc())
    result = await db.execute(query)
    rows = result.scalars().all()

    STATUT_FR = {
        "ENREGISTREE": "Enregistree",
        "A_QUALIFIER": "A qualifier",
        "EN_INSTRUCTION": "En instruction",
        "EN_ATTENTE_PIECES": "En attente pieces",
        "PROJET_REPONSE": "Projet reponse",
        "EN_VALIDATION": "En validation",
        "EN_VISA_DIRECTEUR": "Visa directeur",
        "SIGNEE": "Signee",
        "NOTIFIEE": "Notifiee",
        "CLOTUREE": "Cloturee",
        "REJETEE": "Rejetee",
        "CONTENTIEUX_JUDICIAIRE": "Contentieux judiciaire",
    }

    def _row(r):
        s = str(r.statut.value if hasattr(r.statut, 'value') else r.statut)
        return [
            r.numero_dossier,
            r.contribuable.nom_raison_sociale if r.contribuable else '',
            r.type.libelle if r.type else '',
            s,
            str(r.date_depot) if r.date_depot else '',
            str(r.date_limite_reponse) if r.date_limite_reponse else '',
            STATUT_FR.get(s, s),
            f"{r.montant_concerne:,.0f} DA" if r.montant_concerne else '',
            r.reference_imposition or '',
            r.canal_entree.value if hasattr(r.canal_entree, 'value') else str(r.canal_entree),
        ]

    header = [
        "Numero dossier", "Contribuable", "Type", "Statut", "Date depot",
        "Date limite", "Statut FR", "Montant", "Ref imposition", "Canal",
    ]

    if format == "csv":
        import csv
        buf = BytesIO()
        import io
        writer = csv.writer(io.TextIOWrapper(buf, encoding="utf-8", newline=""), delimiter=";")
        writer.writerow(header)
        for r in rows:
            writer.writerow(_row(r))
        buf.seek(0)
        return StreamingResponse(
            buf,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=reclamations_{today}.csv"},
        )

    import openpyxl
    from openpyxl.styles import Font, PatternFill, Alignment, Border, Side

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Reclamations"

    header_font = Font(bold=True, color="FFFFFF")
    header_fill = PatternFill(start_color="1a5319", fill_type="solid")
    thin = Side(style="thin", color="CCCCCC")
    border = Border(top=thin, bottom=thin, left=thin, right=thin)

    for col, label in enumerate(header, 1):
        cell = ws.cell(row=1, column=col, value=label)
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = Alignment(horizontal="center")
        cell.border = border

    for i, r in enumerate(rows, 2):
        for j, val in enumerate(_row(r), 1):
            cell = ws.cell(row=i, column=j, value=val)
            cell.border = border

    for col in range(1, len(header) + 1):
        ws.column_dimensions[openpyxl.utils.get_column_letter(col)].width = 18

    buf = BytesIO()
    wb.save(buf)
    buf.seek(0)
    return StreamingResponse(
        buf,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename=reclamations_{today}.xlsx"},
    )


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
