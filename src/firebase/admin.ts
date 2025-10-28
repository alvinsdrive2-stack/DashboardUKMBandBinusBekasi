import admin from 'firebase-admin';
import serviceAccount from './serviceAccount.json';

// Check if Firebase Admin is already initialized
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as any),
      projectId: serviceAccount.project_id,
    });
    console.log('✅ Firebase Admin SDK initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin SDK:', error);
  }
}

export const adminAuth = admin.auth();
export const adminMessaging = admin.messaging();
export const adminFirestore = admin.firestore();
export const adminApp = admin;

export default admin;
