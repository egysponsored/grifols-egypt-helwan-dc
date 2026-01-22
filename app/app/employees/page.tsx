"use client";

import { useEffect, useMemo, useState } from "react";
import { auth, db } from "@/lib/firebaseClient";
import { getMyProfile, isAdmin, isManager } from "@/lib/auth";
import type { Role, UserProfile } from "@/lib/types";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { collection, onSnapshot, orderBy, query, addDoc, doc, updateDoc } from "firebase/firestore";

type Emp = {
  uid: string;
  fullName: string;
  employeeCode: string;
  role: Role;
  isActive?: boolean;
  photoURL?: string;
};

async function uploadToCloudinary(file: File, folder: string) {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("folder", folder);

  const res = await fetch("/api/upload", {
    method: "POST",
    body: fd,
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  const data = await res.json();
  return data.url as string;
}

export default function EmployeesPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [employees, setEmployees] = useState<Emp[]>([]);
  const [search, setSearch] = useState("");
  const [newEmp, setNewEmp] = useState({
    uid: "",
    fullName: "",
    employeeCode: "",
    role: "AwarenessEmployee" as Role,
  });

  useEffect(() => {
    let unsub: (() => void) | null = null;

    (async () => {
      const u = auth.currentUser;
      if (!u) return;
      const p = await getMyProfile(u.uid);
      setProfile(p);

      const q = query(collection(db, "users"), orderBy("employeeCode", "asc"));
      unsub = onSnapshot(q, (snap) => {
        const arr: Emp[] = [];
        snap.forEach((d) => arr.push({ uid: d.id, ...(d.data() as any) }));
        setEmployees(arr);
      });
    })();

    return () => {
      if (unsub) unsub();
    };
  }, []);

  const stats = useMemo(() => {
    const total = employees.length;
    const active = employees.filter((e) => e.isActive !== false).length;
    const awareness = employees.filter((e) => e.role === "AwarenessEmployee").length;
    return { total, active, awareness };
  }, [employees]);

  const filtered = useMemo(() => {
    const s = search.trim();
    if (!s) return employees;
    // search by employeeCode ONLY (per requirement)
    return employees.filter((e) => (e.employeeCode || "").includes(s));
  }, [employees, search]);

  async function addEmployeeProfile() {
    if (!profile || !isAdmin(profile.role)) return;
    if (!newEmp.uid || !newEmp.fullName || !newEmp.employeeCode) return;

    await updateDoc(doc(db, "users", newEmp.uid), {
      fullName: newEmp.fullName.trim(),
      employeeCode: newEmp.employeeCode.trim(),
      role: newEmp.role,
      isActive: true,
    } as any);

    setNewEmp({ uid: "", fullName: "", employeeCode: "", role: "AwarenessEmployee" as Role });
  }

  async function uploadEmployeeDoc(empUid: string, file: File, docType: string) {
    if (!profile || !isManager(profile.role)) return;

    const url = await uploadToCloudinary(file, `grifols/employee_documents/${empUid}`);

    await addDoc(collection(db, "employees_documents"), {
      employeeId: empUid,
      docType,
      url,
      uploadedAt: Date.now(),
      uploadedByUid: profile.uid,
    });

    alert("Uploaded");
  }

  async function updateMyPhoto(file: File) {
    if (!profile) return;

    // employees can edit ONLY their photo
    const url = await uploadToCloudinary(file, `grifols/employee_photos/${profile.uid}`);

    await updateDoc(doc(db, "users", profile.uid), { photoURL: url } as any);
    alert("Profile photo updated");
  }

  if (!profile) return null;

  return (
    <div className="space-y-4 max-w-6xl">
      <Card>
        <div className="text-lg font-bold">Employees</div>
        <div className="text-xs text-slate-400 mt-1">بحث بالكود فقط (employeeCode).</div>

        <div className="grid md:grid-cols-3 gap-3 mt-4">
          <div className="rounded-2xl bg-brand-900/40 border border-white/10 p-4">
            <div className="text-2xl font-extrabold">{stats.total}</div>
            <div className="text-xs text-slate-300 mt-1">إجمالي الموظفين</div>
          </div>
          <div className="rounded-2xl bg-brand-900/40 border border-white/10 p-4">
            <div className="text-2xl font-extrabold">{stats.active}</div>
            <div className="text-xs text-slate-300 mt-1">موظفين نشطين</div>
          </div>
          <div className="rounded-2xl bg-brand-900/40 border border-white/10 p-4">
            <div className="text-2xl font-extrabold">{stats.awareness}</div>
            <div className="text-xs text-slate-300 mt-1">موظف توعية</div>
          </div>
        </div>

        <div className="mt-4">
          <Input placeholder="Search employeeCode..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <div className="mt-4 rounded-2xl bg-brand-900/40 border border-white/10 p-4">
          <div className="text-sm font-semibold">My Profile Photo (only editable field for employee)</div>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) updateMyPhoto(f);
            }}
            className="block w-full text-sm text-slate-200 file:mr-2 file:rounded-xl file:border-0 file:bg-sky-600 file:px-3 file:py-2 file:text-white file:font-semibold hover:file:bg-sky-500 mt-2"
          />
        </div>
      </Card>

      {isAdmin(profile.role) && (
        <Card>
          <div className="text-sm font-semibold mb-2">Add / Update Employee Profile (SystemAdmin only)</div>
          <div className="text-xs text-slate-400 mb-3">
            Create user in Firebase Auth أولاً، ثم ضع UID هنا لإنشاء users/{`{uid}`}.
          </div>
          <div className="grid md:grid-cols-4 gap-2">
            <Input placeholder="uid" value={newEmp.uid} onChange={(e) => setNewEmp((s) => ({ ...s, uid: e.target.value }))} />
            <Input placeholder="fullName" value={newEmp.fullName} onChange={(e) => setNewEmp((s) => ({ ...s, fullName: e.target.value }))} />
            <Input
              placeholder="employeeCode"
              value={newEmp.employeeCode}
              onChange={(e) => setNewEmp((s) => ({ ...s, employeeCode: e.target.value }))}
            />
            <select
              className="px-3 py-2 rounded-xl bg-brand-800/60 border border-white/10"
              value={newEmp.role}
              onChange={(e) => setNewEmp((s) => ({ ...s, role: e.target.value as Role }))}
            >
              <option value="SystemAdmin">SystemAdmin</option>
              <option value="BranchManager">BranchManager</option>
              <option value="AwarenessEmployee">AwarenessEmployee</option>
            </select>
          </div>
          <Button onClick={addEmployeeProfile} className="mt-3">
            Save
          </Button>
        </Card>
      )}

      <Card>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="text-slate-300">
              <tr className="border-b border-white/10">
                <th className="text-right p-2">Code</th>
                <th className="text-right p-2">Name</th>
                <th className="text-right p-2">Role</th>
                <th className="text-right p-2">Docs</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr key={e.uid} className="border-b border-white/5 hover:bg-white/5">
                  <td className="p-2 font-mono">{e.employeeCode}</td>
                  <td className="p-2">{e.fullName}</td>
                  <td className="p-2">{e.role}</td>
                  <td className="p-2">
                    {isManager(profile.role) ? (
                      <div className="flex flex-wrap gap-2 items-center">
                        <label className="text-xs px-3 py-2 rounded-xl bg-white/10 border border-white/10 cursor-pointer">
                          Upload ID
                          <input type="file" className="hidden" onChange={(ev) => { const f = ev.target.files?.[0]; if (f) uploadEmployeeDoc(e.uid, f, "id_card"); }} />
                        </label>
                        <label className="text-xs px-3 py-2 rounded-xl bg-white/10 border border-white/10 cursor-pointer">
                          Upload Background Check
                          <input type="file" className="hidden" onChange={(ev) => { const f = ev.target.files?.[0]; if (f) uploadEmployeeDoc(e.uid, f, "criminal_check"); }} />
                        </label>
                        <label className="text-xs px-3 py-2 rounded-xl bg-white/10 border border-white/10 cursor-pointer">
                          Upload University
                          <input type="file" className="hidden" onChange={(ev) => { const f = ev.target.files?.[0]; if (f) uploadEmployeeDoc(e.uid, f, "university_cert"); }} />
                        </label>
                        <label className="text-xs px-3 py-2 rounded-xl bg-white/10 border border-white/10 cursor-pointer">
                          Upload Military
                          <input type="file" className="hidden" onChange={(ev) => { const f = ev.target.files?.[0]; if (f) uploadEmployeeDoc(e.uid, f, "military_cert"); }} />
                        </label>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">No access</span>
                    )}
                  </td>
                </tr>
              ))}
              {!filtered.length && (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-slate-400">
                    No employees
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {profile.role === "BranchManager" && (
          <div className="text-xs text-slate-400 mt-3">
            BranchManager: عرض + إضافة ملفات فقط (بدون تعديل بيانات الموظف الأساسية).
          </div>
        )}
      </Card>
    </div>
  );
}
