import enum
from datetime import datetime, date
from decimal import Decimal
from sqlalchemy import (
    String, Text, Boolean, ForeignKey, Enum as SQLEnum,
    Date, DateTime, Numeric, Index, CheckConstraint, BigInteger,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import JSONB
from app.models.base import Base


class CanalEntreeEnum(str, enum.Enum):
    GUICHET = "GUICHET"
    COURRIER = "COURRIER"
    PORTAIL = "PORTAIL"
    EMAIL = "EMAIL"
    API = "API"


class StatutReclamationEnum(str, enum.Enum):
    ENREGISTREE = "ENREGISTREE"
    A_QUALIFIER = "A_QUALIFIER"
    EN_INSTRUCTION = "EN_INSTRUCTION"
    EN_ATTENTE_PIECES = "EN_ATTENTE_PIECES"
    PROJET_REPONSE = "PROJET_REPONSE"
    EN_VALIDATION = "EN_VALIDATION"
    EN_VISA_DIRECTEUR = "EN_VISA_DIRECTEUR"
    SIGNEE = "SIGNEE"
    NOTIFIEE = "NOTIFIEE"
    CLOTUREE = "CLOTUREE"
    REJETEE = "REJETEE"
    CONTENTIEUX_JUDICIAIRE = "CONTENTIEUX_JUDICIAIRE"


class TypeReclamationCodeEnum(str, enum.Enum):
    CONTENTIEUSE = "CONTENTIEUSE"
    GRACIEUSE = "GRACIEUSE"
    PRESCRIPTION = "PRESCRIPTION"


class CategoriePieceEnum(str, enum.Enum):
    IDENTITE = "IDENTITE"
    AVIS_IMPOSITION = "AVIS_IMPOSITION"
    CORRESPONDANCE = "CORRESPONDANCE"
    EXPERTISE = "EXPERTISE"
    AUTRE = "AUTRE"


class TypeActionEnum(str, enum.Enum):
    CREATION = "CREATION"
    QUALIFICATION = "QUALIFICATION"
    DEMANDE_PIECES = "DEMANDE_PIECES"
    RECEPTION_PIECES = "RECEPTION_PIECES"
    REDACTION = "REDACTION"
    AVIS_CHEF = "AVIS_CHEF"
    VISA_DIR = "VISA_DIR"
    SIGNATURE = "SIGNATURE"
    ENVOI = "ENVOI"
    CLOTURE = "CLOTURE"
    ALERTE_DELAI = "ALERTE_DELAI"


class TypeDecisionEnum(str, enum.Enum):
    ADMIS_TOTAL = "ADMIS_TOTAL"
    ADMIS_PARTIEL = "ADMIS_PARTIEL"
    REJETE = "REJETE"
    IRRECEVABLE = "IRRECEVABLE"
    CADUC = "CADUC"


class StatutDecisionEnum(str, enum.Enum):
    BROUILLON = "BROUILLON"
    VALIDEE = "VALIDEE"
    SIGNEE = "SIGNEE"
    NOTIFIEE = "NOTIFIEE"


class RoleDossierEnum(str, enum.Enum):
    INSTRUCTEUR = "INSTRUCTEUR"
    VALIDATEUR = "VALIDATEUR"
    SIGNATAIRE = "SIGNATAIRE"
    OBSERVATEUR = "OBSERVATEUR"


class TypeReclamation(Base):
    __tablename__ = "types_reclamation"

    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[TypeReclamationCodeEnum] = mapped_column(
        SQLEnum(TypeReclamationCodeEnum), unique=True
    )
    libelle: Mapped[str] = mapped_column(String(100))
    delai_legal_jours: Mapped[int]
    actif: Mapped[bool] = mapped_column(Boolean, default=True)
    motifs: Mapped[list["MotifReclamation"]] = relationship(
        back_populates="type_reclamation"
    )


class MotifReclamation(Base):
    __tablename__ = "motifs_reclamation"

    id: Mapped[int] = mapped_column(primary_key=True)
    id_type: Mapped[int] = mapped_column(ForeignKey("types_reclamation.id"))
    code: Mapped[str] = mapped_column(String(50))
    libelle: Mapped[str] = mapped_column(String(150))
    necessite_piece_justificative: Mapped[bool] = mapped_column(Boolean, default=False)
    type_reclamation: Mapped["TypeReclamation"] = relationship(
        back_populates="motifs"
    )
    reclamations: Mapped[list["Reclamation"]] = relationship(
        back_populates="motif"
    )


class Reclamation(Base):
    __tablename__ = "reclamations"

    id: Mapped[int] = mapped_column(primary_key=True)
    numero_dossier: Mapped[str] = mapped_column(String(30), unique=True, index=True)
    id_contribuable: Mapped[int] = mapped_column(
        ForeignKey("contribuables.id")
    )
    id_type: Mapped[int | None] = mapped_column(
        ForeignKey("types_reclamation.id"), nullable=True
    )
    id_motif: Mapped[int | None] = mapped_column(
        ForeignKey("motifs_reclamation.id"), nullable=True
    )
    canal_entree: Mapped[CanalEntreeEnum] = mapped_column(
        SQLEnum(CanalEntreeEnum), default=CanalEntreeEnum.GUICHET
    )
    date_depot: Mapped[date] = mapped_column(Date, default=date.today)
    date_limite_reponse: Mapped[date | None] = mapped_column(Date, nullable=True)
    statut: Mapped[StatutReclamationEnum] = mapped_column(
        SQLEnum(StatutReclamationEnum),
        default=StatutReclamationEnum.ENREGISTREE,
        index=True,
    )
    resume_faits: Mapped[str | None] = mapped_column(Text, nullable=True)
    montant_concerne: Mapped[Decimal | None] = mapped_column(
        Numeric(15, 2), nullable=True
    )
    reference_imposition: Mapped[str | None] = mapped_column(
        String(100), nullable=True
    )
    id_agent_createur: Mapped[int | None] = mapped_column(
        ForeignKey("utilisateurs.id"), nullable=True
    )
    pdf_accuse_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        default=datetime.utcnow, onupdate=datetime.utcnow
    )

    contribuable: Mapped["Contribuable"] = relationship(back_populates="reclamations")
    type: Mapped["TypeReclamation | None"] = relationship()
    motif: Mapped["MotifReclamation | None"] = relationship()
    createur: Mapped["User | None"] = relationship(
        foreign_keys=[id_agent_createur], back_populates="reclamations_creees"
    )
    pieces: Mapped[list["PieceJointe"]] = relationship(
        back_populates="reclamation", cascade="all, delete-orphan"
    )
    historique: Mapped[list["ActionHistorique"]] = relationship(
        back_populates="reclamation", cascade="all, delete-orphan"
    )
    decision: Mapped["Decision | None"] = relationship(
        back_populates="reclamation", uselist=False, cascade="all, delete-orphan"
    )
    affectations: Mapped[list["Affectation"]] = relationship(
        back_populates="reclamation", cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index("ix_rec_statut_date_limite", "statut", "date_limite_reponse"),
        CheckConstraint(
            "montant_concerne IS NULL OR montant_concerne >= 0",
            name="ck_montant_positif",
        ),
    )


