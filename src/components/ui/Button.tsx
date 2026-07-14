import type {
  ButtonHTMLAttributes,
  ReactNode,
} from "react";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "danger"
  | "success"
  | "ghost";

type ButtonSize = "small" | "medium" | "large";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  icon?: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-yellow-400 text-black hover:bg-yellow-300 border-yellow-400 shadow-lg shadow-yellow-400/10",

  secondary:
    "bg-zinc-950 text-zinc-200 border-zinc-800 hover:bg-zinc-900 hover:border-zinc-700",

  danger:
    "bg-red-500/10 text-red-300 border-red-500/30 hover:bg-red-500/20",

  success:
    "bg-green-500/10 text-green-300 border-green-500/30 hover:bg-green-500/20",

  ghost:
    "bg-transparent text-zinc-400 border-transparent hover:bg-zinc-900 hover:text-white",
};

const sizeClasses: Record<ButtonSize, string> = {
  small: "min-h-10 px-3 py-2 text-sm rounded-xl",
  medium: "min-h-12 px-5 py-3 text-sm rounded-xl",
  large: "min-h-14 px-6 py-3 text-base rounded-2xl",
};

export default function Button({
  children,
  icon,
  variant = "primary",
  size = "medium",
  fullWidth = false,
  loading = false,
  disabled,
  className = "",
  type = "button",
  ...properties
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={[
        "inline-flex items-center justify-center gap-2 border font-bold",
        "transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2",
        "focus-visible:ring-yellow-400/50 focus-visible:ring-offset-2",
        "focus-visible:ring-offset-[#050505]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "active:scale-[0.98]",
        variantClasses[variant],
        sizeClasses[size],
        fullWidth ? "w-full" : "",
        className,
      ].join(" ")}
      {...properties}
    >
      {loading ? (
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        icon
      )}

      <span>{loading ? "Wird verarbeitet..." : children}</span>
    </button>
  );
}