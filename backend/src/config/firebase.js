import admin from 'firebase-admin';

let firebaseInitialized = false;

/**
 * Initialize Firebase Admin SDK if credentials are provided in environment variables.
 */
export const initFirebaseAdmin = () => {
  if (firebaseInitialized || admin.apps.length > 0) {
    firebaseInitialized = true;
    return admin;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (projectId && clientEmail && privateKey) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
    firebaseInitialized = true;
    console.log(`[Firebase Admin] Initialized for project: ${projectId}`);
  } else if (projectId) {
    // Allows initializing with projectId / Application Default Credentials when deployed on GCP/Cloud Run
    admin.initializeApp({ projectId });
    firebaseInitialized = true;
    console.log(`[Firebase Admin] Initialized with default credentials for project: ${projectId}`);
  }

  return admin;
};

export const isFirebaseAdminConfigured = () => {
  return Boolean(
    process.env.FIREBASE_PROJECT_ID &&
      ((process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) ||
        process.env.GOOGLE_APPLICATION_CREDENTIALS)
  );
};

/**
 * Verify a Firebase ID token from the client using Firebase Admin SDK.
 * @param {string} idToken
 */
export const verifyFirebaseToken = async (idToken) => {
  const app = initFirebaseAdmin();
  if (!firebaseInitialized) {
    throw new Error(
      'Firebase Admin is not configured. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in backend/.env'
    );
  }
  return app.auth().verifyIdToken(idToken);
};

export default { initFirebaseAdmin, isFirebaseAdminConfigured, verifyFirebaseToken };
