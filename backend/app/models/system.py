import enum
from datetime import datetime
from sqlalchemy import String, Text, Boolean, ForeignKey, Enum as SQLEnum, BigInteger
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import JSONB, INET
from app.models.base import Base


class TypeParamEnum(str, enum.Enum):
    STRING = "STRING"
    INT = "INT"
    BOOL = "BOOL"
    JSON = "JSON"


class ModeleDocument(Base):
    __tablename__ = "modeles_document"

    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String(50), unique=True)
    libelle: Mapped[str] = mapped_column(String(150))
    template_html: Mapped[str] = mapped_column(Text)
    id_type_reclamation: Mapped[int | None] = mapped_column(
        ForeignKey("types_reclamation.id"), nullable=True
    )
    actif: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        default=datetime.utcnow, onupdate=datetime.utcnow
    )
    type_reclamation: Mapped["TypeReclamation | None"] = relationship()


class ParametreSysteme(Base):
    __tablename__ = "parametres_systeme"

    id: Mapped[int] = mapped_column(primary_key=True)
    cle: Mapped[str] = mapped_column(String(100), unique=True)
    valeur: Mapped[str] = mapped_column(Text)
    type_valeur: Mapped[TypeParamEnum] = mapped_column(
        SQLEnum(TypeParamEnum), default=TypeParamEnum.STRING
    )
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    modifiable: Mapped[bool] = mapped_column(Boolean, default=True)
    updated_at: Mapped[datetime] = mapped_column(
        default=datetime.utcnow, onupdate=datetime.utcnow
    )


class JournalAudit(Base):
    __tablename__ = "journal_audit"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    id_user: Mapped[int | None] = mapped_column(
        ForeignKey("utilisateurs.id"), nullable=True
    )
    action: Mapped[str] = mapped_column(String(100))
    entite: Mapped[str] = mapped_column(String(50))
    id_entite: Mapped[int | None] = mapped_column(nullable=True)
    avant: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    apres: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    ip_adresse: Mapped[str | None] = mapped_column(INET, nullable=True)
    user_agent: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)

    __table_args__ = (
        {"schema": None},
    )
