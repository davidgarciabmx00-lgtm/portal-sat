// set-admin.js
const admin = require('firebase-admin');

// Para desarrollo local: usar el archivo service-account-key.json
// Para producción: configurar variables de entorno
let serviceAccount;

try {
  // Intentar cargar desde archivo local
  serviceAccount = require('./service-account-key.json');
} catch (error) {
  // Si no existe el archivo, usar variables de entorno
  if (process.env.FIREBASE_PROJECT_ID) {
    serviceAccount = {
      type: "service_account",
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
    };
  } else {
    console.error('Error: No se encontró service-account-key.json ni variables de entorno de Firebase.');
    console.error('Descarga la clave de servicio desde Firebase Console y colócala en la raíz del proyecto,');
    console.error('o configura las variables de entorno FIREBASE_PROJECT_ID, etc.');
    process.exit(1);
  }
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const emailDelAdmin = 'admin@alfredsmart.com';

admin.auth().getUserByEmail(emailDelAdmin)
  .then((userRecord) => {
    // Establece el custom claim 'role' a 'admin'
    return admin.auth().setCustomUserClaims(userRecord.uid, { role: 'admin' });
  })
  .then(() => {
    console.log(`¡Éxito! El rol de 'admin' ha sido asignado a ${emailDelAdmin}.`);
    // Forzamos la actualización del token del usuario para que los cambios surtan efecto inmediatamente
    return admin.auth().getUserByEmail(emailDelAdmin);
  })
  .then((userRecord) => {
    console.log('Custom Claims del usuario:', userRecord.customClaims);
  })
  .catch((error) => {
    console.error('Error al asignar el rol:', error);
  });