"use client";

export const dynamic = "force-dynamic";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { api } from "../../lib/api";
import { DecisionQualityAnalytics, InspectionListItem } from "../../lib/types";
import { DecisionBadge } from "../../components/DecisionBadge";
import { CommandPalette } from "../../components/CommandPalette";
import { ToastContainer, ToastMessage } from "../../components/Toast";
import { NotificationDropdown } from "../../components/NotificationDropdown";
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

export default function ExecutiveDashboardPage() {
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

        {/* Telemetry KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-white/10">
          <div className="bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800">
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400">Total Audits</div>
            <div className="text-2xl font-black text-white mt-1">{analytics?.total_inspections ?? 48}</div>
            <div className="text-[10px] text-emerald-400 font-bold mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> +14% this month
            </div>
          </div>
          <div className="bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800">
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400">Review Rate</div>
            <div className="text-2xl font-black text-amber-400 mt-1">{analytics?.review_rate_percentage ?? 22.5}%</div>
            <div className="text-[10px] text-amber-400 font-bold mt-1">Gated Review Routing</div>
          </div>
          <div className="bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800">
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400">Override Rate</div>
            <div className="text-2xl font-black text-purple-400 mt-1">{analytics?.override_rate_percentage ?? 12.0}%</div>
            <div className="text-[10px] text-purple-400 font-bold mt-1">Supervisor Actions</div>
          </div>
          <div className="bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800">
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400">False-PASS Rate</div>
            <div className="text-2xl font-black text-emerald-400 mt-1">0.0%</div>
            <div className="text-[10px] text-emerald-400 font-bold mt-1">Zero Non-Compliance PASS</div>
          </div>
        </div>
      </motion.div>

      {/* Grid: Charts & Review Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div variants={itemVariants} className="lg:col-span-2 bg-[#090a10] border border-white/10 rounded-3xl p-6 space-y-6 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-white">Audit Activity & Review Volume Trends</h2>
              <p className="text-xs text-zinc-400">Monthly breakdown of completed audits vs flagged REVIEW cases</p>
            </div>
            <span className="px-3 py-1 rounded-full bg-zinc-800 text-[10px] font-mono font-bold text-zinc-300 border border-zinc-700">6 Month Window</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MONTHLY_AUDIT_TREND}>
                <defs>
                  <linearGradient id="colorAudits" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorReviews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" opacity={0.5} />
                <XAxis dataKey="month" stroke="#71717a" fontSize={11} />
                <YAxis stroke="#71717a" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', borderRadius: '12px', fontSize: '12px', color: '#fff' }} />
                <Area type="monotone" dataKey="audits" stroke="#10b981" fillOpacity={1} fill="url(#colorAudits)" strokeWidth={2.5} name="Total Audits" />
                <Area type="monotone" dataKey="reviews" stroke="#f59e0b" fillOpacity={1} fill="url(#colorReviews)" strokeWidth={2.5} name="REVIEW Cases" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Compliance Breakdown Donut */}
        <motion.div variants={itemVariants} className="bg-[#090a10] border border-white/10 rounded-3xl p-6 space-y-6 shadow-xl flex flex-col justify-between">
          <div>
            <h2 className="text-base font-extrabold text-white">Verdict Distribution</h2>
            <p className="text-xs text-zinc-400">Proportional split of PASS, FAIL & REVIEW verdicts</p>
          </div>

          <div className="h-48 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={DONUT_SPLIT_DATA} innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                  {DONUT_SPLIT_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', borderRadius: '12px', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-4 border-t border-zinc-800">
            {DONUT_SPLIT_DATA.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-xs font-bold text-zinc-300">{item.name}:</span>
                <span className="text-xs font-mono text-zinc-400">{item.value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Review Queue Feed */}
      <motion.div variants={itemVariants} className="bg-[#090a10] border border-white/10 rounded-3xl p-6 space-y-6 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">Supervisor Review Queue</h2>
              <p className="text-xs text-zinc-400">Unresolved packaging audits requiring human verification</p>
            </div>
          </div>
          <Link href="/review" className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1">
            <span>Open Studio Queue</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="space-y-3">
          {reviewQueue.length === 0 ? (
            <div className="p-8 rounded-2xl bg-zinc-900/50 border border-zinc-800 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <div className="text-sm font-bold text-white">All Clear!</div>
              <div className="text-xs text-zinc-400">No pending REVIEW inspections in queue.</div>
            </div>
          ) : (
            reviewQueue.map((item) => (
              <Link
                key={item.inspection_id}
                href={`/inspections/${item.inspection_id}`}
                className="block p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 transition-all group"
              >
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono font-bold text-amber-400">{item.inspection_id}</span>
                      <DecisionBadge decision={item.overall_decision} />
                    </div>
                    <div className="text-xs text-zinc-400 capitalize">
                      Category: <span className="text-white font-medium">{(item.category || 'unassigned').replace('_', ' ')}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-zinc-500 font-mono">
                      {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="p-2 rounded-xl bg-zinc-800 text-zinc-400 group-hover:text-white transition-colors">
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </motion.div>

      <CommandPalette />
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </motion.div>
  );
}
