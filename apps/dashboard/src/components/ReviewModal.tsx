"use client";

import React, { useState } from "react";
import { Decision } from "../lib/types";
import { api } from "../lib/api";
import { X, ShieldAlert, CheckCircle2, AlertOctagon, Scale, Lock } from "lucide-react";

interface Props {
  inspectionId: string;
  currentDecision: Decision;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ReviewModal: React.FC<Props> = ({
  inspectionId,
  currentDecision,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [overrideDecision, setOverrideDecision] = useState<Decision>("PASS");
  const [reason, setReason] = useState<string>("");
  const [reviewerId, setReviewerId] = useState<string>("sup_officer_kaushik");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (reason.trim().length < 10) {
      setError("Reason must be at least 10 characters long (Legal Metrology Act mandate).");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await api.createReview(inspectionId, overrideDecision, reason.trim(), reviewerId.trim());
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to submit supervisor review");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#09090d]/95 border border-zinc-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 backdrop-blur-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800/60 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#09090d] border border-zinc-800 flex items-center justify-center text-amber-400">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Supervisor Decision Override</h3>
              <p className="text-xs text-zinc-400">Legal Audit Trail Logging (Append-Only)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Append-Only Notice */}
        <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-xs text-amber-300 flex items-start gap-2.5">
          <Lock className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
          <div>
            <strong className="font-bold">Append-Only Legal Mandate:</strong> This override creates a permanent{" "}
            <code className="bg-[#09090d] px-1.5 py-0.5 rounded font-mono font-bold border border-amber-500/30 text-amber-300">ReviewRecord</code>. The original decision (
            <strong className="text-white">{currentDecision}</strong>) remains immutable in the audit log.
          </div>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs text-rose-400 flex items-center gap-2 font-medium">
            <AlertOctagon className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Reviewer ID */}
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5 font-mono">
              Supervisor Officer ID
            </label>
            <input
              type="text"
              value={reviewerId}
              onChange={(e) => setReviewerId(e.target.value)}
              required
              className="w-full bg-[#09090d] border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-zinc-500 font-mono font-bold"
            />
          </div>

          {/* New Decision Choice */}
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5 font-mono">
              Overridden Compliance Decision
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(["PASS", "FAIL"] as Decision[]).map((dec) => (
                <button
                  key={dec}
                  type="button"
                  onClick={() => setOverrideDecision(dec)}
                  className={`py-3 px-4 rounded-xl text-xs font-black border transition-all flex items-center justify-center gap-2 ${
                    overrideDecision === dec
                      ? dec === "PASS"
                        ? "bg-emerald-600 text-white border-emerald-500 shadow-lg"
                        : "bg-rose-600 text-white border-rose-500 shadow-lg"
                      : "bg-[#09090d] text-zinc-400 border-zinc-800 hover:border-zinc-700"
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Set Decision: {dec}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Reason input */}
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5 font-mono">
              Legal Compliance Justification (≥10 chars) *
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Detail the manual verification grounds for overriding this compliance outcome..."
              className="w-full bg-[#09090d] border border-zinc-800 rounded-2xl p-3.5 text-xs text-white focus:outline-none focus:border-zinc-500 resize-none font-medium leading-relaxed"
              required
            />
            <div className="text-[11px] text-zinc-500 mt-1 text-right font-mono">
              {reason.length}/10 chars minimum
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-400 bg-[#09090d] border border-zinc-800 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || reason.trim().length < 10}
              className="px-5 py-2.5 rounded-xl text-xs font-black bg-white hover:bg-zinc-200 text-black disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transition-all flex items-center gap-2"
            >
              {loading ? "Submitting Override..." : "Confirm & Commit Override"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

