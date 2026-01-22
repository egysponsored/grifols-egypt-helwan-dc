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
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  useEffect(() => {
    (async () => {
      const u = auth.currentUser;
      if (!u) return;
      const p = await getMyProfile(u.uid);
      setProfile(p);

      const unsub = onSnapshot(doc(db, "bookings", id), async (snap) => {
        if (!snap.exists()) return;
        const b = { id: snap.id, ...(snap.data() as any) } as Booking;
        setBooking(b);
        const payloadStr = JSON.stringify(b.qrPayload);

// ✅ Dynamic import to avoid TS types issue on build
const QRCode = (await import("qrcode")).default;

const url = await QRCode.toDataURL(payloadStr, { margin: 1, scale: 8 });
setQrDataUrl(url);

      });

      return () => unsub();
    })();
  }, [id]);

  if (!profile || !booking) return null;

  return (
    <div className="max-w-3xl space-y-4">
      <Card>
        <div className="text-lg font-bold">Booking Ticket</div>
        <div className="text-xs text-slate-400 mt-1">QR يحتوي: bookingId / donationNumber / bookingNumber</div>

        <div className="mt-4 grid md:grid-cols-2 gap-4 items-start">
          <div className="rounded-2xl bg-brand-900/40 border border-white/10 p-4">
            <div className="text-sm"><b>{booking.donorName}</b></div>
            <div className="text-xs text-slate-400 mt-1">Donation #: <span className="font-mono">{booking.donationNumber}</span></div>
            <div className="text-xs text-slate-400 mt-1">Booking #: <span className="font-mono">{booking.bookingNumber}</span></div>
            <div className="text-xs text-slate-400 mt-1">Date: <span className="font-mono">{booking.bookingDate}</span></div>

            <div className="mt-3 text-xs text-slate-300">QR Payload:</div>
            <pre className="mt-1 text-xs bg-black/30 rounded-2xl p-3 overflow-auto border border-white/10">{JSON.stringify(booking.qrPayload, null, 2)}</pre>
          </div>

          <div className="rounded-2xl bg-white p-4 text-black">
            <div className="text-center font-bold mb-2">Scan Me</div>
            {qrDataUrl ? <img src={qrDataUrl} alt="QR Code" className="mx-auto" /> : <div>Loading QR…</div>}
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