class PieceJointe(Base):
    __tablename__ = "pieces_jointes"

    id: Mapped[int] = mapped_column(primary_key=True)
    id_reclamation: Mapped[int] = mapped_column(
        ForeignKey("reclamations.id", ondelete="CASCADE")
    )
    nom_fichier: Mapped[str] = mapped_column(String(255))
    chemin_stockage: Mapped[str] = mapped_column(String(500))
    type_mime: Mapped[str] = mapped_column(String(100))
    taille_octets: Mapped[int]
    categorie: Mapped[CategoriePieceEnum] = mapped_column(
        SQLEnum(CategoriePieceEnum), default=CategoriePieceEnum.AUTRE
    )
    hash_sha256: Mapped[str] = mapped_column(String(64))
    id_depot_par: Mapped[int] = mapped_column(ForeignKey("utilisateurs.id"))
    date_depot: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    reclamation: Mapped["Reclamation"] = relationship(back_populates="pieces")
    depose_par: Mapped["User"] = relationship(back_populates="pieces_deposees")


class ActionHistorique(Base):
    __tablename__ = "actions_historique"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    id_reclamation: Mapped[int] = mapped_column(
        ForeignKey("reclamations.id", ondelete="CASCADE")
    )
    id_agent: Mapped[int | None] = mapped_column(
        ForeignKey("utilisateurs.id"), nullable=True
    )
    action: Mapped[TypeActionEnum] = mapped_column(SQLEnum(TypeActionEnum))
    commentaire: Mapped[str | None] = mapped_column(Text, nullable=True)
    donnees_contexte: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    reclamation: Mapped["Reclamation"] = relationship(back_populates="historique")
    agent: Mapped["User | None"] = relationship(back_populates="actions")

    __table_args__ = (
        Index("ix_actions_reclamation_date", "id_reclamation", "created_at"),
    )


