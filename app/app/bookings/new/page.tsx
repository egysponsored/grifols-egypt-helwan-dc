"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebaseClient";
import { getMyProfile } from "@/lib/auth";
import type { Donor, UserProfile } from "@/lib/types";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { collection, doc, getDocs, query, runTransaction, where } from "firebase/firestore";
import { useRouter } from "next/navigation";

function todayStr() {
  const d = new Date();
  return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
}

export default function NewBookingPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [donationNumber, setDonationNumber] = useState("");
  const [donor, setDonor] = useState<Donor | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const u = auth.currentUser;
      if (!u) return;
      const p = await getMyProfile(u.uid);
      setProfile(p);
    })();
  }, []);

  async function findDonor() {
    setErr(null); setDonor(null);
    if (!profile) return;
    const dn = donationNumber.trim();
    if (!dn) return;
    const donorsRef = collection(db, "donors");
    const q = profile.role === "AwarenessEmployee"
      ? query(donorsRef, where("donationNumber","==", dn), where("awarenessEmployeeId","==", profile.uid))
      : query(donorsRef, where("donationNumber","==", dn));
    const snap = await getDocs(q);
    if (snap.empty) return setErr("Donor not found (or not in your scope).");
    const d = snap.docs[0];
    setDonor({ id: d.id, ...(d.data() as any) });
  }

  async function createBooking() {
    if (!profile || !donor?.id) return;
    setBusy(true); setErr(null);
    const date = todayStr();
    try {
      const bookingId = await runTransaction(db, async (tx) => {
        const counterRef = doc(db, "counters", `bookings_${date}`);
        const counterSnap = await tx.get(counterRef);
        let used: number[] = [];
        if (counterSnap.exists()) used = (counterSnap.data() as any).usedNumbers || [];
        if (used.length >= 500) throw new Error("Booking numbers exhausted for today.");
        // pick random unused 1..500
        let pick = 1;
        for (let i=0;i<1000;i++){
          const cand = Math.floor(Math.random()*500)+1;
          if (!used.includes(cand)) { pick=cand; break; }
        }
        if (used.includes(pick)) {
          // fallback sequential
          for (let i=1;i<=500;i++){ if (!used.includes(i)) { pick=i; break; } }
        }
        used.push(pick);
        tx.set(counterRef, { usedNumbers: used, updatedAt: Date.now() }, { merge: true });

        const bookingsRef = collection(db, "bookings");
        const newRef = doc(bookingsRef);
        const payload = { bookingId: newRef.id, donationNumber: donor.donationNumber, bookingNumber: pick, bookingDate: date };
        tx.set(newRef, {
          donorId: donor.id,
          donationNumber: donor.donationNumber,
          donorName: donor.fullName,
          bookingDate: date,
          bookingNumber: pick,
          qrPayload: payload,
          createdAt: Date.now(),
          createdByUid: profile.uid,
        });

        return newRef.id;
      });

      router.push(`/app/bookings/${bookingId}`);
    } catch (e: any) {
      setErr(e?.message || "Failed");
    } finally {
      setBusy(false);
    }
  }

  if (!profile) return null;

  return (
    <div className="max-w-2xl space-y-4">
      <Card>
        <div className="text-lg font-bold mb-2">Create Booking</div>
        <div className="text-xs text-slate-400 mb-4">Search donor by donationNumber only.</div>

        <div className="flex gap-2">
          <Input value={donationNumber} onChange={(e)=>setDonationNumber(e.target.value)} placeholder="donationNumber..." />
          <Button onClick={findDonor} className="whitespace-nowrap">Find</Button>
        </div>

        {err && <div className="text-sm text-red-300 mt-2">{err}</div>}

        {donor && (
          <div className="mt-4 rounded-2xl bg-brand-900/40 border border-white/10 p-4">
            <div className="text-sm"><b>{donor.fullName}</b></div>
            <div className="text-xs text-slate-400 mt-1">Donation #: <span className="font-mono">{donor.donationNumber}</span></div>
            <Button onClick={createBooking} disabled={busy} className="mt-3 w-full bg-emerald-600 hover:bg-emerald-500">
              {busy ? "Creating..." : "Create Booking (1-500 QR)"}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
