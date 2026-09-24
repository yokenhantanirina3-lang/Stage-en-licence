"""Seed de demonstration : jeu de donnees realiste (contribuables + ~64 reclamations).

Usage :
    python3.13 -m app.seed_demo        (a la racine du dossier backend)

Idempotent : si le marqueur REC-DEMO-000001 existe deja, le script s'arrete.
Ne touche pas aux donnees existantes.
"""

import asyncio
import random
import secrets
from datetime import date, datetime, time, timedelta

from sqlalchemy import select, func

from app.core.database import AsyncSessionLocal
from app.models.user import User, Role, RoleEnum
from app.models.contribuable import Contribuable, TypeContribuableEnum
from app.models.reclamation import (
    Reclamation,
    Affectation,
    Decision,
    ActionHistorique,
    TypeReclamation,
    MotifReclamation,
    CanalEntreeEnum,
    StatutReclamationEnum,
    TypeActionEnum,
    TypeDecisionEnum,
    StatutDecisionEnum,
    RoleDossierEnum,
    CategoriePieceEnum,
    PieceJointe,
)
from app.core.security import get_password_hash

RNG = random.Random(42)

# Utilisateurs fonctionnels (recrees a la volee si absents)
DEMO_USERS = [
    ("directeur@dgi.mg", "directeur123", RoleEnum.DIRECTEUR, "Directeur DGI"),
    ("chef@dgi.mg", "chef123", RoleEnum.CHEF, "Chef de Service"),
    ("instructeur@dgi.mg", "instructeur123", RoleEnum.INSTRUCTEUR, "Instructeur Principal"),
    ("saisie@dgi.mg", "saisie123", RoleEnum.SAISIE, "Agent de Saisie"),
]

CONTRIBUABLES = [
    # (NIF, nom, type, adresse)
    ("4000112345", "Societe Ankizy Androy SARL", TypeContribuableEnum.MORALE, "Lot II A 25, Ampitatafika, Antananarivo"),
    ("4000223456", "Raharijaona Mamy", TypeContribuableEnum.PHYSIQUE, "67 Ha, Antananarivo"),
    ("4000334567", "SA Fihirana Voyages", TypeContribuableEnum.MORALE, "Ankorondrano, Antananarivo 101"),
    ("4000445678", "Ny Aina Textiles", TypeContribuableEnum.MORALE, "Zone franche Andranonahoatra, Antananarivo"),
    ("4000556789", "Andrianasolo Vola Rina", TypeContribuableEnum.PHYSIQUE, "Ivandry, Antananarivo 101"),
    ("4000667890", "Garage Mahery Auto", TypeContribuableEnum.MORALE, "Anosizato Est, Antananarivo"),
    ("4000778901", "Ets Rakoto & Fils", TypeContribuableEnum.MORALE, "Analakely, Antananarivo 101"),
    ("4000889012", "Ranarivelo Hasina", TypeContribuableEnum.PHYSIQUE, "Isotry, Antananarivo 101"),
    ("4000990123", "Mada Agro Conseil SA", TypeContribuableEnum.MORALE, "Ampandrana, Antananarivo"),
    ("4001001234", "Rasolofonirina Tiana", TypeContribuableEnum.PHYSIQUE, "Andravoahangy, Antananarivo"),
    ("4001112345", "Mada-Tech Solutions", TypeContribuableEnum.MORALE, "Ivato Aeroport, Antananarivo"),
    ("4001223456", "Razafindrakoto Jean", TypeContribuableEnum.PHYSIQUE, "Ambohimanarina, Antananarivo"),
    ("4001334567", "Beaujolais Distribution Sarl", TypeContribuableEnum.MORALE, "Sabotsy Namehana, Antananarivo"),
    ("4001445678", "Ravelojaona Sitraka", TypeContribuableEnum.PHYSIQUE, "Mandialaza, Antananarivo"),
]

