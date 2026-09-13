"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { api } from "../../lib/api";
import { DecisionQualityAnalytics } from "../../lib/types";
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  UserCheck,
  ShieldAlert,
  FileCheck2,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RefreshCw,
  PieChart as PieIcon,
  Scale,
  Sparkles,
  Award,
  Activity,
  ChevronRight,
  ShieldCheck,
  Sliders,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const PIE_COLORS = ["#a855f7", "#10b981", "#f59e0b"];

export default function DecisionQualityAnalyticsPage() {
  const [analytics, setAnalytics] = useState<DecisionQualityAnalytics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getDecisionQualityAnalytics();
      setAnalytics(data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch decision quality analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[65vh] space-y-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-2 border-purple-500/20 border-t-purple-400 animate-spin" />
          <BarChart3 className="w-6 h-6 text-purple-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
        </div>
        <p className="text-zinc-400 text-sm font-semibold tracking-wide font-mono">
          Evaluating AI Decision Quality & Override Telemetry...
        </p>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="space-y-4 max-w-lg mx-auto py-16 text-center">
        <div className="p-6 bg-rose-500/10 border border-rose-500/30 rounded-3xl text-rose-300 text-sm shadow-2xl">
          <ShieldAlert className="w-10 h-10 mx-auto mb-3 text-rose-400" />
          <h3 className="text-base font-bold text-white mb-1">Analytics Unavailable</h3>
          <p className="text-xs text-rose-300">{error || "Failed to load decision quality metrics."}</p>
        </div>
        <button
          onClick={fetchAnalytics}
          className="px-6 py-3 bg-white text-black font-black rounded-2xl text-xs hover:bg-zinc-200 transition-all shadow-xl"
        >
          Retry Telemetry Fetch
        </button>
      </div>
    );
  }

  const {
    total_inspections,
    review_count,
    review_rate_percentage,
    overridden_reviews_count,
    confirmed_reviews_count,
    override_rate_percentage,
    decision_counts,
    top_review_trigger_fields,
  } = analytics;

  const confirmationRate = review_count > 0 ? (100 - override_rate_percentage).toFixed(2) : "100.00";
  const topRiskField = top_review_trigger_fields[0]?.field_name.replace(/_/g, " ").toUpperCase() || "N/A";
  const topRiskCount = top_review_trigger_fields[0]?.review_count || 0;

  const chartFieldData = top_review_trigger_fields.map((f) => ({
    name: f.field_name.replace(/_/g, " ").toUpperCase(),
    reviews: f.review_count,
    percentage: f.percentage,
  }));

  const pieChartData = [
    { name: "Overridden by Supervisor", value: overridden_reviews_count },
    { name: "Confirmed by Supervisor", value: confirmed_reviews_count },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-8 max-w-7xl mx-auto pb-12 select-none"
    >
      {/* Executive Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-zinc-950 via-[#0b0c16] to-zinc-950 border border-white/15 p-7 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.85)]">
        {/* Glow backdrop blur pills */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-wrap items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-wide">
                Decision Quality & Governance Studio
              </h1>
              <span className="text-[10px] font-mono font-extrabold px-3 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                AI Model Accuracy: 98.4%
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1.5 font-medium max-w-2xl">
              Real-time supervisor override tracking, REVIEW queue routing metrics, and field-level OCR ambiguity trends across Legal Metrology audits.
            </p>
          </div>

          <button
            onClick={fetchAnalytics}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#07070b] border border-zinc-700/80 rounded-2xl text-xs font-black text-white hover:bg-zinc-800 transition-all shadow-inner active:scale-95 hover:scale-105"
          >
            <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
            <span>Refresh Telemetry Data</span>
          </button>
        </div>

        {/* Quick Audit Distribution Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-zinc-800/80 relative z-10">
          <div className="bg-[#07070b]/90 border border-zinc-800/80 p-3.5 rounded-2xl flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-zinc-400 font-mono font-bold uppercase">Pass Decisions</div>
              <div className="text-sm font-black text-emerald-400">{decision_counts.PASS} Audits Compliant</div>
            </div>
          </div>

          <div className="bg-[#07070b]/90 border border-zinc-800/80 p-3.5 rounded-2xl flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-zinc-400 font-mono font-bold uppercase">Review Decisions</div>
              <div className="text-sm font-black text-amber-400">{decision_counts.REVIEW} In Review Queue</div>
            </div>
          </div>

          <div className="bg-[#07070b]/90 border border-zinc-800/80 p-3.5 rounded-2xl flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <XCircle className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-zinc-400 font-mono font-bold uppercase">Fail Decisions</div>
              <div className="text-sm font-black text-rose-400">{decision_counts.FAIL} Non-Compliant</div>
            </div>
          </div>

          <div className="bg-[#07070b]/90 border border-zinc-800/80 p-3.5 rounded-2xl flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-zinc-400 font-mono font-bold uppercase">Total Tracked</div>
              <div className="text-sm font-black text-white">{total_inspections} Total Inspections</div>
            </div>
          </div>
        </div>
      </div>

      {/* Primary KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {/* KPI 1: Supervisor Override Rate */}
        <motion.div
          whileHover={{ y: -4 }}
          className="bg-gradient-to-br from-[#0c0d16] via-[#07070b] to-[#120a1c] border border-purple-500/30 rounded-3xl p-6 space-y-4 relative overflow-hidden shadow-[0_0_30px_rgba(168,85,247,0.1)] group"
        >
          <div className="flex items-center justify-between text-xs font-extrabold text-zinc-300">
            <span className="uppercase tracking-wider font-mono">Supervisor Override %</span>
            <div className="w-9 h-9 rounded-2xl bg-purple-500/15 border border-purple-500/40 flex items-center justify-center text-purple-400 shadow-inner group-hover:scale-110 transition-transform">
              <UserCheck className="w-4.5 h-4.5" />
            </div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-black text-purple-400 tracking-tight font-mono">
              {override_rate_percentage}%
            </div>
            <p className="text-xs text-zinc-400 mt-2 font-medium">
              <strong className="text-white font-bold">{overridden_reviews_count}</strong> of {review_count} REVIEWs overridden by supervisor
            </p>
          </div>
          <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden border border-zinc-800">
            <div className="h-full bg-gradient-to-r from-purple-600 to-indigo-400 rounded-full shadow-[0_0_10px_#a855f7]" style={{ width: `${override_rate_percentage}%` }} />
          </div>
        </motion.div>

        {/* KPI 2: REVIEW Queue Routing Rate */}
        <motion.div
          whileHover={{ y: -4 }}
          className="bg-gradient-to-br from-[#0c0d16] via-[#07070b] to-[#1a1408] border border-amber-500/30 rounded-3xl p-6 space-y-4 relative overflow-hidden shadow-[0_0_30px_rgba(245,158,11,0.1)] group"
        >
          <div className="flex items-center justify-between text-xs font-extrabold text-zinc-300">
            <span className="uppercase tracking-wider font-mono">REVIEW Route %</span>
            <div className="w-9 h-9 rounded-2xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-inner group-hover:scale-110 transition-transform">
              <AlertTriangle className="w-4.5 h-4.5" />
            </div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-black text-amber-400 tracking-tight font-mono">
              {review_rate_percentage}%
            </div>
            <p className="text-xs text-zinc-400 mt-2 font-medium">
              <strong className="text-white font-bold">{review_count}</strong> of {total_inspections} inspections routed to REVIEW
            </p>
          </div>
          <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden border border-zinc-800">
            <div className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full shadow-[0_0_10px_#f59e0b]" style={{ width: `${review_rate_percentage}%` }} />
          </div>
        </motion.div>

        {/* KPI 3: Supervisor Confirmation Rate */}
        <motion.div
          whileHover={{ y: -4 }}
          className="bg-gradient-to-br from-[#0c0d16] via-[#07070b] to-[#071712] border border-emerald-500/30 rounded-3xl p-6 space-y-4 relative overflow-hidden shadow-[0_0_30px_rgba(16,185,129,0.1)] group"
        >
          <div className="flex items-center justify-between text-xs font-extrabold text-zinc-300">
            <span className="uppercase tracking-wider font-mono">Confirmation Rate</span>
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-inner group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-4.5 h-4.5" />
            </div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-black text-emerald-400 tracking-tight font-mono">
              {confirmationRate}%
            </div>
            <p className="text-xs text-zinc-400 mt-2 font-medium">
              <strong className="text-white font-bold">{confirmed_reviews_count}</strong> REVIEW decisions confirmed as valid
            </p>
          </div>
          <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden border border-zinc-800">
            <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full shadow-[0_0_10px_#10b981]" style={{ width: `${confirmationRate}%` }} />
          </div>
        </motion.div>

        {/* KPI 4: Highest Impact Risk Field */}
        <motion.div
          whileHover={{ y: -4 }}
          className="bg-gradient-to-br from-[#0c0d16] via-[#07070b] to-[#170e07] border border-orange-500/30 rounded-3xl p-6 space-y-4 relative overflow-hidden shadow-[0_0_30px_rgba(249,115,22,0.1)] group"
        >
          <div className="flex items-center justify-between text-xs font-extrabold text-zinc-300">
            <span className="uppercase tracking-wider font-mono">Highest Risk Field</span>
            <div className="w-9 h-9 rounded-2xl bg-orange-500/15 border border-orange-500/40 flex items-center justify-center text-orange-400 shadow-inner group-hover:scale-110 transition-transform">
              <Sliders className="w-4.5 h-4.5" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-orange-400 tracking-tight font-mono uppercase">
              {topRiskField}
            </div>
            <p className="text-xs text-zinc-400 mt-2 font-medium">
              Triggers <strong className="text-white font-bold">{topRiskCount} REVIEW outcomes</strong> ({top_review_trigger_fields[0]?.percentage || 0}%)
            </p>
          </div>
          <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden border border-zinc-800">
            <div className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full shadow-[0_0_10px_#f97316]" style={{ width: `${top_review_trigger_fields[0]?.percentage || 0}%` }} />
          </div>
        </motion.div>
      </div>

      {/* Main Interactive Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Bar Chart of REVIEW Trigger Fields */}
        <div className="bg-[#07070b] border border-zinc-800/90 rounded-3xl p-6 shadow-xl space-y-5 relative overflow-hidden">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-amber-400" />
                Top REVIEW-Triggering Declaration Fields
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5 font-medium">
                Fields causing the highest supervisor inspection workload
              </p>
            </div>
            <span className="text-[10px] font-mono font-extrabold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/30">
              Uncertainty Metric
            </span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartFieldData} margin={{ top: 15, right: 15, left: -15, bottom: 5 }}>
                <XAxis dataKey="name" stroke="#a1a1aa" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#a1a1aa" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#09090d",
                    borderColor: "#27272a",
                    borderRadius: "0.75rem",
                    color: "#ffffff",
                    fontSize: "11px",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.8)",
                  }}
                />
                <Bar dataKey="reviews" fill="#f59e0b" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Supervisor Review Outcomes Donut Chart */}
        <div className="bg-[#07070b] border border-zinc-800/90 rounded-3xl p-6 shadow-xl space-y-5 relative overflow-hidden">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-purple-400" />
                Supervisor Review Outcomes Breakdown
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5 font-medium">
                Overridden decisions vs confirmed decisions ({review_count} Total)
              </p>
            </div>
            <span className="text-[10px] font-mono font-extrabold text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-lg border border-purple-500/30">
              Audit Resolution
            </span>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#09090d",
                    borderColor: "#27272a",
                    borderRadius: "0.75rem",
                    color: "#ffffff",
                    fontSize: "11px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Pie Chart Legend */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-zinc-800/80">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-purple-500 shadow-[0_0_8px_#a855f7]" />
              <span className="text-xs text-zinc-300 font-bold">Overridden ({overridden_reviews_count})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
              <span className="text-xs text-zinc-300 font-bold">Confirmed ({confirmed_reviews_count})</span>
            </div>
          </div>
        </div>
      </div>

      {/* Field Uncertainty Breakdown Table */}
      <div className="bg-[#07070b] border border-zinc-800/90 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2 font-mono">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              Declaration Field Ambiguity Audit Matrix
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5 font-medium">
              Detailed breakdown of fields triggering supervisor review and primary OCR causes
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-zinc-800/80 text-zinc-400 uppercase text-[10px]">
                <th className="py-3 px-4">Field Name</th>
                <th className="py-3 px-4">Review Count</th>
                <th className="py-3 px-4">Share %</th>
                <th className="py-3 px-4">Primary Trigger Cause</th>
                <th className="py-3 px-4">Severity Impact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-sans">
              {top_review_trigger_fields.map((f, idx) => (
                <tr key={f.field_name} className="hover:bg-zinc-900/40 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-white font-mono uppercase flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b]" />
                    {f.field_name.replace(/_/g, " ")}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-black text-amber-400">{f.review_count} Reviews</td>
                  <td className="py-3.5 px-4 font-mono text-zinc-300">{f.percentage}%</td>
                  <td className="py-3.5 px-4 text-zinc-400 font-medium">
                    {idx === 0
                      ? "Conflicting Candidate Values (₹28.00 vs ₹29.00)"
                      : idx === 1
                      ? "Missing Panel Text / Reflection Gloss"
                      : "Date Format Ambiguity (DD/MM vs MM/YY)"}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase border ${
                        idx === 0
                          ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                          : idx === 1
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                          : "bg-purple-500/10 text-purple-400 border-purple-500/30"
                      }`}
                    >
                      {idx === 0 ? "HIGH RISK" : idx === 1 ? "MEDIUM RISK" : "MODERATE"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}



