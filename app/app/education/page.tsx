"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebaseClient";
import { getMyProfile, isManager } from "@/lib/auth";
import type { EducationMaterial, UserProfile } from "@/lib/types";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { addDoc, collection, onSnapshot, orderBy, query, updateDoc, doc, deleteDoc } from "firebase/firestore";

export default function EducationPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [items, setItems] = useState<EducationMaterial[]>([]);
  const [form, setForm] = useState({ type: "article", title: "", body: "", url: "" });

  useEffect(() => {
    (async () => {
      const u = auth.currentUser;
      if (!u) return;
      const p = await getMyProfile(u.uid);
      setProfile(p);
      const q = query(collection(db, "educationMaterials"), orderBy("updatedAt", "desc"));
      return onSnapshot(q, (snap) => {
        const arr: EducationMaterial[] = [];
        snap.forEach(d => arr.push({ id: d.id, ...(d.data() as any) }));
        setItems(arr);
      });
    })();
  }, []);

  const canCrud = profile ? isManager(profile.role) : false;

  async function addItem() {
    if (!canCrud) return;
    if (!form.title.trim()) return;
    await addDoc(collection(db, "educationMaterials"), {
      type: form.type,
      title: form.title.trim(),
      body: form.body.trim(),
      url: form.url.trim(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    setForm({ type: "article", title: "", body: "", url: "" });
  }

  async function saveItem(id: string, patch: Partial<EducationMaterial>) {
    if (!canCrud) return;
    await updateDoc(doc(db, "educationMaterials", id), { ...patch, updatedAt: Date.now() } as any);
  }

  async function removeItem(id: string) {
    if (!canCrud) return;
    await deleteDoc(doc(db, "educationMaterials", id));
  }

  if (!profile) return null;

  return (
    <div className="space-y-4 max-w-5xl">
      <Card>
        <div className="text-lg font-bold">Education Materials</div>
        <div className="text-xs text-slate-400 mt-1">CRUD كامل للمدير/المدير الفرع + قراءة للجميع.</div>
      </Card>

      {canCrud && (
        <Card>
          <div className="text-sm font-semibold mb-3">Add New</div>
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-slate-300 mb-1">Type</div>
              <select className="w-full px-3 py-2 rounded-xl bg-brand-800/60 border border-white/10" value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))}>
                <option value="article">Article</option>
                <option value="faq">FAQ</option>
                <option value="video">Video</option>
                <option value="image">Image</option>
              </select>
            </div>
            <div>
              <div className="text-xs text-slate-300 mb-1">Title</div>
              <Input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} />
            </div>
            <div className="md:col-span-2">
              <div className="text-xs text-slate-300 mb-1">Body (optional)</div>
              <textarea className="w-full min-h-24 px-3 py-2 rounded-xl bg-brand-800/60 border border-white/10" value={form.body} onChange={e=>setForm(f=>({...f,body:e.target.value}))} />
            </div>
            <div className="md:col-span-2">
              <div className="text-xs text-slate-300 mb-1">URL (optional)</div>
              <Input value={form.url} onChange={e=>setForm(f=>({...f,url:e.target.value}))} placeholder="https://..." />
            </div>
          </div>
          <Button onClick={addItem} className="mt-3">Add</Button>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {items.map((it) => (
          <Card key={it.id}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-sm font-bold">{it.title}</div>
                <div className="text-xs text-slate-400">{it.type}</div>
              </div>
              {canCrud && <Button onClick={() => removeItem(it.id!)} className="bg-red-600 hover:bg-red-500">Delete</Button>}
            </div>

            {it.url && <a href={it.url} target="_blank" className="text-xs block mt-2 underline decoration-white/20 hover:decoration-white/50">Open URL</a>}
            {it.body && <div className="text-sm text-slate-200 mt-3 whitespace-pre-wrap">{it.body}</div>}

            {canCrud && (
              <div className="mt-4 space-y-2">
                <div className="text-xs text-slate-300">Quick Edit Title</div>
                <Input defaultValue={it.title} onBlur={(e)=>saveItem(it.id!, { title: e.target.value })} />
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
