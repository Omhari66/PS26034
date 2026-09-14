"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { api } from "../lib/api";
import { DecisionQualityAnalytics, InspectionListItem } from "../lib/types";
import { DecisionBadge } from "../components/DecisionBadge";
import { CommandPalette } from "../components/CommandPalette";
import { ToastContainer, ToastMessage } from "../components/Toast";
import { NotificationDropdown } from "../components/NotificationDropdown";
import {
  FileCheck2,
  AlertTriangle,
  BarChart3,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
  Search,
  Activity,
  Layers,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Bell,
  Check,
  Phone,
  Mail,
  UserCheck,
  Award,
  Sliders,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const MONTHLY_AUDIT_TREND = [
  { month: "Jan", audits: 24, reviews: 6 },
  { month: "Feb", audits: 31, reviews: 8 },
  { month: "Mar", audits: 28, reviews: 7 },
  { month: "Apr", audits: 39, reviews: 11 },
  { month: "May", audits: 42, reviews: 12 },
  { month: "Jun", audits: 48, reviews: 14 },
];

const DONUT_SPLIT_DATA = [
  { name: "PASS", value: 26, color: "#10b981" },
  { name: "REVIEW", value: 14, color: "#f59e0b" },
  { name: "FAIL", value: 8, color: "#ef4444" },
  { name: "CONFLICTING", value: 4, color: "#a855f7" },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as const } },
};

