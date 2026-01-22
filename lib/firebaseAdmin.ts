import { cert, getApps, initializeApp, App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

/**
 * IMPORTANT:
 * Create a Firebase Admin service account key in Firebase console,
 * save it as JSON, then set env var FIREBASE_SERVICE_ACCOUNT_JSON
 * to the JSON string (or base64 decode then stringify).
 *
 * Example (PowerShell):
 *   $json = Get-Content .\serviceAccount.json -Raw
 *   setx FIREBASE_SERVICE_ACCOUNT_JSON $json
 *
 * Also set FIREBASE_STORAGE_BUCKET to: grifols-egypt-dc-helwan.firebasestorage.app
 */
function getServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error("Missing FIREBASE_SERVICE_ACCOUNT_JSON");
  try { return JSON.parse(raw); } catch {
    // allow base64
    const decoded = Buffer.from(raw, "base64").toString("utf8");
    return JSON.parse(decoded);
  }
}

export function getAdminApp(): App {
  if (getApps().length) return getApps()[0]!;
  const sa = getServiceAccount();
  return initializeApp({
    credential: cert(sa),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });
}

export const adminApp = getAdminApp();
export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);
export const adminStorage = getStorage(adminApp);
