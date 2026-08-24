import enum
from datetime import datetime
from sqlalchemy import String, Text, Boolean, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base


class TypeContribuableEnum(str, enum.Enum):
    PHYSIQUE = "PHYSIQUE"
    MORALE = "MORALE"


class Contribuable(Base):
    __tablename__ = "contribuables"

    id: Mapped[int] = mapped_column(primary_key=True)
    numero_fiscal: Mapped[str] = mapped_column(String(30), unique=True, index=True)
    nom_raison_sociale: Mapped[str] = mapped_column(String(200))
    type_contribuable: Mapped[TypeContribuableEnum] = mapped_column(
        SQLEnum(TypeContribuableEnum)
    )
    adresse: Mapped[str | None] = mapped_column(Text, nullable=True)
    email: Mapped[str | None] = mapped_column(String(150), nullable=True)
    telephone: Mapped[str | None] = mapped_column(String(30), nullable=True)
    id_user: Mapped[int | None] = mapped_column(
        ForeignKey("utilisateurs.id"), unique=True, nullable=True
    )
    actif: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)

    user: Mapped["User | None"] = relationship(back_populates="contribuable")
    reclamations: Mapped[list["Reclamation"]] = relationship(
        back_populates="contribuable"
    )
