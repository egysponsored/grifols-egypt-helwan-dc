"use client";

import { useEffect, useMemo, useState } from "react";
import { auth, db } from "@/lib/firebaseClient";
import { getMyProfile, isManager } from "@/lib/auth";
import type { Attendance, UserProfile } from "@/lib/types";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { addDoc, collection, onSnapshot, orderBy, query, where, updateDoc, doc } from "firebase/firestore";

function getLocation(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error("Geolocation not supported"));
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 15000 }
    );
  });
}

export default function AttendancePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [items, setItems] = useState<Attendance[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const u = auth.currentUser;
      if (!u) return;
      const p = await getMyProfile(u.uid);
      setProfile(p);

      const ref = collection(db, "attendance");
      const q = p.role === "AwarenessEmployee"
        ? query(ref, where("employeeId","==", p.uid), orderBy("start.ts","desc"))
        : query(ref, orderBy("start.ts","desc"));

      return onSnapshot(q, (snap) => {
        const arr: Attendance[] = [];
        snap.forEach(d => arr.push({ id: d.id, ...(d.data() as any) }));
        setItems(arr);
      });
    })();
  }, []);

  const openShift = useMemo(() => items.find(a => !a.end), [items]);

  async function startShift() {
    if (!profile) return;
    setBusy(true); setErr(null);
    try {
      const loc = await getLocation();
      await addDoc(collection(db, "attendance"), {
        employeeId: profile.uid,
        employeeName: profile.fullName,
        employeeCode: profile.employeeCode,
        start: { ts: Date.now(), ...loc },
      });
    } catch (e: any) {
      setErr(e?.message || "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function endShift() {
    if (!profile || !openShift?.id) return;
    setBusy(true); setErr(null);
    try {
      const loc = await getLocation();
      await updateDoc(doc(db, "attendance", openShift.id), {
        end: { ts: Date.now(), ...loc },
      });
    } catch (e: any) {
      setErr(e?.message || "Failed");
    } finally {
      setBusy(false);
    }
  }

  if (!profile) return null;

  return (
    <div className="space-y-4 max-w-5xl">
      <Card>
        <div className="text-lg font-bold">Attendance</div>
        <div className="text-xs text-slate-400 mt-1">
          عند الحضور/الانصراف يتم طلب Location وتخزين (lat,lng,timestamp).
        </div>
        <div className="flex gap-2 mt-3 flex-wrap">
          <Button onClick={startShift} disabled={busy || !!openShift} className="bg-emerald-600 hover:bg-emerald-500">
            Start Shift
          </Button>
          <Button onClick={endShift} disabled={busy || !openShift} className="bg-amber-600 hover:bg-amber-500">
            End Shift
          </Button>
        </div>
        {err && <div className="text-sm text-red-300 mt-2">{err}</div>}
        {profile.role === "AwarenessEmployee" && (
          <div className="text-xs text-slate-400 mt-2">أنت ترى حضورك فقط.</div>
        )}
      </Card>

      <Card>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="text-slate-300">
              <tr className="border-b border-white/10">
                <th className="text-right p-2">Employee</th>
                <th className="text-right p-2">Start</th>
                <th className="text-right p-2">Start Location</th>
                <th className="text-right p-2">End</th>
                <th className="text-right p-2">End Location</th>
              </tr>
            </thead>
            <tbody>
              {items.map(a => (
                <tr key={a.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="p-2 text-xs">{a.employeeName} ({a.employeeCode})</td>
                  <td className="p-2 text-xs">{new Date(a.start.ts).toLocaleString()}</td>
                  <td className="p-2 text-xs font-mono">{a.start.lat.toFixed(5)}, {a.start.lng.toFixed(5)}</td>
                  <td className="p-2 text-xs">{a.end?.ts ? new Date(a.end.ts).toLocaleString() : "—"}</td>
                  <td className="p-2 text-xs font-mono">{a.end ? `${a.end.lat.toFixed(5)}, ${a.end.lng.toFixed(5)}` : "—"}</td>
                </tr>
              ))}
              {!items.length && <tr><td colSpan={5} className="p-6 text-center text-slate-400">No data</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
