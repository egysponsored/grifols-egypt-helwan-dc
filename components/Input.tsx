import { InputHTMLAttributes } from "react";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  const { className="", ...rest } = props;
  return (
    <input
      className={"w-full px-3 py-2 rounded-xl bg-brand-800/60 border border-white/10 focus:outline-none focus:ring-2 focus:ring-sky-500 " + className}
      {...rest}
    />
  );
}
