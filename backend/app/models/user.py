import enum
from datetime import datetime
from sqlalchemy import String, Text, Boolean, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import JSONB
from app.models.base import Base


class RoleEnum(str, enum.Enum):
    ADMIN = "ADMIN"
    SAISIE = "SAISIE"
    INSTRUCTEUR = "INSTRUCTEUR"
    CHEF = "CHEF"
    DIRECTEUR = "DIRECTEUR"
    CONTRIBUABLE = "CONTRIBUABLE"


class ServiceModel(Base):
    __tablename__ = "services"

    id: Mapped[int] = mapped_column(primary_key=True)
    nom: Mapped[str] = mapped_column(String(150), unique=True)
    code: Mapped[str] = mapped_column(String(20), unique=True)
    chef_id: Mapped[int | None] = mapped_column(
        ForeignKey("utilisateurs.id", use_alter=True, name="fk_services_chef_id"),
        nullable=True,
    )
    users: Mapped[list["User"]] = relationship(
        back_populates="service", foreign_keys="User.id_service"
    )


class Role(Base):
    __tablename__ = "roles"

    id: Mapped[int] = mapped_column(primary_key=True)
    libelle: Mapped[RoleEnum] = mapped_column(SQLEnum(RoleEnum), unique=True)
    permissions: Mapped[dict] = mapped_column(JSONB, default=dict)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    users: Mapped[list["User"]] = relationship(back_populates="role")


class User(Base):
    __tablename__ = "utilisateurs"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(150), unique=True, index=True)
    nom: Mapped[str] = mapped_column(String(150))
    password_hash: Mapped[str] = mapped_column(String(255))
    id_role: Mapped[int] = mapped_column(ForeignKey("roles.id"), default=6)
    id_service: Mapped[int | None] = mapped_column(
        ForeignKey("services.id"), nullable=True
    )
    telephone: Mapped[str | None] = mapped_column(String(30), nullable=True)
    actif: Mapped[bool] = mapped_column(Boolean, default=True)
    dernier_connexion: Mapped[datetime | None] = mapped_column(nullable=True)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        default=datetime.utcnow, onupdate=datetime.utcnow
    )

    role: Mapped["Role"] = relationship(back_populates="users")
    service: Mapped["ServiceModel | None"] = relationship(
        back_populates="users", foreign_keys=[id_service]
    )
    contribuable: Mapped["Contribuable | None"] = relationship(
        back_populates="user", uselist=False
    )
    reclamations_creees: Mapped[list["Reclamation"]] = relationship(
        foreign_keys="Reclamation.id_agent_createur", back_populates="createur"
    )
    affectations: Mapped[list["Affectation"]] = relationship(back_populates="agent")
    actions: Mapped[list["ActionHistorique"]] = relationship(back_populates="agent")
    pieces_deposees: Mapped[list["PieceJointe"]] = relationship(
        foreign_keys="PieceJointe.id_depot_par", back_populates="depose_par"
    )
    decisions_redigees: Mapped[list["Decision"]] = relationship(
        foreign_keys="Decision.id_redacteur", back_populates="redacteur"
    )
    decisions_validees: Mapped[list["Decision"]] = relationship(
        foreign_keys="Decision.id_validateur", back_populates="validateur"
    )
    decisions_signees: Mapped[list["Decision"]] = relationship(
        foreign_keys="Decision.id_signataire", back_populates="signataire"
    )
