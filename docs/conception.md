# Dossier de conception

**Projet :** Logiciel de gestion de la relation usager — suivi des réceptions et réclamations à l'accueil d'un centre fiscal
**Référence :** CONC-PF-2026

Ce document décrit la conception technique et fonctionnelle de la plateforme. Il est complété par les diagrammes UML du dossier `docs/diagrammes`.

---

## 1. Architecture générale

Architecture **web à trois tiers** :

```
[ Navigateur (React + TypeScript) ]
              │  HTTPS / JSON / multipart
              ▼
[ API backend (FastAPI) ]
   │  SQLAlchemy 2.0 (async)        │  HttpClient S3 / stockage local
   ▼                                ▼
[ PostgreSQL ]              [ MinIO - fichiers (pièces, PDF) ]
```

- **Présentation** : application web monopage (SPA) React, génération d'interface Tailwind, gestion des états par *React Query* et routage *React Router*.
- **Application** : API REST FastAPI, validation Pydantic des entrées, contrôle d'accès par dépendance (rôle).
- **Données** : PostgreSQL pour le stockage relationnel ; MinIO pour les fichiers binaires (pièces justificatives, PDF générés).

## 2. Modèle de données

### 2.1 Tables

| Table | Rôle |
|---|---|
| `roles` | Référentiel des profils (ADMIN, SAISIE, INSTRUCTEUR, CHEF, DIRECTEUR, CONTRIBUABLE) |
| `services` | Services du centre fiscal |
| `utilisateurs` | Agents de la DGI (email, nom, mot de passe haché, rôle, service) |
| `contribuables` | Répertoire fiscal (numéro fiscal unique, nom/raison sociale, type) |
| `visites` | Visites à l'accueil / relation usager |
| `types_reclamation` | Types (contentieuse, gracieuse, prescription) + délai légal en jours |
| `motifs_reclamation` | Motifs rattachés à un type (+ obligation de pièces) |
| `reclamations` | Dossiers de réclamation (numéro unique, statut, montant, dates) |
| `pieces_jointes` | Fichiers déposés pour un dossier (catégorie, hash SHA-256, taille) |
| `decisions` | Décision unique par dossier (type, fondement juridique, montants, statut) |
| `actions_historique` | Journal horodaté de toutes les actions |
| `affectations` | Rôles des agents sur un dossier (instructeur, validateur…) |

### 2.2 Relations principales

```
utilisateurs (1) ── (n) reclamations : createur
utilisateurs (1) ── (n) pieces_jointes : depose_par
utilisateurs (1) ── (1) contribuables : compte
contribuables (1) ── (n) reclamations
contribuables (1) ── (n) visites
reclamations (1) ── (1) decisions
reclamations (1) ── (n) pieces_jointes
reclamations (1) ── (n) actions_historique
types_reclamation (1) ── (n) motifs_reclamation
```

### 2.3 Cycles d'état

**Réclamation :**

```
ENREGISTREE → A_QUALIFIER → EN_INSTRUCTION → PROJET_REPONSE → EN_VALIDATION
   → EN_VISA_DIRECTEUR → SIGNEE → NOTIFIEE → CLOTUREE
```

États secondaires : `EN_ATTENTE_PIECES` (complément du dossier par le contribuable), `REJETEE`, `CONTENTIEUX_JUDICIAIRE`.

**Décision :**

```
BROUILLON → VALIDEE → SIGNEE → NOTIFIEE
```

## 3. Circuit décisionnel (conception détaillée)

Le circuit est un **workflow séquentiel** contrôlé par le statut de la décision ; chaque transition est déclenchée par une action réalisée à l'écran et est réservée à un rôle précis.

```
INSTRUCTEUR          CHEF                 DIRECTEUR            CHEF / DIRECTEUR
   │                   │                      │                      │
 Rédige               Avis                    Visa +              Notifie
 + soumet            favorable/              signature           + clôture
   │                défavorable                │                      │
   ▼                   ▼                      ▼                      ▼
BROUILLON ┬soumettre► dossier EN_VALIDATION ──valider──► doss. EN_VISA_DIRECTEUR
          │                                               décision VALIDEE
          │                                              ──visa (tracé)──►
          │                                              ──signer──► décision SIGNEE
          │                                                            dossier SIGNEE
          │                                                         ──notifier──► dossier CLOTUREE
          │                                                                      décision NOTIFIEE (PDF)
```

