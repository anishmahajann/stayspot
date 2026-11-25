import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import jwt from 'jsonwebtoken';

let firebaseInitialized = false;
let hasServiceAccount = false;
let cachedCerts = null;
let cachedCertsExpiry = 0;

const FIREBASE_CERTS_URL =
  'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';

/**
 * Fetch and cache Google's public X.509 certificates for verifying Firebase ID tokens
 * when only FIREBASE_PROJECT_ID is configured without a Service Account private key.
 */
const getFirebasePublicCerts = async () => {
  if (cachedCerts && Date.now() < cachedCertsExpiry) {
    return cachedCerts;
  }

  const res = await fetch(FIREBASE_CERTS_URL);
  if (!res.ok) {
    throw new Error('Failed to fetch Firebase public verification certificates');
  }

  const cacheControl = res.headers.get('cache-control') || '';
  const maxAgeMatch = cacheControl.match(/max-age=(\d+)/);
  const maxAgeMs = maxAgeMatch ? parseInt(maxAgeMatch[1], 10) * 1000 : 3600 * 1000;

  cachedCerts = await res.json();
  cachedCertsExpiry = Date.now() + maxAgeMs;
  return cachedCerts;
};

/**
 * Initialize Firebase Admin SDK if credentials are provided in environment variables.
 */
export const initFirebaseAdmin = () => {
  if (firebaseInitialized || getApps().length > 0) {
    firebaseInitialized = true;
    return getApps()[0];
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (projectId && clientEmail && privateKey) {
    const app = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
    firebaseInitialized = true;
    hasServiceAccount = true;
    console.log(`[Firebase Admin] Initialized with Service Account for project: ${projectId}`);
    return app;
  }

  if (projectId) {
    console.log(`[Firebase Auth] Configured for project: ${projectId} (public X.509 JWT verification)`);
    return null;
  }

  return null;
};

export const isFirebaseAdminConfigured = () => {
  return Boolean(process.env.FIREBASE_PROJECT_ID);
};

/**
 * Verify a Firebase ID token:
 * 1) Uses Firebase Admin SDK if Service Account credentials are configured.
 * 2) Otherwise verifies RS256 signature against Google's official Firebase X.509 certificates
 *    for FIREBASE_PROJECT_ID.
 *
 * @param {string} idToken
 */
export const verifyFirebaseToken = async (idToken) => {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (!projectId) {
    throw new Error('Firebase is not configured. Set FIREBASE_PROJECT_ID in backend/.env');
  }

  const app = initFirebaseAdmin();
  if (hasServiceAccount && (app || getApps().length > 0)) {
    return getAuth(app || getApps()[0]).verifyIdToken(idToken);
  }

  const decodedComplete = jwt.decode(idToken, { complete: true });
  const kid = decodedComplete?.header?.kid;
  if (!kid) {
    throw new Error('Invalid Firebase ID token header (missing kid)');
  }

  const certs = await getFirebasePublicCerts();
  const certPem = certs[kid];
  if (!certPem) {
    throw new Error('Unknown Firebase signing key ID');
  }

  const payload = jwt.verify(idToken, certPem, {
    algorithms: ['RS256'],
    audience: projectId,
    issuer: `https://securetoken.google.com/${projectId}`,
  });

  if (!payload.sub || typeof payload.sub !== 'string') {
    throw new Error('Firebase token missing subject (uid)');
  }

  return {
    ...payload,
    uid: payload.user_id || payload.sub,
  };
};

export default { initFirebaseAdmin, isFirebaseAdminConfigured, verifyFirebaseToken };
