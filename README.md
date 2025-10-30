# API Events Management System v1.3.0

REST API complète pour la gestion d'événements avec authentification JWT, billetterie, albums photos et système de discussions.

## Installation

```bash
git clone <repository-url>
cd api
npm install
```

## Configuration

Créer un fichier `.env` à la racine :

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/events_api
JWT_SECRET=votre-cle-secrete-complexe
NODE_ENV=development
```

## Démarrage

```bash
npm run dev    # Mode développement
npm start      # Mode production
```

L'API sera accessible sur `http://localhost:3000`

## Authentification

### Inscription

```http
POST /users
Content-Type: application/json

{
  "email": "user@example.com",
  "firstname": "John",
  "lastname": "Doe", 
  "password": "password123",
  "age": 25,
  "city": "Paris"
}
```

### Connexion

```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

Retourne un token JWT à inclure dans l'en-tête `Authorization: Bearer <token>` pour les routes protégées.

## Endpoints API

### Utilisateurs

| Méthode | Route | Description | Protection |
|---------|-------|-------------|------------|
| GET | `/users` | Liste des utilisateurs | Non |
| GET | `/users/:id` | Détails d'un utilisateur | Non |
| POST | `/users` | Créer un compte | Non |
| PUT | `/users/:id` | Modifier son profil | JWT |
| DELETE | `/users/:id` | Supprimer son compte | JWT |
| GET | `/auth/profile` | Mon profil | JWT |
| POST | `/auth/logout` | Déconnexion | JWT |

### Événements

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/events` | Liste des événements |
| GET | `/events/:id` | Détails d'un événement |
| POST | `/events` | Créer un événement |
| PUT | `/events/:id` | Modifier un événement |
| DELETE | `/events/:id` | Supprimer un événement |
| POST | `/events/:id/join` | Rejoindre un événement |
| POST | `/events/:id/leave` | Quitter un événement |

### Groupes

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/groups` | Liste des groupes |
| GET | `/groups/:id` | Détails d'un groupe |
| POST | `/groups` | Créer un groupe |
| PUT | `/groups/:id` | Modifier un groupe |
| DELETE | `/groups/:id` | Supprimer un groupe |
| POST | `/groups/:id/join` | Rejoindre un groupe |
| POST | `/groups/:id/leave` | Quitter un groupe |

### Discussions

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/discussions` | Liste des discussions |
| GET | `/discussions/:id` | Détails d'une discussion |
| POST | `/discussions` | Créer une discussion |
| PUT | `/discussions/:id` | Modifier une discussion |
| DELETE | `/discussions/:id` | Supprimer une discussion |
| POST | `/discussions/:id/messages` | Ajouter un message |
| DELETE | `/discussions/:discussionId/messages/:messageId` | Supprimer un message |

### Sondages

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/polls` | Liste des sondages |
| GET | `/polls/:id` | Détails d'un sondage |
| POST | `/polls` | Créer un sondage |
| PUT | `/polls/:id` | Modifier un sondage |
| DELETE | `/polls/:id` | Supprimer un sondage |
| POST | `/polls/:id/vote` | Voter dans un sondage |
| DELETE | `/polls/:id/vote` | Retirer son vote |

### Albums et Photos

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/albums` | Liste des albums |
| GET | `/events/:eventId/albums` | Albums d'un événement |
| POST | `/events/:eventId/albums` | Créer un album |
| GET | `/albums/:id` | Détails d'un album |
| PUT | `/albums/:id` | Modifier un album |
| DELETE | `/albums/:id` | Supprimer un album |
| GET | `/albums/:albumId/photos` | Photos d'un album |
| POST | `/albums/:albumId/photos` | Ajouter une photo |
| GET | `/photos/:id` | Détails d'une photo |
| PUT | `/photos/:id` | Modifier une photo |
| DELETE | `/photos/:id` | Supprimer une photo |
| POST | `/photos/:id/like` | Liker une photo |
| DELETE | `/photos/:id/like` | Retirer un like |
| POST | `/photos/:id/comments` | Commenter une photo |
| DELETE | `/photos/:id/comments/:commentId` | Supprimer un commentaire |