1. **Rédaction** (`INSTRUCTEUR`) : saisie du type de décision, des montants accordé/rejeté, du fondement juridique (ex. art. CIDTA) et de la motivation. La décision est créée à l'état `BROUILLON` et le dossier passe à `PROJET_REPONSE` ; l'action « soumettre » fait passer le dossier à `EN_VALIDATION` (la décision reste en `BROUILLON`).
2. **Validation** (`CHEF`) : avis « favorable » ou « défavorable ». La décision passe à `VALIDEE` et enregistre le validateur dans `decisions.id_validateur` ; le dossier passe à `EN_VISA_DIRECTEUR`.
3. **Visa** (`DIRECTEUR`) : action tracée dans l'historique (`VISA_DIR`) ; la décision demeure `VALIDEE`.
4. **Signature** (`DIRECTEUR`) : la décision passe à `SIGNEE` (id_signataire enregistré) et le dossier à `SIGNEE`.
5. **Notification** (`CHEF` ou `DIRECTEUR`) : génération du **PDF de décision**, la décision passe à `NOTIFIEE` et le dossier à `CLOTUREE`.

**Contrôles de la conception :**
- L'API vérifie à chaque action le **rôle** et le **statut courant** (les transitions sont explicites) ;
- L'interface n'affiche que le bouton d'action correspondant au rôle et à l'état du dossier ;
- Chaque transition écrit une action dans `actions_historique` (type : REDACTION, AVIS_CHEF, VISA_DIR, SIGNATURE, ENVOI, CLOTURE).

## 4. Gestion des pièces justificatives

### 4.1 Dépôt (import) d'un fichier

- Endpoint `POST /api/v1/reclamations/{id}/pieces` (multipart), rôles ADMIN, SAISIE, INSTRUCTEUR.
- Validations : fichier non vide, taille ≤ 10 Mo, catégorie normalisée (IDENTITE, AVIS_IMPOSITION, CORRESPONDANCE, EXPERTISE, AUTRE).
- Stockage : upload binaire vers MinIO (ou disque local en développement) ; la ligne `pieces_jointes` retient le nom, la catégorie, le type MIME, la taille, l'empreinte `hash_sha256` et l'agent déposant.
- Traçabilité : action `RECEPTION_PIECES` écrite à l'historique.

### 4.2 Lecture / téléchargement

- Consultation de la liste : `GET /api/v1/reclamations/{id}/pieces`.
- Téléchargement : `GET /api/v1/reclamations/{id}/pieces/{piece_id}/download` — renvoie le fichier (disque) ou une URL pré-signée (MinIO).

### 4.3 Place dans le workflow

Si le motif de la réclamation exige des justificatifs, le dossier passe en `EN_ATTENTE_PIECES` ; le dossier ne reprend l'instruction (`EN_INSTRUCTION`) qu'après dépôt des pièces demandées.

## 5. Module « Accueil et visites »

Table `visites` (relation usager) :

- Enregistrement d'une visite à l'accueil : contribuable enregistré **ou** nom du visiteur libre ; objet (liste), service de destination, notes.
- Génération du numéro `VIS-AAAA-xxxxxx` ; l'agent connecté est automatiquement enregistré comme récepteur.
- API :
  - `GET /api/v1/visites/` — registre paginé (filtres : jour, service)
  - `GET /api/v1/visites/stats` — total, visites du jour, répartition par service
  - `POST /api/v1/visites/` — enregistrement (ADMIN, SAISIE)
  - `GET /api/v1/visites/{id}` — détail
- Interface : tableau de bord de l'accueil avec formulaire d'enregistrement, registre en tableau, filtre par jour et pagination.

## 6. API REST (extraits)

