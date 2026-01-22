"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebaseClient";
import { getMyProfile, isManager } from "@/lib/auth";
import type { Notification, UserProfile } from "@/lib/types";
import { Card } from "@/components/Card";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";

export default function NotificationsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [items, setItems] = useState<Notification[]>([]);

  useEffect(() => {
    (async () => {
      const u = auth.currentUser;
      if (!u) return;
      const p = await getMyProfile(u.uid);
      setProfile(p);
      const q = query(collection(db, "notifications"), orderBy("createdAt", "desc"));
      return onSnapshot(q, (snap) => {
        const arr: Notification[] = [];
        snap.forEach(d => arr.push({ id: d.id, ...(d.data() as any) }));
        setItems(arr);
      });
    })();
  }, []);

  if (!profile) return null;

  return (
    <div className="space-y-4 max-w-4xl">
      <Card>
        <div className="text-lg font-bold">Notifications</div>
        <div className="text-xs text-slate-400 mt-1">إشعارات تسجيل المتبرعين…</div>
      </Card>

      <div className="space-y-3">
        {items.map(n => (
          <Card key={n.id}>
            <div className="text-sm font-semibold">{n.type}</div>
            <div className="text-sm mt-1">{n.message}</div>
            <div className="text-xs text-slate-400 mt-2">{new Date(n.createdAt).toLocaleString()}</div>
          </Card>
        ))}
        {!items.length && <div className="text-sm text-slate-400">No notifications.</div>}
      </div>
    </div>
  );
}
