"""Notifications email et SMS.

Email : implemente avec aiosmtplib (desactive si SMTP_HOST vide -> mode dev).
SMS   : pas de fournisseur configure -> journalise (branchement futur).
"""

import asyncio
import logging

from app.core.celery_app import celery_app
from app.core.config import settings

logger = logging.getLogger(__name__)


def _send_email_sync(to: str, subject: str, body: str) -> None:
    async def _send():
        import aiosmtplib
        from email.message import EmailMessage

        message = EmailMessage()
        message["From"] = settings.EMAIL_FROM
        message["To"] = to
        message["Subject"] = subject
        message.set_content(body)

        await aiosmtplib.send(
            message,
            hostname=settings.SMTP_HOST,
            port=settings.SMTP_PORT,
            username=settings.SMTP_USER or None,
            password=settings.SMTP_PASSWORD or None,
            start_tls=True,
        )

    asyncio.run(_send())


@celery_app.task(name="app.tasks.notifications.send_email", bind=True, max_retries=3)
def send_email(self, to: str, subject: str, body: str, attachments: list | None = None):
    if not settings.SMTP_HOST:
        logger.warning("[DEV] SMTP non configure - email non envoye a %s: %s", to, subject)
        return {"status": "skipped", "reason": "smtp_not_configured", "sent_to": to}

    try:
        _send_email_sync(to, subject, body)
        return {"status": "ok", "sent_to": to}
    except Exception as exc:
        raise self.retry(exc=exc, countdown=120)


@celery_app.task(name="app.tasks.notifications.send_sms")
def send_sms(to: str, message: str):
    # Branchement futur sur un fournisseur HTTP (Twilio, local GSM gateway...).
    logger.info("[DEV] SMS non envoye a %s: %s", to, message[:50])
    return {"status": "skipped", "reason": "no_sms_provider", "sent_to": to}
