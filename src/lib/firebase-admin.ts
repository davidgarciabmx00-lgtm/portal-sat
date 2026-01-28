// src/lib/firebase-admin.ts
import admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    console.log('🔧 Inicializando Firebase Admin...');

    // Intentar inicializar con variables de entorno (Vercel)
    if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
      console.log('🔧 Inicializando con variables de entorno...');
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        }),
        databaseURL: process.env.FIREBASE_DATABASE_URL || 'https://portal-soporte-sat-default-rtdb.firebaseio.com/',
      });
    } else {
      // Fallback para desarrollo local
      console.log('🔧 Inicializando con archivo service-account-key.json...');
      const serviceAccount = require('../../service-account-key.json');
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: 'https://portal-soporte-sat-default-rtdb.firebaseio.com/',
      });
    }

    console.log('✅ Firebase Admin inicializado correctamente');
    console.log('Apps length:', admin.apps.length);
  } catch (error) {
    console.error('❌ Error al inicializar Firebase Admin:', error);
    throw error;
  }
}

console.log('📊 Firebase Admin apps:', admin.apps.length);
console.log('📊 App config:', admin.apps[0]?.options);

export const auth = admin.auth();
export const db = admin.firestore();

console.log('✅ Auth y Firestore exportados correctamente');