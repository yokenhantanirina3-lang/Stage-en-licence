from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class ModeleDocumentRead(BaseModel):
    id: int
    code: str
    libelle: str
    id_type_reclamation: Optional[int] = None
    actif: bool

    model_config = {"from_attributes": True}


class ParametreSystemeRead(BaseModel):
    id: int
    cle: str
    valeur: str
    type_valeur: str
    description: Optional[str] = None
    modifiable: bool

    model_config = {"from_attributes": True}


class ParametreSystemeUpdate(BaseModel):
    valeur: str
    description: Optional[str] = None
