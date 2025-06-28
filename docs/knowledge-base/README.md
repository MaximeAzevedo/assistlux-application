# 📚 Base de Connaissances - AssistLux

## 📁 Comment ajouter vos documents

### Formats supportés :
- **PDF** (.pdf)
- **Word** (.doc, .docx) 
- **Texte** (.txt, .md)

### Instructions :
1. **Déposez vos documents** dans ce dossier `docs/knowledge-base/`
2. **Lancez l'import** avec : `npm run import-knowledge`
3. **Vos documents seront automatiquement** :
   - Découpés en chunks intelligents
   - Vectorisés avec Azure OpenAI
   - Stockés dans Supabase
   - Intégrés au chatbot

### Structure recommandée :
```
docs/knowledge-base/
├── procedures/           # Procédures administratives
├── faq/                 # Questions fréquentes  
├── guides/              # Guides utilisateur
└── regulations/         # Réglementations
```

### Exemple de nommage :
- `aide-sociale-luxembourg.pdf`
- `procedures-demande-allocation.docx`
- `faq-eligibilite.txt`

---
🤖 **Une fois importés, ces documents alimenteront automatiquement les réponses de votre assistant !** 