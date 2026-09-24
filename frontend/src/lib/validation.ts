// Validation des champs reutilisable (controle en temps reel).

// Caracteres speciaux interdits dans les champs texte.
const CARACTERES_INTERDITS = /['"()*_\\\/<>={}[\];:?%#@$&~^|`!]/g

// Devient vrai si la valeur contient au moins un caractere special interdit.
export function contientCaracteresSpeciaux(valeur: string): boolean {
  return CARACTERES_INTERDITS.test(valeur)
}

// Nettoie la valeur texte : supprime les caracteres speciaux interdits au fur et a mesure.
export function filtrerTexte(valeur: string): string {
  return valeur.replace(CARACTERES_INTERDITS, '')
}

// Vrai si le texte ne contient que des caracteres acceptes (lettres, chiffres, accents,
// espaces, tirets, points). False sinon (utilise pour bloquer / afficher une erreur).
export function texteValide(valeur: string): boolean {
  return !CARACTERES_INTERDITS.test(valeur)
}

// Pour un champ nombre : conserve uniquement un nombre decimal positif (chiffres + un point).
export function filtrerNombrePositif(valeur: string): string {
  // retire tout sauf chiffres et un seul point decimal
  const assaini = valeur.replace(/[^0-9.]/g, '')
  const parties = assaini.split('.')
  if (parties.length > 2) {
    return parties[0] + '.' + parties.slice(1).join('')
  }
  return assaini
}

// Vrai si la chaine est un nombre decimal positif valide (>= 0).
export function nombrePositifValide(valeur: string): boolean {
  if (valeur === '') return false
  const n = Number(valeur)
  return Number.isFinite(n) && n >= 0
}
