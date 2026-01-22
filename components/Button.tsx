import { PropsWithChildren } from "react";

export function Button(props: PropsWithChildren<{ onClick?: () => void; type?: "button"|"submit"; disabled?: boolean; className?: string }>) {
  const { children, className="", ...rest } = props;
  return (
    <button
      className={"px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 disabled:hover:bg-sky-600 transition text-white font-semibold shadow " + className}
      {...rest}
    >
      {children}
    </button>
  );
}
