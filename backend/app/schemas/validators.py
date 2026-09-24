"""Validateurs serveur reutilisables (controle des champs en temps reel cote API)."""
import re
from decimal import Decimal

# Caracteres speciaux interdits dans les champs de texte libre des entites metier.
# NB: la barre oblique inverse et le slash sont inclus pour eviter les ecarts.
# ( ) et ' sont toleres : textes juridiques/administratifs francophones legitimes.
CARACTERES_INTERDITS = re.compile(r"""["*_\\/><={}\[\];:?%#@$&~^|`!]""")

CARACTERES_INTERDITS_LABEL = '" * _ / \\ < > { } [ ] ; : ? % # @ $ & ~ ^ | ` !'


def verifier_texte_sans_speciaux(valeur: str, nom_champ: str) -> str:
    """Lever une ValueError si la valeur contient un caractere special interdit."""
    if valeur and CARACTERES_INTERDITS.search(valeur):
        raise ValueError(
            f"{nom_champ} contient des caracteres speciaux interdits "
            f"({CARACTERES_INTERDITS_LABEL})."
        )
    return valeur


def verifier_montant_positif(valeur, nom_champ: str):
    """Lever une ValueError si la valeur est un montant negatif ou non fini."""
    if valeur is not None:
        if not isinstance(valeur, (int, float, Decimal)):
            raise ValueError(f"{nom_champ} doit etre un nombre.")
        if valeur < 0:
            raise ValueError(f"{nom_champ} doit etre un nombre positif.")
    return valeur
