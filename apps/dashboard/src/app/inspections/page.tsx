"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { api } from "../../lib/api";
import { InspectionListItem } from "../../lib/types";
import { DecisionBadge } from "../../components/DecisionBadge";
import {
  Filter,
  Search,
  RefreshCw,
  FileCheck2,
  ArrowRight,
  ShieldCheck,
  Package,
  Sparkles,
  User,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Tag,
} from "lucide-react";

function InspectionsListContent() {
  const searchParams = useSearchParams();
  const initialDecision = searchParams.get("decision") || "";

  const [inspections, setInspections] = useState<InspectionListItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [decisionFilter, setDecisionFilter] = useState<string>(initialDecision);
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInspections = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getInspections({
        decision: decisionFilter || undefined,
        category: categoryFilter || undefined,
        limit: 50,
      });
      setInspections(res.items);
      setTotal(res.total);
    } catch (err: any) {
      setError(err.message || "Failed to fetch inspections");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInspections();
  }, [decisionFilter, categoryFilter]);

  return (
    <div className="space-y-7 max-w-7xl mx-auto pb-12 select-none">
      {/* Executive Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-zinc-950 via-[#0b0c16] to-zinc-950 border border-white/15 p-7 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.85)]">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-wrap items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-mono font-extrabold text-amber-300 bg-amber-500/10 px-3 py-0.5 rounded-full uppercase tracking-wider border border-amber-500/30 flex items-center gap-1.5 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                Inspection Registry & Audit Queue
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Inspections Queue & Verification Matrix
            </h1>
            <p className="text-xs text-zinc-400 mt-1.5 font-medium max-w-2xl">
              Filter submitted packaging compliance audits, inspect dual-OCR extracted declarations, and log supervisor overrides.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchInspections}
              className="p-3 bg-[#07070b] border border-zinc-800 rounded-2xl text-zinc-300 hover:text-white hover:border-zinc-700 transition-all shadow-inner active:scale-95 flex items-center gap-2 text-xs font-bold"
              title="Refresh Directory"
            >
              <RefreshCw className={`w-4 h-4 text-amber-400 ${loading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh Directory</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modern Filter Control Toolbar */}
      <div className="bg-[#09090d]/90 border border-zinc-800/90 rounded-3xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-xl backdrop-blur-xl">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-zinc-400 px-2">
            <Filter className="w-4 h-4 text-amber-400" />
            <span>Filters:</span>
          </div>

          {/* Segmented Decision Pill Selector */}
          <div className="flex items-center gap-1 bg-[#121218] p-1 rounded-2xl border border-zinc-800">
            {[
              { id: "", label: "All State" },
              { id: "REVIEW", label: "REVIEW Queue" },
              { id: "PASS", label: "PASS" },
              { id: "FAIL", label: "FAIL" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setDecisionFilter(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  decisionFilter === tab.id
                    ? "bg-zinc-800 text-white shadow-md font-extrabold border border-zinc-700/80"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-800/40"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Category Dropdown Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-[#121218] border border-zinc-800 rounded-2xl px-4 py-2 text-xs font-bold text-zinc-200 focus:outline-none focus:border-zinc-600 transition-colors cursor-pointer"
          >
            <option value="">All Product Categories</option>
            <option value="packaged_food">Packaged Food</option>
            <option value="cosmetics">Cosmetics</option>
            <option value="medical_devices">Medical Devices</option>
            <option value="drugs_and_pharma">Drugs & Pharma</option>
          </select>
        </div>

        {/* Counter Badge */}
        <div className="text-xs font-mono text-zinc-400 bg-[#121218] px-3.5 py-1.5 rounded-xl border border-zinc-800/80 ml-auto">
          Showing <strong className="text-white font-bold">{inspections.length}</strong> of{" "}
          <strong className="text-white font-bold">{total}</strong> records
        </div>
      </div>

      {/* Directory Data Matrix Table */}
      <div className="bg-[#09090d]/90 border border-zinc-800/90 rounded-3xl p-6 shadow-2xl overflow-hidden backdrop-blur-xl">
        {loading ? (
          <div className="text-center py-20 text-zinc-400 text-xs font-semibold flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-amber-400" />
            <span className="font-mono">Fetching active inspection records...</span>
          </div>
        ) : error ? (
          <div className="text-center py-16 text-rose-400 text-xs font-semibold">
            {error}
          </div>
        ) : inspections.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <FileCheck2 className="w-12 h-12 text-zinc-700 mx-auto" />
            <p className="text-white text-sm font-bold">No inspection records match your filters</p>
            <p className="text-xs text-zinc-400">Try adjusting your decision state or product category filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-800/90 text-zinc-400 uppercase font-mono font-bold text-[10px] tracking-wider">
                  <th className="pb-3.5 px-4">Inspection ID</th>
                  <th className="pb-3.5 px-4">Product Category</th>
                  <th className="pb-3.5 px-4">Inspector ID</th>
                  <th className="pb-3.5 px-4">Rule Engine</th>
                  <th className="pb-3.5 px-4">Decision Outcome</th>
                  <th className="pb-3.5 px-4">Audit Governance</th>
                  <th className="pb-3.5 px-4 text-right">Created Date</th>
                  <th className="pb-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 font-medium">
                {inspections.map((item) => (
                  <tr key={item.inspection_id} className="hover:bg-zinc-800/40 transition-colors group">
                    <td className="py-4 px-4 font-mono font-bold text-white">
                      <Link href={`/inspections/${item.inspection_id}`} className="hover:text-amber-400 transition-colors flex items-center gap-2">
                        <Package className="w-4 h-4 text-zinc-500 group-hover:text-amber-400 transition-colors" />
                        <span>{item.inspection_id}</span>
                      </Link>
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-800/60 text-zinc-200 capitalize font-semibold border border-zinc-700/50">
                        <Tag className="w-3 h-3 text-zinc-400" />
                        {item.category?.replace(/_/g, " ") || "Unassigned"}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-zinc-400 font-mono text-[11px] flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-zinc-500" />
                      <span>{item.inspector_id}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-mono text-[11px] text-emerald-300 font-bold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30">
                        v{item.rule_version || "1.0"}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <DecisionBadge decision={item.overall_decision} size="sm" />
                    </td>
                    <td className="py-4 px-4">
                      {item.has_reviews ? (
                        <span className="text-[10px] font-mono font-extrabold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/40 shadow-[0_0_8px_rgba(245,158,11,0.15)]">
                          Supervisor Overridden
                        </span>
                      ) : (
                        <span className="text-[10px] text-zinc-400 font-mono px-2 py-0.5 rounded bg-zinc-800/40 border border-zinc-700/40">
                          Original Decision
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-right text-zinc-400 font-mono text-[11px]">
                      {new Date(item.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <Link
                        href={`/inspections/${item.inspection_id}`}
                        className="inline-flex items-center gap-1.5 text-xs font-black text-black hover:text-black px-4 py-1.5 rounded-xl bg-gradient-to-r from-zinc-100 to-zinc-300 hover:from-white hover:to-zinc-200 transition-all shadow-md active:scale-95 group-hover:shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                      >
                        <span>Inspect</span>
                        <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function InspectionsPage() {
  return (
    <Suspense
      fallback={
        <div className="text-center py-20 text-zinc-400 text-xs font-semibold flex items-center justify-center gap-2 font-mono">
          <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
          Loading inspection queue...
        </div>
      }
    >
      <InspectionsListContent />
    </Suspense>
  );
}


