"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { auth, db } from "@/lib/firebaseClient";
import { getMyProfile, isManager } from "@/lib/auth";
import type { Donor, UserProfile, DeferralReason } from "@/lib/types";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { doc, getDoc, onSnapshot, collection, query, orderBy, addDoc, where, getDocs, updateDoc } from "firebase/firestore";

const statuses: Donor["status"][] = ["registered","arrived","donation_completed","not_donated","deferred"];

export default function DonorDetailsPage() {
  const params = useParams<{ id: string }>();
  const donorId = params.id;
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [donor, setDonor] = useState<Donor | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [status, setStatus] = useState<Donor["status"]>("registered");
  const [reasons, setReasons] = useState<DeferralReason[]>([]);
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [metrics, setMetrics] = useState({ hematocrit: "", systolic: "", temperature: "", weight: "" });
  const [note, setNote] = useState("");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const u = auth.currentUser;
      if (!u) return;
      const p = await getMyProfile(u.uid);
      setProfile(p);

      const unsub = onSnapshot(doc(db, "donors", donorId), (snap) => {
        if (!snap.exists()) return;
        const d = { id: snap.id, ...(snap.data() as any) } as Donor;
        setDonor(d);
        setStatus((d.status || "registered") as any);
      });

      const hq = query(collection(db, "donor_status_history"), where("donorId","==", donorId), orderBy("changedAt","desc"));
      const unsubH = onSnapshot(hq, (snap) => {
        const arr: any[] = [];
        snap.forEach(s => arr.push({ id: s.id, ...(s.data() as any) }));
        setHistory(arr);
      });

      const rq = query(collection(db, "deferral_reasons"), where("isActive","==", true), orderBy("code","asc"));
      const rs = await getDocs(rq);
      const rarr: DeferralReason[] = [];
      rs.forEach(r => rarr.push({ id: r.id, ...(r.data() as any) }));
      setReasons(rarr);

      return () => { unsub(); unsubH(); };
    })();
  }, [donorId]);

  const canUpdateStatus = useMemo(() => (profile ? isManager(profile.role) : false), [profile]);

  async function updateStatus() {
    if (!profile || !donor) return;
    setErr(null);
    try {
      // BranchManager & SystemAdmin can update status (continuous entry)
      if (!canUpdateStatus) throw new Error("Forbidden");
      await updateDoc(doc(db, "donors", donorId), {
        status,
        arrivedAt: status === "arrived" ? Date.now() : (donor.arrivedAt || null),
      });

      await addDoc(collection(db, "donor_status_history"), {
        donorId,
        donationNumber: donor.donationNumber,
        status,
        changedAt: Date.now(),
        changedByUid: profile.uid,
        note: note || "",
      });

      // If deferred -> create donor_deferrals with metrics
      if (status === "deferred") {
        if (!selectedReasons.length) throw new Error("اختر سبب/أسباب الـ Deferral");
        await addDoc(collection(db, "donor_deferrals"), {
          donorId,
          donationNumber: donor.donationNumber,
          reasons: selectedReasons,
          hematocrit: metrics.hematocrit ? Number(metrics.hematocrit) : null,
          systolic: metrics.systolic ? Number(metrics.systolic) : null,
          temperature: metrics.temperature ? Number(metrics.temperature) : null,
          weight: metrics.weight ? Number(metrics.weight) : null,
          createdAt: Date.now(),
          createdByUid: profile.uid,
        });
      }
      setNote("");
    } catch (e: any) {
      setErr(e?.message || "Failed");
    }
  }

  if (!profile || !donor) return null;

  return (
    <div className="space-y-4 max-w-4xl">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-lg font-bold">{donor.fullName}</div>
            <div className="text-xs text-slate-400">Donation #: <span className="font-mono text-slate-200">{donor.donationNumber}</span></div>
            <div className="text-xs text-slate-400 mt-1">
              Awareness: {donor.awarenessEmployeeName} ({donor.awarenessEmployeeCode})
            </div>
          </div>
          <div className="rounded-2xl bg-brand-900/40 border border-white/10 p-3 text-xs">
            Status: <b className="text-sky-300">{donor.status || "registered"}</b>
          </div>
        </div>

        <div className="mt-4 grid md:grid-cols-2 gap-4">
          <div className="rounded-2xl bg-brand-900/40 border border-white/10 p-3">
            <div className="text-sm font-semibold mb-2">ID Card Image</div>
            <div className="relative w-full h-64 rounded-2xl overflow-hidden border border-white/10">
              <Image src={donor.idCardImageUrl} alt="ID Card" fill className="object-cover" />
            </div>
          </div>

          <div className="rounded-2xl bg-brand-900/40 border border-white/10 p-3">
            <div className="text-sm font-semibold mb-2">Tracking / Journey</div>

            <div className="text-xs text-slate-400 mb-2">Update status (SystemAdmin/BranchManager only)</div>

            <select
              className="w-full px-3 py-2 rounded-xl bg-brand-800/60 border border-white/10"
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              disabled={!canUpdateStatus}
            >
              {statuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            {status === "deferred" && (
              <div className="mt-3 space-y-2">
                <div className="text-xs text-slate-300">Deferral Reasons *</div>
                <div className="flex flex-wrap gap-2">
                  {reasons.map(r => (
                    <label key={r.id} className={"text-xs px-3 py-2 rounded-xl border cursor-pointer " + (selectedReasons.includes(r.title) ? "bg-sky-600/30 border-sky-500/50" : "bg-transparent border-white/10")}>
                      <input
                        type="checkbox"
                        className="ml-2"
                        checked={selectedReasons.includes(r.title)}
                        onChange={(e) => {
                          setSelectedReasons((prev) => e.target.checked ? [...prev, r.title] : prev.filter(x => x !== r.title));
                        }}
                        disabled={!canUpdateStatus}
                      />
                      {r.code} — {r.title}
                    </label>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div><div className="text-xs text-slate-300 mb-1">hematocrit</div><Input value={metrics.hematocrit} onChange={e=>setMetrics(m=>({...m, hematocrit:e.target.value}))} disabled={!canUpdateStatus} /></div>
                  <div><div className="text-xs text-slate-300 mb-1">systolic</div><Input value={metrics.systolic} onChange={e=>setMetrics(m=>({...m, systolic:e.target.value}))} disabled={!canUpdateStatus} /></div>
                  <div><div className="text-xs text-slate-300 mb-1">temperature</div><Input value={metrics.temperature} onChange={e=>setMetrics(m=>({...m, temperature:e.target.value}))} disabled={!canUpdateStatus} /></div>
                  <div><div className="text-xs text-slate-300 mb-1">weight</div><Input value={metrics.weight} onChange={e=>setMetrics(m=>({...m, weight:e.target.value}))} disabled={!canUpdateStatus} /></div>
                </div>
              </div>
            )}

            <div className="mt-3">
              <div className="text-xs text-slate-300 mb-1">Note (optional)</div>
              <Input value={note} onChange={(e) => setNote(e.target.value)} disabled={!canUpdateStatus} />
            </div>

            {err && <div className="text-sm text-red-300 mt-2">{err}</div>}

            <Button onClick={updateStatus} disabled={!canUpdateStatus} className="w-full mt-3">
              Save Status
            </Button>

            {!canUpdateStatus && (
              <div className="text-xs text-slate-400 mt-2">موظف التوعية لا يغير الحالة.</div>
            )}
          </div>
        </div>
      </Card>

      <Card>
        <div className="text-lg font-bold mb-2">Status Timeline</div>
        <div className="space-y-2">
          {history.map(h => (
            <div key={h.id} className="rounded-2xl bg-brand-900/40 border border-white/10 p-3 text-sm">
              <div className="flex justify-between gap-3 flex-wrap">
                <div className="font-semibold">{h.status}</div>
                <div className="text-xs text-slate-400">{new Date(h.changedAt).toLocaleString()}</div>
              </div>
              {h.note && <div className="text-xs text-slate-300 mt-1">{h.note}</div>}
            </div>
          ))}
          {!history.length && <div className="text-sm text-slate-400">No history yet.</div>}
        </div>
      </Card>
    </div>
  );
}
