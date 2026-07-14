import type { ReactNode } from "react";

type BadgeVariant =
  | "neutral"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "vip";

type BadgeProps = {
  children: ReactNode;
  variant?: BadgeVariant;
};

const variantClasses: Record<BadgeVariant, string> = {
  neutral:
    "border-zinc-700 bg-zinc-800 text-zinc-300",

  success:
    "border-green-500/25 bg-green-500/10 text-green-300",

  warning:
    "border-yellow-500/25 bg-yellow-500/10 text-yellow-300",

  danger:
    "border-red-500/25 bg-red-500/10 text-red-300",

  info:
    "border-blue-500/25 bg-blue-500/10 text-blue-300",

  vip:
    "border-yellow-300/30 bg-gradient-to-r from-yellow-500/15 to-amber-300/10 text-yellow-300",
};

export default function Badge({
  children,
  variant = "neutral",
}: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full border",
        "px-3 py-1 text-xs font-bold",
        variantClasses[variant],
      ].join(" ")}
    >
      {children}
    </span>
  );
}