"use client";

import { useEffect, useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebaseClient";
import { useRouter } from "next/navigation";
import LogoCenter from "@/components/LogoCenter";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => {
      if (u) router.replace("/app");
    });
    return () => unsub();
  }, [router]);

  return (
    <main className="max-w-md mx-auto px-4 py-10">
      <LogoCenter />
      <Card>
        <h2 className="text-xl font-bold mb-4 text-center">تسجيل الدخول</h2>
        <div className="space-y-3">
          <div>
            <div className="text-xs text-slate-300 mb-1">Email</div>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" />
          </div>
          <div>
            <div className="text-xs text-slate-300 mb-1">Password</div>
            <Input value={pass} onChange={(e) => setPass(e.target.value)} type="password" placeholder="••••••••" />
          </div>
          {err && <div className="text-sm text-red-300">{err}</div>}
          <Button
            onClick={async () => {
              setErr(null);
              try {
                await signInWithEmailAndPassword(auth, email, pass);
                router.replace("/app");
              } catch (e: any) {
                setErr(e?.message || "Login failed");
              }
            }}
            className="w-full"
          >
            دخول
          </Button>
        </div>
        <div className="mt-4 text-xs text-slate-400 leading-relaxed">
          الحسابات تُنشأ من SystemAdmin داخل Firebase Auth + users collection.
        </div>
      </Card>
    </main>
  );
}
