"use client";

import { useEffect, useMemo, useState } from "react";
import { auth, db } from "@/lib/firebaseClient";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import type { UserProfile } from "@/lib/types";
import { getMyProfile } from "@/lib/auth";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import Link from "next/link";

type Stats = { donated: number; notDonated: number; deferred: number; total: number };

export default function Dashboard() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<Stats>({ donated: 0, notDonated: 0, deferred: 0, total: 0 });

  useEffect(() => {
    (async () => {
      const u = auth.currentUser;
      if (!u) return;
      const p = await getMyProfile(u.uid);
      setProfile(p);
      const donorsRef = collection(db, "donors");
      const q = p.role === "AwarenessEmployee" ? query(donorsRef, where("awarenessEmployeeId", "==", p.uid)) : query(donorsRef);
      return onSnapshot(q, (snap) => {
        let donated=0, notDonated=0, deferred=0, total=0;
        snap.forEach(d => {
          total++;
          const s = (d.data() as any).status;
          if (s === "donation_completed") donated++;
          else if (s === "not_donated") notDonated++;
          else if (s === "deferred") deferred++;
        });
        setStats({ donated, notDonated, deferred, total });
      });
    })();
  }, []);

  const cards = useMemo(() => ([
    { label: "Total my donors / total donors", value: stats.total },
    { label: "Donation (Accepted)", value: stats.donated },
    { label: "Not Donated", value: stats.notDonated },
    { label: "Deferred", value: stats.deferred },
  ]), [stats]);

  if (!profile) return null;

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <Card>
        <div className="text-lg font-bold mb-2">Quick Actions</div>
        <div className="flex flex-wrap gap-2">
          <Link href="/app/donors/new"><Button>Register Donor</Button></Link>
          <Link href="/app/bookings/new"><Button className="bg-emerald-600 hover:bg-emerald-500">Create Booking</Button></Link>
          <Link href="/app/scan"><Button className="bg-violet-600 hover:bg-violet-500">Scan QR</Button></Link>
        </div>
        <div className="text-xs text-slate-400 mt-3">
          ملاحظة: تحديث الإحصائيات لحظي عبر Firestore realtime.
        </div>
      </Card>
      <Card>
        <div className="text-lg font-bold mb-3">Awareness Live Reports</div>
        <div className="grid grid-cols-2 gap-3">
          {cards.map((c) => (
            <div key={c.label} className="rounded-2xl bg-brand-900/40 border border-white/10 p-4">
              <div className="text-2xl font-extrabold">{c.value}</div>
              <div className="text-xs text-slate-300 mt-1">{c.label}</div>
            </div>
          ))}
        </div>
        {profile.role !== "AwarenessEmployee" && (
          <div className="text-xs text-slate-400 mt-3">
            كمدير: هذه الإحصائيات تعرض كل المتبرعين.
          </div>
        )}
      </Card>
    </div>
  );
}
