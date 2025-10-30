# Facebook Events API

## Description

API REST complète pour la gestion d'événements inspirée de Facebook Events. Cette API permet la création, gestion et participation à des événements, ainsi que la gestion de groupes, discussions, sondages, albums photos et système de billetterie.

## Architecture technique

- **Framework**: Node.js avec Express.js
- **Base de données**: MongoDB avec Mongoose ODM
- **Authentification**: JWT (JSON Web Tokens)
- **Validation**: ESLint pour la qualité du code
- **Structure**: Architecture modulaire avec contrôleurs séparés

## Prérequis

- Node.js version 16 ou supérieure
- MongoDB (local ou Atlas)
- npm ou yarn

## Installation

```bash
# Cloner le projet
git clone <repository-url>
cd api

# Installer les dépendances
npm install

# Démarrer le serveur de développement
npm run dev
```

## Configuration

Créer un fichier `.env` à la racine avec les variables suivantes :

```env
PORT=3000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
JWT_SECRET=your-secret-key-change-in-production
NODE_ENV=development
```

## Structure du projet

```
src/
├── config.mjs              # Configuration base de données
├── server.mjs               # Configuration serveur Express
├── controllers/             # Logique métier
│   ├── users.mjs
│   ├── events.controller.mjs
│   ├── groups.controller.mjs
│   ├── discussions.controller.mjs
│   ├── polls.controller.mjs
│   ├── albums.controller.mjs
│   ├── photos.controller.mjs
│   ├── tickets.controller.mjs
│   └── routes.mjs
├── models/                  # Modèles de données MongoDB
│   ├── user.mjs
│   ├── event.mjs
│   ├── group.mjs
│   ├── discussion.mjs
│   ├── poll.mjs
│   ├── album.mjs
│   ├── photo.mjs
│   ├── ticket.mjs
│   └── ticketType.mjs
└── middleware/              # Middlewares personnalisés
    └── auth.mjs
```

## Modèles de données

### Utilisateur (User)
- Informations personnelles (nom, prénom, email, mot de passe)
- Photo de profil et biographie
- Date de naissance
- Timestamps de création/modification

### Événement (Event)
- Informations de base (nom, description, lieu)
- Dates de début et fin
- Photo de couverture
- Statut privé/public
- Organisateurs multiples
- Participants
- Liaison optionnelle à un groupe
- Albums, sondages et discussions associés
- Système de billetterie intégré

### Groupe (Group)
- Informations de base (nom, description, photo de couverture)
- Types de confidentialité (public, privé, secret)
- Administrateurs et membres
- Paramètres de permissions (posts et événements des membres)
- Événements et discussions associés
- **Contrôle d'accès intelligent** selon le type et l'appartenance

### Discussion (Discussion)
- Liaison à un événement OU un groupe (exclusif)
- Messages avec auteur et contenu
- Système de réponses imbriquées
- Timestamps pour tous les messages

### Sondage (Poll)
- Questions multiples avec options de réponse
- Système de votes par utilisateur
- Date de fin de sondage
- Liaison à un événement ou groupe
- Calcul automatique des pourcentages

### Album et Photo
- Albums liés aux événements
- Photos avec légendes et métadonnées
- Système de likes et commentaires
- Suivi de l'utilisateur qui télécharge

### Billetterie
- Types de billets avec prix et limites
- Achat de billets avec informations d'acheteur
- Numéros de billets uniques
- Statuts (acheté, validé, annulé)

## API Endpoints

### Authentification

