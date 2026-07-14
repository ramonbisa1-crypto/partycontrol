import type {
  HTMLAttributes,
  ReactNode,
} from "react";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  hover?: boolean;
  padding?: "none" | "small" | "medium" | "large";
};

const paddingClasses = {
  none: "",
  small: "p-4",
  medium: "p-5 sm:p-6",
  large: "p-6 sm:p-8",
};

export default function Card({
  children,
  hover = false,
  padding = "medium",
  className = "",
  ...properties
}: CardProps) {
  return (
    <div
      className={[
        "app-card",
        hover ? "app-card-hover" : "",
        paddingClasses[padding],
        className,
      ].join(" ")}
      {...properties}
    >
      {children}
    </div>
  );
}