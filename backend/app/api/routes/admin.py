from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.core.deps import get_current_user, require_role
from app.models.user import User, Role, ServiceModel
from app.models.reclamation import (
    TypeReclamation,
    MotifReclamation,
    TypeReclamationCodeEnum,
)
from app.schemas.user import (
    UserCreate,
    UserRead,
    UserUpdate,
    RoleRead,
)
from app.schemas.admin import (
    ServiceRead,
    ServiceCreate,
    ServiceUpdate,
    TypeReclamationCreate,
    TypeReclamationUpdate,
    MotifReclamationCreate,
    MotifReclamationUpdate,
)
from app.schemas.reclamation import TypeReclamationRead, MotifReclamationRead

router = APIRouter()


@router.get("/users", response_model=list[UserRead])
async def list_users(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    result = await db.execute(
        select(User)
        .options(selectinload(User.role), selectinload(User.service))
        .order_by(User.id)
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

    if data.id_role is not None:
        role = await db.get(Role, data.id_role)
        if not role:
            raise HTTPException(status_code=400, detail="Role invalide")

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
        select(User)
        .options(selectinload(User.role), selectinload(User.service))
        .where(User.id == user.id)
    )
    return UserRead.model_validate(result.scalar_one())


@router.patch("/users/{user_id}", response_model=UserRead)
async def update_user(
    user_id: int,
    data: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")

    if data.email is not None and data.email != user.email:
        existing = await db.execute(select(User).where(User.email == data.email))
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Email deja utilise")
        user.email = data.email
    if data.nom is not None:
        user.nom = data.nom
    if data.telephone is not None:
        user.telephone = data.telephone
    if data.id_role is not None:
        role = await db.get(Role, data.id_role)
        if not role:
            raise HTTPException(status_code=400, detail="Role invalide")
        user.id_role = data.id_role
    if data.id_service is not None:
        if data.id_service:
            service = await db.get(ServiceModel, data.id_service)
            if not service:
                raise HTTPException(status_code=400, detail="Service invalide")
        user.id_service = data.id_service or None
    if data.actif is not None:
        user.actif = data.actif

    await db.commit()
    result = await db.execute(
        select(User)
        .options(selectinload(User.role), selectinload(User.service))
        .where(User.id == user.id)
    )
    return UserRead.model_validate(result.scalar_one())


@router.get("/roles", response_model=list[RoleRead])
async def list_roles(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    result = await db.execute(select(Role))
    return result.scalars().all()


async def _build_service_read(db: AsyncSession, service: ServiceModel) -> ServiceRead:
    chef_nom = None
    if service.chef_id is not None:
        chef = await db.get(User, service.chef_id)
        chef_nom = chef.nom if chef else None
    return ServiceRead(
        id=service.id,
        nom=service.nom,
        code=service.code,
        chef_id=service.chef_id,
        chef_nom=chef_nom,
    )


@router.get("/services", response_model=list[ServiceRead])
async def list_services(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    result = await db.execute(select(ServiceModel).order_by(ServiceModel.id))
    services = result.scalars().all()
    return [await _build_service_read(db, s) for s in services]


@router.post("/services", response_model=ServiceRead, status_code=status.HTTP_201_CREATED)
async def create_service(
    data: ServiceCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    existing = await db.execute(
        select(ServiceModel).where(
            or_(ServiceModel.nom == data.nom, ServiceModel.code == data.code)
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Un service a deja ce nom ou ce code")

    if data.chef_id is not None:
        chef = await db.get(User, data.chef_id)
        if not chef:
            raise HTTPException(status_code=400, detail="Chef de service introuvable")

    service = ServiceModel(nom=data.nom, code=data.code, chef_id=data.chef_id)
    db.add(service)
    await db.flush()
    return await _build_service_read(db, service)


@router.patch("/services/{service_id}", response_model=ServiceRead)
async def update_service(
    service_id: int,
    data: ServiceUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    service = await db.get(ServiceModel, service_id)
    if not service:
        raise HTTPException(status_code=404, detail="Service introuvable")

    if data.nom is not None and data.nom != service.nom:
        existing = await db.execute(
            select(ServiceModel).where(ServiceModel.nom == data.nom)
        )
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Un service porte deja ce nom")
        service.nom = data.nom
    if data.code is not None and data.code != service.code:
        existing = await db.execute(
            select(ServiceModel).where(ServiceModel.code == data.code)
        )
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Un service porte deja ce code")
        service.code = data.code
    if data.chef_id is not None:
        if data.chef_id:
            chef = await db.get(User, data.chef_id)
            if not chef:
                raise HTTPException(status_code=400, detail="Chef de service introuvable")
        service.chef_id = data.chef_id or None

    await db.commit()
    await db.refresh(service)
    return await _build_service_read(db, service)


@router.get("/types-reclamation", response_model=list[TypeReclamationRead])
async def list_types_reclamation_admin(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    result = await db.execute(select(TypeReclamation).order_by(TypeReclamation.id))
    return result.scalars().all()


@router.post(
    "/types-reclamation",
    response_model=TypeReclamationRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_type_reclamation(
    data: TypeReclamationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    try:
        code = TypeReclamationCodeEnum(data.code)
    except ValueError:
        raise HTTPException(status_code=400, detail="Code de type invalide")

    existing = await db.execute(
        select(TypeReclamation).where(TypeReclamation.code == code)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Ce type existe deja")

    type_recl = TypeReclamation(
        code=code,
        libelle=data.libelle,
        delai_legal_jours=data.delai_legal_jours,
    )
    db.add(type_recl)
    await db.flush()
    await db.refresh(type_recl)
    return type_recl


@router.patch("/types-reclamation/{type_id}", response_model=TypeReclamationRead)
async def update_type_reclamation(
    type_id: int,
    data: TypeReclamationUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    type_recl = await db.get(TypeReclamation, type_id)
    if not type_recl:
        raise HTTPException(status_code=404, detail="Type introuvable")

    if data.libelle is not None:
        type_recl.libelle = data.libelle
    if data.delai_legal_jours is not None:
        type_recl.delai_legal_jours = data.delai_legal_jours
    if data.actif is not None:
        type_recl.actif = data.actif

    await db.commit()
    await db.refresh(type_recl)
    return type_recl


@router.get("/motifs-reclamation", response_model=list[MotifReclamationRead])
async def list_motifs_reclamation_admin(
    id_type: int | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    query = select(MotifReclamation)
    if id_type:
        query = query.where(MotifReclamation.id_type == id_type)
    result = await db.execute(query.order_by(MotifReclamation.id))
    return result.scalars().all()


@router.post(
    "/motifs-reclamation",
    response_model=MotifReclamationRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_motif_reclamation(
    data: MotifReclamationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    type_recl = await db.get(TypeReclamation, data.id_type)
    if not type_recl:
        raise HTTPException(status_code=400, detail="Type introuvable")

    existing = await db.execute(
        select(MotifReclamation).where(
            MotifReclamation.id_type == data.id_type,
            MotifReclamation.code == data.code,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Ce motif existe deja pour ce type")

    motif = MotifReclamation(
        id_type=data.id_type,
        code=data.code,
        libelle=data.libelle,
        necessite_piece_justificative=data.necessite_piece_justificative,
    )
    db.add(motif)
    await db.flush()
    await db.refresh(motif)
    return motif


@router.patch("/motifs-reclamation/{motif_id}", response_model=MotifReclamationRead)
async def update_motif_reclamation(
    motif_id: int,
    data: MotifReclamationUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    motif = await db.get(MotifReclamation, motif_id)
    if not motif:
        raise HTTPException(status_code=404, detail="Motif introuvable")

    if data.code is not None:
        motif.code = data.code
    if data.libelle is not None:
        motif.libelle = data.libelle
    if data.necessite_piece_justificative is not None:
        motif.necessite_piece_justificative = data.necessite_piece_justificative

    await db.commit()
    await db.refresh(motif)
    return motif
