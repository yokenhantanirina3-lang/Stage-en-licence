from pydantic import BaseModel, EmailStr, Field, field_validator
from datetime import datetime
from typing import Optional

from app.schemas.validators import verifier_texte_sans_speciaux


class UserBase(BaseModel):
    email: EmailStr
    nom: str = Field(..., min_length=2, max_length=150)
    telephone: Optional[str] = None
    actif: bool = True

    @field_validator("nom", "telephone")
    @classmethod
    def _texte_sans_speciaux(cls, v):
        if v is None:
            return v
        return verifier_texte_sans_speciaux(v, "Le champ")


class UserCreate(UserBase):
    password: str = Field(..., min_length=6)
    id_role: int = 6
    id_service: Optional[int] = None


class UserUpdate(BaseModel):
    nom: Optional[str] = None
    email: Optional[EmailStr] = None
    telephone: Optional[str] = None
    id_role: Optional[int] = None
    id_service: Optional[int] = None
    actif: Optional[bool] = None

    @field_validator("nom", "telephone")
    @classmethod
    def _texte_sans_speciaux(cls, v):
        if v is None:
            return v
        return verifier_texte_sans_speciaux(v, "Le champ")


class RoleRead(BaseModel):
    id: int
    libelle: str
    permissions: dict

    model_config = {"from_attributes": True}


class ServiceBrief(BaseModel):
    id: int
    nom: str
    code: str

    model_config = {"from_attributes": True}


class UserRead(UserBase):
    id: int
    id_role: int
    id_service: Optional[int] = None
    created_at: datetime
    dernier_connexion: Optional[datetime] = None
    role: Optional[RoleRead] = None
    service: Optional[ServiceBrief] = None

    model_config = {"from_attributes": True}


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    sub: str
    type: str
    exp: int
