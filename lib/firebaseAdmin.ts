import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } else {
      console.warn("FIREBASE_SERVICE_ACCOUNT_KEY is missing. Initializing admin without credentials.");
      admin.initializeApp();
    }
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
}

export const getAdminDb = () => admin.firestore();
export const getAdminAuth = () => admin.auth();
