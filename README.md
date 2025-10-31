# API MSN Events

Une API REST complète pour la gestion d'événements sociaux avec système d'authentification et autorisation granulaire.

## Fonctionnalités

### Authentification
- Système JWT avec tokens sécurisés
- Inscription et connexion utilisateur
- Middleware d'authentification pour toutes les routes protégées

### Gestion des utilisateurs
- Profils utilisateur complets
- Gestion des permissions et rôles

### Événements
- Création et gestion d'événements
- Système de participants
- Distinction créateur/organisateur
- Événements publics et privés

### Groupes
- Création et administration de groupes
- Système de membres avec rôles
- Événements liés aux groupes

### Discussions
- Discussions par événement ou groupe
- Messages et réponses en thread
- Contrôle d'accès basé sur la participation

### Sondages
- Création de sondages pour les événements
- Vote et consultation des résultats
- Permissions différenciées créateur/participant

### Albums et Photos
- Gestion d'albums liés aux événements
- Upload et partage de photos
- Contrôle d'accès basé sur la participation

### Billetterie
- Création de types de billets
- Système d'achat et annulation
- Gestion des quotas et disponibilités
- Vérification propriétaire pour les actions

## Installation

### Prérequis
- Node.js 18+
- MongoDB
- npm ou yarn

### Configuration
1. Cloner le repository
```bash
git clone https://github.com/Xoriax/api_msn_tp.git
cd api_msn_tp
```

2. Installer les dépendances
```bash
npm install
```

3. Configurer l'environnement
Créer un fichier `.env` à la racine :
```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/facebook_events
```

4. Démarrer l'application
```bash
# Mode développement avec hot reload
npm run dev

# Mode production
npm start
```

## Architecture de sécurité

### Middleware d'authentification
- `authenticateToken` : Vérification JWT obligatoire
- Extraction automatique de l'ID utilisateur depuis le token

### Middleware d'autorisation
- `checkEventParticipant` : Vérification participation événement
- `checkEventOrganizer` : Vérification rôle organisateur/créateur
- `checkEventCreator` : Vérification créateur uniquement
- `checkGroupMember` : Vérification appartenance groupe
- `checkGroupAdmin` : Vérification admin/créateur groupe
- `checkGroupCreator` : Vérification créateur groupe uniquement
- `checkDiscussionAccess` : Accès discussion basé sur événement/groupe
- `checkPollCreator` : Vérification créateur sondage
- `checkPollResultsAccess` : Accès résultats sondage
- `checkPollDeleteAccess` : Suppression sondage
- `checkAlbumAccess` : Accès album basé sur participation
- `checkAlbumManageAccess` : Gestion album (créateur/organisateur)
- `checkPhotoAccess` : Accès photo basé sur album
- `checkPhotoUploader` : Vérification uploader photo
- `checkTicketOwner` : Vérification propriétaire billet
- `checkTicketTypeManageAccess` : Gestion types billets

### Modèle de permissions
- **Créateur** : Permissions complètes sur la ressource
- **Organisateur/Admin** : Permissions de gestion (événements/groupes)
- **Participant/Membre** : Accès lecture et interactions limitées
- **Propriétaire** : Permissions sur ses propres ressources (billets, photos)

## Structure du projet

```
src/
├── config.mjs              # Configuration application
├── server.mjs              # Configuration serveur Express
├── controllers/            # Contrôleurs routes API
│   ├── routes.mjs          # Index des contrôleurs
│   ├── users.mjs           # Gestion utilisateurs
│   ├── events.controller.mjs    # Gestion événements
│   ├── groups.controller.mjs    # Gestion groupes
│   ├── discussions.controller.mjs # Gestion discussions
│   ├── polls.controller.mjs     # Gestion sondages
│   ├── albums.controller.mjs    # Gestion albums
│   ├── photos.controller.mjs    # Gestion photos
│   └── tickets.controller.mjs   # Gestion billetterie
├── middleware/
│   └── auth.mjs            # Middlewares authentification/autorisation
└── models/                 # Modèles MongoDB/Mongoose
    ├── user.mjs
    ├── event.mjs
    ├── group.mjs
    ├── discussion.mjs
    ├── poll.mjs
    ├── album.mjs
    ├── photo.mjs
    ├── ticket.mjs
    └── ticketType.mjs
```

