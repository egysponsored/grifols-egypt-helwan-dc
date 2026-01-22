import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyAWgmPNSLMwcXVBsEyRePQoorjmzQueojk",
  authDomain: "grifols-egypt-dc-helwan.firebaseapp.com",
  projectId: "grifols-egypt-dc-helwan",
  storageBucket: "grifols-egypt-dc-helwan.firebasestorage.app",
  messagingSenderId: "410137607509",
  appId: "1:410137607509:web:46bdd5439da2e1ea1143dc",
  measurementId: "G-M5N14D54TY",
};

export const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export async function initAnalytics() {
  if (typeof window === "undefined") return null;
  if (!(await isSupported())) return null;
  return getAnalytics(app);
}
