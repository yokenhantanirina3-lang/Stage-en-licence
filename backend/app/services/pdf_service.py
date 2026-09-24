"""Generation des PDF (accuse de reception) via reportlab - sans Docker/MinIO."""

from datetime import date

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

from app.models.reclamation import Reclamation
from app.services import minio_service
from app.core.config import settings

_MARGE = 18 * mm


def _style_titre():
    return ParagraphStyle(
        "Titre",
        parent=getSampleStyleSheet()["Title"],
        fontSize=17,
        leading=22,
        alignment=1,
        spaceAfter=4,
        textColor=colors.HexColor("#1e293b"),
    )


def _style_sous_titre():
    return ParagraphStyle(
        "SousTitre",
        parent=getSampleStyleSheet()["Normal"],
        fontSize=10,
        alignment=1,
        textColor=colors.HexColor("#64748b"),
        spaceAfter=2,
    )


def _format_montant(montant) -> str:
    if montant is None:
        return "Non precise"
    return f"{float(montant):,.2f} DA".replace(",", " ")


def build_accuse_pdf(reclamation: Reclamation) -> bytes:
    """Construit le PDF d'accuse de reception pour une reclamation."""
    numero = reclamation.numero_dossier
    date_depot = reclamation.date_depot.strftime("%d/%m/%Y") if reclamation.date_depot else "-"
    contribuable = getattr(reclamation, "contribuable", None)
    nom = getattr(contribuable, "nom_raison_sociale", "-") or "-"
    nif = getattr(contribuable, "numero_fiscal", "-") or "-"
    canal = reclamation.canal_entree.value if hasattr(reclamation.canal_entree, "value") else str(reclamation.canal_entree)
    type_libelle = getattr(getattr(reclamation, "type", None), "libelle", "-") or "-"

    from io import BytesIO

    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        topMargin=_MARGE,
        bottomMargin=_MARGE,
        leftMargin=_MARGE,
        rightMargin=_MARGE,
        title=f"Accuse de reception - {numero}",
    )

    styles = getSampleStyleSheet()
    normal = ParagraphStyle(
        "NormalX",
        parent=styles["BodyText"],
        fontSize=10.5,
        leading=15,
        textColor=colors.HexColor("#334155"),
    )

    footer_style = ParagraphStyle(
        "Footer",
        parent=styles["BodyText"],
        fontSize=8,
        textColor=colors.HexColor("#94a3b8"),
        alignment=1,
    )

    tableau = Table(
        [
            ["Numero de dossier", numero],
            ["Date de depot", date_depot],
            ["Contribuable", nom],
            ["Numero fiscal", nif],
            ["Type de reclamation", type_libelle],
            ["Canal d'entree", canal],
            ["Montant concerne", _format_montant(reclamation.montant_concerne)],
            ["Reference imposition", reclamation.reference_imposition or "-"],
        ],
        colWidths=[55 * mm, 100 * mm],
        style=TableStyle(
            [
                ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 10),
                ("TEXTCOLOR", (0, 0), (0, -1), colors.HexColor("#1e293b")),
                ("TEXTCOLOR", (1, 0), (1, -1), colors.HexColor("#334155")),
                ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#f1f5f9")),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
                ("TOPPADDING", (0, 0), (-1, -1), 7),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ]
        ),
    )

    lignes = [
        Paragraph("Accuse de reception", _style_titre()),
        Paragraph("Plateforme de gestion des reclamations fiscales", _style_sous_titre()),
        Paragraph("Direction Generale des Impots - Madagascar", _style_sous_titre()),
        Spacer(1, 8 * mm),
        Paragraph(
            "Nous accusons la reception de votre reclamation enregistree sous les references suivantes :",
            normal,
        ),
        Spacer(1, 6 * mm),
        tableau,
        Spacer(1, 8 * mm),
        Paragraph(
            "Votre dossier sera traite dans le respect des delais reglementaires en vigueur.",
            normal,
        ),
        Spacer(1, 14 * mm),
        Paragraph(
            f"Document genere automatiquement le {date.today().strftime('%d/%m/%Y')}.",
            footer_style,
        ),
    ]

    doc.build(lignes)
    return buffer.getvalue()


def generer_et_stocker_accuse(reclamation: Reclamation) -> str:
    """Genere le PDF d'accuse, le stocke (MinIO ou local) et retourne le chemin."""
    pdf_bytes = build_accuse_pdf(reclamation)
    chemin = minio_service.upload_bytes(
        settings.MINIO_BUCKET_DOCS,
        f"ACCUSE_RECEPTION_{reclamation.numero_dossier}.pdf",
        pdf_bytes,
        "application/pdf",
    )
    return chemin


