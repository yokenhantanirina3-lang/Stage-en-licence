"""Service de stockage : MinIO (S3) ou fallback local si indisponible."""

import io
import os
import uuid
from datetime import timedelta
from functools import lru_cache
from pathlib import Path
from fastapi import HTTPException

from app.core.config import settings

_minio_available: bool | None = None
LOCAL_STORAGE = Path(__file__).resolve().parent.parent.parent / "uploads" / "pieces"


def _try_minio() -> bool:
    global _minio_available
    if _minio_available is not None:
        return _minio_available
    import socket
    try:
        host, port = settings.MINIO_ENDPOINT.split(":")
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(2)
        result = sock.connect_ex((host, int(port)))
        sock.close()
        if result != 0:
            _minio_available = False
            return False
        from minio import Minio
        client = Minio(
            settings.MINIO_ENDPOINT,
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            secure=settings.MINIO_SECURE,
        )
        client.list_buckets()
        _minio_available = True
    except Exception:
        _minio_available = False
    return _minio_available


@lru_cache
def get_minio_client():
    from minio import Minio
    return Minio(
        settings.MINIO_ENDPOINT,
        access_key=settings.MINIO_ACCESS_KEY,
        secret_key=settings.MINIO_SECRET_KEY,
        secure=settings.MINIO_SECURE,
    )


def upload_bytes(bucket: str, nom_fichier: str, data: bytes, content_type: str) -> str:
    if _try_minio():
        client = get_minio_client()
        if not client.bucket_exists(bucket):
            client.make_bucket(bucket)
        object_name = _build_object_name(nom_fichier)
        client.put_object(bucket, object_name, io.BytesIO(data), length=len(data), content_type=content_type)
        return f"minio:{bucket}/{object_name}"

    LOCAL_STORAGE.mkdir(parents=True, exist_ok=True)
    ext = nom_fichier.rsplit(".", 1)[-1].lower() if "." in nom_fichier else "bin"
    filename = f"{uuid.uuid4().hex}.{ext}"
    (LOCAL_STORAGE / filename).write_bytes(data)
    return f"local:{filename}"


def presigned_download(chemin_stockage: str, expires_hours: int = 2) -> str:
    if chemin_stockage.startswith("local:"):
        raise HTTPException(status_code=200, detail=f"LOCAL:{chemin_stockage.split(':',1)[1]}")
    if chemin_stockage.startswith("minio:"):
        bucket, object_name = chemin_stockage.split(":",1)[1].split("/", 1)
        client = get_minio_client()
        return client.presigned_get_object(bucket, object_name, expires=timedelta(hours=expires_hours))
    raise HTTPException(status_code=404, detail="Chemin de stockage inconnu")


def get_local_file(filename: str) -> Path:
    return LOCAL_STORAGE / filename


def download_bytes(chemin_stockage: str) -> bytes:
    if chemin_stockage.startswith("local:"):
        filename = chemin_stockage.split(":", 1)[1]
        return (LOCAL_STORAGE / filename).read_bytes()
    if chemin_stockage.startswith("minio:"):
        bucket, object_name = chemin_stockage.split(":", 1)[1].split("/", 1)
        client = get_minio_client()
        response = client.get_object(bucket, object_name)
        try:
            return response.read()
        finally:
            response.close()
    raise HTTPException(status_code=404, detail="Chemin de stockage inconnu")


def _build_object_name(nom_fichier: str) -> str:
    ext = nom_fichier.rsplit(".", 1)[-1].lower()[:10] if "." in nom_fichier else ""
    unique = uuid.uuid4().hex
    return f"{unique}.{ext}" if ext else unique
