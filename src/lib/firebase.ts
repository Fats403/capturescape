import { initializeApp, getApp } from "firebase/app";
import { getAuth, type UserCredential } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { env } from "@/env";
import type { FirebaseOptions } from "firebase/app";
import { getFirestore } from "firebase/firestore";

export interface AuthCredential extends UserCredential {
  _tokenResponse?: {
    isNewUser?: boolean;
  };
}

const firebaseConfig = {
  apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: `${env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: `gs://${env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebasestorage.app`,
  messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function getFirebaseApp(config: FirebaseOptions) {
  try {
    return getApp();
  } catch {
    return initializeApp(config);
  }
}

const firebaseApp = getFirebaseApp(firebaseConfig);
export const storage = getStorage(firebaseApp);
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
