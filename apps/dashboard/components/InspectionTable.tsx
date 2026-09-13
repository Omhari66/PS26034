import Link from "next/link";
import type { InspectionListItem } from "../lib/api";
import { DecisionBadge } from "./DecisionBadge";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function InspectionTable({ items }: { items: InspectionListItem[] }) {
  if (items.length === 0) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "60px 0",
          color: "var(--text-tertiary)",
          fontSize: 15,
        }}
      >
        No inspections found.
      </div>
    );
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: 14,
        }}
      >
        <thead>
          <tr
            style={{
              borderBottom: "1px solid var(--border)",
              color: "var(--text-tertiary)",
              textAlign: "left",
            }}
          >
            {[
              "Date",
              "Inspector",
              "Category",
              "Decision",
              "Status",
              "Rules",
              "",
            ].map((h) => (
              <th
                key={h}
                style={{ padding: "10px 12px", fontWeight: 600, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.5px" }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr
              key={item.inspection_id}
              style={{
                borderBottom: "1px solid var(--border)",
                transition: "background 0.1s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "var(--surface-2)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              <td style={{ padding: "12px 12px", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
                {fmtDate(item.created_at)}
              </td>
              <td style={{ padding: "12px 12px", fontFamily: "var(--font-mono)", fontSize: 12 }}>
                {item.inspector_id}
              </td>
              <td style={{ padding: "12px 12px" }}>
                {item.category ? (
                  <span className="badge badge-cat">{item.category}</span>
                ) : (
                  <span style={{ color: "var(--text-tertiary)" }}>—</span>
                )}
              </td>
              <td style={{ padding: "12px 12px" }}>
                <DecisionBadge decision={item.overall_decision} />
                {item.has_reviews && (
                  <span
                    style={{
                      marginLeft: 6,
                      fontSize: 10,
                      background: "var(--amber-bg)",
                      color: "var(--amber)",
                      padding: "1px 6px",
                      borderRadius: 10,
                    }}
                  >
                    reviewed
                  </span>
                )}
              </td>
              <td style={{ padding: "12px 12px", color: "var(--text-secondary)" }}>
                {item.status}
              </td>
              <td style={{ padding: "12px 12px", color: "var(--text-tertiary)", fontSize: 12 }}>
                {item.rule_version ?? "—"}
              </td>
              <td style={{ padding: "12px 12px" }}>
                <Link
                  href={`/inspections/${item.inspection_id}`}
                  className="btn btn-ghost"
                  style={{ fontSize: 12, padding: "5px 12px" }}
                >
                  View →
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
