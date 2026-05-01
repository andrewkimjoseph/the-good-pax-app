import { cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function validateFirebaseEnv() {
  const env = {
    projectId: process.env.PAX_FIREBASE_PROJECT_ID,
    clientEmail: process.env.PAX_FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.PAX_FIREBASE_PRIVATE_KEY,
  };

  if (!env.projectId || !env.clientEmail || !env.privateKey) {
    throw new Error(
      "Missing Firebase Admin env vars: PAX_FIREBASE_PROJECT_ID, PAX_FIREBASE_CLIENT_EMAIL, PAX_FIREBASE_PRIVATE_KEY"
    );
  }

  return {
    projectId: env.projectId,
    clientEmail: env.clientEmail,
    privateKey: env.privateKey.replace(/\\n/g, "\n"),
  };
}

const appName = "paxApp";

function getPaxFirebaseApp() {
  const existing = getApps().find((app) => app.name === appName);
  if (existing) return existing;

  const env = validateFirebaseEnv();
  return initializeApp(
    {
      credential: cert({
        projectId: env.projectId,
        clientEmail: env.clientEmail,
        privateKey: env.privateKey,
      }),
    },
    appName
  );
}

export const paxDB = getFirestore(getPaxFirebaseApp());
export const paxFirebaseApp = getApp(appName);
