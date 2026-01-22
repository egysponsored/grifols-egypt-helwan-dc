"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebaseClient";
import { getMyProfile } from "@/lib/auth";
import type { UserProfile } from "@/lib/types";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { addDoc, collection } from "firebase/firestore";
import { useRouter } from "next/navigation";

function genDonationNumber() {
  const now = new Date();
  return (
    "DN-" +
    now.getFullYear().toString().slice(2) +
    (now.getMonth() + 1).toString().padStart(2, "0") +
    now.getDate().toString().padStart(2, "0") +
    "-" +
    Math.random().toString(36).slice(2, 7).toUpperCase()
  );
}

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

export default function NewDonorPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [fullName, setFullName] = useState("");
  const [file, setFile] = useState<File | null>(null);
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

  async function submit() {
    setErr(null);
    if (!profile) return;
    if (!fullName.trim()) return setErr("الاسم الرباعي مطلوب");
    if (!file) return setErr("صورة بطاقة المتبرع مطلوبة");

    setBusy(true);
    try {
      const donationNumber = genDonationNumber();

      // ✅ Upload to Cloudinary بدل Firebase Storage
      const url = await uploadToCloudinary(
        file,
        `grifols/donor_id_cards/${profile.uid}`
      );

      // Create donor record (restricted fields only)
      const donorDoc = await addDoc(collection(db, "donors"), {
        fullName: fullName.trim(),
        idCardImageUrl: url,
        awarenessEmployeeId: profile.uid,
        awarenessEmployeeName: profile.fullName,
        awarenessEmployeeCode: profile.employeeCode,
        donationNumber,
        createdAt: Date.now(),
        status: "registered",
      });

      // Notification to SystemAdmin
      await addDoc(collection(db, "notifications"), {
        type: "donor_registered",
        message: `تم تسجيل متبرع جديد بواسطة: ${profile.fullName} - كود: ${profile.employeeCode}`,
        createdAt: Date.now(),
        readBy: [],
      });

      router.push(`/app/donors/${donorDoc.id}`);
    } catch (e: any) {
      setErr(e?.message || "Failed");
    } finally {
      setBusy(false);
    }
  }

  if (!profile) return null;

  return (
    <div className="max-w-2xl">
      <Card>
        <div className="text-lg font-bold mb-1">Register New Donor</div>
        <div className="text-xs text-slate-400 mb-4">
          النموذج مطابق للمطلوب: (Full Name + ID Card Image) فقط — لا رقم قومي ولا
          هاتف ولا بريد ولا عنوان…
        </div>

        <div className="space-y-3">
          <div>
            <div className="text-xs text-slate-300 mb-1">الاسم الرباعي *</div>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="مثال: أحمد محمد علي محمود"
            />
          </div>

          <div>
            <div className="text-xs text-slate-300 mb-1">صورة بطاقة المتبرع *</div>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-slate-200 file:mr-2 file:rounded-xl file:border-0 file:bg-sky-600 file:px-3 file:py-2 file:text-white file:font-semibold hover:file:bg-sky-500"
            />
          </div>

          <div className="rounded-2xl bg-brand-900/40 border border-white/10 p-3 text-xs text-slate-300">
            يتم ملء بيانات موظف التوعية تلقائيًا: <b>{profile.fullName}</b> — كود:{" "}
            <b>{profile.employeeCode}</b>
          </div>

          {err && <div className="text-sm text-red-300">{err}</div>}

          <Button onClick={submit} disabled={busy} className="w-full">
            {busy ? "Saving..." : "Save Donor"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
