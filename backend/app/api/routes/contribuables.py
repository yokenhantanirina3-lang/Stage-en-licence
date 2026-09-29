from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.core.database import get_db
from app.core.deps import get_current_user, require_role
from app.models.user import User
from app.models.contribuable import Contribuable
from app.schemas.contribuable import ContribuableCreate, ContribuableRead, ContribuableUpdate

router = APIRouter()


def generer_numero_fiscal(annee: int, index: int) -> str:
    return f"NF-{annee}-{index:06d}"


@router.get("/", response_model=list[ContribuableRead])
async def list_contribuables(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=1000),
    search: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN", "SAISIE", "INSTRUCTEUR", "CHEF", "DIRECTEUR")),
):
    query = select(Contribuable)
    if search:
        query = query.where(
            Contribuable.nom_raison_sociale.ilike(f"%{search}%")
            | Contribuable.numero_fiscal.ilike(f"%{search}%")
        )
    query = query.offset((page - 1) * size).limit(size).order_by(Contribuable.nom_raison_sociale)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/", response_model=ContribuableRead, status_code=status.HTTP_201_CREATED)
async def create_contribuable(
    data: ContribuableCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN", "SAISIE")),
):
    payload = data.model_dump()

    if not payload.get("numero_fiscal"):
        from datetime import datetime
        annee = datetime.utcnow().year
        count = await db.scalar(select(func.count()).select_from(Contribuable))
        numero = generer_numero_fiscal(annee, (count or 0) + 1)
        while await db.scalar(
            select(Contribuable.id).where(Contribuable.numero_fiscal == numero)
        ):
            count = (count or 0) + 1
            numero = generer_numero_fiscal(annee, count + 1)
        payload["numero_fiscal"] = numero
    else:
        existing = await db.execute(
            select(Contribuable).where(Contribuable.numero_fiscal == payload["numero_fiscal"])
        )
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Numero fiscal deja utilise")

    contribuable = Contribuable(**payload)
    db.add(contribuable)
    await db.flush()
    return ContribuableRead.model_validate(contribuable)


@router.get("/{contribuable_id}", response_model=ContribuableRead)
async def get_contribuable(
    contribuable_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Contribuable).where(Contribuable.id == contribuable_id)
    )
    contrib = result.scalar_one_or_none()
    if not contrib:
        raise HTTPException(status_code=404, detail="Contribuable introuvable")
    return ContribuableRead.model_validate(contrib)


@router.patch("/{contribuable_id}", response_model=ContribuableRead)
async def update_contribuable(
    contribuable_id: int,
    data: ContribuableUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN", "SAISIE")),
):
    result = await db.execute(
        select(Contribuable).where(Contribuable.id == contribuable_id)
    )
    contrib = result.scalar_one_or_none()
    if not contrib:
        raise HTTPException(status_code=404, detail="Contribuable introuvable")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(contrib, field, value)

    return ContribuableRead.model_validate(contrib)
