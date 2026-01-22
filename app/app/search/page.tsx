"use client";

import { useEffect, useMemo, useState } from "react";
import { auth, db } from "@/lib/firebaseClient";
import { getMyProfile } from "@/lib/auth";
import type { UserProfile } from "@/lib/types";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { collection, getDocs, limit, query, where } from "firebase/firestore";

type Result = { type: string; id: string; label: string; meta?: string };

export default function SearchPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [text, setText] = useState("");
  const [entity, setEntity] = useState("all");
  const [results, setResults] = useState<Result[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const u = auth.currentUser;
      if (!u) return;
      const p = await getMyProfile(u.uid);
      setProfile(p);
    })();
  }, []);

  async function runSearch() {
    if (!profile) return;
    setErr(null);
    const qtext = text.trim();
    if (!qtext) return setResults([]);

    const out: Result[] = [];
    const awarenessScope = profile.role === "AwarenessEmployee";

    async function searchDonors() {
      // donor search by donationNumber only (requirement)
      const ref = collection(db, "donors");
      let q = query(ref, where("donationNumber", ">=", qtext), where("donationNumber", "<=", qtext + ""), limit(20));
      const snap = await getDocs(q);
      snap.forEach(d => {
        const data = d.data() as any;
        if (awarenessScope && data.awarenessEmployeeId !== profile.uid) return;
        out.push({ type: "donor", id: d.id, label: `${data.donationNumber} — ${data.fullName}` });
      });
    }

    async function searchBookings() {
      const ref = collection(db, "bookings");
      const snap = await getDocs(query(ref, where("donationNumber", ">=", qtext), where("donationNumber", "<=", qtext + ""), limit(20)));
      snap.forEach(d => {
        const data = d.data() as any;
        if (awarenessScope && data.createdByUid !== profile.uid) return;
        out.push({ type: "booking", id: d.id, label: `${data.donationNumber} — ${data.donorName}`, meta: `#${data.bookingNumber} ${data.bookingDate}` });
      });
    }

    async function searchEmployees() {
      if (awarenessScope) return; // awareness cannot search all employees
      const ref = collection(db, "users");
      const snap = await getDocs(query(ref, where("employeeCode", ">=", qtext), where("employeeCode", "<=", qtext + ""), limit(20)));
      snap.forEach(d => {
        const data = d.data() as any;
        out.push({ type: "employee", id: d.id, label: `${data.employeeCode} — ${data.fullName}`, meta: data.role });
      });
    }

    try {
      if (entity === "all" || entity === "donors") await searchDonors();
      if (entity === "all" || entity === "bookings") await searchBookings();
      if (entity === "all" || entity === "employees") await searchEmployees();
      setResults(out);
    } catch (e: any) {
      setErr(e?.message || "Search failed");
    }
  }

  if (!profile) return null;

  return (
    <div className="space-y-4 max-w-5xl">
      <Card>
        <div className="text-lg font-bold">Global Search</div>
        <div className="text-xs text-slate-400 mt-1">
          SystemAdmin/BranchManager: بحث في الكل • AwarenessEmployee: يبحث في متبرعيه فقط.
        </div>

        <div className="grid md:grid-cols-3 gap-2 mt-3">
          <Input value={text} onChange={(e)=>setText(e.target.value)} placeholder="Search (donationNumber / employeeCode)..." />
          <select className="px-3 py-2 rounded-xl bg-brand-800/60 border border-white/10" value={entity} onChange={e=>setEntity(e.target.value)}>
            <option value="all">All</option>
            <option value="donors">Donors</option>
            <option value="bookings">Bookings</option>
            <option value="employees">Employees</option>
          </select>
          <button onClick={runSearch} className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 font-semibold shadow">Search</button>
        </div>
        {err && <div className="text-sm text-red-300 mt-2">{err}</div>}
      </Card>

      <Card>
        <div className="space-y-2">
          {results.map((r, idx) => (
            <div key={idx} className="rounded-2xl bg-brand-900/40 border border-white/10 p-3">
              <div className="text-sm font-semibold">{r.type.toUpperCase()}</div>
              <div className="text-sm">{r.label}</div>
              {r.meta && <div className="text-xs text-slate-400 mt-1">{r.meta}</div>}
            </div>
          ))}
          {!results.length && <div className="text-sm text-slate-400">No results.</div>}
        </div>
      </Card>
    </div>
  );
}
