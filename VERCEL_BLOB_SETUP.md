# 🔧 Configuration Vercel Blob pour les PDF

## 📋 **Étapes à suivre :**

### 1. **Générer le token Vercel Blob**
1. Allez sur https://vercel.com/dashboard
2. Sélectionnez votre projet `dashboard`
3. Allez dans `Storage` → `Create Database` → `Blob`
4. Créez un store Blob (nom suggéré: `studio-mae-pdfs`)
5. Copiez le token généré

### 2. **Ajouter la variable d'environnement sur Vercel**
1. Allez dans `Settings` → `Environment Variables`
2. Ajoutez une nouvelle variable :
   - **Nom** : `BLOB_READ_WRITE_TOKEN`
   - **Valeur** : [Le token généré à l'étape 1]
   - **Environnements** : Production, Preview, Development

### 3. **Redéployer l'application**
Après avoir ajouté la variable, redéployez l'application.

## ✅ **Fonctionnalités après configuration :**

- ✅ **Upload PDF** en production via Vercel Blob
- ✅ **Envoi d'emails** avec PDF en pièce jointe
- ✅ **Stockage sécurisé** et scalable
- ✅ **URLs publiques** pour accès aux PDF
- ✅ **Fallback local** en développement

## 💰 **Coût estimé :**
- **Stockage** : ~$0.15 par GB par mois
- **Transfert** : ~$0.15 par GB transféré
- **Gratuit** jusqu'à 500MB de stockage

---

**Une fois configuré, vous pourrez créer et envoyer des devis avec PDF directement depuis la production !** 🚀
