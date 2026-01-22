"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { auth, db } from "@/lib/firebaseClient";
import { getMyProfile } from "@/lib/auth";
import type { Donor, UserProfile } from "@/lib/types";
import { collection, onSnapshot, query, where, orderBy } from "firebase/firestore";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";

export default function DonorsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [donors, setDonors] = useState<Donor[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    (async () => {
      const u = auth.currentUser;
      if (!u) {
        setLoading(false);
        return;
      }

      const p = await getMyProfile(u.uid);
      setProfile(p);

      const donorsRef = collection(db, "donors");
      const q =
        p.role === "AwarenessEmployee"
          ? query(
              donorsRef,
              where("awarenessEmployeeId", "==", p.uid),
              orderBy("createdAt", "desc")
            )
          : query(donorsRef, orderBy("createdAt", "desc"));

      unsubscribe = onSnapshot(
        q,
        (snap) => {
          const arr: Donor[] = [];
          snap.forEach((d) => arr.push({ id: d.id, ...(d.data() as any) }));
          setDonors(arr);
          setLoading(false);
        },
        (err) => {
          console.error("Firestore error:", err);
          setLoading(false);
        }
      );
    })();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const filtered = useMemo(() => {
    const s = search.trim();
    if (!s) return donors;
    return donors.filter((d) => (d.donationNumber || "").includes(s));
  }, [donors, search]);

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="text-lg font-bold">Donors</div>
            <div className="text-xs text-slate-400">
              Search by donation number only
            </div>
          </div>
          <Link
            href="/app/donors/new"
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 font-semibold shadow"
          >
            Register Donor
          </Link>
        </div>

        <div className="mt-3">
          <Input
            placeholder="Search donation number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </Card>

      <Card>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="text-slate-300">
              <tr className="border-b border-white/10">
                <th className="text-right p-2">Donation #</th>
                <th className="text-right p-2">Full Name</th>
                <th className="text-right p-2">Status</th>
                <th className="text-right p-2">Awareness</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-slate-400">
                    Loading...
                  </td>
                </tr>
              )}

              {!loading &&
                filtered.map((d) => (
                  <tr
                    key={d.id}
                    className="border-b border-white/5 hover:bg-white/5"
                  >
                    <td className="p-2 font-mono">{d.donationNumber}</td>
                    <td className="p-2">
                      <Link
                        href={`/app/donors/${d.id}`}
                        className="underline decoration-white/20 hover:decoration-white/50"
                      >
                        {d.fullName}
                      </Link>
                    </td>
                    <td className="p-2">{d.status || "registered"}</td>
                    <td className="p-2 text-xs text-slate-300">
                      {d.awarenessEmployeeName} ({d.awarenessEmployeeCode})
                    </td>
                  </tr>
                ))}

              {!loading && !filtered.length && (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-slate-400">
                    No data
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {profile?.role === "AwarenessEmployee" && (
        <div className="text-xs text-slate-400">
          ⚠️ أنت ترى متبرعيك فقط (Row Level Access)
        </div>
      )}
    </div>
  );
}
