# 📸 Studio MAE - Dashboard Interne

Dashboard complet pour la gestion des devis, clients, emails et calendrier de Studio MAE.

## 🚀 Fonctionnalités

### ✅ Implémentées
- **Dashboard admin** avec statistiques et aperçu
- **Gestion des clients** (CRUD complet)
- **Gestion des devis** avec pipeline de statuts
- **Envoi d'emails** avec templates HTML et validation en ligne
- **Authentification admin** avec NextAuth
- **Base de données** SQLite avec Prisma
- **Interface moderne** avec Tailwind CSS

### 🔄 Statuts des devis
- `DRAFT` → Brouillon
- `READY` → Prêt à envoyer
- `SENT` → Envoyé au client
- `SIGNED` → Signé par le client
- `INVOICED` → Facturé
- `CANCELED` → Annulé

## 🛠️ Stack Technique

- **Framework**: Next.js 15.3.2 (App Router)
- **UI**: React 18 + Tailwind CSS 4.1.7
- **Base de données**: SQLite + Prisma ORM
- **Authentification**: NextAuth.js v4
- **Email**: Resend
- **Types**: TypeScript
- **Tokens**: José (JWT)

## 📦 Installation

1. **Cloner et installer les dépendances** :
```bash
npm install
```

2. **Configurer les variables d'environnement** :
```bash
cp .env.example .env
```

Modifier `.env` avec vos valeurs :
```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="votre-cle-secrete-forte"
NEXTAUTH_URL="http://localhost:3000"
RESEND_API_KEY="votre-cle-resend"
ADMIN_EMAIL="admin@studiomae.fr"
ADMIN_PASSWORD="motdepasse-admin"
```

3. **Initialiser la base de données** :
```bash
npx prisma generate
npx prisma db push
npm run db:seed
```

4. **Démarrer le serveur** :
```bash
npm run dev
```

L'application sera accessible sur http://localhost:3000

## 🔑 Connexion Admin

**Identifiants par défaut** (modifiables dans le seed) :
- Email: `admin@studiomae.fr`
- Mot de passe: `admin123`

Next, run the development server:

```bash
npm run dev
```

Finally, open [http://localhost:3000](http://localhost:3000) in your browser to view the website.

## Customizing

You can start editing this template by modifying the files in the `/src` folder. The site will auto-update as you edit these files.

## License

This site template is a commercial product and is licensed under the [Tailwind Plus license](https://tailwindcss.com/plus/license).

## Learn more

To learn more about the technologies used in this site template, see the following resources:

- [Tailwind CSS](https://tailwindcss.com/docs) - the official Tailwind CSS documentation
- [Next.js](https://nextjs.org/docs) - the official Next.js documentation
- [Headless UI](https://headlessui.dev) - the official Headless UI documentation
