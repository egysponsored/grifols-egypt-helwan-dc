"use client";

import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebaseClient";
import { Button } from "./Button";
import type { UserProfile } from "@/lib/types";

export default function Topbar({ profile }: { profile: UserProfile }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <div className="text-xl font-bold">GRIFOLS EGYPT HELWAN DC</div>
        <div className="text-xs text-slate-300">
          {profile.fullName} • {profile.employeeCode} • <span className="text-sky-300">{profile.role}</span>
        </div>
      </div>
      <Button onClick={() => signOut(auth)} className="bg-white/10 hover:bg-white/15 text-slate-100">
        Logout
      </Button>
    </div>
  );
}
