from pydantic import BaseModel, Field
from datetime import datetime, date
from typing import Optional
from decimal import Decimal


class TypeReclamationRead(BaseModel):
    id: int
    code: str
    libelle: str
    delai_legal_jours: int
    actif: bool

    model_config = {"from_attributes": True}


class MotifReclamationRead(BaseModel):
    id: int
    id_type: int
    code: str
    libelle: str
    necessite_piece_justificative: bool

    model_config = {"from_attributes": True}


class ReclamationCreate(BaseModel):
    id_contribuable: int
    id_type: Optional[int] = None
    id_motif: Optional[int] = None
    canal_entree: str = "GUICHET"
    resume_faits: Optional[str] = None
    montant_concerne: Optional[Decimal] = None
    reference_imposition: Optional[str] = None


class ReclamationUpdate(BaseModel):
    id_type: Optional[int] = None
    id_motif: Optional[int] = None
    resume_faits: Optional[str] = None
    montant_concerne: Optional[Decimal] = None


class QualifierReclamation(BaseModel):
    id_type: int
    id_motif: int


class DemanderPieces(BaseModel):
    motif: str
    liste_pieces: list[str]


class SoumettreValidation(BaseModel):
    commentaire: Optional[str] = None


class ValiderDecision(BaseModel):
    avis: str = Field(..., pattern="^(FAVORABLE|DEFAVORABLE)$")
    commentaire: Optional[str] = None


class VisDecision(BaseModel):
    signature: Optional[str] = None


class SignerDecision(BaseModel):
    signature: Optional[str] = None


class PieceJointeRead(BaseModel):
    id: int
    nom_fichier: str
    type_mime: str
    taille_octets: int
    categorie: str
    date_depot: datetime

    model_config = {"from_attributes": True}


class ActionHistoriqueRead(BaseModel):
    id: int
    action: str
    commentaire: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class DecisionCreate(BaseModel):
    type_decision: str
    fondement_juridique: str
    motivation: str
    montant_accorde: Decimal = Decimal("0")
    montant_rejete: Decimal = Decimal("0")


class DecisionRead(BaseModel):
    id: int
    id_reclamation: int
    type_decision: str
    fondement_juridique: str
    motivation: str
    montant_accorde: Decimal
    montant_rejete: Decimal
    date_decision: date
    statut: str
    chemin_pdf: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class DecisionUpdate(BaseModel):
    fondement_juridique: Optional[str] = None
    motivation: Optional[str] = None
    montant_accorde: Optional[Decimal] = None
    montant_rejete: Optional[Decimal] = None


class ReclamationRead(BaseModel):
    id: int
    numero_dossier: str
    id_contribuable: int
    id_type: Optional[int] = None
    id_motif: Optional[int] = None
    canal_entree: str
    date_depot: date
    date_limite_reponse: Optional[date] = None
    statut: str
    resume_faits: Optional[str] = None
    montant_concerne: Optional[Decimal] = None
    reference_imposition: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ReclamationList(BaseModel):
    items: list[ReclamationRead]
    total: int
    page: int
    size: int
