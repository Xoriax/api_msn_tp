# Facebook Events API v1.2

API REST complète pour la gestion d'événements inspirée de Facebook Events avec système d'authentification JWT sécurisé.

## Nouveautés v1.2

- Authentification JWT complète avec bcrypt
- Système de login/logout sécurisé  
- Protection des routes utilisateur
- Autorisation basée sur l'ID utilisateur
- Hachage sécurisé des mots de passe

## Installation

```bash
git clone <repository-url>
cd api
npm install
```

## Configuration

Créer un fichier `.env` :

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/facebook_events
JWT_SECRET=votre-cle-secrete-forte
NODE_ENV=development
```

## Démarrage

```bash
# Développement
npm run dev

# Production  
npm run prod
```

Le serveur démarre sur `http://localhost:3000`

## Authentification

### Créer un compte

```http
POST /users
Content-Type: application/json

{
  "email": "user@example.com",
  "firstname": "John",
  "lastname": "Doe",
  "password": "motdepasse123",
  "age": 25,
  "city": "Paris"
}
```

### Se connecter

```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com", 
  "password": "motdepasse123"
}
```

Réponse :
```json
{
  "code": 200,
  "message": "Connexion réussie",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user_id",
      "firstname": "John",
      "lastname": "Doe",
      "email": "user@example.com"
    }
  }
}
```

### Utiliser le token

Pour accéder aux routes protégées, incluez le token dans l'en-tête :

```http
Authorization: Bearer <votre_token>
```

## Endpoints principaux

### Utilisateurs

```http
GET    /users                    # Liste des utilisateurs
GET    /users/:id                # Détails d'un utilisateur
POST   /users                    # Créer un utilisateur
PUT    /users/:id                # Modifier son profil (protégé)
DELETE /users/:id                # Supprimer son compte (protégé)
GET    /auth/profile             # Mon profil (protégé)
POST   /auth/logout              # Se déconnecter (protégé)
```

### Événements

```http
GET    /events                   # Liste des événements
GET    /events/:id               # Détails d'un événement
POST   /events                   # Créer un événement
PUT    /events/:id               # Modifier un événement
DELETE /events/:id               # Supprimer un événement
POST   /events/:id/join          # Rejoindre un événement
POST   /events/:id/leave         # Quitter un événement
```

### Groupes

```http
GET    /groups                   # Liste des groupes
GET    /groups/:id               # Détails d'un groupe
POST   /groups                   # Créer un groupe
PUT    /groups/:id               # Modifier un groupe
DELETE /groups/:id               # Supprimer un groupe
POST   /groups/:id/join          # Rejoindre un groupe
POST   /groups/:id/leave         # Quitter un groupe
```

### Discussions

```http
GET    /discussions              # Liste des discussions
POST   /discussions              # Créer une discussion
POST   /discussions/:id/messages # Ajouter un message
```

### Sondages

```http
GET    /polls                    # Liste des sondages
POST   /polls                    # Créer un sondage
POST   /polls/:id/vote           # Voter dans un sondage
```

### Albums et Photos

```http
GET    /albums                   # Liste des albums
POST   /albums                   # Créer un album
GET    /photos                   # Liste des photos
POST   /photos                   # Ajouter une photo
POST   /photos/:id/like          # Liker une photo
```

### Billetterie

```http
GET    /events/:eventId/tickets  # Billets d'un événement
POST   /events/:eventId/tickets  # Acheter des billets
```

## Sécurité

### Protection des données

- Mots de passe hachés avec bcrypt (10 salt rounds)
- Tokens JWT avec expiration 24h
- Un utilisateur ne peut modifier que son propre compte
- Validation des données d'entrée
- Exclusion automatique des mots de passe des réponses

### Codes d'erreur

- `400` - Données invalides
- `401` - Non authentifié
- `403` - Non autorisé
- `404` - Ressource non trouvée
- `500` - Erreur serveur

## Structure technique

```
src/
├── config.mjs              # Configuration
├── server.mjs               # Serveur Express
├── controllers/             # Logique métier
│   ├── users.mjs           # Gestion utilisateurs + auth
│   ├── events.controller.mjs
│   ├── groups.controller.mjs
│   └── ...
├── models/                  # Modèles MongoDB
│   ├── user.mjs
│   ├── event.mjs
│   └── ...
└── middleware/              # Middlewares
    └── auth.mjs            # Authentification JWT
```

## Technologies

- Node.js + Express.js
- MongoDB + Mongoose
- JWT + bcrypt
- ESLint

## Fonctionnalités

- Authentification JWT sécurisée
- Gestion complète des utilisateurs
- Système d'événements avec participation
- Groupes publics/privés/secrets
- Discussions et messages
- Sondages avec votes
- Albums photos avec likes
- Billetterie intégrée
- Pagination sur toutes les listes
- Validation et gestion d'erreurs

## Scripts

```bash
npm run dev     # Développement avec ESLint
npm run prod    # Production
npm run lint    # Vérification ESLint seule
```

## Développement

Le projet utilise ESLint avec des règles strictes pour maintenir la qualité du code. Tous les endpoints retournent du JSON avec une structure cohérente.

## Variables d'environnement

Production recommandée :

```env
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=cle-secrete-complexe-unique
```