def build_decision_pdf(reclamation: Reclamation, decision) -> bytes:
    """Construit le PDF de decision notifiee via reportlab."""
    numero = reclamation.numero_dossier
    contribuable = getattr(reclamation, "contribuable", None)
    nom = getattr(contribuable, "nom_raison_sociale", "-") or "-"
    nif = getattr(contribuable, "numero_fiscal", "-") or "-"
    type_decision = getattr(decision, "type_decision", "-")
    type_decision = type_decision.value if hasattr(type_decision, "value") else str(type_decision)
    date_decision = decision.date_decision.strftime("%d/%m/%Y") if getattr(decision, "date_decision", None) else "-"
    signataire = getattr(getattr(decision, "signataire", None), "nom", "Illegible") or "Illegible"

    from io import BytesIO

    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        topMargin=_MARGE,
        bottomMargin=_MARGE,
        leftMargin=_MARGE,
        rightMargin=_MARGE,
        title=f"Decision - {numero}",
    )

    styles = getSampleStyleSheet()
    normal = ParagraphStyle(
        "NormalX",
        parent=styles["BodyText"],
        fontSize=10.5,
        leading=15,
        textColor=colors.HexColor("#334155"),
    )
    footer_style = ParagraphStyle(
        "Footer",
        parent=styles["BodyText"],
        fontSize=8,
        textColor=colors.HexColor("#94a3b8"),
        alignment=1,
    )

    def _para_bloc(libelle, contenu):
        return Paragraph(
            f"<b>{libelle} :</b> {contenu}",
            normal,
        )

    tableau = Table(
        [
            ["Numero de dossier", numero],
            ["Contribuable", nom],
            ["Numero fiscal", nif],
            ["Type de decision", type_decision],
            ["Date de decision", date_decision],
            ["Montant accorde", _format_montant(decision.montant_accorde)],
            ["Montant rejete", _format_montant(decision.montant_rejete)],
        ],
        colWidths=[55 * mm, 100 * mm],
        style=TableStyle(
            [
                ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 10),
                ("TEXTCOLOR", (0, 0), (0, -1), colors.HexColor("#1e293b")),
                ("TEXTCOLOR", (1, 0), (1, -1), colors.HexColor("#334155")),
                ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#f1f5f9")),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
                ("TOPPADDING", (0, 0), (-1, -1), 7),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ]
        ),
    )

    lignes = [
        Paragraph("Decision de la Direction des Impots", _style_titre()),
        Paragraph("Plateforme de gestion des reclamations fiscales", _style_sous_titre()),
        Paragraph("Direction Generale des Impots - Madagascar", _style_sous_titre()),
        Spacer(1, 8 * mm),
        _para_bloc("Fondement juridique", decision.fondement_juridique or "-"),
        Spacer(1, 5 * mm),
        _para_bloc("Motivation", decision.motivation or "-"),
        Spacer(1, 6 * mm),
        tableau,
        Spacer(1, 9 * mm),
        Paragraph(
            f"Fait a Antananarivo, le {date_decision}. Le Directeur : {signataire}.",
            normal,
        ),
        Spacer(1, 14 * mm),
        Paragraph(
            f"Document genere automatiquement le {date.today().strftime('%d/%m/%Y')}.",
            footer_style,
        ),
    ]

    doc.build(lignes)
    return buffer.getvalue()


def generer_et_stocker_decision(reclamation: Reclamation, decision) -> str:
    """Genere le PDF de decision, le stocke (MinIO ou local) et retourne le chemin."""
    pdf_bytes = build_decision_pdf(reclamation, decision)
    chemin = minio_service.upload_bytes(
        settings.MINIO_BUCKET_DOCS,
        f"DECISION_{reclamation.numero_dossier}.pdf",
        pdf_bytes,
        "application/pdf",
    )
    return chemin


