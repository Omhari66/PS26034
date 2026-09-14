import React from "react";
import { Decision } from "../lib/types";
import { CheckCircle2, XCircle, AlertTriangle, HelpCircle, MinusCircle } from "lucide-react";

interface Props {
  decision: Decision | string | null;
  size?: "sm" | "md" | "lg";
}

export const DecisionBadge: React.FC<Props> = ({ decision, size = "md" }) => {
  if (!decision) return null;

  let bgClass = "bg-zinc-800/80 text-zinc-300 border-zinc-700/60";
  let dotClass = "bg-zinc-400";
  let Icon = MinusCircle;
  let label = String(decision);

  switch (decision) {
    case "PASS":
      bgClass = "bg-emerald-500/10 text-emerald-300 border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.15)]";
      dotClass = "bg-emerald-400 shadow-[0_0_6px_#10b981]";
      Icon = CheckCircle2;
      break;
    case "FAIL":
      bgClass = "bg-rose-500/10 text-rose-300 border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.15)]";
      dotClass = "bg-rose-400 shadow-[0_0_6px_#f43f5e]";
      Icon = XCircle;
      break;
    case "REVIEW":
      bgClass = "bg-amber-500/10 text-amber-300 border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.15)]";
      dotClass = "bg-amber-400 shadow-[0_0_6px_#f59e0b]";
      Icon = AlertTriangle;
      break;
    case "CONFLICTING":
      bgClass = "bg-purple-500/10 text-purple-300 border-purple-500/30 shadow-[0_0_12px_rgba(168,85,247,0.15)]";
      dotClass = "bg-purple-400 shadow-[0_0_6px_#a855f7]";
      Icon = HelpCircle;
      break;
    case "NOT_APPLICABLE":
      bgClass = "bg-zinc-800/60 text-zinc-400 border-zinc-700/50";
      dotClass = "bg-zinc-500";
      Icon = MinusCircle;
      label = "N/A";
      break;
  }

  const sizeClasses = {
    sm: "px-2.5 py-0.5 text-[10px] font-extrabold rounded-full border gap-1.5 tracking-wider uppercase backdrop-blur-md font-mono",
    md: "px-3 py-1 text-xs font-extrabold rounded-full border gap-2 tracking-wider uppercase backdrop-blur-md font-mono",
    lg: "px-4 py-1.5 text-xs font-black rounded-full border gap-2.5 tracking-widest uppercase backdrop-blur-md font-mono",
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-3.5 h-3.5",
    lg: "w-4 h-4",
  };

  return (
    <span className={`inline-flex items-center shrink-0 ${bgClass} ${sizeClasses[size]}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotClass}`} />
      <Icon className={`${iconSizes[size]} shrink-0`} />
      <span>{label}</span>
    </span>
  );
};


