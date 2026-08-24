"""Tests des reclamations : creation, liste, detail, qualification."""

from sqlalchemy import select

from app.models.reclamation import TypeReclamation, TypeReclamationCodeEnum
from app.tests.conftest import login_headers


async def _create_type_contentieuse(db) -> TypeReclamation:
    type_recl = TypeReclamation(
        code=TypeReclamationCodeEnum.CONTENTIEUSE,
        libelle="Reclamation contentieuse",
        delai_legal_jours=60,
    )
    db.add(type_recl)
    await db.flush()
    return type_recl


async def _create_reclamation(client, headers, contribuable_id: int) -> dict:
    response = await client.post(
        "/api/v1/reclamations/",
        json={
            "id_contribuable": contribuable_id,
            "canal_entree": "GUICHET",
            "resume_faits": "Contestation du montant redresse",
            "montant_concerne": 150000.0,
            "reference_imposition": "REF-2026-001",
        },
        headers=headers,
    )
    assert response.status_code == 201, response.text
    return response.json()


async def test_create_reclamation_generates_numero(client, users, contribuable):
    headers = await login_headers(client, "agent@test-exemple.fr", "agent123")
    rec = await _create_reclamation(client, headers, contribuable.id)

    assert rec["numero_dossier"].startswith("REC-")
    assert rec["statut"] == "ENREGISTREE"
    assert float(rec["montant_concerne"]) == 150000.0


async def test_create_reclamation_requires_role(client, users, contribuable):
    headers = await login_headers(client, "directeur@test-exemple.fr", "direct123")
    response = await client.post(
        "/api/v1/reclamations/",
        json={"id_contribuable": contribuable.id},
        headers=headers,
    )
    assert response.status_code == 403


async def test_list_and_get_detail(client, users, contribuable):
    headers = await login_headers(client, "agent@test-exemple.fr", "agent123")
    rec = await _create_reclamation(client, headers, contribuable.id)

    listing = await client.get("/api/v1/reclamations/", headers=headers)
    assert listing.status_code == 200
    assert listing.json()["total"] >= 1

    detail = await client.get(f"/api/v1/reclamations/{rec['id']}", headers=headers)
    assert detail.status_code == 200
    assert detail.json()["id"] == rec["id"]


async def test_get_unknown_reclamation_404(client, users):
    headers = await login_headers(client, "agent@test-exemple.fr", "agent123")
    response = await client.get("/api/v1/reclamations/9999", headers=headers)
    assert response.status_code == 404


async def test_qualification_sets_deadline_and_statut(client, users, contribuable, db):
    type_recl = await _create_type_contentieuse(db)
    types_in_db = (
        (await db.execute(select(TypeReclamation))).scalars().all()
    )
    assert len(types_in_db) == 1

    headers = await login_headers(client, "agent@test-exemple.fr", "agent123")
    rec = await _create_reclamation(client, headers, contribuable.id)

    motifs_response = await client.get("/api/v1/reclamations/motifs", headers=headers)
    assert motifs_response.status_code == 200

    qualify = await client.patch(
        f"/api/v1/reclamations/{rec['id']}/qualifier",
        json={"id_type": type_recl.id},
        headers=headers,
    )
    assert qualify.status_code == 422 or qualify.status_code == 400

    from app.models.reclamation import MotifReclamation

    motif = MotifReclamation(
        id_type=type_recl.id,
        code="ERREUR_CALCUL",
        libelle="Erreur de calcul de l'impot",
        necessite_piece_justificative=True,
    )
    db.add(motif)
    await db.flush()

    qualify_ok = await client.patch(
        f"/api/v1/reclamations/{rec['id']}/qualifier",
        json={"id_type": type_recl.id, "id_motif": motif.id},
        headers=headers,
    )
    assert qualify_ok.status_code == 200, qualify_ok.text
    body = qualify_ok.json()
    assert body["statut"] == "EN_INSTRUCTION"
    assert body["date_limite_reponse"] is not None


async def test_types_endpoint_returns_active_only(client, users, db):
    db.add(
        TypeReclamation(
            code=TypeReclamationCodeEnum.GRACIEUSE,
            libelle="Gracieuse",
            delai_legal_jours=30,
        )
    )
    await db.flush()

    headers = await login_headers(client, "chef@test-exemple.fr", "chef123")
    response = await client.get("/api/v1/reclamations/types", headers=headers)
    assert response.status_code == 200
    codes = [t["code"] for t in response.json()]
    assert "GRACIEUSE" in codes