```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

## Authentification et sécurité

### Système JWT

L'API utilise des tokens JWT pour l'authentification. Après connexion, tous les appels aux endpoints protégés doivent inclure le token dans les headers :

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Endpoints protégés

Les endpoints de modification et suppression nécessitent une authentification et des permissions spécifiques :

**Groupes** : Seuls les administrateurs peuvent modifier/supprimer
**Événements** : Seuls les organisateurs peuvent modifier/supprimer
**Événements de groupe** : Seuls les administrateurs du groupe peuvent créer

### Codes d'erreur

- `401` : Token d'authentification manquant
- `403` : Token invalide ou permissions insuffisantes
- `404` : Ressource non trouvée
- `400` : Données invalides
- `500` : Erreur serveur

### Utilisateurs

```http
GET    /users                    # Liste des utilisateurs (pagination)
GET    /users/:id                # Détails d'un utilisateur
POST   /users                    # Créer un utilisateur
PUT    /users/:id                # Modifier un utilisateur
DELETE /users/:id                # Supprimer un utilisateur
GET    /users/email/:email       # Chercher par email
```

### Événements

```http
GET    /events                   # Liste des événements
GET    /events/:id               # Détails d'un événement
POST   /events                   # Créer un événement
PUT    /events/:id               # Modifier un événement (organisateurs)
DELETE /events/:id               # Supprimer un événement (organisateurs)
POST   /events/:id/join          # Rejoindre un événement
POST   /events/:id/leave         # Quitter un événement
```

### Événements de groupe

```http
POST   /groups/:groupId/events   # Créer un événement dans un groupe (admins)
```

### Groupes

```http
GET    /groups                   # Tous les groupes avec contrôle d'accès
GET    /groups/public            # Groupes publics uniquement (compatibilité)
GET    /groups/:id               # Détails d'un groupe (contrôle d'accès)
POST   /groups                   # Créer un groupe
PUT    /groups/:id               # Modifier un groupe (admins)
DELETE /groups/:id               # Supprimer un groupe (admins)
POST   /groups/:id/join          # Rejoindre un groupe
POST   /groups/:id/leave         # Quitter un groupe
```

#### Contrôle d'accès aux groupes

**GET /groups** - Nouveau système intelligent :
- **Groupes publics** : Informations complètes pour tous
- **Groupes privés** : Visibles par tous, détails limités aux non-membres
- **Groupes secrets** : Invisibles dans la liste publique

**GET /groups/:id** - Accès conditionnel :
- **Public** : Accessible à tous
- **Privé** : Détails complets pour membres, informations limitées pour non-membres
- **Secret** : Accessible uniquement aux membres (404 pour les autres)

### Discussions

```http
GET    /discussions              # Liste des discussions
GET    /discussions/:id          # Détails d'une discussion
POST   /discussions             # Créer une discussion
PUT    /discussions/:id          # Modifier une discussion
DELETE /discussions/:id          # Supprimer une discussion
POST   /discussions/:id/messages # Ajouter un message
POST   /discussions/:discussionId/messages/:messageId/replies # Répondre à un message
DELETE /discussions/:discussionId/messages/:messageId         # Supprimer un message
```

### Discussions spécifiques

```http
GET    /events/:eventId/discussion    # Discussion d'un événement
POST   /events/:eventId/discussion    # Créer discussion d'événement
GET    /groups/:groupId/discussion    # Discussion d'un groupe
POST   /groups/:groupId/discussion    # Créer discussion de groupe
```

### Sondages

```http
GET    /polls                    # Liste des sondages
GET    /polls/:id                # Détails d'un sondage
POST   /polls                    # Créer un sondage
PUT    /polls/:id                # Modifier un sondage
DELETE /polls/:id                # Supprimer un sondage
POST   /polls/:id/vote           # Voter dans un sondage
GET    /polls/:id/results        # Résultats d'un sondage
```

### Albums et Photos

```http
GET    /albums                   # Liste des albums
GET    /events/:eventId/albums   # Albums d'un événement
GET    /albums/:id               # Détails d'un album
POST   /events/:eventId/albums   # Créer un album
PUT    /albums/:id               # Modifier un album
DELETE /albums/:id               # Supprimer un album

