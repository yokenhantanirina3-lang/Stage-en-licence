from pydantic import BaseModel, Field, EmailStr, field_validator
from datetime import datetime
from typing import Optional

from app.schemas.validators import verifier_texte_sans_speciaux


class ContribuableBase(BaseModel):
    numero_fiscal: Optional[str] = Field(None, min_length=3, max_length=30)
    nom_raison_sociale: str = Field(..., min_length=2, max_length=200)
    type_contribuable: str = Field(..., pattern="^(PHYSIQUE|MORALE)$")
    adresse: Optional[str] = None
    email: Optional[EmailStr] = None
    telephone: Optional[str] = None


class ContribuableCreate(ContribuableBase):
    id_user: Optional[int] = None

    @field_validator("nom_raison_sociale", "adresse", "numero_fiscal", "telephone")
    @classmethod
    def _texte_sans_speciaux(cls, v):
        if v is None:
            return v
        return verifier_texte_sans_speciaux(v, "Le champ")

    @field_validator("telephone")
    @classmethod
    def _telephone_chiffres(cls, v):
        if v and not str(v).replace("+", "").replace("-", "").replace(" ", "").isdigit():
            raise ValueError("Le telephone doit etre compose de chiffres (+, - et espaces autorises).")
        return v


class ContribuableUpdate(BaseModel):
    nom_raison_sociale: Optional[str] = None
    adresse: Optional[str] = None
    email: Optional[EmailStr] = None
    telephone: Optional[str] = None
    actif: Optional[bool] = None

    @field_validator("nom_raison_sociale", "adresse", "telephone")
    @classmethod
    def _texte_sans_speciaux(cls, v):
        if v is None:
            return v
        return verifier_texte_sans_speciaux(v, "Le champ")

    @field_validator("telephone")
    @classmethod
    def _telephone_chiffres(cls, v):
        if v and not str(v).replace("+", "").replace("-", "").replace(" ", "").isdigit():
            raise ValueError("Le telephone doit etre compose de chiffres (+, - et espaces autorises).")
        return v


class ContribuableRead(ContribuableBase):
    id: int
    actif: bool
    id_user: Optional[int] = None
    created_at: datetime

    model_config = {"from_attributes": True}
