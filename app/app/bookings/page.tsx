"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { auth, db } from "@/lib/firebaseClient";
import { getMyProfile } from "@/lib/auth";
import type { Booking, UserProfile } from "@/lib/types";
import { Card } from "@/components/Card";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";

export default function BookingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [items, setItems] = useState<Booking[]>([]);

  useEffect(() => {
    (async () => {
      const u = auth.currentUser;
      if (!u) return;
      const p = await getMyProfile(u.uid);
      setProfile(p);
      const ref = collection(db, "bookings");
      const q = p.role === "AwarenessEmployee"
        ? query(ref, where("createdByUid","==", p.uid), orderBy("createdAt","desc"))
        : query(ref, orderBy("createdAt","desc"));
      return onSnapshot(q, (snap) => {
        const arr: Booking[] = [];
        snap.forEach(d => arr.push({ id: d.id, ...(d.data() as any) }));
        setItems(arr);
      });
    })();
  }, []);

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="text-lg font-bold">Bookings</div>
            <div className="text-xs text-slate-400">عرض رقم التبرع + الاسم فقط (حسب المطلوب).</div>
          </div>
          <Link href="/app/bookings/new" className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-semibold shadow">
            Create Booking
          </Link>
        </div>
      </Card>

      <Card>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="text-slate-300">
              <tr className="border-b border-white/10">
                <th className="text-right p-2">Donation #</th>
                <th className="text-right p-2">Name</th>
                <th className="text-right p-2">Booking #</th>
                <th className="text-right p-2">Date</th>
                <th className="text-right p-2">QR</th>
              </tr>
            </thead>
            <tbody>
              {items.map((b) => (
                <tr key={b.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="p-2 font-mono">{b.donationNumber}</td>
                  <td className="p-2">{b.donorName}</td>
                  <td className="p-2 font-mono">{b.bookingNumber}</td>
                  <td className="p-2 font-mono">{b.bookingDate}</td>
                  <td className="p-2">
                    <Link href={`/app/bookings/${b.id}`} className="underline decoration-white/20 hover:decoration-white/50">View</Link>
                  </td>
                </tr>
              ))}
              {!items.length && <tr><td colSpan={5} className="p-6 text-center text-slate-400">No bookings</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
