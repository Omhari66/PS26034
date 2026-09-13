"use client";
import type { Decision } from "../lib/api";

const MAP: Record<
  Decision,
  { label: string; cls: string; icon: string }
> = {
  PASS: { label: "PASS", cls: "badge-pass", icon: "✓" },
  FAIL: { label: "FAIL", cls: "badge-fail", icon: "✗" },
  REVIEW: { label: "REVIEW", cls: "badge-review", icon: "?" },
  NOT_APPLICABLE: { label: "N/A", cls: "badge-na", icon: "—" },
  CATEGORY_NOT_SUPPORTED: { label: "UNSUPPORTED", cls: "badge-na", icon: "—" },
};

export function DecisionBadge({
  decision,
}: {
  decision: Decision | null | undefined;
}) {
  if (!decision) return <span className="badge badge-na">—</span>;
  const { label, cls, icon } = MAP[decision] ?? MAP.NOT_APPLICABLE;
  return (
    <span className={`badge ${cls}`}>
      {icon} {label}
    </span>
  );
}
