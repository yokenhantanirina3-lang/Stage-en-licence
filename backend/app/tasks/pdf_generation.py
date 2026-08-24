"""Generation des PDF (accuse de reception, decision notifiee) via WeasyPrint."""

import asyncio
from datetime import date

from jinja2 import Template
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.celery_app import celery_app
from app.core.config import settings
from app.core.database import AsyncSessionLocal
from app.models.reclamation import Reclamation, Decision
from app.models.system import ModeleDocument
from app.services import minio_service

TEMPLATE_ACCUSE_DEFAULT = """<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: 'DejaVu Sans', sans-serif; font-size: 12pt; margin: 40px; }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 16px; margin-bottom: 24px; }
        .title { font-size: 16pt; font-weight: bold; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        td { padding: 8px; border-bottom: 1px solid #ddd; }
        td.label { font-weight: bold; width: 35%; }
        .footer { margin-top: 48px; font-size: 9pt; color: #666; text-align: center; }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">Accuse de reception</div>
        <div>Plateforme de gestion des reclamations fiscales</div>
    </div>
    <p>Nous accusons la reception de votre reclamation enregistree sous les references suivantes :</p>
    <table>
        <tr><td class="label">Numero de dossier</td><td>{{ numero_dossier }}</td></tr>
        <tr><td class="label">Date de depot</td><td>{{ date_depot }}</td></tr>
        <tr><td class="label">Contribuable</td><td>{{ contribuable_nom }}</td></tr>
        <tr><td class="label">Canal d'entree</td><td>{{ canal_entree }}</td></tr>
        <tr><td class="label">Montant concerne</td><td>{{ montant_concerne }}</td></tr>
        <tr><td class="label">Reference imposition</td><td>{{ reference_imposition }}</td></tr>
    </table>
    <p style="margin-top: 24px;">Votre dossier sera traite dans le respect des delais reglementaires.</p>
    <div class="footer">Document genere automatiquement le {{ date_generation }}</div>
</body>
</html>"""


def _format_montant(montant) -> str:
    if montant is None:
        return "Non precise"
    return f"{float(montant):,.2f} DA".replace(",", " ")


async def _generate_pdf_async(reclamation_id: int, template_code: str) -> dict:
    from weasyprint import HTML

    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(Reclamation)
            .options(selectinload(Reclamation.contribuable))
            .where(Reclamation.id == reclamation_id)
        )
        reclamation = result.scalar_one_or_none()
        if not reclamation:
            return {"status": "error", "detail": f"Reclamation {reclamation_id} introuvable"}

        modele_result = await db.execute(
            select(ModeleDocument).where(
                ModeleDocument.code == template_code,
                ModeleDocument.actif.is_(True),
            )
        )
        modele = modele_result.scalar_one_or_none()
        template_html = modele.template_html if modele else TEMPLATE_ACCUSE_DEFAULT

        contexte = {
            "numero_dossier": reclamation.numero_dossier,
            "date_depot": reclamation.date_depot.strftime("%d/%m/%Y"),
            "contribuable_nom": getattr(reclamation.contribuable, "nom_raison_sociale", "-"),
            "canal_entree": reclamation.canal_entree.value,
            "montant_concerne": _format_montant(reclamation.montant_concerne),
            "reference_imposition": reclamation.reference_imposition or "-",
            "resume_faits": reclamation.resume_faits or "",
            "date_generation": date.today().strftime("%d/%m/%Y %H:%M"),
        }

        html = Template(template_html).render(**contexte)
        pdf_bytes = HTML(string=html).write_pdf()

        chemin = minio_service.upload_bytes(
            settings.MINIO_BUCKET_DOCS,
            f"{template_code.lower()}_{reclamation_id}.pdf",
            pdf_bytes,
            "application/pdf",
        )

        if template_code.startswith("ACCUSE"):
            reclamation.pdf_accuse_path = chemin
        else:
            decision_result = await db.execute(
                select(Decision).where(Decision.id_reclamation == reclamation_id)
            )
            decision = decision_result.scalar_one_or_none()
            if decision:
                decision.chemin_pdf = chemin

        await db.commit()

        return {"status": "ok", "pdf_path": chemin, "reclamation_id": reclamation_id}


@celery_app.task(name="app.tasks.pdf_generation.generate_pdf", bind=True, max_retries=3)
def generate_pdf(self, reclamation_id: int, template_code: str = "ACCUSE_RECEPTION"):
    try:
        return asyncio.run(_generate_pdf_async(reclamation_id, template_code))
    except Exception as exc:
        raise self.retry(exc=exc, countdown=60)