export default function OverviewPage() {
  const [analytics, setAnalytics] = useState<DecisionQualityAnalytics | null>(null);
  const [recentInspections, setRecentInspections] = useState<InspectionListItem[]>([]);
  const [reviewQueue, setReviewQueue] = useState<InspectionListItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [mounted, setMounted] = useState<boolean>(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState<boolean>(false);
  const [isNotifOpen, setIsNotifOpen] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (title: string, description?: string, type?: "success" | "warning" | "info") => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, title, description, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  useEffect(() => {
    setMounted(true);
    async function loadDashboard() {
      try {
        setLoading(true);
        const [anData, inspData, queueData] = await Promise.all([
          api.getDecisionQualityAnalytics().catch(() => null),
          api.getInspections({ limit: 10 }).catch(() => ({ items: [], total: 0 })),
          api.getInspections({ decision: "REVIEW", limit: 5 }).catch(() => ({ items: [], total: 0 })),
        ]);

        if (anData) setAnalytics(anData);
        setRecentInspections(inspData.items);
        setReviewQueue(queueData.items);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8 max-w-7xl mx-auto pb-12 select-none w-full min-w-0"
    >
      {/* Executive Hero Header */}
      <motion.div
        variants={itemVariants}
        className="relative overflow-hidden bg-gradient-to-r from-zinc-950 via-[#0b0c16] to-zinc-950 border border-white/15 p-7 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.85)]"
      >
        {/* Glow backdrop blur pills */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-wrap items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-extrabold text-zinc-300 bg-zinc-900 px-3 py-0.5 rounded-full font-mono uppercase tracking-wider border border-zinc-700/80 flex items-center gap-1.5 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Legal Metrology Compliance Platform
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-wide mt-2">
              Supervisor Executive Dashboard
            </h1>
            <p className="text-xs text-zinc-400 mt-1.5 font-medium max-w-2xl">
              Real-time compliance monitoring, Bounding Box OCR evidence verification, and decision quality metrics across Legal Metrology audits.
            </p>
          </div>

          <div className="flex items-center gap-3 relative">
            {/* Quick Search triggering Ctrl + K Command Palette */}
            <div
              onClick={() => {
                setIsPaletteOpen(true);
                window.dispatchEvent(new CustomEvent("open-command-palette"));
              }}
              className="relative cursor-pointer group"
              title="Click or press Ctrl + K to open Command Palette"
            >
              <Search className="w-3.5 h-3.5 absolute left-3.5 top-3 text-zinc-500 group-hover:text-amber-400 transition-colors" />
              <div className="bg-[#07070b] border border-zinc-800 group-hover:border-zinc-700 rounded-2xl pl-10 pr-12 py-2.5 text-xs text-zinc-300 w-60 font-medium transition-all flex items-center justify-between shadow-inner">
                <span>Search audits...</span>
                <kbd className="hidden sm:inline-block text-[9px] font-mono font-bold px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-400 border border-zinc-700">
                  Ctrl K
                </kbd>
              </div>
            </div>

            {/* Notification Bell with Flyout Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="relative p-3 rounded-2xl bg-[#07070b] border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 cursor-pointer transition-all active:scale-95 shadow-inner"
                title="Click to view Notifications"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              </button>

              <NotificationDropdown isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
            </div>

            <Link
              href="/inspections?decision=REVIEW"
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black font-black text-xs transition-all flex items-center gap-2 shadow-[0_0_25px_rgba(245,158,11,0.3)] hover:scale-105 active:scale-95"
            >
              <AlertTriangle className="w-4 h-4 text-black" />
              <span>Process REVIEW ({analytics?.review_count || reviewQueue.length})</span>
            </Link>
          </div>
        </div>

        {/* Quick Telemetry Status Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-zinc-800/80 relative z-10">
          <div className="bg-[#07070b]/90 border border-zinc-800/80 p-3.5 rounded-2xl flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-zinc-400 font-mono font-bold uppercase">Pass Decisions</div>
              <div className="text-sm font-black text-emerald-400">{analytics?.decision_counts?.PASS || 26} Audits Compliant</div>
            </div>
          </div>

          <div className="bg-[#07070b]/90 border border-zinc-800/80 p-3.5 rounded-2xl flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-zinc-400 font-mono font-bold uppercase">Review Queue</div>
              <div className="text-sm font-black text-amber-400">{analytics?.review_count || 14} In Review Queue</div>
            </div>
          </div>

          <div className="bg-[#07070b]/90 border border-zinc-800/80 p-3.5 rounded-2xl flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <XCircle className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-zinc-400 font-mono font-bold uppercase">Fail Decisions</div>
              <div className="text-sm font-black text-rose-400">{analytics?.decision_counts?.FAIL || 8} Non-Compliant</div>
            </div>
          </div>

          <div className="bg-[#07070b]/90 border border-zinc-800/80 p-3.5 rounded-2xl flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-zinc-400 font-mono font-bold uppercase">Total Tracked</div>
              <div className="text-sm font-black text-white">{analytics?.total_inspections || 48} Total Inspections</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* KPI Grid - Executive Glassmorphic Style */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {/* KPI 1: Total Audits */}
        <motion.div
          whileHover={{ y: -4 }}
          className="bg-gradient-to-br from-[#0c0d16] via-[#07070b] to-[#120a1c] border border-zinc-700/80 rounded-3xl p-6 space-y-4 relative overflow-hidden shadow-[0_0_30px_rgba(255,255,255,0.05)] group"
        >
          <div className="flex items-center justify-between text-xs font-extrabold text-zinc-300">
            <span className="uppercase tracking-wider font-mono">Total Audits</span>
            <div className="w-9 h-9 rounded-2xl bg-zinc-800/90 border border-zinc-700/80 flex items-center justify-center text-white shadow-inner group-hover:scale-110 transition-transform">
              <FileCheck2 className="w-4.5 h-4.5 text-zinc-200" />
            </div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-black text-white font-mono tracking-tight truncate">
              {analytics?.total_inspections ?? (recentInspections.length > 0 ? recentInspections.length : 48)}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-400 font-semibold truncate">
              <TrendingUp className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">+12% from last month</span>
            </div>
          </div>
          <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden border border-zinc-800">
            <div className="h-full bg-gradient-to-r from-zinc-400 to-white rounded-full shadow-[0_0_10px_#ffffff]" style={{ width: "85%" }} />
          </div>
        </motion.div>

        {/* KPI 2: REVIEW Routing */}
        <motion.div
          whileHover={{ y: -4 }}
          className="bg-gradient-to-br from-[#0c0d16] via-[#07070b] to-[#1a1408] border border-amber-500/30 rounded-3xl p-6 space-y-4 relative overflow-hidden shadow-[0_0_30px_rgba(245,158,11,0.1)] group"
        >
          <div className="flex items-center justify-between text-xs font-extrabold text-zinc-300">
            <span className="uppercase tracking-wider font-mono">REVIEW Routing</span>
            <div className="w-9 h-9 rounded-2xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-inner group-hover:scale-110 transition-transform">
              <AlertTriangle className="w-4.5 h-4.5 text-amber-400" />
            </div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-black text-amber-400 font-mono tracking-tight truncate">
              {analytics?.review_rate_percentage ?? 29.17}%
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-400 font-semibold truncate">
              <TrendingUp className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">+4.2% from last month</span>
            </div>
          </div>
          <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden border border-zinc-800">
            <div className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full shadow-[0_0_10px_#f59e0b]" style={{ width: `${analytics?.review_rate_percentage || 29.17}%` }} />
          </div>
        </motion.div>

        {/* KPI 3: Supervisor Overrides */}
        <motion.div
          whileHover={{ y: -4 }}
          className="bg-gradient-to-br from-[#0c0d16] via-[#07070b] to-[#120a1c] border border-purple-500/30 rounded-3xl p-6 space-y-4 relative overflow-hidden shadow-[0_0_30px_rgba(168,85,247,0.1)] group"
        >
          <div className="flex items-center justify-between text-xs font-extrabold text-zinc-300">
            <span className="uppercase tracking-wider font-mono">Supervisor Overrides</span>
            <div className="w-9 h-9 rounded-2xl bg-purple-500/15 border border-purple-500/40 flex items-center justify-center text-purple-400 shadow-inner group-hover:scale-110 transition-transform">
              <BarChart3 className="w-4.5 h-4.5 text-purple-400" />
            </div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-black text-purple-400 font-mono tracking-tight truncate">
              {analytics?.override_rate_percentage ?? 78.57}%
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-rose-400 font-semibold truncate">
              <TrendingDown className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">-3% from last month</span>
            </div>
          </div>
          <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden border border-zinc-800">
            <div className="h-full bg-gradient-to-r from-purple-600 to-indigo-400 rounded-full shadow-[0_0_10px_#a855f7]" style={{ width: `${analytics?.override_rate_percentage || 78.57}%` }} />
          </div>
        </motion.div>

        {/* KPI 4: Compliance Split */}
        <motion.div
          whileHover={{ y: -4 }}
          className="bg-gradient-to-br from-[#0c0d16] via-[#07070b] to-[#071712] border border-emerald-500/30 rounded-3xl p-6 space-y-4 relative overflow-hidden shadow-[0_0_30px_rgba(16,185,129,0.1)] group"
        >
          <div className="flex items-center justify-between text-xs font-extrabold text-zinc-300">
            <span className="uppercase tracking-wider font-mono">Compliance Split</span>
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-inner group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400" />
            </div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-black text-white font-mono tracking-tight truncate">
              76.5%
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-400 font-semibold truncate">
              <TrendingUp className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">+5.8% from last month</span>
            </div>
          </div>
          <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden border border-zinc-800">
            <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full shadow-[0_0_10px_#10b981]" style={{ width: "76.5%" }} />
          </div>
        </motion.div>
      </motion.div>

      {/* Middle Row: Interactive Visualizations */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Audit Volume Trend Area Chart (2 cols) */}
        <div className="lg:col-span-2 bg-[#07070b] border border-zinc-800/90 rounded-3xl p-6 shadow-xl space-y-5 relative overflow-hidden">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
            <div>
              <h2 className="text-base font-black text-white">Audit Volume Trend</h2>
              <p className="text-xs text-zinc-400 mt-0.5 font-medium">Monthly breakdown of packaging compliance audits</p>
            </div>
            <span className="text-[10px] font-mono font-extrabold px-3 py-1 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300">
              Last 6 months
            </span>
          </div>

          <div className="h-64 w-full">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={MONTHLY_AUDIT_TREND} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="auditColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="month" stroke="#a1a1aa" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#a1a1aa" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#09090d",
                      borderColor: "#27272a",
                      borderRadius: "0.75rem",
                      color: "#fff",
                      fontSize: "12px",
                      boxShadow: "0 10px 30px rgba(0,0,0,0.8)",
                    }}
                  />
                  <Area type="monotone" dataKey="audits" stroke="#818cf8" strokeWidth={3} fillOpacity={1} fill="url(#auditColor)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : null}
          </div>
        </div>

        {/* Right: Compliance Pipeline Donut Chart */}
        <div className="bg-[#07070b] border border-zinc-800/90 rounded-3xl p-6 shadow-xl space-y-5 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
            <h2 className="text-base font-black text-white">Compliance Pipeline</h2>
            <Link href="/analytics" className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1">
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="h-48 relative flex items-center justify-center">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={DONUT_SPLIT_DATA}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {DONUT_SPLIT_DATA.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            ) : null}
            <div className="absolute text-center pointer-events-none">
              <span className="text-2xl font-black text-white font-mono">48</span>
              <span className="block text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Total Audits</span>
            </div>
          </div>

          {/* Legend Split */}
          <div className="grid grid-cols-2 gap-2.5 pt-3 text-xs border-t border-zinc-800/80">
            {DONUT_SPLIT_DATA.map((d) => (
              <div key={d.name} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="text-zinc-400 font-semibold">{d.name}:</span>
                <span className="font-bold font-mono text-white ml-auto">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Bottom Row: Priority Queue & Recent Activities */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Priority REVIEW Queue with Risk Tag Chips */}
        <div className="bg-[#07070b] border border-zinc-800/90 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4.5 h-4.5 text-amber-400" />
              <h2 className="text-base font-black text-white">Priority REVIEW Queue</h2>
            </div>
            <Link href="/inspections?decision=REVIEW" className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1">
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {[
              {
                id: "demo-insp-001",
                code: "#demo-insp-001",
                name: "Parle-G Gold 200g",
                risk: "MRP Ambiguity 84%",
                riskColor: "bg-rose-500/10 text-rose-400 border-rose-500/30",
              },
              {
                id: "demo-insp-002",
                code: "#demo-insp-002",
                name: "Himalaya Neem Facewash",
                risk: "Net Wt Non-Compliant",
                riskColor: "bg-amber-500/10 text-amber-400 border-amber-500/30",
              },
              {
                id: "demo-insp-003",
                code: "#demo-insp-003",
                name: "Britannia NutriChoice 150g",
                risk: "Customer Care Missing",
                riskColor: "bg-purple-500/10 text-purple-400 border-purple-500/30",
              },
            ].map((item) => (
              <Link
                key={item.id}
                href={`/inspections/${item.id}`}
                className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-[#050508] border border-zinc-800/90 hover:border-zinc-700 hover:bg-zinc-900/50 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-mono font-bold text-white group-hover:text-amber-400 transition-colors">
                      {item.code}
                    </div>
                    <div className="text-[11px] text-zinc-400 font-medium">{item.name}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${item.riskColor}`}>
                    {item.risk}
                  </span>
                  <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-white transition-transform group-hover:translate-x-0.5" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Right: Recent Audit Activities */}
        <div className="bg-[#07070b] border border-zinc-800/90 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
            <div className="flex items-center gap-2">
              <Activity className="w-4.5 h-4.5 text-emerald-400" />
              <h2 className="text-base font-black text-white">Recent Audit Activities</h2>
            </div>
            <Link href="/inspections" className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1">
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3.5 text-xs">
              <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 font-bold shadow-sm">
                <Check className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white font-bold">Supervisor override logged for #demo-insp-001</div>
                <div className="text-[11px] text-zinc-400 mt-0.5">2 hours ago</div>
              </div>
            </div>

            <div className="flex items-center gap-3.5 text-xs">
              <div className="w-9 h-9 rounded-2xl bg-zinc-900 border border-zinc-700/80 flex items-center justify-center text-zinc-300 shrink-0 font-bold shadow-sm">
                <UserCheck className="w-4 h-4 text-purple-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white font-bold">Automated rule engine evaluated Parle-G Gold 200g</div>
                <div className="text-[11px] text-zinc-400 mt-0.5">4 hours ago</div>
              </div>
            </div>

            <div className="flex items-center gap-3.5 text-xs">
              <div className="w-9 h-9 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0 font-bold shadow-sm">
                <Mail className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white font-bold">Dual-OCR ambiguity report generated for Himalaya Facewash</div>
                <div className="text-[11px] text-zinc-400 mt-0.5">6 hours ago</div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Global Toast Container */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </motion.div>
  );
}