RESUMES = [
    "Le service des impots a applique un redressement que le contribuable conteste sur le calcul de la base.",
    "Erreur constatee dans le montant de l'impot sur les revenus professionnels de l'exercice.",
    "Redressement notifie sans visa prealable, le contribuable demande l'annulation de l'avis.",
    "Demande de remise gracieuse des majorations appliquees suite a un retard de paiement lie a la conjoncture.",
    "Difficultes de tresorerie, le contribuable sollicite un echelonnement du paiement de l'impot.",
    "Le contribuable signale une erreur materielle dans sa declaration et demande la correction de la base.",
    "Le versement effectue par virement a ete impute a tort sur un autre exercice fiscal.",
    "Contestation du montant de la taxe fonciere applique a un terrain non batir.",
    "Le contribuable demande la restitution d'un paiement effectue en double au cours du dernier exercice.",
    "Prescription acquise invoquee pour des impositions anterieures a la periode legale.",
    "Demande de regularisation d'une declaration souscrite par erreur a un taux inapproprie.",
    "Le service a applique des penalites a tort alors que le delai legal de paiement n'etait pas expire.",
    "Contestation du caractere exigible de l'impot sur les revenus de l'exercice precedent.",
    "Demande d'exoneration au titre des mesures d'incitation a l'investissement dans les zones franches.",
]

REPARTITION_STATUTS = [
    (StatutReclamationEnum.CLOTUREE, 10),
    (StatutReclamationEnum.NOTIFIEE, 6),
    (StatutReclamationEnum.REJETEE, 4),
    (StatutReclamationEnum.SIGNEE, 4),
    (StatutReclamationEnum.EN_VALIDATION, 6),
    (StatutReclamationEnum.EN_VISA_DIRECTEUR, 4),
    (StatutReclamationEnum.EN_INSTRUCTION, 9),
    (StatutReclamationEnum.EN_ATTENTE_PIECES, 6),
    (StatutReclamationEnum.PROJET_REPONSE, 6),
    (StatutReclamationEnum.ENREGISTREE, 4),
    (StatutReclamationEnum.A_QUALIFIER, 4),
]

STATUTS_CLOS = {
    StatutReclamationEnum.CLOTUREE,
    StatutReclamationEnum.REJETEE,
    StatutReclamationEnum.NOTIFIEE,
    StatutReclamationEnum.SIGNEE,
}

CANAUX = [c for c in CanalEntreeEnum if c != CanalEntreeEnum.PORTAIL]


def _dt(day: date, heure: int = 9, minute: int = 0) -> datetime:
    return datetime.combine(day, time(heure, minute, RNG.randrange(0, 59)))


def _mois_arriere(d: date, n: int) -> date:
    """Retire n mois calendaires a la date d en restant au plus au 27."""
    annee, mois = d.year, d.month - n
    while mois <= 0:
        mois += 12
        annee -= 1
    jour = min(d.day, 27)
    return date(annee, mois, jour)


async def _agents(db) -> dict[str, list[int]]:
    rows = await db.execute(select(User, Role).join(Role, User.id_role == Role.id))
    agents: dict[str, list[int]] = {}
    for user, role in rows:
        agents.setdefault(role.libelle.value, []).append(user.id)
    return agents


async def creer_users_demo(db) -> None:
    for email, mdp, role_enum, nom in DEMO_USERS:
        exists = await db.scalar(select(User.id).where(User.email == email))
        if exists:
            continue
        role = await db.scalar(select(Role).where(Role.libelle == role_enum))
        if role is None:
            raise SystemExit(f"Role {role_enum.value} manquant : lancer 'python -m app.seed' d'abord.")
        db.add(User(
            email=email,
            nom=nom,
            password_hash=get_password_hash(mdp),
            id_role=role.id,
            actif=True,
        ))
    await db.flush()


