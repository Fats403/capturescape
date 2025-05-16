import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getStorage } from "firebase-admin/storage";
import { env } from "@/env";
import { getFirestore } from "firebase-admin/firestore";

function initAdmin() {
  const apps = getApps();

  if (apps.length > 0) {
    return apps[0];
  }

  const firebaseAdminConfig = {
    credential: cert({
      projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
    storageBucket: `gs://${env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebasestorage.app`,
  };

  return initializeApp(firebaseAdminConfig);
}

// Initialize the admin app
const adminApp = initAdmin();
const adminAuth = getAuth(adminApp);
const adminStorage = getStorage(adminApp);
const db = getFirestore();

export { adminApp, adminAuth, adminStorage, db };
