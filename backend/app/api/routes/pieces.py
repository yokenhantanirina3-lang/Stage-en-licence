from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import hashlib

from app.core.database import get_db
from app.core.deps import get_current_user, require_role
from app.models.user import User
from app.models.reclamation import (
    Reclamation,
    PieceJointe,
    CategoriePieceEnum,
    ActionHistorique,
    TypeActionEnum,
)
from app.schemas.reclamation import PieceJointeRead
from app.services import minio_service
from app.core.config import settings

router = APIRouter()

TAILLE_MAX = 10 * 1024 * 1024


async def _get_reclamation(db: AsyncSession, reclamation_id: int) -> Reclamation:
    result = await db.execute(
        select(Reclamation).where(Reclamation.id == reclamation_id)
    )
    reclamation = result.scalar_one_or_none()
    if not reclamation:
        raise HTTPException(status_code=404, detail="Reclamation introuvable")
    return reclamation


@router.get("/{reclamation_id}/pieces", response_model=list[PieceJointeRead])
async def list_pieces(
    reclamation_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await _get_reclamation(db, reclamation_id)
    result = await db.execute(
        select(PieceJointe)
        .where(PieceJointe.id_reclamation == reclamation_id)
        .order_by(PieceJointe.date_depot.desc())
    )
    return result.scalars().all()


@router.post(
    "/{reclamation_id}/pieces",
    response_model=PieceJointeRead,
    status_code=201,
)
async def upload_piece(
    reclamation_id: int,
    fichier: UploadFile = File(...),
    categorie: str = Form("AUTRE"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN", "SAISIE", "INSTRUCTEUR")),
):
    await _get_reclamation(db, reclamation_id)

    try:
        categorie_enum = CategoriePieceEnum(categorie)
    except ValueError:
        raise HTTPException(status_code=400, detail="Categorie invalide")

    data = await fichier.read()
    if len(data) > TAILLE_MAX:
        raise HTTPException(status_code=400, detail="Fichier trop volumineux (max 10 Mo)")
    if not data:
        raise HTTPException(status_code=400, detail="Fichier vide")

    chemin = minio_service.upload_bytes(
        settings.MINIO_BUCKET_PIECES,
        fichier.filename or "sans_nom",
        data,
        fichier.content_type or "application/octet-stream",
    )

    piece = PieceJointe(
        id_reclamation=reclamation_id,
        nom_fichier=fichier.filename or "sans_nom",
        chemin_stockage=chemin,
        type_mime=fichier.content_type or "application/octet-stream",
        taille_octets=len(data),
        categorie=categorie_enum,
        hash_sha256=hashlib.sha256(data).hexdigest(),
        id_depot_par=current_user.id,
    )
    db.add(piece)

    action = ActionHistorique(
        id_reclamation=reclamation_id,
        id_agent=current_user.id,
        action=TypeActionEnum.RECEPTION_PIECES,
        commentaire=f"Depot de {piece.nom_fichier}",
    )
    db.add(action)
    await db.flush()

    return piece


@router.get("/{reclamation_id}/pieces/{piece_id}/download")
async def download_piece(
    reclamation_id: int,
    piece_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(PieceJointe).where(
            PieceJointe.id == piece_id,
            PieceJointe.id_reclamation == reclamation_id,
        )
    )
    piece = result.scalar_one_or_none()
    if not piece:
        raise HTTPException(status_code=404, detail="Piece jointe introuvable")

    url = minio_service.presigned_download(piece.chemin_stockage)
    return {"url": url}