async def run() -> None:
    async with AsyncSessionLocal() as db:
        try:
            marqueur = await db.scalar(
                select(func.count(Reclamation.id)).where(Reclamation.numero_dossier == "REC-DEMO-000001")
            )
            if marqueur and marqueur > 0:
                print("Jeu de donnees deja charge (REC-DEMO present).")
                return

            await creer_users_demo(db)

            agents = await _agents(db)
            saisie_ids = agents.get("SAISIE", [])
            inst_ids = agents.get("INSTRUCTEUR", [])
            chef_ids = agents.get("CHEF", [])
            dir_ids = agents.get("DIRECTEUR", [])
            if not (saisie_ids and inst_ids and chef_ids and dir_ids):
                raise SystemExit("Roles manquants : lancer 'python -m app.seed' d'abord.")

            motifs = (await db.execute(select(MotifReclamation))).scalars().all()
            type_refs = {t.id: t for t in (await db.execute(select(TypeReclamation))).scalars().all()}

            # --- Contribuables demo ---
            contribuables = []
            for nif, nom, typ, adresse in CONTRIBUABLES:
                exists = await db.scalar(
                    select(Contribuable.id).where(Contribuable.numero_fiscal == nif)
                )
                if exists:
                    contribuables.append(exists)
                    continue
                c = Contribuable(
                    numero_fiscal=nif,
                    nom_raison_sociale=nom,
                    type_contribuable=typ,
                    adresse=adresse,
                    email=f"c{RNG.randrange(10000, 99999)}@demo.mg",
                    telephone=f"03{RNG.randrange(20000000, 99999999)}",
                    actif=True,
                )
                db.add(c)
                await db.flush()
                contribuables.append(c.id)

            # --- Construction des dossiers ---
            aujourd = date.today()
            statuts = []
            for statut, poids in REPARTITION_STATUTS:
                statuts.extend([statut] * poids)
            plan = [RNG.choice(statuts) for _ in range(64)]

            n = 0
            for statut in plan:
                n += 1
                numero = f"REC-DEMO-{n:06d}"
                mois_arriere = RNG.randint(3, 6) if statut in STATUTS_CLOS else RNG.randint(0, 5)
                date_depot = _mois_arriere(aujourd, mois_arriere).replace(day=RNG.randint(1, 27))

                id_contribuable = RNG.choice(contribuables)
                motif = RNG.choice(motifs)
                type_recl = type_refs.get(motif.id_type)

                if statut in STATUTS_CLOS:
                    limite = min(aujourd - timedelta(days=RNG.randint(30, 120)), aujourd)
                else:
                    choix = RNG.random()
                    if choix < 0.20:
                        limite = aujourd - timedelta(days=RNG.randint(1, 45))
                    elif choix < 0.45:
                        limite = aujourd + timedelta(days=RNG.randint(1, 15))
                    else:
                        borne = min(120, getattr(type_recl, "delai_legal_jours", 60))
                        limite = aujourd + timedelta(days=RNG.randint(16, max(17, borne)))

                montant = RNG.choice([None, None, None, 850_000, 1_240_000, 2_500_000, 450_000, 6_000_000])
                reference = f"{RNG.choice(['2024', '2025', '2026'])}-{RNG.randint(1000000, 9999999)}"

                rec = Reclamation(
                    numero_dossier=numero,
                    code_suivi=f"{aujourd.strftime('%Y%m')}-{secrets.token_hex(3).upper()}",
                    id_contribuable=id_contribuable,
                    id_type=motif.id_type,
                    id_motif=motif.id,
                    canal_entree=RNG.choice(CANAUX),
                    date_depot=date_depot,
                    date_limite_reponse=limite,
                    statut=statut,
                    resume_faits=RNG.choice(RESUMES),
                    montant_concerne=montant,
                    reference_imposition=reference,
                    id_agent_createur=RNG.choice(saisie_ids),
                    created_at=_dt(date_depot),
                    updated_at=_dt(min(aujourd, date_depot + timedelta(days=RNG.randint(1, 90)))),
                )
                db.add(rec)
                await db.flush()

                db.add(ActionHistorique(
                    id_reclamation=rec.id,
                    id_agent=rec.id_agent_createur,
                    action=TypeActionEnum.CREATION,
                    commentaire="Reclamation enregistree a l'accueil",
                    created_at=_dt(date_depot, 9, 30),
                ))

                if statut == StatutReclamationEnum.ENREGISTREE:
                    continue

                jq = date_depot + timedelta(days=RNG.randint(1, 3))
                db.add(ActionHistorique(
                    id_reclamation=rec.id,
                    id_agent=rec.id_agent_createur,
                    action=TypeActionEnum.QUALIFICATION,
                    commentaire=f"Type: {type_recl.code.value}, Date limite: {limite}",
                    created_at=_dt(jq, 10, 0),
                ))

                if statut == StatutReclamationEnum.A_QUALIFIER:
                    continue

                instructeur = RNG.choice(inst_ids)
                db.add(Affectation(
                    id_reclamation=rec.id,
                    id_agent=instructeur,
                    role_dossier=RoleDossierEnum.INSTRUCTEUR,
                    date_debut=jq + timedelta(days=1),
                    actif=True,
                ))
                db.add(ActionHistorique(
                    id_reclamation=rec.id,
                    id_agent=instructeur,
                    action=TypeActionEnum.AFFECTATION,
                    commentaire="Affectation a l'instruction",
                    created_at=_dt(jq + timedelta(days=1), 9, 15),
                ))

                if statut == StatutReclamationEnum.EN_INSTRUCTION:
                    continue

                if statut == StatutReclamationEnum.EN_ATTENTE_PIECES:
                    pieces = ["Photo de la piece d'identite", "Copie de l'avis d'imposition", "Justificatif de paiement"]
                    db.add(ActionHistorique(
                        id_reclamation=rec.id,
                        id_agent=instructeur,
                        action=TypeActionEnum.DEMANDE_PIECES,
                        commentaire="Pieces complementaires requises",
                        donnees_contexte={"pieces": pieces},
                        created_at=_dt(jq + timedelta(days=2), 11, 0),
                    ))
                    continue

                db.add(ActionHistorique(
                    id_reclamation=rec.id,
                    id_agent=instructeur,
                    action=TypeActionEnum.REDACTION,
                    commentaire="Projet de decision redige",
                    created_at=_dt(jq + timedelta(days=RNG.randint(3, 10)), 14, 0),
                ))

                if statut in (StatutReclamationEnum.PROJET_REPONSE, StatutReclamationEnum.EN_VALIDATION, StatutReclamationEnum.EN_VISA_DIRECTEUR):
                    major = RNG.choice([0, 0, 250_000, 500_000, 1_000_000])
                    minor = RNG.choice([0, 0, 100_000, 400_000])
                    db.add(Decision(
                        id_reclamation=rec.id,
                        type_decision=RNG.choice([TypeDecisionEnum.ADMIS_TOTAL, TypeDecisionEnum.ADMIS_PARTIEL, TypeDecisionEnum.REJETE]),
                        fondement_juridique="Article 420 ter du Code General des Impots.",
                        motivation="Examen du dossier realise en concertation avec le service instructeur.",
                        montant_accorde=major,
                        montant_rejete=minor,
                        date_decision=aujourd - timedelta(days=RNG.randint(1, 30)),
                        id_redacteur=instructeur,
                        statut=(
                            StatutDecisionEnum.BROUILLON
                            if statut
                            in (StatutReclamationEnum.PROJET_REPONSE, StatutReclamationEnum.EN_VALIDATION)
                            else StatutDecisionEnum.VALIDEE
                        ),
                    ))
                    if statut == StatutReclamationEnum.EN_VISA_DIRECTEUR:
                        db.add(ActionHistorique(
                            id_reclamation=rec.id,
                            id_agent=RNG.choice(chef_ids),
                            action=TypeActionEnum.AVIS_CHEF,
                            commentaire="Avis favorable du chef de service",
                            created_at=_dt(aujourd - timedelta(days=2), 16, 0),
                        ))
                    continue

                # Statuts arrives au terme (SIGNEE / NOTIFIEE / CLOTUREE / REJETEE)
                chef = RNG.choice(chef_ids)
                directeur = RNG.choice(dir_ids)
                db.add(ActionHistorique(
                    id_reclamation=rec.id,
                    id_agent=chef,
                    action=TypeActionEnum.AVIS_CHEF,
                    commentaire="Avis favorable du chef de service",
                    created_at=_dt(aujourd - timedelta(days=RNG.randint(5, 60)), 16, 0),
                ))
                db.add(ActionHistorique(
                    id_reclamation=rec.id,
                    id_agent=directeur,
                    action=TypeActionEnum.VISA_DIR,
                    commentaire="Visa de la direction",
                    created_at=_dt(aujourd - timedelta(days=RNG.randint(2, 55)), 10, 0),
                ))

                rejet = statut == StatutReclamationEnum.REJETEE
                termine = statut in (StatutReclamationEnum.NOTIFIEE, StatutReclamationEnum.CLOTUREE)
                db.add(Decision(
                    id_reclamation=rec.id,
                    type_decision=(
                        TypeDecisionEnum.REJETE
                        if rejet
                        else RNG.choice([TypeDecisionEnum.ADMIS_TOTAL, TypeDecisionEnum.ADMIS_PARTIEL])
                    ),
                    fondement_juridique="Article 420 ter du Code General des Impots.",
                    motivation=(
                        "Rejet de la reclamation : les impositions contestees sont conformes a la loi."
                        if rejet
                        else "Fondement de la reclamation reconnu, decision d'admission partielle ou totale."
                    ),
                    montant_accorde=0 if rejet else RNG.choice([150_000, 350_000, 1_100_000]),
                    montant_rejete=0 if not rejet else RNG.choice([200_000, 800_000]),
                    date_decision=aujourd - timedelta(days=RNG.randint(5, 80)),
                    id_redacteur=instructeur,
                    id_validateur=chef,
                    id_signataire=directeur,
                    statut=(
                        StatutDecisionEnum.SIGNEE
                        if statut == StatutReclamationEnum.SIGNEE
                        else StatutDecisionEnum.NOTIFIEE
                    ),
                ))

                db.add(ActionHistorique(
                    id_reclamation=rec.id,
                    id_agent=directeur,
                    action=TypeActionEnum.SIGNATURE,
                    commentaire="Decision signee par la direction",
                    created_at=_dt(aujourd - timedelta(days=RNG.randint(2, 60)), 9, 0),
                ))
                if statut in (StatutReclamationEnum.NOTIFIEE, StatutReclamationEnum.CLOTUREE, StatutReclamationEnum.REJETEE):
                    db.add(ActionHistorique(
                        id_reclamation=rec.id,
                        id_agent=instructeur,
                        action=TypeActionEnum.ENVOI,
                        commentaire="Decision notifiee au contribuable",
                        created_at=_dt(aujourd - timedelta(days=RNG.randint(1, 50)), 15, 0),
                    ))
                if statut == StatutReclamationEnum.CLOTUREE:
                    db.add(ActionHistorique(
                        id_reclamation=rec.id,
                        id_agent=instructeur,
                        action=TypeActionEnum.CLOTURE,
                        commentaire="Dossier cloture apres notification",
                        created_at=_dt(aujourd - timedelta(days=RNG.randint(1, 40)), 16, 0),
                    ))
                    if RNG.random() < 0.35:
                        for nom in ["avis_imposition.pdf", "recu_paiement.pdf"]:
                            db.add(PieceJointe(
                                id_reclamation=rec.id,
                                nom_fichier=nom,
                                chemin_stockage=f"local:demo/{nom}",
                                type_mime="application/pdf",
                                taille_octets=RNG.randrange(80_000, 900_000),
                                categorie=CategoriePieceEnum.AUTRE,
                                hash_sha256=secrets.token_hex(32),
                                id_depot_par=instructeur,
                                date_depot=_dt(aujourd - timedelta(days=RNG.randint(1, 40))),
                            ))

            await db.commit()
            total = await db.scalar(select(func.count(Reclamation.id)))
            print(f"Jeu de donnees de demonstration charge : {total} reclamations au total.")
        except Exception:
            await db.rollback()
            raise


if __name__ == "__main__":
    asyncio.run(run())