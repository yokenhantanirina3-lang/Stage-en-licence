from pydantic import BaseModel, Field, field_validator
from typing import Optional

from app.schemas.validators import verifier_texte_sans_speciaux


class ServiceRead(BaseModel):
    id: int
    nom: str
    code: str
    chef_id: Optional[int] = None
    chef_nom: Optional[str] = None

    model_config = {"from_attributes": True}


class ServiceCreate(BaseModel):
    nom: str = Field(..., min_length=2, max_length=150)
    code: str = Field(..., min_length=2, max_length=20)
    chef_id: Optional[int] = None

    @field_validator("nom", "code")
    @classmethod
    def _texte_sans_speciaux(cls, v):
        return verifier_texte_sans_speciaux(v, "Le champ")


class ServiceUpdate(BaseModel):
    nom: Optional[str] = Field(None, min_length=2, max_length=150)
    code: Optional[str] = Field(None, min_length=2, max_length=20)
    chef_id: Optional[int] = None

    @field_validator("nom", "code")
    @classmethod
    def _texte_sans_speciaux(cls, v):
        if v is None:
            return v
        return verifier_texte_sans_speciaux(v, "Le champ")


class TypeReclamationCreate(BaseModel):
    code: str
    libelle: str = Field(..., min_length=2, max_length=100)
    delai_legal_jours: int = Field(..., gt=0)

    @field_validator("libelle")
    @classmethod
    def _libelle(cls, v):
        return verifier_texte_sans_speciaux(v, "Le libelle")


class TypeReclamationUpdate(BaseModel):
    libelle: Optional[str] = Field(None, min_length=2, max_length=100)
    delai_legal_jours: Optional[int] = Field(None, gt=0)
    actif: Optional[bool] = None

    @field_validator("libelle")
    @classmethod
    def _libelle(cls, v):
        if v is None:
            return v
        return verifier_texte_sans_speciaux(v, "Le libelle")


class MotifReclamationCreate(BaseModel):
    id_type: int
    code: str = Field(..., min_length=2, max_length=50)
    libelle: str = Field(..., min_length=2, max_length=150)
    necessite_piece_justificative: bool = False

    @field_validator("code", "libelle")
    @classmethod
    def _texte_sans_speciaux(cls, v):
        return verifier_texte_sans_speciaux(v, "Le champ")


class MotifReclamationUpdate(BaseModel):
    code: Optional[str] = Field(None, min_length=2, max_length=50)
    libelle: Optional[str] = Field(None, min_length=2, max_length=150)
    necessite_piece_justificative: Optional[bool] = None

    @field_validator("code", "libelle")
    @classmethod
    def _texte_sans_speciaux(cls, v):
        if v is None:
            return v
        return verifier_texte_sans_speciaux(v, "Le champ")