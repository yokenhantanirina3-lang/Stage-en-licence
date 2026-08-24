"""Script de seed : roles, services, types/motifs de reclamation, super admin.

Usage :
    docker compose exec backend python -m app.seed
"""

import asyncio

from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.core.config import settings
from app.core.security import get_password_hash
from app.models.user import User, Role, ServiceModel, RoleEnum
from app.models.reclamation import TypeReclamation, MotifReclamation, TypeReclamationCodeEnum

ROLES = [
    (RoleEnum.ADMIN, "Administrateur systeme", {"*": ["*"]}),
    (RoleEnum.SAISIE, "Agent de saisie", {
        "reclamations": ["create", "read", "qualify"],
        "contribuables": ["create", "read", "update"],
    }),
    (RoleEnum.INSTRUCTEUR, "Instructeur", {
        "reclamations": ["read", "qualify", "instruct", "pieces"],
        "decisions": ["create", "update"],
    }),
    (RoleEnum.CHEF, "Chef de service", {
        "reclamations": ["read", "assign"],
        "decisions": ["validate"],
    }),
    (RoleEnum.DIRECTEUR, "Directeur", {
        "reclamations": ["read"],
        "decisions": ["sign"],
    }),
    (RoleEnum.CONTRIBUABLE, "Contribuable", {
        "reclamations": ["create_own", "read_own"],
    }),
]

SERVICES = [
    ("Direction Generale", "DG"),
    ("Service Contentieux", "SC"),
    ("Service Recouvrement", "SR"),
    ("Guichet Unique", "GU"),
]

TYPES_MOTIFS = [
    (
        TypeReclamationCodeEnum.CONTENTIEUSE,
        "Reclamation contentieuse",
        60,
        [
            ("ERREUR_CALCUL", "Erreur de calcul de l'impot", True),
            ("REDRESSEMENT_CONTESTE", "Contestation d'un redressement", True),
            ("ERREUR_BASE_IMPOSABLE", "Erreur sur la base imposable", True),
        ],
    ),
    (
        TypeReclamationCodeEnum.GRACIEUSE,
        "Reclamation gracieuse",
        30,
        [
            ("DIFFICULTE_PAIEMENT", "Difficultes de paiement", False),
            ("DEMANDE_REMISE", "Demande de remise gracieuse", False),
            ("ERREUR_MATERIELLE", "Erreur materielle du contribuable", False),
        ],
    ),
    (
        TypeReclamationCodeEnum.PRESCRIPTION,
        "Reclamation en prescription",
        90,
        [
            ("PRESCRIPTION_ACQUISITIVE", "Prescription acquise", True),
            ("RESTITUTION_PAIEMENT", "Restitution d'un paiement indu", True),
        ],
    ),
]


async def seed_roles(db) -> None:
    for libelle, description, permissions in ROLES:
        exists = await db.execute(select(Role).where(Role.libelle == libelle))
        if exists.scalar_one_or_none():
            continue
        db.add(Role(libelle=libelle, description=description, permissions=permissions))
    await db.flush()
    print(f"Roles OK ({len(ROLES)})")


async def seed_services(db) -> None:
    for nom, code in SERVICES:
        exists = await db.execute(select(ServiceModel).where(ServiceModel.code == code))
        if exists.scalar_one_or_none():
            continue
        db.add(ServiceModel(nom=nom, code=code))
    await db.flush()
    print(f"Services OK ({len(SERVICES)})")


async def seed_types_motifs(db) -> None:
    for code, libelle, delai, motifs in TYPES_MOTIFS:
        result = await db.execute(
            select(TypeReclamation).where(TypeReclamation.code == code)
        )
        type_recl = result.scalar_one_or_none()
        if not type_recl:
            type_recl = TypeReclamation(
                code=code, libelle=libelle, delai_legal_jours=delai
            )
            db.add(type_recl)
            await db.flush()

        for motif_code, motif_libelle, necessite_piece in motifs:
            exists = await db.execute(
                select(MotifReclamation).where(MotifReclamation.code == motif_code)
            )
            if not exists.scalar_one_or_none():
                db.add(
                    MotifReclamation(
                        id_type=type_recl.id,
                        code=motif_code,
                        libelle=motif_libelle,
                        necessite_piece_justificative=necessite_piece,
                    )
                )
    await db.flush()
    print("Types et motifs OK")


async def seed_admin(db) -> None:
    email = settings.FIRST_SUPERUSER_EMAIL
    exists = await db.execute(select(User).where(User.email == email))
    if exists.scalar_one_or_none():
        print(f"Admin {email} deja present")
        return

    role_result = await db.execute(
        select(Role).where(Role.libelle == RoleEnum.ADMIN)
    )
    role = role_result.scalar_one()

    db.add(
        User(
            email=email,
            nom="Administrateur",
            password_hash=get_password_hash(settings.FIRST_SUPERUSER_PASSWORD),
            id_role=role.id,
            actif=True,
        )
    )
    print(f"Admin {email} cree")


async def run() -> None:
    async with AsyncSessionLocal() as db:
        try:
            await seed_roles(db)
            await seed_services(db)
            await seed_types_motifs(db)
            await seed_admin(db)
            await db.commit()
            print("Seed termine avec succes")
        except Exception:
            await db.rollback()
            raise


if __name__ == "__main__":
    asyncio.run(run())
