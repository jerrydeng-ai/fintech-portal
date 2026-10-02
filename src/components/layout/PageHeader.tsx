import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  eyebrow,
  actions,
}: {
  title: string;
  description?: ReactNode;
  eyebrow?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <div className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">{eyebrow}</div>}
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
        {description && <p className="mt-1 max-w-3xl text-sm text-slate-600">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
