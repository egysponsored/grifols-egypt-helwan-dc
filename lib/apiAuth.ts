import { NextRequest } from "next/server";
import { adminAuth, adminDb } from "./firebaseAdmin";
import type { Role, UserProfile } from "./types";

export async function requireUser(req: NextRequest): Promise<UserProfile> {
  const authHeader = req.headers.get("authorization") || "";
  const m = authHeader.match(/^Bearer (.+)$/);
  if (!m) throw new Response("Missing Authorization Bearer token", { status: 401 });
  const token = m[1];
  const decoded = await adminAuth.verifyIdToken(token);
  const snap = await adminDb.collection("users").doc(decoded.uid).get();
  if (!snap.exists) throw new Response("User profile missing", { status: 403 });
  const data = snap.data() as any;
  return { uid: decoded.uid, ...data } as UserProfile;
}

export function requireRole(user: UserProfile, roles: Role[]) {
  if (!roles.includes(user.role)) throw new Response("Forbidden", { status: 403 });
}

export function scopeAwarenessFilter(user: UserProfile) {
  if (user.role === "AwarenessEmployee") return { awarenessEmployeeId: user.uid };
  return null;
}
