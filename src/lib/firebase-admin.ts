// src/lib/firebase-admin.ts
import admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    const serviceAccount = require('../../service-account-key.json');
    console.log('🔧 Inicializando Firebase Admin con service account...');
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: 'https://portal-soporte-sat-default-rtdb.firebaseio.com/', // URL de Realtime Database
    });
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