GET    /photos                   # Liste des photos
GET    /albums/:albumId/photos   # Photos d'un album
GET    /photos/:id               # Détails d'une photo
POST   /albums/:albumId/photos   # Ajouter une photo
PUT    /photos/:id               # Modifier une photo
DELETE /photos/:id               # Supprimer une photo
POST   /photos/:id/like          # Liker une photo
DELETE /photos/:id/like          # Unliker une photo
POST   /photos/:id/comments      # Commenter une photo
DELETE /photos/:photoId/comments/:commentId # Supprimer un commentaire
```

### Billetterie

```http
GET    /events/:eventId/ticket-types    # Types de billets d'un événement
POST   /events/:eventId/ticket-types    # Créer un type de billet
GET    /tickets                         # Liste des billets
GET    /events/:eventId/tickets         # Billets d'un événement
GET    /tickets/:id                     # Détails d'un billet
POST   /events/:eventId/tickets         # Acheter des billets
PUT    /tickets/:id                     # Modifier un billet
DELETE /tickets/:id                     # Annuler un billet
```

## Gestion de la Confidentialité des Groupes

### Types de Groupes

**Public** : Accessible à tous
- Visible dans la liste publique
- Détails complets accessibles sans restriction
- Tous peuvent rejoindre librement

**Privé** : Visible mais accès restreint
- Visible dans la liste publique avec informations de base
- Détails complets uniquement pour les membres
- Possibilité de rejoindre après demande

**Secret** : Complètement caché
- Invisible dans la liste publique
- Accessible uniquement par lien direct si membre
- Impossible de rejoindre sans invitation

### Authentification Optionnelle

Les endpoints `/groups` et `/groups/:id` fonctionnent avec ou sans authentification :

**Sans token JWT** :
```json
// Groupe privé - informations limitées
{
  "_id": "group_id",
  "name": "Nom du groupe",
  "description": "Description publique",
  "type": "private",
  "memberCount": 25,
  "isPrivate": true,
  "canJoin": true
}
```

**Avec token JWT (membre)** :
```json
// Groupe privé - informations complètes
{
  "_id": "group_id", 
  "name": "Nom du groupe",
  "description": "Description complète",
  "type": "private",
  "administrators": [...],
  "members": [...],
  "events": [...],
  "allowMemberPosts": true,
  "discussion_id": "..."
}
```

## Format des réponses

### Succès

```json
{
  "code": 200,
  "message": "success",
  "data": { ... },
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  }
}
```

### Erreur

```json
{
  "code": 400,
  "message": "Description de l'erreur",
  "error": "Détails techniques"
}
```

## Pagination

La plupart des endpoints de liste supportent la pagination via les paramètres de requête :

```http
GET /events?page=1&limit=10
GET /users?page=2&limit=20&search=john
```

## Développement

### Scripts disponibles

```bash
npm run dev     # Démarrage en mode développement avec ESLint
npm run start   # Démarrage en production
npm run lint    # Vérification ESLint uniquement
```

### Standards de code

- ESLint configuré avec des règles strictes
- Longueur maximale de ligne : 100 caractères
- Convention de nommage : camelCase
- Retours explicites dans les fonctions async
- Gestion d'erreurs systématique

### Structure des contrôleurs

Chaque contrôleur suit le même pattern :

```javascript
export default class ControllerName {
  constructor(app, connect) {
    this.app = app;
    this.Model = connect.model('ModelName', Schema);
    this.run();
  }

  methodName() {
    this.app.method('/endpoint', middleware, async (req, res) => {
      try {
        // Logique métier
        return res.status(200).json({ ... });
      } catch (error) {
        return res.status(500).json({ ... });
      }
    });
  }

  run() {
    this.methodName();
    // Autres méthodes...
  }
}
```

## Base de données

### Connexion MongoDB

Configuration dans `src/config.mjs` avec support pour développement et production.

### Relations entre modèles

- Références croisées avec `ObjectId`
- Population automatique des relations
- Contraintes d'intégrité via middleware Mongoose

## Tests et validation

### ESLint

Configuration stricte pour maintenir la qualité du code :

```bash
npx eslint ./src/**/*.mjs
```

### Test de l'API

Utilisez des outils comme Postman, Insomnia ou curl pour tester les endpoints.

## Déploiement

### Variables d'environnement production

```env
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=strong-secret-key-for-production
```

### Considérations de sécurité

- Changez `JWT_SECRET` en production
- Utilisez HTTPS
- Implémentez le hachage des mots de passe avec bcrypt
- Ajoutez des limites de taux (rate limiting)
- Validez toutes les entrées utilisateur

## Installation et démarrage

1. Installer les dépendances :
```bash
npm install
```

2. Configurer la base de données MongoDB dans `src/config.mjs`

3. Démarrer en mode développement :
```bash
npm run dev
```

4. Démarrer en mode production :
```bash
npm run prod
```

## Technologies utilisées

- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **MongoDB** - Base de données NoSQL
- **Mongoose** - ODM pour MongoDB
- **ESLint** - Linter pour la qualité du code

## Fonctionnalités principales

- Gestion des utilisateurs avec emails uniques  
- Création et gestion d'événements publics/privés  
- Système de groupes (public, privé, secret)  
- Albums photos avec commentaires  
- Fil de discussion pour groupes et événements  
- Système de sondages avec votes  
- Billetterie complète avec types de billets  
- Pagination sur tous les endpoints  
- Validation des données d'entrée  
- Gestion d'erreurs cohérente  

## Améliorations futures

- [ ] Authentification JWT/OAuth
- [ ] Upload de fichiers pour les photos
- [ ] Notifications en temps réel
- [ ] Système de permissions avancé
- [ ] Cache Redis pour les performances
- [ ] Tests automatisés
- [ ] Documentation Swagger/OpenAPI
