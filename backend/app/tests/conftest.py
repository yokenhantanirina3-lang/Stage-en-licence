"""Fixtures de test : base isolee, client HTTP, utilisateurs de reference."""

import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

from app.core.config import settings
from app.core.database import get_db
from app.core.security import get_password_hash
from app.models.base import Base
import app.models  # noqa: F401
from app.models.user import User, Role, RoleEnum
from app.models.contribuable import Contribuable


@pytest_asyncio.fixture(autouse=True)
async def db_env():
    """Engine + schema neufs pour chaque test (isolation totale)."""
    engine = create_async_engine(str(settings.DATABASE_URL))
    TestingSession = async_sessionmaker(
        bind=engine, class_=AsyncSession, expire_on_commit=False
    )

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    yield TestingSession

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest_asyncio.fixture
async def db(db_env):
    async with db_env() as session:
        yield session


@pytest_asyncio.fixture
async def client(db_env, db):
    from app.main import app as fastapi_app

    async def override_get_db():
        yield db

    fastapi_app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=fastapi_app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c
    fastapi_app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def users(db):
    roles = {}
    for role_enum in RoleEnum:
        role = Role(libelle=role_enum, permissions={"*": ["*"]})
        db.add(role)
        roles[role_enum.value] = role
    await db.flush()

    def make_user(email: str, nom: str, password: str, role_key: str) -> User:
        return User(
            email=email,
            nom=nom,
            password_hash=get_password_hash(password),
            id_role=roles[role_key].id,
            actif=True,
        )

    created = {
        "roles": roles,
        "admin": make_user("admin@test-exemple.fr", "Admin Test", "admin123", "ADMIN"),
        "agent": make_user("agent@test-exemple.fr", "Agent Test", "agent123", "SAISIE"),
        "instructeur": make_user(
            "instructeur@test-exemple.fr", "Instructeur Test", "instr123", "INSTRUCTEUR"
        ),
        "chef": make_user("chef@test-exemple.fr", "Chef Test", "chef123", "CHEF"),
        "directeur": make_user(
            "directeur@test-exemple.fr", "Directeur Test", "direct123", "DIRECTEUR"
        ),
    }
    db.add_all([created[k] for k in ("admin", "agent", "instructeur", "chef", "directeur")])
    await db.flush()
    return created


@pytest_asyncio.fixture
async def contribuable(db):
    obj = Contribuable(
        numero_fiscal="NIF-TEST-0001",
        nom_raison_sociale="Entreprise Test SARL",
        type_contribuable="MORALE",
        email="contact@test-exemple.fr",
        actif=True,
    )
    db.add(obj)
    await db.flush()
    return obj


async def login_headers(client, email: str, password: str) -> dict:
    response = await client.post(
        "/api/v1/auth/login",
        data={"username": email, "password": password},
    )
    assert response.status_code == 200, response.text
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
