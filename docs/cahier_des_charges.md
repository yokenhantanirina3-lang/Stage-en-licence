# Cahier des charges

**Thème :** Mise en place d'un logiciel de **gestion de la relation usager** dédié au **suivi des réceptions et réclamations à l'accueil d'un centre fiscal**
**Maître d'ouvrage :** Direction Générale des Impôts (DGI) Madagascar
**Référence :** CDC-PF-2026

**Problématique :** Comment centraliser l'historique des visites et des requêtes des contribuables pour améliorer la qualité de l'accueil et le suivi des dossiers ?

---

## 1. Présentation du projet

La présente plateforme a pour objet la **gestion et le suivi dématérialisé des réclamations des contribuables** au sein d'un centre fiscal de la Direction Générale des Impôts. Elle couvre l'intégralité du cycle de vie d'une réclamation : réception du contribuable à l'accueil, enregistrement de la demande, attribution et instruction du dossier, collecte des pièces justificatives, rédaction et circuit de validation de la décision, puis notification et clôture.

L'application repose sur une architecture web à trois tiers (frontend React, backend FastAPI, base de données PostgreSQL) accessible depuis un simple navigateur.

## 2. Objectifs

Le projet vise à :

- **Numériser** la réception et l'enregistrement des réclamations au guichet ;
- **Traçer** chaque étape du dossier (historique horodaté des actions) ;
- **Sécuriser** le circuit décisionnel par un système de validation hiérarchique ;
- **Respecter** les délais légaux de réponse par un suivi automatisé des échéances ;
- **Améliorer** l'accueil des usagers par le suivi des visites et des réceptions ;
- **Produire** automatiquement l'accusé de réception et le PDF de décision.

## 3. Bénéficiaires / profils utilisateurs

| Profil | Rôle | Prérogatives principales |
|---|---|---|
| Agent de saisie | SAISIE | Enregistrer les réclamations, qualifier le type/motif, enregistrer les visites à l'accueil, déposer les pièces |
| Instructeur | INSTRUCTEUR | Instruire les dossiers, demander/recevoir les pièces, rédiger les décisions, soumettre à validation |
| Chef de service | CHEF | Valider ou refuser les décisions, notifier et clôturer les dossiers |
| Directeur | DIRECTEUR | Apposer le visa et signer les décisions |
| Administrateur | ADMIN | Gérer les utilisateurs, les référentiels et tout le flux décisionnel |

## 4. Périmètre fonctionnel

1. Gestion des contribuables (répertoire fiscal)
2. Suivi des visites et de la relation usager à l'accueil
3. Enregistrement et suivi des réclamations
4. Qualification des réclamations (type et motif)
5. Instruction des dossiers et gestion des pièces justificatives
6. Circuit décisionnel et notification de la décision
7. Tableaux de bord et alertes d'échéance
8. Administration des utilisateurs et des référentiels

## 5. Description des fonctionnalités

### 5.1 Gestion des contribuables

- Création, modification et recherche des contribuables (numéro fiscal, nom/raison sociale, type physique ou morale, adresse, coordonnées).
- Chaque contribuable est immatriculé par un numéro fiscal unique.
- Une réclamation est toujours rattachée à un contribuable du répertoire.

### 5.2 Suivi des visites à l'accueil

- Enregistrement d'une visite à l'accueil : contribuable (sélection) **ou** visiteur non enregistré (nom libre), objet de la visite (liste déroulante : dépôt de réclamation, retrait de décision, renseignements fiscaux, paiement et quittance, dépôt de pièce, autre), service de destination, notes.
- Numéro de visite horodaté (format VIS-AAAA-xxxxxx) et agent récepteur renseigné automatiquement.
- Registre consultable (filtre par jour, pagination, statistiques du jour et par service).
- Droits : enregistrement réservé à l'ADMIN et à la SAISIE ; consultation ouverte à tous les profils.

### 5.3 Enregistrement et suivi des réclamations

- Saisie de la réclamation : contribuable, canal d'entrée (guichet, courrier, portail, e-mail, API), résumé des faits, montant concerné, référence d'imposition.
- Génération automatique d'un numéro de dossier et d'un **accusé de réception** au format PDF remis au contribuable.
- Calcul de la **date limite de réponse** selon le délai légal du type de réclamation.

### 5.4 Qualification

- Attribution du type (contentieuse, gracieuse, prescription) et du motif de la réclamation.
- Le motif peut imposer la fourniture de pièces justificatives.

### 5.5 Instruction et pièces justificatives

