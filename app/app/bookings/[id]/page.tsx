"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { auth, db } from "@/lib/firebaseClient";
import { getMyProfile } from "@/lib/auth";
import type { Booking, UserProfile } from "@/lib/types";
import { Card } from "@/components/Card";
import { doc, onSnapshot } from "firebase/firestore";

export default function BookingDetailsPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [booking, setBooking] = useState<Booking | null>(null);

  useEffect(() => {
    let unsub: (() => void) | null = null;

    (async () => {
      const u = auth.currentUser;
      if (!u) return;

      const p = await getMyProfile(u.uid);
      setProfile(p);

      unsub = onSnapshot(doc(db, "bookings", id), (snap) => {
        if (!snap.exists()) return;
        const b = { id: snap.id, ...(snap.data() as any) } as Booking;
        setBooking(b);
      });
    })();

    return () => {
      if (unsub) unsub();
    };
  }, [id]);

  if (!profile || !booking) return null;

  return (
    <div className="max-w-3xl space-y-4">
      <Card>
        <div className="text-lg font-bold">Booking Details</div>
        <div className="text-xs text-slate-400 mt-1">
          عرض بيانات الحجز فقط (تم إزالة QR نهائيًا لتفادي مشاكل build على Vercel).
        </div>

        <div className="mt-4 grid md:grid-cols-2 gap-4 items-start">
          <div className="rounded-2xl bg-brand-900/40 border border-white/10 p-4">
            <div className="text-sm">
              <b>{booking.donorName}</b>
            </div>

            <div className="text-xs text-slate-400 mt-2">
              Donation #: <span className="font-mono">{booking.donationNumber}</span>
            </div>

            <div className="text-xs text-slate-400 mt-1">
              Booking #: <span className="font-mono">{booking.bookingNumber}</span>
            </div>

            <div className="text-xs text-slate-400 mt-1">
              Date: <span className="font-mono">{booking.bookingDate}</span>
            </div>

            <div className="mt-3 text-xs text-slate-300">Payload:</div>
            <pre className="mt-1 text-xs bg-black/30 rounded-2xl p-3 overflow-auto border border-white/10">
              {JSON.stringify(booking.qrPayload, null, 2)}
            </pre>
          </div>

          <div className="rounded-2xl bg-white p-4 text-black">
            <div className="text-center font-bold mb-2">Ticket</div>
            <div className="text-sm text-center">
              QR تم إزالته مؤقتًا/نهائيًا.
            </div>
            <div className="text-center text-xs mt-3">GRIFOLS EGYPT HELWAN DC</div>
          </div>
        </div>

        <div className="text-xs text-slate-400 mt-4">
          للطباعة: استخدم Print من المتصفح (Ctrl+P).
        </div>
      </Card>
    </div>
  );
}