## API Endpoints

### Authentification
- `POST /register` - Inscription
- `POST /login` - Connexion

### Utilisateurs
- `GET /users` - Liste utilisateurs (admin)
- `GET /users/:id` - Profil utilisateur
- `PUT /users/:id` - Modification profil
- `DELETE /users/:id` - Suppression compte

### Événements
- `GET /events/public` - Événements publics
- `POST /events` - Création événement
- `GET /events/:id` - Détails événement
- `PUT /events/:id` - Modification événement
- `DELETE /events/:id` - Suppression événement
- `POST /events/:id/join` - Rejoindre événement
- `POST /events/:id/leave` - Quitter événement

### Groupes
- `GET /groups` - Liste groupes
- `POST /groups` - Création groupe
- `GET /groups/:id` - Détails groupe
- `PUT /groups/:id` - Modification groupe
- `DELETE /groups/:id` - Suppression groupe
- `POST /groups/:id/join` - Rejoindre groupe
- `POST /groups/:id/leave` - Quitter groupe

### Discussions
- `GET /groups/:id/discussion` - Discussion groupe
- `POST /groups/:id/discussion` - Créer discussion groupe
- `GET /events/:id/discussion` - Discussion événement
- `POST /events/:id/discussion` - Créer discussion événement
- `POST /discussions/:id/messages` - Nouveau message
- `POST /discussions/:id/messages/:messageId/replies` - Répondre message

### Sondages
- `GET /events/:id/polls` - Sondages événement
- `POST /events/:id/polls` - Créer sondage
- `POST /polls/:id/vote` - Voter sondage
- `GET /polls/:id/results` - Résultats sondage
- `PUT /polls/:id` - Modifier sondage
- `DELETE /polls/:id` - Supprimer sondage

### Albums et Photos
- `GET /events/:id/albums` - Albums événement
- `POST /events/:id/albums` - Créer album
- `GET /albums/:id/photos` - Photos album
- `POST /albums/:id/photos` - Ajouter photo
- `PUT /albums/:id` - Modifier album
- `DELETE /albums/:id` - Supprimer album
- `DELETE /photos/:id` - Supprimer photo

### Billetterie
- `GET /events/:id/ticket-types` - Types billets
- `POST /events/:id/ticket-types` - Créer type billet
- `POST /ticket-types/:id/purchase` - Acheter billet
- `GET /tickets/:number` - Détails billet
- `GET /events/:id/tickets` - Billets événement
- `POST /tickets/:number/use` - Utiliser billet
- `PUT /ticket-types/:id` - Modifier type billet
- `DELETE /ticket-types/:id` - Supprimer type billet
- `DELETE /tickets/:number` - Annuler billet

## Technologies utilisées

- **Runtime** : Node.js
- **Framework** : Express.js
- **Base de données** : MongoDB avec Mongoose
- **Authentification** : JWT (jsonwebtoken)
- **Sécurité** : bcrypt pour hashage mots de passe
- **Validation** : Mongoose schemas
- **Environnement** : dotenv
- **Qualité code** : ESLint

## Développement

### Scripts disponibles
- `npm run dev` : Développement avec lint + hot reload
- `npm start` : Production
- `npm run lint` : Vérification code
- `npm run lint:fix` : Correction automatique

### Standards de code
- ESLint configuré avec règles strictes
- Longueur ligne maximum 100 caractères
- Indentation 2 espaces
- Point-virgules obligatoires

## Sécurité

- Tokens JWT avec expiration
- Hashage bcrypt pour mots de passe
- Validation entrées utilisateur
- Middleware authentification sur toutes routes protégées
- Autorisation granulaire par ressource et action
- Vérification propriétaire pour actions sensibles