// Firebase Configuration
// Replace these placeholders with your actual Firebase config
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getDatabase, Database } from 'firebase/database';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'demo-api-key',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'demo-project.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'demo-project',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'demo-project.appspot.com',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '000000000000',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:000000000000:web:000000000000',
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || '',
};

// Lazy initialization - Firebase is only initialized when first accessed on the client
let _app: FirebaseApp | null = null;
let _auth: Auth | null = null;
let _db: Firestore | null = null;
let _rtdb: Database | null = null;

function getFirebaseApp(): FirebaseApp {
  if (typeof window === 'undefined') {
    throw new Error('Firebase cannot be used during server-side rendering');
  }

  if (!_app) {
    _app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  }
  return _app;
}

// Lazy getters that only initialize Firebase when accessed
export const auth: Auth = new Proxy({} as Auth, {
  get(_, prop) {
    if (!_auth) {
      _auth = getAuth(getFirebaseApp());
    }
    return (_auth as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export const db: Firestore = new Proxy({} as Firestore, {
  get(_, prop) {
    if (!_db) {
      _db = getFirestore(getFirebaseApp());
    }
    return (_db as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export const rtdb: Database = new Proxy({} as Database, {
  get(_, prop) {
    if (!_rtdb) {
      const app = getFirebaseApp();
      // Only initialize RTDB if databaseURL is configured
      if (firebaseConfig.databaseURL) {
        _rtdb = getDatabase(app);
      } else {
        // Return a mock database that won't cause errors
        _rtdb = {
          app,
          type: 'database',
        } as unknown as Database;
      }
    }
    return (_rtdb as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export default null;
