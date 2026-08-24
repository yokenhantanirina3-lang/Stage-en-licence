"""Tests de l'authentification JWT."""

from app.tests.conftest import login_headers


async def test_login_success(client, users):
    response = await client.post(
        "/api/v1/auth/login",
        data={"username": "admin@test-exemple.fr", "password": "admin123"},
    )
    assert response.status_code == 200
    body = response.json()
    assert "access_token" in body
    assert "refresh_token" in body
    assert body["token_type"] == "bearer"


async def test_login_wrong_password(client, users):
    response = await client.post(
        "/api/v1/auth/login",
        data={"username": "admin@test-exemple.fr", "password": "mauvais"},
    )
    assert response.status_code == 401


async def test_login_unknown_user(client, users):
    response = await client.post(
        "/api/v1/auth/login",
        data={"username": "inconnu@test-exemple.fr", "password": "x123456"},
    )
    assert response.status_code == 401


async def test_me_requires_token(client):
    response = await client.get("/api/v1/auth/me")
    assert response.status_code in (401, 403)


async def test_me_returns_profile(client, users):
    headers = await login_headers(client, "agent@test-exemple.fr", "agent123")
    response = await client.get("/api/v1/auth/me", headers=headers)
    assert response.status_code == 200
    body = response.json()
    assert body["email"] == "agent@test-exemple.fr"
    assert body["role"]["libelle"] == "SAISIE"


async def test_refresh_token(client, users):
    login = await client.post(
        "/api/v1/auth/login",
        data={"username": "admin@test-exemple.fr", "password": "admin123"},
    )
    refresh = login.json()["refresh_token"]

    response = await client.post("/api/v1/auth/refresh", params={"refresh_token": refresh})
    assert response.status_code == 200
    assert "access_token" in response.json()
