# Logiciel de gestion de la relation usager — suivi des réceptions et réclamations à l'accueil d'un centre fiscal

## Demarrage rapide

```bash
# 1. Lancer tous les services
docker compose up --build -d

# 2. Verifier les logs
docker compose logs -f backend

# 3. Acceder aux interfaces
# - API Docs (Swagger) : http://localhost:8000/docs
# - Frontend (React)   : http://localhost:5173
# - MinIO Console      : http://localhost:9001 (minioadmin / minioadmin)
# - pgAdmin            : http://localhost:5050 (admin@fiscal.dz / adminpass)
```

## Initialiser la base de donnees

```bash
# 1. Appliquer les migrations (creation des tables)
docker compose exec backend alembic upgrade head

# 2. Charger les donnees de reference (roles, services, types/motifs, super admin)
docker compose exec backend python -m app.seed
```

Le super admin est cree avec les identifiants definis dans `.env`
(`FIRST_SUPERUSER_EMAIL` / `FIRST_SUPERUSER_PASSWORD`).

## Lancement local (sans Docker)

Necessite : Python 3.11+, PostgreSQL, Node.js. Redis/MinIO optionnels
(requis seulement pour Celery et les pieces jointes).

```bash
# 1. Backend : dependances + .env (copier la racine .env dans backend/)
cd backend
pip install -r requirements.txt

# 2. Migration + seed
alembic upgrade head
python -m app.seed

# 3. API sur http://localhost:8000/docs
uvicorn app.main:app --port 8000 --reload

# 4. Frontend sur http://localhost:5173
cd ../frontend
npm install
npm run dev
```

## Tests

```bash
# Dans Docker
docker compose exec backend pytest

# En local (necessite PostgreSQL ; les tests vident puis recreeent le schema)
cd backend
pytest
```

## Commandes utiles

```bash
# Arreter
docker compose down

# Arreter + supprimer volumes
docker compose down -v

# Shell backend
docker compose exec backend bash

# Tests
docker compose exec backend pytest
```

## Stack technique

- Backend: FastAPI + SQLAlchemy 2.0 + PostgreSQL
- Frontend: React 18 + TypeScript + Tailwind CSS
- Async: Celery + Redis
- Stockage: MinIO (S3)
- Auth: JWT (HS256)
- PDF: WeasyPrint + Jinja2
