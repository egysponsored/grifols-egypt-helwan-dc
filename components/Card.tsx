import { PropsWithChildren } from "react";

export function Card({ children }: PropsWithChildren) {
  return <div className="rounded-3xl bg-brand-800/40 border border-white/10 shadow p-5">{children}</div>;
}