class Decision(Base):
    __tablename__ = "decisions"

    id: Mapped[int] = mapped_column(primary_key=True)
    id_reclamation: Mapped[int] = mapped_column(
        ForeignKey("reclamations.id", ondelete="CASCADE"), unique=True
    )
    type_decision: Mapped[TypeDecisionEnum] = mapped_column(
        SQLEnum(TypeDecisionEnum)
    )
    fondement_juridique: Mapped[str] = mapped_column(Text)
    motivation: Mapped[str] = mapped_column(Text)
    montant_accorde: Mapped[Decimal] = mapped_column(
        Numeric(15, 2), default=Decimal("0")
    )
    montant_rejete: Mapped[Decimal] = mapped_column(
        Numeric(15, 2), default=Decimal("0")
    )
    date_decision: Mapped[date] = mapped_column(Date, default=date.today)
    id_redacteur: Mapped[int] = mapped_column(ForeignKey("utilisateurs.id"))
    id_validateur: Mapped[int | None] = mapped_column(
        ForeignKey("utilisateurs.id"), nullable=True
    )
    id_signataire: Mapped[int | None] = mapped_column(
        ForeignKey("utilisateurs.id"), nullable=True
    )
    chemin_pdf: Mapped[str | None] = mapped_column(String(500), nullable=True)
    statut: Mapped[StatutDecisionEnum] = mapped_column(
        SQLEnum(StatutDecisionEnum), default=StatutDecisionEnum.BROUILLON
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        default=datetime.utcnow, onupdate=datetime.utcnow
    )

    reclamation: Mapped["Reclamation"] = relationship(back_populates="decision")
    redacteur: Mapped["User"] = relationship(
        foreign_keys=[id_redacteur], back_populates="decisions_redigees"
    )
    validateur: Mapped["User | None"] = relationship(
        foreign_keys=[id_validateur], back_populates="decisions_validees"
    )
    signataire: Mapped["User | None"] = relationship(
        foreign_keys=[id_signataire], back_populates="decisions_signees"
    )


class Affectation(Base):
    __tablename__ = "affectations"

    id: Mapped[int] = mapped_column(primary_key=True)
    id_reclamation: Mapped[int] = mapped_column(
        ForeignKey("reclamations.id", ondelete="CASCADE")
    )
    id_agent: Mapped[int] = mapped_column(ForeignKey("utilisateurs.id"))
    role_dossier: Mapped[RoleDossierEnum] = mapped_column(
        SQLEnum(RoleDossierEnum)
    )
    date_debut: Mapped[date] = mapped_column(Date, default=date.today)
    date_fin: Mapped[date | None] = mapped_column(Date, nullable=True)
    actif: Mapped[bool] = mapped_column(Boolean, default=True)

    reclamation: Mapped["Reclamation"] = relationship(back_populates="affectations")
    agent: Mapped["User"] = relationship(back_populates="affectations")
