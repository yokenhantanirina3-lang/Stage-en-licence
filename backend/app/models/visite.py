from datetime import datetime, date
from sqlalchemy import String, Text, ForeignKey, DateTime, Date, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base


class Visite(Base):
    __tablename__ = "visites"

    id: Mapped[int] = mapped_column(primary_key=True)
    numero: Mapped[str] = mapped_column(String(30), unique=True, index=True)
    id_contribuable: Mapped[int | None] = mapped_column(
        ForeignKey("contribuables.id"), nullable=True
    )
    nom_visiteur: Mapped[str | None] = mapped_column(String(200), nullable=True)
    objet: Mapped[str] = mapped_column(String(200))
    service_destination: Mapped[str] = mapped_column(String(100))
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    id_agent_recepteur: Mapped[int | None] = mapped_column(
        ForeignKey("utilisateurs.id"), nullable=True
    )
    date_visite: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    contribuable: Mapped["Contribuable | None"] = relationship(
        back_populates="visites", lazy="selectin"
    )
    agent_recepteur: Mapped["User | None"] = relationship(
        back_populates="visites", lazy="selectin"
    )

    __table_args__ = (
        Index("ix_visites_date_service", "date_visite", "service_destination"),
    )