def build_dossier_pdf(reclamation: Reclamation) -> bytes:
    """Construit le PDF de dossier complet d'une reclamation (cinquieme section)."""
    contribuable = getattr(reclamation, "contribuable", None)
    nom = getattr(contribuable, "nom_raison_sociale", "-") or "-"
    nif = getattr(contribuable, "numero_fiscal", "-") or "-"
    code_suivi = getattr(reclamation, "code_suivi", None) or "-"
    statut = getattr(reclamation, "statut", "-")
    statut = statut.value if hasattr(statut, "value") else str(statut)
    canal = getattr(reclamation, "canal_entree", "-")
    canal = canal.value if hasattr(canal, "value") else str(canal)
    type_libelle = getattr(getattr(reclamation, "type", None), "libelle", "-") or "-"
    motif_libelle = getattr(getattr(reclamation, "motif", None), "libelle", "-") or "-"

    from io import BytesIO

    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        topMargin=_MARGE,
        bottomMargin=_MARGE,
        leftMargin=_MARGE,
        rightMargin=_MARGE,
        title=f"Dossier - {reclamation.numero_dossier}",
    )

    styles = getSampleStyleSheet()
    normal = ParagraphStyle(
        "NormalX",
        parent=styles["BodyText"],
        fontSize=10.5,
        leading=15,
        textColor=colors.HexColor("#334155"),
    )
    footer_style = ParagraphStyle(
        "Footer",
        parent=styles["BodyText"],
        fontSize=8,
        textColor=colors.HexColor("#94a3b8"),
        alignment=1,
    )
    small = ParagraphStyle(
        "Small",
        parent=styles["BodyText"],
        fontSize=9.5,
        leading=13,
        textColor=colors.HexColor("#475569"),
    )

    def _para_bloc(libelle, contenu):
        return Paragraph(
            f"<b>{libelle} :</b> {contenu}",
            normal,
        )

    tableau = Table(
        [
            ["Numero de dossier", reclamation.numero_dossier],
            ["Code de suivi", code_suivi],
            ["Statut", statut],
            ["Canal d'entree", canal],
            ["Date de depot", reclamation.date_depot.strftime("%d/%m/%Y") if reclamation.date_depot else "-"],
            ["Date limite de reponse", reclamation.date_limite_reponse.strftime("%d/%m/%Y") if reclamation.date_limite_reponse else "-"],
            ["Type de reclamation", type_libelle],
            ["Motif", motif_libelle],
            ["Montant concerne", _format_montant(reclamation.montant_concerne)],
            ["Reference imposition", reclamation.reference_imposition or "-"],
            ["Contribuable", nom],
            ["Numero fiscal", nif],
        ],
        colWidths=[55 * mm, 100 * mm],
        style=TableStyle(
            [
                ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 10),
                ("TEXTCOLOR", (0, 0), (0, -1), colors.HexColor("#1e293b")),
                ("TEXTCOLOR", (1, 0), (1, -1), colors.HexColor("#334155")),
                ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#f1f5f9")),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ]
        ),
    )

    lignes = [
        Paragraph("Dossier de reclamation", _style_titre()),
        Paragraph("Plateforme de gestion des reclamations fiscales", _style_sous_titre()),
        Paragraph("Direction Generale des Impots - Madagascar", _style_sous_titre()),
        Spacer(1, 8 * mm),
        tableau,
    ]

    historique = getattr(reclamation, "historique", None) or []
    if historique:
        lignes.append(Spacer(1, 8 * mm))
        lignes.append(Paragraph("<b>Historique du dossier</b>", normal))
        lignes.append(Spacer(1, 3 * mm))
        lignes.append(Paragraph("<br/>".join([f"<b>{h.created_at.strftime('%d/%m/%Y %H:%M')}</b> - {h.action.value if hasattr(h.action, 'value') else h.action}{(' : ' + h.commentaire) if (h.commentaire or '').strip() else ''}" for h in historique]), small))

    decision = getattr(reclamation, "decision", None)
    if decision:
        type_decision = getattr(decision, "type_decision", "-")
        type_decision = type_decision.value if hasattr(type_decision, "value") else str(type_decision)
        lignes.append(Spacer(1, 8 * mm))
        lignes.append(Paragraph("<b>Decision</b>", normal))
        lignes.append(Spacer(1, 3 * mm))
        lignes.append(_para_bloc("Type de decision", type_decision))
        lignes.append(_para_bloc("Fondement juridique", getattr(decision, "fondement_juridique", "-") or "-"))
        lignes.append(_para_bloc("Motivation", getattr(decision, "motivation", "-") or "-"))
        lignes.append(_para_bloc("Montant accorde", _format_montant(getattr(decision, "montant_accorde", None))))
        lignes.append(_para_bloc("Montant rejete", _format_montant(getattr(decision, "montant_rejete", None))))

    lignes.append(Spacer(1, 10 * mm))
    lignes.append(Paragraph(
        f"Document genere automatiquement le {date.today().strftime('%d/%m/%Y')}.",
        footer_style,
    ))

    doc.build(lignes)
    return buffer.getvalue()
