import { useState } from 'react'
import type { ReactNode, ChangeEvent } from 'react'
import {
  filtrerTexte,
  filtrerNombrePositif,
  contientCaracteresSpeciaux,
  nombrePositifValide,
} from '@/lib/validation'

interface TextFieldProps {
  label?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: 'text' | 'nombre'
  required?: boolean
  className?: string
  minLength?: number
  maxLength?: number
  disabled?: boolean
  helpText?: string
  icon?: ReactNode
}

export default function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  required,
  className = '',
  minLength,
  maxLength,
  disabled,
  helpText,
  icon,
}: TextFieldProps) {
  const [touched, setTouched] = useState(false)
  const estNombre = type === 'nombre'

  // Erreur affichee pour un champ texte avec caracteres speciaux (si la saisie est arretee).
  const aCaracteresInterdits = !estNombre && value !== '' && contientCaracteresSpeciaux(value)
  const erreurNombre = estNombre && value !== '' && !nombrePositifValide(value)

  // En mode filtrage on retire les caracteres interdits au fil de la frappe,
  // donc on n'affiche pas d'erreur : on a simplement corrige la saisie.
  const showCharError = aCaracteresInterdits && touched

  const erreur = erreurNombre || (showCharError && !estNombre)

  const texteAide =
    !estNombre && !aCaracteresInterdits
      ? helpText
      : helpText

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const brut = e.target.value
    if (estNombre) {
      onChange(filtrerNombrePositif(brut))
    } else {
      onChange(filtrerTexte(brut))
    }
    if (!touched) setTouched(true)
  }

  const inputClasses = ['input', erreur ? 'input-error' : ''].filter(Boolean).join(' ')

  return (
    <div className={className}>
      {label && <label className="label">{label}{required && ' *'}</label>}
      <div className="relative">
        {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none">{icon}</span>}
        <input
          type={estNombre ? 'text' : 'text'}
          inputMode={estNombre ? 'decimal' : 'text'}
          value={value}
          onChange={handleChange}
          onBlur={() => setTouched(true)}
          placeholder={placeholder}
          required={required}
          minLength={estNombre ? undefined : minLength}
          maxLength={estNombre ? undefined : maxLength}
          disabled={disabled}
          className={`${inputClasses} ${icon ? 'pl-9' : ''}`}
        />
      </div>
      {erreurNombre && (
        <p className="text-xs text-amber-600 mt-1">Veuillez saisir un nombre positif (ex. 150000.50)</p>
      )}
      {!estNombre && showCharError && (
        <p className="text-xs text-amber-600 mt-1">
          Caracteres speciaux interdits : ' " ( ) * _ / \ &lt; &gt; { } [ ] ; : ? % # @ $ etc.
        </p>
      )}
      {!erreurNombre && !showCharError && texteAide && (
        <p className="text-xs text-surface-400 mt-1">{texteAide}</p>
      )}
    </div>
  )
}
