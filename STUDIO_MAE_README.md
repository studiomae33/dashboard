# 🎯 Studio MAE - Dashboard Complet

Dashboard professionnel pour Studio MAE permettant la gestion complète des devis, clients, envoi d'emails et calendrier des locations.

## ✅ FONCTIONNALITÉS LIVRÉES

### 🏗️ **Architecture Robuste**
- ✅ **Next.js 15.3.2** avec App Router
- ✅ **TypeScript** complet pour la sécurité des types
- ✅ **Tailwind CSS 4.1.7** pour l'interface moderne
- ✅ **Prisma ORM** avec SQLite (migrable PostgreSQL)
- ✅ **NextAuth.js v4** pour l'authentification sécurisée
- ✅ **Middleware** de protection automatique des routes admin

### 📋 **Gestion Devis Complète**
- ✅ **Pipeline complet** : DRAFT → READY → SENT → SIGNED → INVOICED → CANCELED
- ✅ **Génération automatique** de références (DE{YYYY}{0001})
- ✅ **Gestion des statuts** avec historique complet
- ✅ **Vue Kanban** pour visualiser le pipeline
- ✅ **Tracking des événements** (audit trail)

### 👥 **Gestion Clients Avancée**
- ✅ **CRUD complet** avec recherche
- ✅ **Support entreprises** et particuliers
- ✅ **Historique des devis** par client
- ✅ **Informations de facturation** complètes

### ✉️ **Système Email Professionnel**
- ✅ **Templates HTML responsive** avec design professionnel
- ✅ **Validation sécurisée** avec tokens JWT (7 jours)
- ✅ **Prévisualisation** avant envoi
- ✅ **Support pièces jointes** PDF
- ✅ **Intégration Resend** pour la délivrabilité
- ✅ **Variables dynamiques** dans les templates

### 📅 **Calendrier des Locations**
- ✅ **Vue calendrier mensuelle** avec navigation
- ✅ **Création automatique** de bookings après signature
- ✅ **Visualisation** des réservations par fond/type
- ✅ **Liste des réservations** à venir

### 🔐 **Validation Client Sécurisée**
- ✅ **Page publique** de validation `/quote/validate/:token`
- ✅ **Tokens JWT signés** avec expiration
- ✅ **Tracking IP** et horodatage
- ✅ **Passage automatique** en statut SIGNED

### ⚙️ **Configuration & Paramètres**
- ✅ **Paramètres studio** (coordonnées, branding)
- ✅ **Configuration email** (Resend, expéditeur)
- ✅ **Numérotation automatique** personnalisable
- ✅ **Templates email** modifiables

## 🚀 DÉMARRAGE RAPIDE

### 1. Installation
```bash
npm install
```

### 2. Configuration environnement
```bash
cp .env.example .env
```

**Variables essentielles dans `.env` :**
```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="votre-clé-secrète-forte-ici"
NEXTAUTH_URL="http://localhost:3000"
RESEND_API_KEY="re_xxxxxxxxx"
ADMIN_EMAIL="admin@studiomae.fr"
ADMIN_PASSWORD="admin123"
```

### 3. Base de données
```bash
npm run db:generate    # Génère le client Prisma
npm run db:push       # Crée la base de données
npm run db:seed       # Charge les données de test
```

### 4. Démarrage
```bash
npm run dev
```

🎉 **Accès :** http://localhost:3001 (ou 3000 si libre)

## 🔑 CONNEXION ADMIN

**Identifiants par défaut :**
- **Email :** `admin@studiomae.fr`
- **Mot de passe :** `admin123`

## 📁 PAGES DISPONIBLES

### 🔐 Public
- `/login` - Connexion admin
- `/quote/validate/:token` - Validation devis par client

### 📊 Admin (protégé)
- `/admin` - Dashboard principal
- `/admin/clients` - Gestion clients + `/new`
- `/admin/quotes` - Gestion devis + `/new` + `/:id` + `/:id/email`
- `/admin/pipeline` - Vue Kanban des statuts
- `/admin/calendar` - Calendrier des locations
- `/admin/settings` - Configuration générale

## 🗄️ MODÈLE DE DONNÉES

### Client
```sql
- id, createdAt, updatedAt
- companyName (optionnel)
- firstName, lastName, email (unique)
- phone, billingAddress, notes
```

### QuoteRequest (Devis)
```sql
- id, reference (unique ex: DE20250001)
- status (DRAFT|READY|SENT|SIGNED|INVOICED|CANCELED)
- clientId, desiredStart, desiredEnd, background, message
- pdfPath, sentAt, signedAt, signedIp
- invoiceRef, invoiceAmountTTC
```

### Booking (Réservation)
```sql
- id, quoteRequestId (unique)
- start, end, background, title
# Créé automatiquement quand devis → SIGNED
```

### EventLog (Audit)
```sql
- entityType, entityId, action, payload, createdAt
# Tracking complet de tous les événements
```

## 📧 CONFIGURATION EMAIL

