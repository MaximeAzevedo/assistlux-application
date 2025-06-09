import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Vérification des variables d'environnement
const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID'
];

const missingVars = requiredEnvVars.filter(envVar => !import.meta.env[envVar]);

let auth: any;
let db: any;

if (missingVars.length > 0) {
  console.warn('Variables d\'environnement Firebase manquantes:', missingVars);
  console.warn('Firebase désactivé - Utilisation de Supabase uniquement');
  
  // Créer des mocks pour éviter les erreurs
  auth = {
    currentUser: null,
    onAuthStateChanged: () => () => {},
    signInWithEmailAndPassword: () => Promise.reject(new Error('Firebase non configuré')),
    createUserWithEmailAndPassword: () => Promise.reject(new Error('Firebase non configuré')),
    signOut: () => Promise.reject(new Error('Firebase non configuré'))
  };
  
  db = {
    collection: () => ({
      doc: () => ({
        get: () => Promise.reject(new Error('Firebase non configuré')),
        set: () => Promise.reject(new Error('Firebase non configuré'))
      })
    })
  };
} else {
  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
}

export { auth, db };