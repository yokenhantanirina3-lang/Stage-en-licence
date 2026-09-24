"""Tests unitaires du niveau d'alerte des echeances (pure, sans base)."""

from app.tasks.echeances import _niveau_alerte


def test_niveau_alerte_depasse():
    assert _niveau_alerte(-1) == "DEPASSE"
    assert _niveau_alerte(-45) == "DEPASSE"


def test_niveau_alerte_critique():
    assert _niveau_alerte(0) == "CRITIQUE"
    assert _niveau_alerte(7) == "CRITIQUE"


def test_niveau_alerte_urgent():
    assert _niveau_alerte(8) == "URGENT"
    assert _niveau_alerte(15) == "URGENT"


def test_niveau_alerte_info():
    assert _niveau_alerte(16) == "INFO"
    assert _niveau_alerte(29) == "INFO"
