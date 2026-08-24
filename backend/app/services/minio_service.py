"""Service de stockage MinIO (S3) pour les pieces jointes et documents."""

import io
import uuid
from datetime import timedelta
from functools import lru_cache

from minio import Minio

from app.core.config import settings


@lru_cache
def get_minio_client() -> Minio:
    return Minio(
        settings.MINIO_ENDPOINT,
        access_key=settings.MINIO_ACCESS_KEY,
        secret_key=settings.MINIO_SECRET_KEY,
        secure=settings.MINIO_SECURE,
    )


def ensure_bucket(bucket: str) -> None:
    client = get_minio_client()
    if not client.bucket_exists(bucket):
        client.make_bucket(bucket)


def build_object_name(nom_fichier: str) -> str:
    extension = ""
    if "." in nom_fichier:
        extension = nom_fichier.rsplit(".", 1)[-1].lower()[:10]
    unique = uuid.uuid4().hex
    return f"{unique}.{extension}" if extension else unique


def upload_bytes(bucket: str, nom_fichier: str, data: bytes, content_type: str) -> str:
    """Depose un fichier et retourne le chemin de stockage (bucket/object)."""
    ensure_bucket(bucket)
    object_name = build_object_name(nom_fichier)
    client = get_minio_client()
    client.put_object(
        bucket,
        object_name,
        io.BytesIO(data),
        length=len(data),
        content_type=content_type,
    )
    return f"{bucket}/{object_name}"


def presigned_download(chemin_stockage: str, expires_hours: int = 2) -> str:
    """Genere une URL de telechargement temporaire pour bucket/object."""
    bucket, object_name = chemin_stockage.split("/", 1)
    client = get_minio_client()
    return client.presigned_get_object(
        bucket, object_name, expires=timedelta(hours=expires_hours)
    )
