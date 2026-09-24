from fastapi import APIRouter
from app.api.routes import auth, reclamations, contribuables, admin, pieces, decisions, echeances, visites, public

api_router = APIRouter()

api_router.include_router(auth.api_router, prefix="/auth", tags=["Authentification"])
api_router.include_router(public.router, prefix="/public", tags=["Portail contribuable"])
api_router.include_router(reclamations.router, prefix="/reclamations", tags=["Reclamations"])
api_router.include_router(pieces.router, prefix="/reclamations", tags=["Pieces jointes"])
api_router.include_router(decisions.router, tags=["Decisions"])
api_router.include_router(echeances.router, tags=["Echeances"])
api_router.include_router(contribuables.router, prefix="/contribuables", tags=["Contribuables"])
api_router.include_router(visites.router, prefix="/visites", tags=["Visites"])
api_router.include_router(admin.router, prefix="/admin", tags=["Administration"])
