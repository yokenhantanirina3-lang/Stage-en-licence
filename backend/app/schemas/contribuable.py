from pydantic import BaseModel, Field, EmailStr
from datetime import datetime
from typing import Optional


class ContribuableBase(BaseModel):
    numero_fiscal: str = Field(..., min_length=3, max_length=30)
    nom_raison_sociale: str = Field(..., min_length=2, max_length=200)
    type_contribuable: str = Field(..., pattern="^(PHYSIQUE|MORALE)$")
    adresse: Optional[str] = None
    email: Optional[EmailStr] = None
    telephone: Optional[str] = None


class ContribuableCreate(ContribuableBase):
    id_user: Optional[int] = None


class ContribuableUpdate(BaseModel):
    nom_raison_sociale: Optional[str] = None
    adresse: Optional[str] = None
    email: Optional[EmailStr] = None
    telephone: Optional[str] = None
    actif: Optional[bool] = None


class ContribuableRead(ContribuableBase):
    id: int
    actif: bool
    id_user: Optional[int] = None
    created_at: datetime

    model_config = {"from_attributes": True}
