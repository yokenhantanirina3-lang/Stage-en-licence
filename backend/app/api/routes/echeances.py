"""Verification des echeances / alertes de delai - declenchable a la demande (sans Celery)."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user, require_role
from app.models.user import User
from app.tasks.echeances import _check_echeances_async

router = APIRouter()


@router.post("/reclamations/echeances/check")
async def verifier_echeances(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN", "CHEF", "DIRECTEUR")),
):
    """Verifie les echeances de traitement et cree les alertes de delai si necessaire."""
    resultat = await _check_echeances_async()
    return resultat
