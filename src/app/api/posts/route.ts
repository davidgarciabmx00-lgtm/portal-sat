// src/app/api/posts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Iniciando creación de post...');

    // Inicializar Firebase Admin si no está hecho
    if (!admin.apps.length) {
      console.log('Inicializando Firebase Admin...');
      const serviceAccount = require('../../../../service-account-key.json');
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: 'https://soporte-sat-default-rtdb.europe-west1.firebasedatabase.app/',
      });
      console.log('✅ Firebase Admin inicializado');
    }

    const auth = admin.auth();
    const db = admin.database();

    // 1. Obtener el token de autorización del header
    const authorization = request.headers.get('Authorization');
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const idToken = authorization.split('Bearer ')[1];

    // 2. Verificar el token y obtener los claims
    const decodedToken = await auth.verifyIdToken(idToken);
    const role = decodedToken.role;

    // 3. Comprobar si el usuario es admin
    if (role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admins only' }, { status: 403 });
    }

    // 4. Obtener los datos del cuerpo de la solicitud
    const { title, content, category, image, duration } = await request.json();

    // 5. Calcular expiresAt
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + duration);

    // 6. Guardar en Realtime Database
    console.log('Guardando en Realtime Database...');
    const postsRef = db.ref('posts');
    const newPostRef = postsRef.push();
    await newPostRef.set({
      title,
      content,
      category,
      author: decodedToken.email,
      authorEmail: decodedToken.email,
      createdAt: admin.database.ServerValue.TIMESTAMP,
      imageUrl: null, // Por ahora sin imagen
      duration,
      expiresAt: expiresAt.getTime(),
    });

    console.log('✅ Post guardado exitosamente');
    return NextResponse.json({ message: 'Post creado exitosamente' }, { status: 201 });

  } catch (error) {
    console.error('❌ Error al crear el post:', error);
    return NextResponse.json({
      error: 'Internal Server Error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}