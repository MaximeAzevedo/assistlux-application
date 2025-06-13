# Configuration Azure Speech Services

## 🎯 Objectif

Ce guide vous aide à configurer Azure Speech Services pour la reconnaissance vocale dans AssistLux, en respectant la conformité RGPD (région EU uniquement).

## 📋 Prérequis

- Compte Azure actif
- Ressource "Speech Services" créée dans la région **West Europe**
- Clés API récupérées

## 🔧 Configuration

### 1. Variables d'environnement

Ajoutez ces variables dans votre fichier `.env` :

```env
# Azure Speech Services (région EU pour conformité RGPD)
AZURE_SPEECH_KEY=votre_clé_speech_ici
AZURE_SPEECH_REGION=westeurope
AZURE_SPEECH_ENDPOINT=https://westeurope.api.cognitive.microsoft.com/
```

### 2. Récupération des clés

1. **Connectez-vous** au [portail Azure](https://portal.azure.com)
2. **Naviguez** vers votre ressource "Speech Services"
3. **Menu** → "Clés et point de terminaison"
4. **Copiez** :
   - **KEY 1** → `AZURE_SPEECH_KEY`
   - **Région** → `AZURE_SPEECH_REGION` (doit être "westeurope")
   - **Point de terminaison** → `AZURE_SPEECH_ENDPOINT`

## 🌍 Langues supportées

Azure Speech Services EU supporte :

- **Français** (fr-FR) - Assistant social
- **Arabe** (ar-SA) - Usagers
- **Anglais** (en-US, en-GB)
- **Allemand** (de-DE)
- **Espagnol** (es-ES)
- **Italien** (it-IT)
- **Portugais** (pt-PT)
- **Russe** (ru-RU)
- **Turc** (tr-TR)
- **Néerlandais** (nl-NL)
- **Polonais** (pl-PL)
- **Roumain** (ro-RO)
- **Persan** (fa-IR)
- **Ourdou** (ur-PK)

## 💰 Coûts estimés

### Niveau gratuit (F0)
- ✅ **5 heures/mois** incluses
- ✅ Parfait pour les tests
- ❌ Limité en volume

### Niveau standard (S0)
- 💰 **~1€ par heure** de reconnaissance
- 📊 **Usage estimé** : 50h/mois = ~50€/mois
- ✅ Volume illimité
- ✅ Meilleure qualité

## 🛡️ Conformité RGPD

### ✅ Conforme
- **Région** : West Europe (UE)
- **Stockage** : Données traitées en Europe
- **Anonymisation** : Automatique avant traitement
- **Rétention** : Aucune (traitement temps réel)

### 🔒 Sécurité
- Chiffrement en transit (HTTPS)
- Authentification par clé API
- Pas de stockage permanent
- Effacement automatique après traitement

## 🚀 Test de fonctionnement

### Vérification dans l'application

1. **Lancez** AssistLux
2. **Ouvrez** le traducteur temps réel
3. **Vérifiez** l'indicateur de statut :
   - 🟢 **"Azure Speech EU"** = Configuré correctement
   - 🟠 **"Mode texte uniquement"** = Configuration manquante

### Test de reconnaissance vocale

1. **Activez** Azure Speech dans les paramètres
2. **Cliquez** sur le bouton micro 🎤
3. **Parlez** clairement
4. **Vérifiez** que le texte apparaît automatiquement

## ❌ Dépannage

### Erreur "Azure Speech Services non configuré"
- Vérifiez que `AZURE_SPEECH_KEY` est définie dans `.env`
- Redémarrez l'application après modification du `.env`

### Erreur "Langue non supportée"
- Vérifiez que la langue est dans la liste supportée
- Utilisez les codes à 2 lettres (fr, en, ar, etc.)

### Erreur "Permissions microphone"
- Autorisez l'accès au microphone dans votre navigateur
- Vérifiez les paramètres de confidentialité

### Qualité de reconnaissance faible
- Parlez plus lentement et distinctement
- Réduisez le bruit ambiant
- Vérifiez la qualité de votre microphone

## 📞 Support

En cas de problème :

1. **Vérifiez** les logs de la console navigateur (F12)
2. **Testez** avec le niveau gratuit F0 d'abord
3. **Contactez** le support Azure si problème de facturation

## 🔄 Migration depuis Web Speech API

L'ancienne version utilisait Web Speech API (Google/Microsoft US). 

**Avantages Azure Speech EU :**
- ✅ 100% conforme RGPD
- ✅ Meilleure qualité de reconnaissance
- ✅ Plus de langues supportées
- ✅ Contrôle total des données

**Migration automatique :**
- L'application détecte automatiquement Azure Speech
- Fallback vers mode texte si non configuré
- Aucune perte de fonctionnalité 