import Image from "next/image";

export default function LogoCenter() {
  return (
    <div className="w-full flex items-center justify-center py-10">
      <div className="relative w-28 h-28 rounded-3xl bg-brand-800/60 shadow-lg border border-white/10 flex items-center justify-center">
        <Image src="/logo.png" alt="GRIFOLS EGYPT HELWAN DC" fill className="object-contain p-4" priority />
      </div>
    </div>
  );
}