| Méthode | Endpoint | Rôle(s) | Description |
|---|---|---|---|
| POST | `/api/v1/auth/login` | public | Authentification (jetons JWT) |
| GET | `/api/v1/auth/me` | tous | Profil de l'utilisateur connecté |
| GET | `/api/v1/contribuables/` | tous | Liste / recherche contribuables |
| POST | `/api/v1/contribuables/` | ADMIN, SAISIE | Création contribuable |
| POST | `/api/v1/reclamations/` | ADMIN, SAISIE, INSTRUCTEUR | Enregistrement d'une réclamation |
| GET | `/api/v1/reclamations/a-instruire` | ADMIN, INSTRUCTEUR | File d'attente d'instruction |
| GET | `/api/v1/reclamations/a-valider` | ADMIN, CHEF, DIRECTEUR | File d'attente de validation |
| GET | `/api/v1/reclamations/{id}/pieces` | tous | Pièces jointes du dossier |
| POST | `/api/v1/reclamations/{id}/pieces` | ADMIN, SAISIE, INSTRUCTEUR | Import d'un fichier |
| POST | `/api/v1/reclamations/{id}/decision` | ADMIN, INSTRUCTEUR | Rédaction de la décision (BROUILLON) |
| POST | `/api/v1/decisions/{id}/soumettre` | ADMIN, INSTRUCTEUR | Soumission à validation |
| POST | `/api/v1/decisions/{id}/valider` | ADMIN, CHEF | Validation (avis) |
| POST | `/api/v1/decisions/{id}/visa` | ADMIN, DIRECTEUR | Visa du directeur |
| POST | `/api/v1/decisions/{id}/signer` | ADMIN, DIRECTEUR | Signature |
| POST | `/api/v1/decisions/{id}/notifier` | ADMIN, CHEF, DIRECTEUR | Notification + clôture |
| GET | `/api/v1/visites/` , `/api/v1/visites/stats` | tous | Registre et statistiques des visites |
| POST | `/api/v1/visites/` | ADMIN, SAISIE | Enregistrement d'une visite |
| GET | `/api/v1/reclamations/stats` | tous | Statistiques globales (sidebar/dashboard) |

## 7. Sécurité

- **Authentification** : JWT HS256 ; jeton d'accès court (15 min) + jeton de rafraîchissement (7 jours) ; jeton requis sur chaque endpoint (Bearer).
- **Autorisation** : contrôle par rôle appliqué sur les routeurs (`require_role`) ; aucune transition du circuit décisionnel n'est accessible hors de son rôle.
- **Validation des saisies** : double contrôle navigateur (filtrage des caractères spéciaux) et API (Pydantic + validators) sur tous les champs textuels ; montants strictement positifs.
- **Intégrité des fichiers** : empreinte SHA-256 enregistrée à chaque dépôt.
- **Mots de passe** : stockés hachés ; désactivation possible d'un utilisateur.

## 8. Génération PDF

- **Accusé de réception** : produit à l'enregistrement d'une réclamation (récapitulatif, numéro de dossier, date limite), téléchargeable depuis le dossier.
- **Décision** : produit à la notification, reprend le fondement juridique, la motivation et les montants de la décision signée.
- Génération serveur (bibliothèque PDF) ; le fichier est conservé et proposé au téléchargement.

## 9. Tableaux de bord

- **Par rôle** : indicateurs adaptés (charges de saisie, file d'instruction, file de validation, synthèse directeur).
- **Files d'attente** : listes dynamiques « à qualifier », « à instruire », « à valider » avec compteurs en temps réel (badges de la barre latérale).
- **Accueil** : statistiques de visites (du jour, totale, par service).
- **Alertes** : dossiers en retard sur la date limite de réponse.

## 10. Références UML

Les diagrammes de conception sont fournis dans `docs/diagrammes` :
- **Cas d'utilisation** : acteurs et fonctionnalités (visites, réclamations, instruction, validation, administration).
- **Classes** : correspondance avec le modèle de données (entités, attributs, relations, statuts).
- **Séquence / Activité** : déroulement du circuit décisionnel et de la gestion des pièces.
- **Déploiement** : répartition des briques (navigateur, API, PostgreSQL, MinIO).