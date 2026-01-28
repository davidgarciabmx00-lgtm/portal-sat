// src/app/api/posts/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('🔍 Eliminando post con ID:', id);

    // Inicializar Firebase Admin si no está hecho
    if (!admin.apps.length) {
      console.log('Inicializando Firebase Admin...');
      const serviceAccount = require('../../../../../service-account-key.json');
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

    // 4. Eliminar el post de Realtime Database
    console.log('Eliminando post de Realtime Database...');
    const postRef = db.ref(`posts/${id}`);
    await postRef.remove();

    console.log('✅ Post eliminado exitosamente');
    return NextResponse.json({ message: 'Post eliminado exitosamente' }, { status: 200 });

  } catch (error) {
    console.error('❌ Error al eliminar el post:', error);
    return NextResponse.json({
      error: 'Internal Server Error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}