from datetime import datetime, date
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.core.deps import get_current_user, require_role
from app.models.user import User
from app.models.contribuable import Contribuable
from app.models.visite import Visite
from app.schemas.visite import VisiteCreate, VisiteRead, VisiteList, VisiteStats

router = APIRouter()


def generer_numero_visite(annee: int, index: int) -> str:
    return f"VIS-{annee}-{index:06d}"


@router.get("/", response_model=VisiteList)
async def list_visites(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    jour: date | None = None,
    service: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN", "SAISIE", "INSTRUCTEUR", "CHEF", "DIRECTEUR")),
):
    base = select(Visite).options(
        selectinload(Visite.contribuable),
        selectinload(Visite.agent_recepteur),
    )
    base = base.order_by(Visite.date_visite.desc())

    if jour:
        base = base.where(func.date(Visite.date_visite) == jour)
    if service:
        base = base.where(Visite.service_destination == service)

    count_q = select(func.count()).select_from(base.subquery())
    total = await db.scalar(count_q) or 0

    base = base.offset((page - 1) * size).limit(size)
    result = await db.execute(base)
    items = result.scalars().all()

    return VisiteList(items=items, total=total, page=page, size=size)


@router.get("/stats", response_model=VisiteStats)
async def stats_visites(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN", "SAISIE", "INSTRUCTEUR", "CHEF", "DIRECTEUR")),
):
    total = await db.scalar(select(func.count()).select_from(Visite)) or 0
    aujourd_hui = await db.scalar(
        select(func.count()).select_from(Visite).where(func.date(Visite.date_visite) == date.today())
    ) or 0

    rows = await db.execute(
        select(Visite.service_destination, func.count()).group_by(Visite.service_destination)
    )
    par_service = {service: count for service, count in rows.all()}
    return VisiteStats(total=total, aujourd_hui=aujourd_hui, par_service=par_service)


@router.post("/", response_model=VisiteRead, status_code=status.HTTP_201_CREATED)
async def create_visite(
    data: VisiteCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN", "SAISIE")),
):
    payload = data.model_dump()

    if payload.get("id_contribuable"):
        contrib = await db.get(Contribuable, payload["id_contribuable"])
        if not contrib:
            raise HTTPException(status_code=404, detail="Contribuable introuvable")

    annee = datetime.utcnow().year
    count = await db.scalar(select(func.count()).select_from(Visite))
    numero = generer_numero_visite(annee, (count or 0) + 1)
    while await db.scalar(select(Visite.id).where(Visite.numero == numero)):
        count = (count or 0) + 1
        numero = generer_numero_visite(annee, count + 1)
    payload["numero"] = numero

    payload["id_agent_recepteur"] = current_user.id
    if payload.get("date_visite") is None:
        payload["date_visite"] = datetime.utcnow()

    visite = Visite(**payload)
    db.add(visite)
    await db.flush()
    return VisiteRead.model_validate(visite)


@router.get("/{visite_id}", response_model=VisiteRead)
async def get_visite(
    visite_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Visite)
        .options(selectinload(Visite.contribuable), selectinload(Visite.agent_recepteur))
        .where(Visite.id == visite_id)
    )
    visite = result.scalar_one_or_none()
    if not visite:
        raise HTTPException(status_code=404, detail="Visite introuvable")
    return VisiteRead.model_validate(visite)