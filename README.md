# Center Management 2

## Description

`center_management2` est une application de gestion de centre éducatif construite avec **Next.js 16**, **React 19** et **TypeScript**. Elle propose un tableau de bord multi-rôles pour la gestion des élèves, professeurs, cours, présences, paiements, ressources et notifications.

## Fonctionnalités principales

- Authentification utilisateur via **NextAuth** avec provider `Credentials`
- Rôles utilisateurs : `ADMIN`, `SECRETARY`, `TEACHER`, `PARENT`, `STUDENT`
- Interface de dashboard localisée en **français** et **arabe**
- Gestion des cours, ressources et emplois du temps
- Suivi de la **présence** et des **paiements** des étudiants
- Envoi et lecture de **notifications** ciblées
- Upload / téléchargement de ressources par cours
- Gestion des profils enseignants et étudiants
- Protection des routes avec **middleware/proxy** et gestion i18n
- Gestion complète des notes
## Architecture du projet

- `src/app/` : pages principales et structure du site
- `src/components/` : composants UI et dashboard
- `src/actions/` : actions serveur pour login, présence, paiements, notifications, ressources
- `src/auth.ts` et `src/auth.config.ts` : configuration de NextAuth
- `src/i18n/` : configuration de `next-intl` pour la navigation et le routage localisé
- `src/proxy.ts` : fichier de proxy/middleware pour i18n + auth
- `src/lib/prisma.ts` : client Prisma
- `prisma/schema.prisma` : modèle de données PostgreSQL

## Stack technique

- `next` 16.2.2
- `react` 19.2.4
- `typescript` 5
- `next-auth` 5 beta
- `next-intl` 4.9.0
- `prisma` 6.19.3
- `@prisma/client`
- `postgresql`
- `tailwindcss` 4
- `shadcn` pour les composants UI
- `framer-motion` pour les animations
- `sonner` pour les notifications frontend

## Installation

1. Cloner le dépôt

```bash
git clone <repo-url>
cd center_management2
```

2. Installer les dépendances

```bash
npm install
```

3. Configurer les variables d'environnement

Créez un fichier `.env` à la racine avec au minimum :

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?pgbouncer=true"
DIRECT_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="une-clé-secrète-de-32-caractères-au-moins"
AUTH_SECRET="une-clé-secrète-de-32-caractères-au-moins"
```

4. Appliquer la migration Prisma / synchroniser la base

```bash
npx prisma migrate dev
# ou si vous utilisez déjà la base existante
npx prisma db push
```

5. Semer les données de base (si le seed est configuré)

```bash
npx prisma db seed
```

## Commandes utiles

- `npm run dev` : lancer le serveur de développement
- `npm run build` : construire l'application pour la production
- `npm start` : démarrer le serveur produit
- `npm run lint` : lancer ESLint

## Routes principales

- `GET /fr` : page d'accueil redirigeant vers le locale français
- `GET /fr/login` : page de connexion
- `GET /fr/dashboard` : tableau de bord authentifié
- `GET /fr/dashboard/attendance` : présence
- `GET /fr/dashboard/classes` : classes
- `GET /fr/dashboard/courses` : cours
- `GET /fr/dashboard/notifications` : notifications
- `GET /fr/dashboard/payments` : paiements
- `GET /fr/dashboard/resources` : ressources
- `GET /fr/dashboard/students` : étudiants
- `GET /fr/dashboard/subjects` : matières
- `GET /fr/dashboard/teachers` : enseignants

## API

- `src/app/api/auth/[...nextauth]` : gestion d'authentification NextAuth
- `src/app/api/notification-file/[id]` : téléchargement de pièce jointe de notification
- `src/app/api/resource/[id]` : téléchargement de ressource
- `src/app/api/resources/upload` : endpoint d'upload de ressources

## Base de données

Le schéma Prisma gère les entités suivantes :

- `User` : utilisateur avec rôle et mot de passe hashé
- `TeacherProfile` / `StudentProfile`
- `Course`, `Class`, `Subject`
- `Resource`, `Enrollment`, `Attendance`, `Payment`
- `Notification` et `NotificationRead`

## Authentification

- Provider `Credentials` utilisant `email` + `password`
- Vérification via bcrypt
- JWT session strategy
- Pages personnalisées : `signIn: "/login"`

## Internationalisation

Le projet utilise `next-intl` avec les locales :

- `fr` (français)
- `ar` (arabe)

La navigation localisée est gérée depuis `src/i18n/routing.ts`.

## Notes spécifiques

- `src/proxy.ts` est utilisé à la place de l'ancien `middleware.ts` pour la compatibilité avec Next.js 16.
- Assurez-vous que `NEXTAUTH_SECRET` est correctement défini pour que la session fonctionne.
- `src/actions/login.ts` gère la connexion côté serveur avec `signIn` de NextAuth.

## Améliorations possibles

- Ajouter un vrai système de rôles et permissions plus fin
- Implémenter une interface de création et gestion des utilisateurs
- Ajouter des tests end-to-end
- Améliorer la gestion des uploads de fichiers et des validations

## Contribution

1. Fork du projet
2. Créez une branche feature
3. Faites vos modifications
4. Ouvrez une pull request

---

`center_management2` est conçu comme une base de gestion d'atelier / centre éducatif avec un backend Prisma et un frontend Next.js moderne.