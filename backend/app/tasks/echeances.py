"""Verification quotidienne des echeances de traitement."""

import asyncio
from datetime import date, timedelta

from sqlalchemy import select, and_

from app.core.celery_app import celery_app
from app.core.database import AsyncSessionLocal
from app.models.reclamation import (
    Reclamation,
    ActionHistorique,
    TypeActionEnum,
    StatutReclamationEnum,
)

STATUTS_SUIVIS = (
    StatutReclamationEnum.A_QUALIFIER,
    StatutReclamationEnum.EN_INSTRUCTION,
    StatutReclamationEnum.EN_ATTENTE_PIECES,
    StatutReclamationEnum.PROJET_REPONSE,
)

SEUIL_ALERTE_JOURS = 30


def _niveau_alerte(jours_restants: int) -> str:
    if jours_restants < 0:
        return "DEPASSE"
    if jours_restants <= 7:
        return "CRITIQUE"
    if jours_restants <= 15:
        return "URGENT"
    return "INFO"


async def _check_echeances_async() -> dict:
    aujourdhui = date.today()
    limite = aujourdhui + timedelta(days=SEUIL_ALERTE_JOURS)

    alertes_creees = 0

    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(Reclamation).where(
                and_(
                    Reclamation.statut.in_(STATUTS_SUIVIS),
                    Reclamation.date_limite_reponse.is_not(None),
                    Reclamation.date_limite_reponse <= limite,
                )
            )
        )
        reclamations = result.scalars().all()

        for reclamation in reclamations:
            deja_alerte = await db.execute(
                select(ActionHistorique.id).where(
                    and_(
                        ActionHistorique.id_reclamation == reclamation.id,
                        ActionHistorique.action == TypeActionEnum.ALERTE_DELAI,
                        ActionHistorique.created_at >= aujourdhui,
                    )
                )
            )
            if deja_alerte.scalar_one_or_none():
                continue

            jours_restants = (reclamation.date_limite_reponse - aujourdhui).days
            niveau = _niveau_alerte(jours_restants)

            db.add(
                ActionHistorique(
                    id_reclamation=reclamation.id,
                    action=TypeActionEnum.ALERTE_DELAI,
                    commentaire=(
                        f"Echeance {niveau}: {jours_restants} jour(s) restant(s) "
                        f"(limite {reclamation.date_limite_reponse.strftime('%d/%m/%Y')})"
                    ),
                )
            )
            alertes_creees += 1

        await db.commit()

    return {"status": "ok", "checked": len(reclamations), "alertes_creees": alertes_creees}


@celery_app.task(name="app.tasks.echeances.check_echeances_daily")
def check_echeances_daily():
    return asyncio.run(_check_echeances_async())