### Billetterie

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/events/:eventId/ticket-types` | Types de billets |
| POST | `/events/:eventId/ticket-types` | Créer un type de billet |
| PUT | `/ticket-types/:id` | Modifier un type de billet |
| DELETE | `/ticket-types/:id` | Supprimer un type de billet |
| POST | `/ticket-types/:ticketTypeId/purchase` | Acheter un billet |
| GET | `/tickets/:ticketNumber` | Détails d'un billet |
| DELETE | `/tickets/:ticketNumber` | Annuler un billet |
| GET | `/events/:eventId/tickets` | Billets d'un événement |

## Exemples de requêtes

### Créer un événement

```http
POST /events
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Concert de Jazz",
  "description": "Soirée jazz exceptionnelle",
  "startDate": "2025-12-01T20:00:00Z",
  "endDate": "2025-12-01T23:00:00Z",
  "location": "Salle Pleyel, Paris",
  "max_participants": 200
}
```

### Créer un type de billet

```http
POST /events/:eventId/ticket-types
Content-Type: application/json

{
  "name": "Billet VIP",
  "price": 89.99,
  "quantityLimit": 50,
  "description": "Accès VIP avec boissons incluses"
}
```

### Acheter un billet

```http
POST /ticket-types/:ticketTypeId/purchase
Content-Type: application/json

{
  "buyerInfo": {
    "firstname": "Marie",
    "lastname": "Dupont",
    "email": "marie@example.com",
    "address": {
      "street": "123 Rue de la Paix",
      "city": "Paris",
      "postal_code": "75001",
      "country": "France"
    }
  }
}
```

### Liker une photo

```http
POST /photos/:id/like
Content-Type: application/json

{
  "userId": "64f12a3b1c9d4e5f6a7b8c9d"
}
```

## Structure des données

### Réponse standard

Toutes les réponses suivent ce format :

```json
{
  "code": 200,
  "message": "success",
  "data": { /* données */ },
  "pagination": { /* si applicable */ }
}
```

### Pagination

Les listes supportent la pagination :

```http
GET /events?page=2&limit=10
```

```json
{
  "code": 200,
  "message": "success",
  "data": [ /* événements */ ],
  "pagination": {
    "page": 2,
    "limit": 10,
    "total": 156,
    "pages": 16
  }
}
```

## Codes de réponse

| Code | Description |
|------|-------------|
| 200 | Succès |
| 201 | Création réussie |
| 400 | Données invalides |
| 401 | Non authentifié |
| 403 | Non autorisé |
| 404 | Ressource non trouvée |
| 500 | Erreur serveur |

## Sécurité

- Authentification JWT avec expiration 24h
- Hachage des mots de passe avec bcrypt
- Validation des données d'entrée
- Protection CORS configurée
- Rate limiting par IP

## Technologies

- Node.js 18+
- Express.js 4.x
- MongoDB 6+ avec Mongoose
- JWT pour l'authentification
- bcrypt pour le hachage des mots de passe

## Architecture

```
src/
├── config.mjs                 # Configuration générale
├── server.mjs                 # Point d'entrée du serveur
├── controllers/               # Contrôleurs de routes
│   ├── users.mjs             # Gestion utilisateurs et auth
│   ├── events.controller.mjs # Gestion des événements
│   ├── groups.controller.mjs # Gestion des groupes
│   ├── discussions.controller.mjs
│   ├── polls.controller.mjs
│   ├── albums.controller.mjs
│   ├── photos.controller.mjs
│   ├── tickets.controller.mjs
│   └── routes.mjs            # Routing central
├── models/                   # Modèles de données MongoDB
│   ├── user.mjs
│   ├── event.mjs
│   ├── group.mjs
│   ├── discussion.mjs
│   ├── poll.mjs
│   ├── album.mjs
│   ├── photo.mjs
│   ├── ticket.mjs
│   └── ticketType.mjs
└── middleware/
    └── auth.mjs              # Middleware d'authentification
```

## Fonctionnalités principales

- Système d'authentification complet avec JWT
- Gestion d'événements avec participants
- Groupes publics, privés et secrets
- Discussions avec messages en temps réel
- Sondages avec système de vote
- Albums photos avec likes et commentaires
- Billetterie intégrée avec types de billets
- Annulation de billets avec remboursement automatique
- Suppression intelligente des types de billets
- Pagination sur toutes les collections
- Validation et gestion d'erreurs robuste

## Nouvelles fonctionnalités v1.3.0

- Système de likes pour les photos
- Annulation de billets avec traçabilité
- Suppression intelligente des types de billets
- Amélioration des validations de données
- Messages d'erreur détaillés

## Scripts disponibles

```bash
npm run dev     # Développement avec rechargement automatique
npm start       # Production
npm run lint    # Vérification du code avec ESLint
```

## Contribution

1. Fork le projet
2. Créer une branche feature
3. Commiter les changements
4. Push vers la branche
5. Ouvrir une Pull Request

## License

MIT License - voir le fichier LICENSE pour plus de détails