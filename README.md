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

## API Endpoints Doc

```bash
https://.postman.co/workspace/My-Workspace~281493ef-5f23-43b2-8bd3-243daae25e69/collection/28620833-b1aab039-7348-4665-a0bb-68e6c9d8b7f4?action=share&creator=28620833
```

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