"""Tests du workflow decision complet : redaction -> validation -> signature -> notification."""

from app.tests.conftest import login_headers


async def _setup_dossier(client, db, users, contribuable) -> dict:
    """Cree un type/motif, une reclamation et la qualifie. Retourne les ids."""
    from app.models.reclamation import TypeReclamation, MotifReclamation, TypeReclamationCodeEnum

    type_recl = TypeReclamation(
        code=TypeReclamationCodeEnum.CONTENTIEUSE,
        libelle="Contentieuse",
        delai_legal_jours=60,
    )
    db.add(type_recl)
    await db.flush()

    motif = MotifReclamation(
        id_type=type_recl.id,
        code="REDRESSEMENT_CONTESTE",
        libelle="Contestation d'un redressement",
        necessite_piece_justificative=True,
    )
    db.add(motif)
    await db.flush()

    headers_agent = await login_headers(client, "agent@test-exemple.fr", "agent123")
    create = await client.post(
        "/api/v1/reclamations/",
        json={"id_contribuable": contribuable.id, "canal_entree": "GUICHET"},
        headers=headers_agent,
    )
    assert create.status_code == 201, create.text
    rec_id = create.json()["id"]

    headers_instr = await login_headers(client, "instructeur@test-exemple.fr", "instr123")
    qualify = await client.patch(
        f"/api/v1/reclamations/{rec_id}/qualifier",
        json={"id_type": type_recl.id, "id_motif": motif.id},
        headers=headers_instr,
    )
    assert qualify.status_code == 200, qualify.text

    return {"rec_id": rec_id, "headers_instr": headers_instr}


def _decision_payload() -> dict:
    return {
        "type_decision": "ADMIS_PARTIEL",
        "fondement_juridique": "Art. 72 CIDTA",
        "motivation": "Redressement partiellement fonde.",
        "montant_accorde": 50000,
        "montant_rejete": 100000,
    }


async def test_workflow_complet(client, users, contribuable, db):
    dossier = await _setup_dossier(client, db, users, contribuable)
    rec_id = dossier["rec_id"]
    headers_instr = dossier["headers_instr"]

    # 1. Redaction du projet de decision
    create = await client.post(
        f"/api/v1/reclamations/{rec_id}/decision",
        json=_decision_payload(),
        headers=headers_instr,
    )
    assert create.status_code == 201, create.text
    decision = create.json()
    assert decision["statut"] == "BROUILLON"

    rec = await client.get(f"/api/v1/reclamations/{rec_id}", headers=headers_instr)
    assert rec.json()["statut"] == "PROJET_REPONSE"

    # 2. Soumission a la validation
    submit = await client.post(
        f"/api/v1/decisions/{decision['id']}/soumettre", json={}, headers=headers_instr
    )
    assert submit.status_code == 200
    rec = await client.get(f"/api/v1/reclamations/{rec_id}", headers=headers_instr)
    assert rec.json()["statut"] == "EN_VALIDATION"

    # 3. Validation par le chef
    headers_chef = await login_headers(client, "chef@test-exemple.fr", "chef123")
    validate = await client.post(
        f"/api/v1/decisions/{decision['id']}/valider",
        json={"avis": "FAVORABLE"},
        headers=headers_chef,
    )
    assert validate.status_code == 200
    assert validate.json()["statut"] == "VALIDEE"
    rec = await client.get(f"/api/v1/reclamations/{rec_id}", headers=headers_instr)
    assert rec.json()["statut"] == "EN_VISA_DIRECTEUR"

    # 4. Signature par le directeur
    headers_dir = await login_headers(client, "directeur@test-exemple.fr", "direct123")
    sign = await client.post(
        f"/api/v1/decisions/{decision['id']}/signer", json={}, headers=headers_dir
    )
    assert sign.status_code == 200
    assert sign.json()["statut"] == "SIGNEE"

    # 5. Notification et cloture
    notify = await client.post(
        f"/api/v1/decisions/{decision['id']}/notifier", headers=headers_chef
    )
    assert notify.status_code == 200
    assert notify.json()["statut"] == "NOTIFIEE"

    rec = await client.get(f"/api/v1/reclamations/{rec_id}", headers=headers_instr)
    assert rec.json()["statut"] == "CLOTUREE"


async def test_instructeur_ne_peut_pas_valider(client, users, contribuable, db):
    dossier = await _setup_dossier(client, db, users, contribuable)
    rec_id = dossier["rec_id"]
    headers_instr = dossier["headers_instr"]

    create = await client.post(
        f"/api/v1/reclamations/{rec_id}/decision",
        json=_decision_payload(),
        headers=headers_instr,
    )
    decision = create.json()

    response = await client.post(
        f"/api/v1/decisions/{decision['id']}/valider",
        json={"avis": "FAVORABLE"},
        headers=headers_instr,
    )
    assert response.status_code == 403


async def test_double_decision_refusee(client, users, contribuable, db):
    dossier = await _setup_dossier(client, db, users, contribuable)
    rec_id = dossier["rec_id"]
    headers_instr = dossier["headers_instr"]

    first = await client.post(
        f"/api/v1/reclamations/{rec_id}/decision",
        json=_decision_payload(),
        headers=headers_instr,
    )
    assert first.status_code == 201

    second = await client.post(
        f"/api/v1/reclamations/{rec_id}/decision",
        json=_decision_payload(),
        headers=headers_instr,
    )
    assert second.status_code == 400


async def test_historique_trace_le_workflow(client, users, contribuable, db):
    dossier = await _setup_dossier(client, db, users, contribuable)
    rec_id = dossier["rec_id"]
    headers_instr = dossier["headers_instr"]

    create = await client.post(
        f"/api/v1/reclamations/{rec_id}/decision",
        json=_decision_payload(),
        headers=headers_instr,
    )
    decision_id = create.json()["id"]

    history = await client.get(
        f"/api/v1/reclamations/{rec_id}/historique", headers=headers_instr
    )
    assert history.status_code == 200
    actions = [a["action"] for a in history.json()]
    assert "CREATION" in actions
    assert "QUALIFICATION" in actions
    assert "REDACTION" in actions


async def test_demande_pieces_change_statut(client, users, contribuable, db):
    dossier = await _setup_dossier(client, db, users, contribuable)
    rec_id = dossier["rec_id"]
    headers_instr = dossier["headers_instr"]

    response = await client.post(
        f"/api/v1/reclamations/{rec_id}/demander-pieces",
        json={
            "motif": "Pieces justificatives manquantes",
            "liste_pieces": ["Avis d'imposition", "Registre de commerce"],
        },
        headers=headers_instr,
    )
    assert response.status_code == 200
    assert response.json()["statut"] == "EN_ATTENTE_PIECES"