- Dossier d'instruction avec lecture du résumé des faits, des informations et des pièces.
- **Dépôt/import de fichiers** (max 10 Mo) par catégorie normalisée : IDENTITE, AVIS_IMPOSITION, CORRESPONDANCE, EXPERTISE, AUTRE.
- Chaque pièce est stockée de façon sécurisée (empreinte SHA-256, traçabilité du déposant et de la date).
- Téléchargement des pièces jointes à tout moment.
- Passage du dossier à l'état « en attente de pièces » lorsque le contribuable doit compléter son dossier.

### 5.6 Circuit décisionnel

Le cœur du dispositif : la réponse au contribuable suit un **circuit hiérarchique de validation** contrôlé par les statuts de la décision.

| Étape | Acteur | Action | Décision | Dossier |
|---|---|---|---|---|
| 1 | Instructeur | Rédige la décision (type, fondement juridique, motivation, montants accordé/rejeté) puis la soumet | BROUILLON | PROJET_REPONSE → EN_VALIDATION |
| 2 | Chef de service | Émet un avis favorable ou défavorable puis valide | VALIDEE | EN_VISA_DIRECTEUR |
| 3 | Directeur | Appose son visa (action tracée) | VALIDEE | EN_VISA_DIRECTEUR |
| 4 | Directeur | Signe la décision | SIGNEE | SIGNEE |
| 5 | Chef / Directeur | Notifie la décision au contribuable (PDF) et clôture le dossier | NOTIFIEE | CLOTUREE |

- Types de décision : ADMIS_TOTAL, ADMIS_PARTIEL, REJETE, IRRECEVABLE, CADUC.
- Chaque transition est **réalisée à l'écran selon le rôle connecté** : l'interface n'affiche que les actions autorisées à l'utilisateur.
- La décision finale est éditée en **PDF** téléchargeable.

### 5.7 Suivi statistique

- Tableau de bord personnalisé selon le rôle : indicateurs (total, en attente, en retard), files d'attente de travail (à qualifier, à instruire, à valider).
- Suivi des visites du jour par service.
- Synthèse consultable dans le panneau de navigation latéral.

### 5.8 Administration

- Gestion des utilisateurs (création, affectation d'un rôle et d'un service, activation/désactivation).
- Gestion des référentiels : services, types et motifs de réclamation, délais légaux.

## 6. Règles de gestion

- Un numéro de dossier (réclamation) et un numéro de visite sont générés automatiquement et sont uniques.
- Une décision ne peut exister qu'au plus une par dossier.
- La validation hiérarchique est **séquentielle** : aucune étape ne peut être sautée.
- Le délai de réponse est calculé à partir du type de réclamation (délai légal en jours).
- Toute action sensible est enregistrée dans l'historique (action, agent, date, commentaire).
- Les montants saisis sont strictement positifs et exprimés en Ariary.
- Les champs textuels rejettent les caractères spéciaux à risque (injection / falsification).

## 7. Exigences non fonctionnelles

| Exigence | Description |
|---|---|
| Sécurité | Authentification JWT, contrôle d'accès par rôle sur chaque endpoint |
| Traçabilité | Historique complet des actions avec horodatage et agent responsable |
| Intégrité | Empreinte SHA-256 des fichiers déposés, montants contraints en base |
| Fiabilité | Validation des saisies côté navigateur **et** côté API |
| Disponibilité | Consultation temps réel des files d'attente (mise à jour périodique) |
| Compatibilité | Interface web responsive (navigateur standard) |

## 8. Contraintes techniques

| Brique | Technologie |
|---|---|
| Frontend | React 18, TypeScript, Tailwind CSS |
| Backend | FastAPI, SQLAlchemy 2.0, Pydantic |
| Base de données | PostgreSQL (schéma relationnel, contraintes d'intégrité) |
| Stockage fichiers | MinIO (S3), repli local en développement |
| Authentification | JWT (HS256), jetons d'accès et de rafraîchissement |
| Génération PDF | bibliothèque PDF (accusé de réception, décision) |

## 9. Références

Les diagrammes de conception associés sont disponibles dans le dossier `docs/diagrammes` :
- Diagramme de cas d'utilisation (`usecase.png`)
- Diagramme de classes (`classes.png`)
- Diagrammes de séquence et d'activité (`sequence.png`, `activite.png`)
- Diagramme de déploiement (`deploiement.png`)

Le dossier **conception** détaille l'architecture, le modèle de données et les flux décisionnels ci-dessus.