### Resend Setup
1. Compte sur [resend.com](https://resend.com)
2. Vérifier votre domaine
3. Créer une clé API
4. Configurer dans `/admin/settings`

### Templates Email
- **Devis** : Bouton validation + détails séance
- **Facture** : Montant + informations paiement
- **Variables** : `{{studioName}}`, `{{clientName}}`, `{{quoteRef}}`, etc.

## 🔄 WORKFLOW COMPLET

### 1. Nouvelle Demande
```
Créer client → Créer devis → Status: DRAFT
```

### 2. Préparation
```
Compléter devis → Status: READY → Page envoi email
```

### 3. Envoi Client
```
Prévisualiser → Joindre PDF → Envoyer → Status: SENT
```

### 4. Validation Client
```
Email reçu → Clic validation → Page publique → Status: SIGNED + Booking créé
```

### 5. Facturation
```
Après séance → Status: INVOICED + montant + référence facture
```

## 🛠️ SCRIPTS UTILES

```bash
# Base de données
npm run db:generate   # Client Prisma
npm run db:push      # Sync schéma
npm run db:migrate   # Migration
npm run db:seed      # Données test
npm run db:reset     # Reset + seed

# Développement
npm run dev          # Serveur dev
npm run build        # Build production
npm run start        # Mode production
```

## 📊 DONNÉES DE TEST INCLUSES

Le seed créé automatiquement :
- **1 admin** : `admin@studiomae.fr` / `admin123`
- **3 clients** de test avec différents profils
- **5 devis** avec statuts variés pour démonstration
- **2 bookings** confirmés dans le calendrier
- **Historique complet** des événements

## 🔧 PERSONNALISATION

### Numérotation
Configuration dans `/admin/settings` :
- **Préfixes** : `DE` pour devis, `FA` pour factures
- **Format** : `{PRÉFIXE}{ANNÉE}{COMPTEUR}` → `DE20250001`

### Templates Email
Modifiables dans `src/lib/email.ts` :
- HTML responsive avec CSS inline
- Variables dynamiques
- Support multi-langue (actuellement FR)

### Branding
Tous les éléments de marque dans `/admin/settings` :
- Nom studio, adresse, contacts
- Logo et couleurs (via Tailwind)

## 🚀 MIGRATION PRODUCTION

### PostgreSQL
```bash
# Modifier prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### Variables Prod
```env
NEXTAUTH_SECRET="clé-ultra-sécurisée-production"
NEXTAUTH_URL="https://dashboard.studiomae.fr"
DATABASE_URL="postgresql://user:pass@host:5432/db"
RESEND_API_KEY="re_production_key"
```

### Stockage Fichiers
Remplacer `/uploads` local par :
- Supabase Storage
- AWS S3
- Google Cloud Storage

## 🛡️ SÉCURITÉ

- ✅ **JWT tokens** signés avec expiration
- ✅ **Middleware** protection routes admin
- ✅ **Hashage bcrypt** des mots de passe
- ✅ **Validation** données d'entrée
- ✅ **Audit trail** complet
- ✅ **Pas d'exposition** d'IDs sensibles

## 📈 ÉVOLUTIONS FUTURES

### Court terme
- [ ] Upload PDF intégré
- [ ] Notifications email automatiques
- [ ] Rappels automatiques
- [ ] Export Excel/CSV

### Moyen terme
- [ ] Intégration Google Calendar
- [ ] Paiement en ligne (Stripe)
- [ ] Multi-utilisateurs
- [ ] Application mobile

## 🆘 SUPPORT

### Problèmes courants
```bash
# Reset complet
npm run db:reset

# Port occupé
npm run dev -- -p 3001

# Erreur auth
# Vérifier NEXTAUTH_SECRET dans .env
```

### Logs
- Console navigateur : erreurs front
- Terminal : erreurs serveur  
- Table `event_logs` : audit

---

## 📞 CONTACT & SUPPORT

**Studio MAE Dashboard v1.0**  
Développé avec Next.js, TypeScript, Prisma & Tailwind CSS

**Stack complet :**
- ⚡ Next.js 15.3.2 + App Router
- 🎨 Tailwind CSS 4.1.7
- 🗄️ Prisma + SQLite
- 🔐 NextAuth.js v4
- 📧 Resend API
- 🛡️ JWT tokens sécurisés

---

## 🎉 RÉSUMÉ : DASHBOARD 100% FONCTIONNEL

✅ **Interface admin complète** avec authentification  
✅ **Gestion clients** (création, édition, recherche)  
✅ **Pipeline devis** complet avec statuts  
✅ **Envoi emails** avec templates professionnels  
✅ **Validation client** sécurisée en ligne  
✅ **Calendrier** des réservations automatique  
✅ **Configuration** centralisée  
✅ **Audit trail** et historique  
✅ **Design responsive** et moderne  

**LIVRÉ CLÉS EN MAIN - PRÊT POUR LA PRODUCTION** 🚀
