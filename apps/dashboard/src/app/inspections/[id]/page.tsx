"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "../../../lib/api";
import { InspectionReport, InspectionImageMeta, ReviewRecordOut, RuleResult } from "../../../lib/types";
import { DecisionBadge } from "../../../components/DecisionBadge";
import { BoundingBoxViewer } from "../../../components/BoundingBoxViewer";
import { ReviewModal } from "../../../components/ReviewModal";
import { AuditTrail } from "../../../components/AuditTrail";
import {
  ArrowLeft,
  ShieldCheck,
  UserCheck,
  AlertTriangle,
  FileCheck2,
  Calendar,
  Layers,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  XCircle,
} from "lucide-react";

export default function InspectionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [report, setReport] = useState<InspectionReport | null>(null);
  const [images, setImages] = useState<InspectionImageMeta[]>([]);
  const [reviews, setReviews] = useState<ReviewRecordOut[]>([]);
  const [activeField, setActiveField] = useState<string | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);

      const [repData, imgData, auditData] = await Promise.all([
        api.getInspection(id),
        api.getInspectionImages(id).catch(() => []),
        api.getAuditTrail(id).catch(() => null),
      ]);

      setReport(repData);
      setImages(imgData);
      if (auditData) {
        setReviews(auditData.reviews || []);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load inspection detail");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin text-zinc-900" />
        <p className="text-zinc-500 text-sm font-semibold">Loading Legal Metrology report #{id?.substring(0, 8)}...</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="space-y-4 max-w-lg mx-auto py-12 text-center">
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-400 text-sm">
          {error || "Inspection report not found"}
        </div>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 bg-white text-black font-extrabold rounded-xl text-xs hover:bg-zinc-200"
        >
          Go Back
        </button>
      </div>
    );
  }

  // Calculate summary metrics
  const latestReview = reviews.length > 0 ? reviews[reviews.length - 1] : null;
  const effectiveDecision = latestReview ? latestReview.overridden_decision : report.overall_decision;
  const totalFields = report.field_results.length;
  const passFields = report.field_results.filter((f) => f.decision === "PASS").length;
  const reviewFields = report.field_results.filter((f) => f.decision === "REVIEW").length;
  const failFields = report.field_results.filter((f) => f.decision === "FAIL").length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
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
                <h1 className="text-2xl font-black text-white tracking-wide capitalize">
                  {report.category.replace(/_/g, " ")} Compliance Audit
                </h1>
                <DecisionBadge decision={effectiveDecision} size="sm" />
              </div>
              <p className="text-xs text-zinc-400 font-mono mt-1 flex items-center gap-2">
                <span>Inspection #{report.inspection_id}</span>
                <span>•</span>
                <span>Product: <strong className="text-white font-bold">{report.product_id}</strong></span>
                <span>•</span>
                <span>Rule Ver: <strong className="text-emerald-400 font-bold">v{report.rule_version}</strong></span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsReviewModalOpen(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black font-black rounded-2xl text-xs tracking-wide shadow-[0_0_25px_rgba(245,158,11,0.3)] hover:scale-105 transition-all"
            >
              <UserCheck className="w-4 h-4 text-black" />
              <span>Supervisor Override / Review</span>
            </button>
          </div>
        </div>

        {/* Executive Quick Telemetry Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-zinc-800/80 relative z-10">
          <div className="bg-[#07070b]/90 border border-zinc-800/80 p-3.5 rounded-2xl flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-300">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-zinc-400 font-mono font-bold uppercase">Total Fields</div>
              <div className="text-sm font-black text-white">{totalFields} Evaluated</div>
            </div>
          </div>

          <div className="bg-[#07070b]/90 border border-emerald-500/20 p-3.5 rounded-2xl flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-emerald-400/80 font-mono font-bold uppercase">Verified PASS</div>
              <div className="text-sm font-black text-emerald-400">{passFields} Compliant</div>
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
              <FileCheck2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <div className="text-[10px] text-zinc-400 font-mono font-bold uppercase">Audit Status</div>
              <div className="text-sm font-black text-white">
                {reviews.length > 0 ? `${reviews.length} Override(s)` : "Original Decision"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Task 1 Deliverable: Bounding Box Overlay Viewer */}
      <BoundingBoxViewer
        images={images}
        fieldResults={report.field_results}
        activeField={activeField}
        onSelectField={(f) => setActiveField(f)}
      />

      {/* Grid: Detailed Evaluated Field Results + Audit Trail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Evaluated Rule Results List */}
        <div className="lg:col-span-2 bg-[#09090d]/90 border border-zinc-800/90 rounded-3xl p-6 shadow-2xl space-y-4 backdrop-blur-xl">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
            <div className="flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-amber-400" />
              <h3 className="text-lg font-bold text-white">Evaluated Rule Results ({report.field_results.length})</h3>
            </div>
            <span className="text-xs text-zinc-400 font-mono">Pure Deterministic Dispatch Engine</span>
          </div>

          <div className="space-y-3">
            {report.field_results.map((rr: RuleResult) => {
              const isSelected = activeField === rr.field_name;

              return (
                <div
                  key={rr.rule_id + rr.field_name}
                  onClick={() => setActiveField(rr.field_name)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-zinc-800/80 border-zinc-500 shadow-md"
                      : "bg-[#09090d] border-zinc-800 hover:border-zinc-700"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-black bg-white px-2 py-0.5 rounded font-black">
                          {rr.rule_id}
                        </span>
                        <h4 className="font-bold text-sm text-white capitalize">
                          {rr.field_name.replace(/_/g, " ")}
                        </h4>
                      </div>
                      <p className="text-xs text-zinc-300 mt-2 font-medium leading-relaxed">{rr.reason}</p>
                    </div>
                    <DecisionBadge decision={rr.decision} size="sm" />
                  </div>

                  {/* Evidence Breakdown pill */}
                  {rr.evidence && (
                    <div className="mt-3 pt-3 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-400">
                      <div className="flex items-center gap-2">
                        <span>Extracted:</span>
                        <code className="bg-zinc-900 px-2 py-0.5 rounded text-white font-mono font-bold border border-zinc-800">
                          {rr.evidence.value || "N/A"}
                        </code>
                      </div>

                      <div className="flex items-center gap-3 font-mono text-[11px]">
                        {rr.evidence.ocr_confidence !== undefined && rr.evidence.ocr_confidence !== null && (
                          <span>Conf: {(rr.evidence.ocr_confidence * 100).toFixed(0)}%</span>
                        )}
                        {rr.evidence.bbox && (
                          <span className="text-zinc-500">[{rr.evidence.bbox.join(",")}]</span>
                        )}
                        <span className="text-zinc-400 uppercase">{rr.evidence.state}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Append-Only Audit Log Column */}
        <AuditTrail
          originalDecision={report.overall_decision}
          ruleVersion={report.rule_version}
          reviews={reviews}
        />
      </div>

      {/* Supervisor Review Modal */}
      <ReviewModal
        inspectionId={report.inspection_id}
        currentDecision={effectiveDecision}
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        onSuccess={loadData}
      />
    </div>
  );
}

