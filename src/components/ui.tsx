import type { ReactNode } from "react";

export function Card({ title, aside, children }: { title?: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className="min-w-0 rounded-xl border border-line bg-surface p-5">
      {(title || aside) && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          {title && <h2 className="text-base font-semibold">{title}</h2>}
          {aside}
        </div>
      )}
      {children}
    </section>
  );
}

export function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="min-w-0">
      <div className="text-sm text-ink-secondary">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
      {note && <div className="mt-0.5 text-xs text-ink-muted">{note}</div>}
    </div>
  );
}

const STATUS_STYLES = {
  good: { icon: "✓", className: "bg-good text-on-accent" },
  warning: { icon: "!", className: "bg-warning text-black" },
  critical: { icon: "!", className: "bg-critical text-on-accent" },
};

/** A status colour never stands alone: it always comes with an icon and a label. */
export function StatusBadge({ kind, children }: { kind: keyof typeof STATUS_STYLES; children: ReactNode }) {
  const { icon, className } = STATUS_STYLES[kind];
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-ink-secondary">
      <span
        aria-hidden
        className={`flex size-4 items-center justify-center rounded-full text-[11px] font-bold ${className}`}
      >
        {icon}
      </span>
      {children}
    </span>
  );
}

export function Notice({ kind, children }: { kind: "warning" | "critical"; children: ReactNode }) {
  return (
    <div role="status" className="flex items-start gap-2 rounded-lg bg-wash px-3 py-2 text-sm text-ink-secondary">
      <span
        aria-hidden
        className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${STATUS_STYLES[kind].className}`}
      >
        !
      </span>
      <span>{children}</span>
    </div>
  );
}

export const BUTTON_CLASS =
  "rounded-lg bg-accent px-3 py-2 text-sm font-medium text-on-accent hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50";
