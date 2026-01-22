"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@/lib/types";

const baseLinks = [
  { href: "/app", label: "Dashboard" },
  { href: "/app/donors", label: "Donors" },
  { href: "/app/bookings", label: "Bookings" },
  { href: "/app/education", label: "Education" },
  { href: "/app/scan", label: "Scan QR" },
  { href: "/app/attendance", label: "Attendance" },
  { href: "/app/employees", label: "Employees" },
  { href: "/app/notifications", label: "Notifications" },
  { href: "/app/search", label: "Search" },
  { href: "/app/export", label: "Export Excel" },
];

function allowed(role: Role, href: string) {
  if (role === "AwarenessEmployee") {
    if (href.startsWith("/app/employees")) return false;
    if (href.startsWith("/app/export")) return false;
    return true;
  }
  if (role === "BranchManager") {
    // can view employees but cannot edit base details (handled in UI per page)
    return true;
  }
  return true;
}

export default function Nav({ role }: { role: Role }) {
  const path = usePathname();
  return (
    <nav className="flex flex-wrap gap-2 text-sm">
      {baseLinks.filter(l => allowed(role, l.href)).map(l => (
        <Link
          key={l.href}
          href={l.href}
          className={
            "px-3 py-2 rounded-xl border border-white/10 hover:bg-brand-800/60 " +
            (path === l.href ? "bg-brand-800/70" : "bg-transparent")
          }
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
