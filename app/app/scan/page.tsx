"use client";

import { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { auth, db } from "@/lib/firebaseClient";
import { getMyProfile } from "@/lib/auth";
import type { UserProfile } from "@/lib/types";
import { Card } from "@/components/Card";
import { doc, getDoc, updateDoc, addDoc, collection } from "firebase/firestore";

export default function ScanPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [msg, setMsg] = useState<string>("");
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    (async () => {
      const u = auth.currentUser;
      if (!u) return;
      const p = await getMyProfile(u.uid);
      setProfile(p);
    })();
  }, []);

  useEffect(() => {
    if (!profile) return;
    const elId = "qr-reader";
    if (scannerRef.current) return;

    const scanner = new Html5QrcodeScanner(elId, { fps: 10, qrbox: 250 }, false);
    scanner.render(async (decodedText) => {
      try {
        const payload = JSON.parse(decodedText);
        const bookingId = payload.bookingId as string;
        const bookingRef = doc(db, "bookings", bookingId);
        const bookingSnap = await getDoc(bookingRef);
        if (!bookingSnap.exists()) throw new Error("Invalid booking.");
        const booking = bookingSnap.data() as any;

        const donorId = booking.donorId as string;
        await updateDoc(doc(db, "donors", donorId), {
          status: "arrived",
          arrivedAt: Date.now(),
        });

        await addDoc(collection(db, "donor_status_history"), {
          donorId,
          donationNumber: booking.donationNumber,
          status: "arrived",
          changedAt: Date.now(),
          changedByUid: profile.uid,
          note: "Arrived via QR scan",
        });

        setMsg(`✅ Arrived confirmed for donationNumber: ${booking.donationNumber} (Booking #${booking.bookingNumber})`);
      } catch (e: any) {
        setMsg("❌ " + (e?.message || "Scan error"));
      }
    }, (err) => {
      // ignore scan errors
    });

    scannerRef.current = scanner;
    return () => {
      try { scanner.clear(); } catch {}
      scannerRef.current = null;
    };
  }, [profile]);

  return (
    <div className="max-w-3xl space-y-4">
      <Card>
        <div className="text-lg font-bold">Scan QR</div>
        <div className="text-xs text-slate-400 mt-1">عند المسح: تحديث حالة المتبرع إلى arrived + تسجيل وقت الوصول.</div>
      </Card>

      <Card>
        <div id="qr-reader" className="w-full" />
        {msg && <div className="mt-3 text-sm">{msg}</div>}
      </Card>
    </div>
  );
}
