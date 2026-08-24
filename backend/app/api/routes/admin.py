from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.core.deps import get_current_user, require_role
from app.models.user import User, Role
from app.models.contribuable import Contribuable
from app.schemas.user import UserCreate, UserRead, UserUpdate, RoleRead

router = APIRouter()


@router.get("/users", response_model=list[UserRead])
async def list_users(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    result = await db.execute(
        select(User).options(selectinload(User.role)).order_by(User.id)
    )
    return result.scalars().all()


@router.post("/users", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def create_user(
    data: UserCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    from app.core.security import get_password_hash

    existing = await db.execute(select(User).where(User.email == data.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email deja utilise")

    user = User(
        email=data.email,
        nom=data.nom,
        password_hash=get_password_hash(data.password),
        id_role=data.id_role,
        id_service=data.id_service,
        telephone=data.telephone,
        actif=data.actif,
    )
    db.add(user)
    await db.flush()
    result = await db.execute(
        select(User).options(selectinload(User.role)).where(User.id == user.id)
    )
    return UserRead.model_validate(result.scalar_one())


@router.get("/roles", response_model=list[RoleRead])
async def list_roles(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    result = await db.execute(select(Role))
    return result.scalars().all()
