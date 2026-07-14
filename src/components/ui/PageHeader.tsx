import type { ReactNode } from "react";

type PageHeaderProps = {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: ReactNode;
};

export default function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: PageHeaderProps) {
  return (
    <div className="mb-8 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
      <div>
        <p className="mb-2 font-semibold text-yellow-400">
          {eyebrow}
        </p>

        <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
          {title}
        </h1>

        {description && (
          <p className="mt-2 max-w-3xl leading-7 text-zinc-400">
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          {actions}
        </div>
      )}
    </div>
  );
}