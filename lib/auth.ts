import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebaseClient";
import type { Role, UserProfile } from "./types";

export function waitForUser(): Promise<User | null> {
  return new Promise((resolve) => {
    const unsub = onAuthStateChanged(auth, (u) => {
      unsub();
      resolve(u);
    });
  });
}

export async function getMyProfile(uid: string): Promise<UserProfile> {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) throw new Error("Profile not found. Ask SystemAdmin to create your employee profile.");
  const data = snap.data() as any;
  return { uid, ...data } as UserProfile;
}

export function canExport(role: Role) {
  return role === "SystemAdmin" || role === "BranchManager";
}

export function isAdmin(role: Role) {
  return role === "SystemAdmin";
}

export function isManager(role: Role) {
  return role === "SystemAdmin" || role === "BranchManager";
}
