from pydantic import BaseModel, Field, field_validator
from datetime import datetime
from typing import Optional, Any
from app.schemas.validators import verifier_texte_sans_speciaux

SERVICES_ACCUEIL = ["Accueil", "Comptabilite", "Contentieux", "Recouvrement", "Cadastre", "Autre"]


class ContribuableResume(BaseModel):
    id: int
    numero_fiscal: str
    nom_raison_sociale: str

    model_config = {"from_attributes": True}


class AgentResume(BaseModel):
    id: int
    nom: str

    model_config = {"from_attributes": True}


class VisiteCreate(BaseModel):
    id_contribuable: Optional[int] = None
    nom_visiteur: Optional[str] = Field(None, min_length=2, max_length=200)
    objet: str = Field(..., min_length=3, max_length=200)
    service_destination: str = Field(..., pattern="^(Accueil|Comptabilite|Contentieux|Recouvrement|Cadastre|Autre)$")
    notes: Optional[str] = None
    date_visite: Optional[datetime] = None

    @field_validator("nom_visiteur", "objet", "notes")
    @classmethod
    def _texte_sans_speciaux(cls, v):
        if v is None:
            return v
        return verifier_texte_sans_speciaux(v, "Le champ")

    @field_validator("id_contribuable")
    @classmethod
    def _soit_contribuable_soit_nom(cls, v, info):
        nom = info.data.get("nom_visiteur")
        if v is None and not nom:
            raise ValueError("Indiquez un contribuable (selection) ou un nom de visiteur.")
        return v


class VisiteRead(BaseModel):
    id: int
    numero: str
    id_contribuable: Optional[int] = None
    nom_visiteur: Optional[str] = None
    objet: str
    service_destination: str
    notes: Optional[str] = None
    id_agent_recepteur: Optional[int] = None
    date_visite: datetime
    created_at: datetime
    contribuable: Optional[ContribuableResume] = None
    agent_recepteur: Optional[AgentResume] = None

    model_config = {"from_attributes": True}


class VisiteList(BaseModel):
    items: list[VisiteRead]
    total: int
    page: int
    size: int


class VisiteStats(BaseModel):
    total: int
    aujourd_hui: int
    par_service: dict[str, Any]