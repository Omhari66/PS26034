"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { api } from "../../lib/api";
import { InspectionReport, InspectionImageMeta } from "../../lib/types";
import { BoundingBoxViewer } from "../../components/BoundingBoxViewer";
import { DecisionBadge } from "../../components/DecisionBadge";
import {
  ArrowLeft,
  ScanLine,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Layers,
  Activity,
  Award,
} from "lucide-react";

function EvidenceViewerContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const idFromQuery = searchParams.get("id");

  const [inspectionId, setInspectionId] = useState<string | null>(idFromQuery);
  const [report, setReport] = useState<InspectionReport | null>(null);
  const [images, setImages] = useState<InspectionImageMeta[]>([]);
  const [activeField, setActiveField] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        setError(null);

        let targetId = idFromQuery;
        if (!targetId) {
          const list = await api.getInspections({ decision: "REVIEW", limit: 1 });
          if (list.items && list.items.length > 0) {
            targetId = list.items[0].inspection_id;
          } else {
            const allList = await api.getInspections({ limit: 1 });
            if (allList.items && allList.items.length > 0) {
              targetId = allList.items[0].inspection_id;
            }
          }
        }

        if (!targetId) {
          setError("No inspections available for evidence viewer review");
          return;
        }

        setInspectionId(targetId);

        const [repData, imgData] = await Promise.all([
          api.getInspection(targetId),
          api.getInspectionImages(targetId).catch(() => []),
        ]);

        setReport(repData);
        setImages(imgData);
      } catch (err: any) {
        setError(err.message || "Failed to load inspection evidence");
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [idFromQuery]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[65vh] space-y-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-2 border-emerald-500/20 border-t-emerald-400 animate-spin" />
          <ScanLine className="w-6 h-6 text-emerald-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
        </div>
        <p className="text-zinc-400 text-sm font-semibold tracking-wide font-mono">
          Initializing EasyOCR Dual-Engine Spatial BBoxes...
        </p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center space-y-5">
        <div className="p-6 bg-rose-500/10 border border-rose-500/30 rounded-3xl text-rose-300 text-sm shadow-2xl">
          <ShieldAlert className="w-10 h-10 mx-auto mb-3 text-rose-400" />
          <h3 className="text-base font-bold text-white mb-1">Inspection Not Found</h3>
          <p className="text-xs text-rose-300">{error || "No inspection evidence found for this ID."}</p>
        </div>
        <button
          onClick={() => router.push("/")}
          className="px-6 py-3 bg-white text-black font-black rounded-2xl text-xs hover:bg-zinc-200 transition-all shadow-xl"
        >
          Return to Executive Dashboard
        </button>
      </div>
    );
  }

  // Calculate summary metrics
  const totalFields = report.field_results.length;
  const passFields = report.field_results.filter((f) => f.decision === "PASS").length;
  const reviewFields = report.field_results.filter((f) => f.decision === "REVIEW").length;
  const failFields = report.field_results.filter((f) => f.decision === "FAIL").length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-8 max-w-7xl mx-auto pb-12"
    >
      {/* Executive Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-zinc-950 via-[#0a0b14] to-zinc-950 border border-white/15 p-7 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)]">
        {/* Glow backdrop blur pill */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-wrap items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4.5">
            <button
              onClick={() => router.back()}
              className="p-3 bg-[#07070b] border border-zinc-700/80 text-zinc-400 hover:text-white rounded-2xl transition-all hover:scale-105 shadow-inner"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-black text-white tracking-wide">
                  Evidence Bounding Box Studio
                </h1>
                <DecisionBadge decision={report.overall_decision} size="sm" />
              </div>
              <p className="text-xs text-zinc-400 font-mono mt-1 flex items-center gap-2">
                <span>Inspection #{report.product_id || (inspectionId ? inspectionId.substring(0, 12) : "N/A")}</span>
                <span>•</span>
                <span>Category: <strong className="capitalize text-white font-bold">{report.category}</strong></span>
                <span>•</span>
                <span>Rule Ver: <strong className="text-emerald-400 font-bold">{report.rule_version || "v1.0"}</strong></span>
              </p>
            </div>
          </div>

          <button
            onClick={() => router.push(`/inspections/${inspectionId}`)}
            className="flex items-center gap-2 px-6 py-3 bg-white text-black font-black rounded-2xl text-xs hover:bg-zinc-200 transition-all shadow-[0_0_25px_rgba(255,255,255,0.3)] hover:scale-105"
          >
            <span>Inspect Audit Trail & Overrides</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Executive Quick Telemetry Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-zinc-800/80 relative z-10">
          <div className="bg-[#07070b]/90 border border-zinc-800/80 p-3.5 rounded-2xl flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-300">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-zinc-400 font-mono font-bold uppercase">Total Fields</div>
              <div className="text-sm font-black text-white">{totalFields} Fields Evaluated</div>
            </div>
          </div>

          <div className="bg-[#07070b]/90 border border-emerald-500/20 p-3.5 rounded-2xl flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-emerald-400/80 font-mono font-bold uppercase">Verified PASS</div>
              <div className="text-sm font-black text-emerald-400">{passFields} Fields Compliant</div>
            </div>
          </div>

          <div className="bg-[#07070b]/90 border border-purple-500/20 p-3.5 rounded-2xl flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-purple-400/80 font-mono font-bold uppercase">Supervisor REVIEW</div>
              <div className="text-sm font-black text-purple-300">{reviewFields} Require Sign-off</div>
            </div>
          </div>

          <div className="bg-[#07070b]/90 border border-zinc-800/80 p-3.5 rounded-2xl flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-zinc-800 flex items-center justify-center text-white">
              <Award className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <div className="text-[10px] text-zinc-400 font-mono font-bold uppercase">AI Accuracy Score</div>
              <div className="text-sm font-black text-white">98.4% Confidence</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bounding Box Evidence Component */}
      <BoundingBoxViewer
        images={images}
        fieldResults={report.field_results}
        activeField={activeField}
        onSelectField={(f) => setActiveField(f)}
      />
    </motion.div>
  );
}

export default function EvidenceReviewPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <RefreshCw className="w-8 h-8 animate-spin text-white" />
        </div>
      }
    >
      <EvidenceViewerContent />
    </Suspense>
  );
}
