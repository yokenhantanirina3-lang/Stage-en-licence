"""Notifications email et SMS.

Email : implemente avec aiosmtplib (desactive si SMTP_HOST vide -> mode dev).
SMS   : pas de fournisseur configure -> journalise (branchement futur).
"""

import asyncio
import logging

from app.core.celery_app import celery_app
from app.core.config import settings

logger = logging.getLogger(__name__)


def _construire_message(to: str, subject: str, body: str, attachments: list | None = None):
    from email.message import EmailMessage

    message = EmailMessage()
    message["From"] = settings.EMAIL_FROM
    message["To"] = to
    message["Subject"] = subject
    message.set_content(body)

    for attachement in attachments or []:
        nom, data, content_type = attachement
        message.add_attachment(
            data,
            maintype=content_type.split("/")[0],
            subtype=content_type.split("/")[-1] if "/" in content_type else "octet-stream",
            filename=nom,
        )
    return message


async def _envoyer_email_async(
    to: str,
    subject: str,
    body: str,
    attachments: list | None = None,
) -> dict:
    """Envoi reel. Co-routine : a appeler via await dans une route FastAPI."""
    if not settings.SMTP_HOST:
        logger.warning("[DEV] SMTP non configure - email non envoye a %s: %s", to, subject)
        return {"status": "skipped", "reason": "smtp_not_configured", "sent_to": to}

    import aiosmtplib

    message = _construire_message(to, subject, body, attachments)
    await aiosmtplib.send(
        message,
        hostname=settings.SMTP_HOST,
        port=settings.SMTP_PORT,
        username=settings.SMTP_USER or None,
        password=settings.SMTP_PASSWORD or None,
        start_tls=settings.SMTP_STARTTLS,
        timeout=30,
    )
    return {"status": "ok", "sent_to": to}


def send_email_direct(to: str, subject: str, body: str, attachments: list | None = None) -> dict:
    """Envoi immediate (contextes non-async : worker Celery, scripts, tests)."""
    if not settings.SMTP_HOST:
        logger.warning("[DEV] SMTP non configure - email non envoye a %s: %s", to, subject)
        return {"status": "skipped", "reason": "smtp_not_configured", "sent_to": to}
    return asyncio.run(_envoyer_email_async(to, subject, body, attachments))


@celery_app.task(name="app.tasks.notifications.send_email", bind=True, max_retries=3)
def send_email(self, to: str, subject: str, body: str, attachments: list | None = None):
    return send_email_direct(to, subject, body, attachments)


@celery_app.task(name="app.tasks.notifications.send_sms")
def send_sms(to: str, message: str):
    # Branchement futur sur un fournisseur HTTP (Twilio, local GSM gateway...).
    logger.info("[DEV] SMS non envoye a %s: %s", to, message[:50])
    return {"status": "skipped", "reason": "no_sms_provider", "sent_to": to}
