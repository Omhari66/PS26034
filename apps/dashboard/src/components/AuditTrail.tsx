import React from "react";
import { ReviewRecordOut, Decision } from "../lib/types";
import { DecisionBadge } from "./DecisionBadge";
import { History, ShieldCheck, UserCheck, Clock, GitCommit } from "lucide-react";

interface Props {
  originalDecision: Decision;
  ruleVersion: string;
  reviews: ReviewRecordOut[];
}

export const AuditTrail: React.FC<Props> = ({ originalDecision, ruleVersion, reviews }) => {
  return (
    <div className="bg-[#09090d]/90 border border-zinc-800/90 rounded-3xl p-6 shadow-2xl space-y-5 backdrop-blur-xl">
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#121218] border border-zinc-800 flex items-center justify-center text-amber-400 shadow-inner">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-white">Append-Only Audit Trail</h3>
            <p className="text-xs text-zinc-400 font-mono">Immutable rule version v{ruleVersion} audit history</p>
          </div>
        </div>
      </div>

      <div className="relative pl-6 space-y-6 before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-zinc-800">
        {/* Original Automated Report Node */}
        <div className="relative group">
          <div className="absolute -left-6 top-1.5 w-3.5 h-3.5 rounded-full bg-emerald-400 ring-4 ring-[#09090d] shadow-[0_0_10px_#10b981]" />
          <div className="bg-[#121218] border border-zinc-800/90 rounded-2xl p-4 space-y-2.5 hover:border-zinc-700 transition-colors shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-2 font-mono">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Automated Rule Evaluation
              </span>
              <DecisionBadge decision={originalDecision} size="sm" />
            </div>
            <p className="text-xs text-zinc-300 font-medium leading-relaxed">
              Executed pure validator routing under rule version <strong className="text-white font-mono">v{ruleVersion}</strong>. Baseline decision registered.
            </p>
          </div>
        </div>

        {/* Supervisor Review Overrides */}
        {reviews.map((rev, index) => (
          <div key={rev.id} className="relative group">
            <div className="absolute -left-6 top-1.5 w-3.5 h-3.5 rounded-full bg-amber-400 ring-4 ring-[#09090d] shadow-[0_0_12px_#f59e0b]" />
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 space-y-3 hover:border-amber-500/50 transition-colors shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-300 flex items-center gap-2 font-mono">
                  <UserCheck className="w-4 h-4 text-amber-400" />
                  Supervisor Override #{index + 1}
                </span>
                <DecisionBadge decision={rev.overridden_decision} size="sm" />
              </div>

              <div className="text-xs text-zinc-200 bg-[#09090d] p-3 rounded-xl border border-zinc-800/80 leading-relaxed font-medium">
                <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-1 font-mono">
                  Legal Compliance Reasoning:
                </div>
                <p className="italic text-zinc-200">"{rev.reason}"</p>
              </div>

              <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono pt-1">
                <span className="flex items-center gap-1">
                  Officer: <strong className="text-white">{rev.reviewer_id}</strong>
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-zinc-500" />
                  {new Date(rev.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};


