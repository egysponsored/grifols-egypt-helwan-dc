"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebaseClient";
import { getMyProfile, canExport } from "@/lib/auth";
import type { UserProfile } from "@/lib/types";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";

const entities = [
  { key: "donors", label: "Donors" },
  { key: "donor_status_history", label: "Tracking / Status History" },
  { key: "donor_deferrals", label: "Deferrals" },
  { key: "bookings", label: "Bookings" },
  { key: "attendance", label: "Attendance" },
  { key: "users", label: "Employees (SystemAdmin only)" },
];

export default function ExportPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    (async () => {
      const u = auth.currentUser;
      if (!u) return;
      const p = await getMyProfile(u.uid);
      setProfile(p);
    })();
  }, []);

  async function exportEntity(key: string) {
    if (!profile) return;
    setMsg("");
    const token = await auth.currentUser?.getIdToken();
    const res = await fetch(`/api/export/${key}`, { headers: { authorization: `Bearer ${token}` } });
    if (!res.ok) {
      setMsg("Failed: " + (await res.text()));
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${key}.xlsx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setMsg("✅ Exported " + key);
  }

  if (!profile) return null;

  if (!canExport(profile.role)) {
    return (
      <div className="max-w-2xl">
        <Card>
          <div className="text-lg font-bold">Export Excel</div>
          <div className="text-sm text-slate-300 mt-2">غير مسموح لموظف التوعية.</div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-3xl">
      <Card>
        <div className="text-lg font-bold">Export Excel</div>
        <div className="text-xs text-slate-400 mt-1">مسموح لـ SystemAdmin و BranchManager فقط.</div>
        {msg && <div className="text-sm mt-2">{msg}</div>}
      </Card>

      <div className="grid md:grid-cols-2 gap-3">
        {entities.map(e => (
          <Card key={e.key}>
            <div className="text-sm font-semibold">{e.label}</div>
            <Button
              onClick={() => exportEntity(e.key)}
              className="mt-3 w-full"
              disabled={profile.role !== "SystemAdmin" && e.key === "users"}
            >
              Export
            </Button>
            {e.key === "users" && profile.role !== "SystemAdmin" && (
              <div className="text-xs text-slate-400 mt-2">Employees export: SystemAdmin only.</div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
