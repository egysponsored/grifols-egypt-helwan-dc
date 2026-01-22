"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebaseClient";
import { getMyProfile } from "@/lib/auth";
import type { UserProfile } from "@/lib/types";
import Topbar from "@/components/Topbar";
import Nav from "@/components/Nav";
import { Card } from "@/components/Card";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (u) => {
      if (!u) {
        router.replace("/login");
        return;
      }
      try {
        const p = await getMyProfile(u.uid);
        setProfile(p);
      } catch (e: any) {
        setErr(e?.message || "Profile error");
      }
    });
    return () => unsub();
  }, [router]);

  if (err) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-10">
        <Card>
          <div className="text-red-300">{err}</div>
          <div className="text-xs text-slate-400 mt-2">تأكد من وجود users/{'{uid}'} في Firestore.</div>
        </Card>
      </main>
    );
  }

  if (!profile) return <main className="px-4 py-10 text-center text-slate-300">Loading…</main>;

  return (
    <main className="max-w-6xl mx-auto px-4 py-6 space-y-4">
      <Topbar profile={profile} />
      <Nav role={profile.role} />
      <div className="pt-2">{children}</div>
    </main>
  );
}
