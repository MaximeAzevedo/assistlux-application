# AssistLux

Une plateforme numérique moderne pour faciliter l'accès aux services sociaux et administratifs au Luxembourg.

## 🚀 Fonctionnalités

### 🔍 **Scanner de Documents Intelligent**
- Reconnaissance optique de caractères (OCR) avec Tesseract.js
- Support des formats PDF, DOC, DOCX et images
- Analyse automatique et traduction des documents
- Extraction des informations clés

### 🗺️ **Carte Interactive des Services**
- Localisation des services sociaux et administratifs
- Filtrage par catégorie (hébergement, santé, emploi, etc.)
- Intégration Google Maps
- Informations détaillées sur chaque service

### 🤖 **Assistant IA Multilingue**
- Chat intelligent avec OpenAI GPT-4
- Support de 15 langues incluant le luxembourgeois
- Traduction automatique en temps réel
- Assistance personnalisée pour les démarches

### 📋 **Vérificateur d'Éligibilité**
- Questionnaire dynamique pour évaluer l'éligibilité aux aides
- Logique conditionnelle avancée
- Recommandations personnalisées
- Liens directs vers les formulaires

### 👤 **Espace Personnel Sécurisé**
- Profil utilisateur complet
- Sauvegarde des documents scannés
- Historique des démarches
- Authentification Firebase

## 🛠️ Technologies

### **Frontend**
- **React 18** avec TypeScript
- **Vite** pour le build et le développement
- **Tailwind CSS** pour le styling
- **React Router** pour la navigation
- **React i18next** pour l'internationalisation

### **Backend & Services**
- **Supabase** - Base de données et authentification
- **Firebase** - Authentification alternative
- **OpenAI GPT-4** - Intelligence artificielle
- **Google Maps API** - Cartographie
- **AWS Textract** - OCR avancé
- **Tesseract.js** - OCR côté client

### **Outils & Qualité**
- **ESLint** avec TypeScript
- **Prettier** pour le formatage
- **Husky** pour les hooks Git
- **Lazy Loading** pour les performances

## 📦 Installation

### Prérequis
- Node.js 18+ 
- npm ou yarn
- Comptes pour les services externes (Firebase, Supabase, OpenAI, etc.)

### Configuration

1. **Cloner le projet**
```bash
git clone [url-du-repo]
cd assistlux
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configuration des variables d'environnement**
Créer un fichier `.env` à la racine :

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# OpenAI Configuration
VITE_OPENAI_API_KEY=your_openai_api_key

# AWS Configuration
VITE_AWS_ACCESS_KEY_ID=your_aws_access_key
VITE_AWS_SECRET_ACCESS_KEY=your_aws_secret_key
VITE_AWS_REGION=eu-west-3
VITE_AWS_S3_BUCKET=your_bucket_name

# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google Maps
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key

# Twilio (WhatsApp)
VITE_TWILIO_ACCOUNT_SID=your_twilio_sid
VITE_TWILIO_AUTH_TOKEN=your_twilio_token
```

4. **Démarrer le serveur de développement**
```bash
npm run dev
```

## 🏗️ Scripts Disponibles

```bash
# Développement
npm run dev

# Build de production
npm run build

# Prévisualisation du build
npm run preview

# Linting
npm run lint

# Tests (à implémenter)
npm run test
```

## 📁 Structure du Projet

```
src/
├── components/          # Composants React réutilisables
│   ├── Chat/           # Système de chat
│   ├── DocumentScanner/ # Scanner de documents
│   ├── EligibilityChecker/ # Vérificateur d'éligibilité
│   └── PersonalSpace/  # Espace personnel
├── contexts/           # Contextes React (Auth, etc.)
├── hooks/             # Hooks personnalisés
├── i18n/              # Fichiers de traduction
├── lib/               # Utilitaires et configurations
├── pages/             # Pages principales
├── types/             # Définitions TypeScript
└── data/              # Données statiques
```

## 🌍 Langues Supportées

- 🇫🇷 Français (par défaut)
- 🇬🇧 Anglais
- 🇱🇺 Luxembourgeois
- 🇩🇪 Allemand
- 🇵🇹 Portugais
- 🇪🇸 Espagnol
- 🇸🇦 Arabe
- 🇺🇦 Ukrainien
- 🇮🇷 Persan
- 🇵🇰 Ourdou
- 🇮🇹 Italien
- 🇳🇱 Néerlandais
- 🇵🇱 Polonais
- 🇷🇴 Roumain
- 🇷🇺 Russe
- 🇹🇷 Turc

## 🔒 Sécurité

- ✅ Variables d'environnement pour tous les secrets
- ✅ Authentification sécurisée avec Firebase/Supabase
- ✅ Validation des données côté client et serveur
- ✅ HTTPS obligatoire en production
- ✅ Sanitisation des entrées utilisateur

## 📈 Performance

- ✅ Lazy loading des composants
- ✅ Code splitting automatique
- ✅ Optimisation des images
- ✅ Mise en cache intelligente
- ✅ Bundle analysis et optimisation

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📝 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 📞 Support

Pour toute question ou support :
- 📧 Email : support@assistlux.lu
- 🌐 Site web : https://assistlux.lu
- 📱 WhatsApp : +352 XX XX XX XX

---

**AssistLux** - Simplifier l'accès aux services sociaux au Luxembourg 🇱🇺
