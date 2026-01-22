import LogoCenter from "@/components/LogoCenter";
import Link from "next/link";

export default function Home() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <LogoCenter />
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-extrabold">GRIFOLS EGYPT HELWAN DC</h1>
        <p className="text-slate-300">System: Plasma Donation Center Management</p>
        <Link href="/login" className="inline-block mt-6 px-5 py-3 rounded-2xl bg-sky-600 hover:bg-sky-500 font-semibold shadow">
          دخول النظام
        </Link>
        <p className="text-xs text-slate-400 mt-6">
          ضع ملف اللوجو الحقيقي بدل <code>public/logo.png</code>.
        </p>
      </div>
    </main>
  );
}
