// set-admin-role.js
require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');

// Inicializar Firebase Admin con las variables de entorno
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
  });
}

async function setAdminRole(email) {
  try {
    // Buscar el usuario por email
    const user = await admin.auth().getUserByEmail(email);
    
    // Establecer custom claim de admin
    await admin.auth().setCustomUserClaims(user.uid, { role: 'admin' });
    
    console.log(`✅ Usuario ${email} ahora tiene rol de admin`);
    console.log(`UID: ${user.uid}`);
    
    // El usuario debe cerrar sesión y volver a iniciar para que los claims se actualicen
    console.log('\n⚠️  IMPORTANTE: El usuario debe cerrar sesión y volver a iniciar sesión para que los cambios surtan efecto.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Obtener email desde argumentos de línea de comandos
const email = process.argv[2];

if (!email) {
  console.error('❌ Debes proporcionar un email');
  console.log('Uso: node set-admin-role.js email@ejemplo.com');
  process.exit(1);
}

setAdminRole(email);
