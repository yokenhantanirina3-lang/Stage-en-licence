"""Tests des contribuables : listing (taille de page, caracteres speciaux)."""

from app.models.contribuable import Contribuable
from app.tests.conftest import login_headers


async def test_list_contribuables_accepte_grande_page(client, users):
    headers = await login_headers(client, "agent@test-exemple.fr", "agent123")
    response = await client.get("/api/v1/contribuables/?size=300", headers=headers)
    assert response.status_code == 200, response.text


async def test_list_contribuables_avec_speciaux_existants(client, users, db):
    db.add(
        Contribuable(
            numero_fiscal="NIF-AMPERSAND-0001",
            nom_raison_sociale="Ets Rakoto & Fils",
            type_contribuable="MORALE",
            email="contact@rakoto-fils.mg",
            actif=True,
        )
    )
    await db.flush()

    headers = await login_headers(client, "agent@test-exemple.fr", "agent123")
    response = await client.get("/api/v1/contribuables/", headers=headers)
    assert response.status_code == 200, response.text
    noms = [c["nom_raison_sociale"] for c in response.json()]
    assert "Ets Rakoto & Fils" in noms