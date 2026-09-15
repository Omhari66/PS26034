"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldAlert,
  Clock,
  Scale,
  AlertTriangle,
  ChevronRight,
  Package,
  ScanLine,
  FileText,
  FileX,
  TrendingDown,
  Layers,
  AlertCircle,
  XCircle,
  Activity,
  ArrowRight,
  Eye,
  CheckCircle2,
  Lock,
  Zap,
  Terminal,
  FileCheck2,
} from "lucide-react";

export default function ProblemSection() {
  const [selectedWorkflowNode, setSelectedWorkflowNode] = useState<number>(2); // Default to Manual Verification
  const [activeCard1Tab, setActiveCard1Tab] = useState<"signal" | "defects">("signal");
  const [activeCard2Category, setActiveCard2Category] = useState<"fmcg" | "commodity" | "pharma">("fmcg");

  const workflowNodes = [
    {
      step: "01",
      title: "PACKAGED PRODUCT",
      desc: "Market Supply Chain",
      icon: Package,
      risk: "Unchecked Batch",
      detail: "Mass production packaging enters national retail without pre-market verification. Non-standard unit prices are printed in tiny fonts.",
      stat: "42% Lack Mandatory Unit Price",
      severity: "WARNING",
    },
    {
      step: "02",
      title: "FIELD INSPECTION",
      desc: "Manual Photo Capture",
      icon: ScanLine,
      risk: "Low Quality / Blur",
      detail: "Field officers capture photos in low light or at harsh angles. Over 35% of photos suffer from motion blur or reflection glares.",
      stat: "38% Photos Obscured",
      severity: "HIGH",
    },
    {
      step: "03",
      title: "MANUAL VERIFICATION",
      desc: "15+ Min Computation",
      icon: Clock,
      risk: "Fatigue Bottleneck",
      detail: "Inspectors manually convert net quantities, check Mfg date cutoffs against legal thresholds, and look up registered helpline addresses.",
      stat: "18.4 Min Average Delay",
      severity: "CRITICAL",
    },
    {
      step: "04",
      title: "PAPER REPORT",
      desc: "Static Physical Log",
      icon: FileText,
      risk: "No Pixel Bounding",
      detail: "Handwritten inspection sheets lack 1:1 pixel coordinate bounding boxes. Physical evidence is susceptible to loss or tampering.",
      stat: "Zero Spatial Evidence",
      severity: "CRITICAL",
    },
    {
      step: "05",
      title: "COURT / ENFORCEMENT",
      desc: "Zero Legal Evidence",
      icon: Scale,
      risk: "Case Dismissal Risk",
      detail: "Defense attorneys challenge unverified paper logs in legal proceedings. 68% of challenged cases are dismissed due to weak evidence integrity.",
      stat: "68% Prosecution Failure",
      severity: "SEVERE",
    },
  ];

  return (
    <section id="problem" className="py-24 px-4 sm:px-6 max-w-7xl mx-auto space-y-16 relative z-10 selection:bg-rose-500/30">
      {/* ───────────────────────────────────────────────────────────────────────
          SECTION 1 — HEADER (Ultra-Luxury Editorial Header)
      ─────────────────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="text-center space-y-5 relative"
      >
        {/* Glowing Background Radial Ambient Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-rose-600/10 rounded-full blur-[140px] pointer-events-none" />

        {/* Eyebrow Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-rose-500/15 via-rose-500/10 to-amber-500/15 border border-rose-500/30 text-rose-300 text-xs font-mono font-extrabold uppercase tracking-widest shadow-[0_0_25px_rgba(244,63,94,0.3)] backdrop-blur-xl">
          <AlertTriangle className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
          <span>THE METROLOGY CHALLENGE</span>
        </div>

        {/* Editorial Headline */}
        <h2 className="text-4xl sm:text-6xl font-black tracking-tight text-white max-w-4xl mx-auto leading-[1.12]">
          Manual Audits Create <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-rose-400 via-amber-300 to-orange-400 drop-shadow-[0_0_40px_rgba(244,63,94,0.45)]">
            Enforcement Blind Spots.
          </span>
        </h2>

        {/* Editorial Subtitle */}
        <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl mx-auto font-medium leading-relaxed">
          Traditional Indian Legal Metrology (Packaged Commodities Rules 2011) compliance relies on paper logs and manual visual checks, creating massive loopholes in market enforcement.
        </p>

        {/* Technical Metadata Pipeline Row */}
        <div className="pt-3 flex flex-wrap items-center justify-center gap-2 text-[10px] font-mono text-zinc-400 tracking-wider">
          <div className="px-3.5 py-1.5 rounded-xl bg-[#0b0c16]/90 border border-zinc-800/90 text-zinc-300 font-bold shadow-inner flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
            <span>LEGACY WORKFLOW</span>
          </div>
          <span className="text-rose-500/70 font-bold">→</span>
          <div className="px-3.5 py-1.5 rounded-xl bg-[#0b0c16]/90 border border-zinc-800/90 text-zinc-300 font-bold shadow-inner flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span>MANUAL VERIFICATION</span>
          </div>
          <span className="text-amber-500/70 font-bold">→</span>
          <div className="px-3.5 py-1.5 rounded-xl bg-[#0b0c16]/90 border border-zinc-800/90 text-zinc-300 font-bold shadow-inner flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
            <span>PAPER EVIDENCE</span>
          </div>
          <span className="text-orange-500/70 font-bold">→</span>
          <div className="px-3.5 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/40 text-rose-300 font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(244,63,94,0.2)]">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
            <span>LIMITED TRACEABILITY</span>
          </div>
        </div>
      </motion.div>

      {/* ───────────────────────────────────────────────────────────────────────
          SECTION 2 — INSPECTION RISK OVERVIEW PANEL (Interactive Telemetry)
      ─────────────────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 35 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="rounded-3xl bg-gradient-to-b from-[#0a0b16]/95 via-[#080912]/95 to-[#04050a]/95 border border-zinc-800/90 p-6 sm:p-8 space-y-8 shadow-[0_30px_90px_rgba(0,0,0,0.9)] backdrop-blur-2xl relative overflow-hidden group hover:border-rose-500/40 transition-all"
      >
        {/* Glowing Accent Corner Light */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/10 rounded-full blur-[100px] pointer-events-none" />

        {/* Top Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-zinc-800/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
              <Activity className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="text-xs font-mono font-extrabold text-zinc-200 tracking-wider uppercase flex items-center gap-2">
                <span>CURRENT INSPECTION WORKFLOW</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-normal">v2.4 AUDIT</span>
              </div>
              <p className="text-[10px] text-zinc-400 font-mono">Interactive Stage Telemetry (Click stage to inspect diagnostic)</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 font-mono text-[10px] font-extrabold tracking-wide shadow-[0_0_20px_rgba(244,63,94,0.2)]">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <span>SYSTEMIC RISK DETECTED</span>
          </div>
        </div>

        {/* Interactive 5-Stage Workflow Nodes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 relative">
          {workflowNodes.map((node, i) => {
            const IconComp = node.icon;
            const isSelected = selectedWorkflowNode === i;
            return (
              <div
                key={i}
                onClick={() => setSelectedWorkflowNode(i)}
                className="relative cursor-pointer group/node"
              >
                <div
                  className={`p-4 rounded-2xl transition-all duration-300 space-y-2 text-left h-full flex flex-col justify-between ${
                    isSelected
                      ? "bg-gradient-to-b from-[#180e14] to-[#0e0a14] border-2 border-rose-500 shadow-[0_0_25px_rgba(244,63,94,0.35)] scale-[1.02]"
                      : "bg-[#0c0d18] border border-zinc-800/90 hover:border-amber-500/40 hover:bg-[#111220]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-mono font-extrabold ${isSelected ? "text-rose-400" : "text-zinc-500"}`}>
                      {node.step}
                    </span>
                    <div
                      className={`p-1.5 rounded-lg border transition-colors ${
                        isSelected
                          ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                          : "bg-zinc-900 text-amber-400 border-zinc-800 group-hover/node:text-amber-300"
                      }`}
                    >
                      <IconComp className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div>
                    <h4 className={`text-[11px] font-extrabold tracking-tight ${isSelected ? "text-white" : "text-zinc-300"}`}>
                      {node.title}
                    </h4>
                    <p className="text-[10px] text-zinc-400 font-medium">{node.desc}</p>
                  </div>
                  <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[9px] font-mono">
                    <span className={isSelected ? "text-rose-300 font-bold" : "text-rose-400/90"}>
                      ⚠️ {node.risk}
                    </span>
                  </div>
                </div>
                {i < 4 && (
                  <div className="hidden md:flex absolute top-1/2 -right-3 -translate-y-1/2 z-20 text-rose-500/40">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Dynamic Expanded Inspector Telemetry Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedWorkflowNode}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="p-4 sm:p-5 rounded-2xl bg-[#05060d] border border-rose-500/30 flex flex-wrap items-center justify-between gap-4 text-left font-mono text-xs"
          >
            <div className="space-y-1 max-w-xl">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-[11px]">
                <Terminal className="w-3.5 h-3.5 text-rose-400" />
                <span>STAGE DIAGNOSTIC: {workflowNodes[selectedWorkflowNode].title}</span>
                <span className="px-2 py-0.2 rounded bg-rose-500/20 text-rose-300 text-[9px]">
                  {workflowNodes[selectedWorkflowNode].severity}
                </span>
              </div>
              <p className="text-zinc-300 font-sans text-xs leading-relaxed">
                {workflowNodes[selectedWorkflowNode].detail}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-[#0d0e19] border border-zinc-800 space-y-1 text-right">
              <div className="text-[10px] text-zinc-500 font-bold">KEY METRIC FACTOR</div>
              <div className="text-rose-400 font-bold font-mono text-sm">
                {workflowNodes[selectedWorkflowNode].stat}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Enterprise Analytics Key Metrics Row */}
        <div className="pt-4 border-t border-zinc-800/80 grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="p-5 rounded-2xl bg-gradient-to-br from-[#12080e]/90 to-[#080914]/90 border border-rose-500/30 flex items-center gap-4 shadow-lg group hover:border-rose-400/60 transition-colors">
            <div className="text-3xl font-black text-rose-400 font-mono tracking-tight drop-shadow-[0_0_15px_rgba(244,63,94,0.4)]">
              85%
            </div>
            <div className="text-left space-y-0.5">
              <div className="text-[11px] font-mono font-extrabold text-zinc-200 uppercase tracking-wider">
                FATIGUE-RELATED RISK
              </div>
              <div className="text-[10px] text-zinc-400 font-medium">Unchecked packaging label compliance</div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-gradient-to-br from-[#130f08]/90 to-[#080914]/90 border border-amber-500/30 flex items-center gap-4 shadow-lg group hover:border-amber-400/60 transition-colors">
            <div className="text-3xl font-black text-amber-400 font-mono tracking-tight drop-shadow-[0_0_15px_rgba(245,158,11,0.4)]">
              15+ MIN
            </div>
            <div className="text-left space-y-0.5">
              <div className="text-[11px] font-mono font-extrabold text-zinc-200 uppercase tracking-wider">
                VERIFICATION / ITEM
              </div>
              <div className="text-[10px] text-zinc-400 font-medium">Manual calculation backlog per officer</div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-gradient-to-br from-[#13090c]/90 to-[#080914]/90 border border-orange-500/30 flex items-center gap-4 shadow-lg group hover:border-orange-400/60 transition-colors">
            <div className="text-3xl font-black text-orange-400 font-mono tracking-tight drop-shadow-[0_0_15px_rgba(249,115,22,0.4)]">
              0%
            </div>
            <div className="text-left space-y-0.5">
              <div className="text-[11px] font-mono font-extrabold text-zinc-200 uppercase tracking-wider">
                DIGITAL BOUNDING
              </div>
              <div className="text-[10px] text-zinc-400 font-medium">Zero 1:1 spatial court evidence logs</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ───────────────────────────────────────────────────────────────────────
          SECTION 3 — THREE PROBLEM INTELLIGENCE CARDS (Luxury Interactive Visuals)
      ─────────────────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {/* ── CARD 1 — FALSE PASS RISK (Accuracy Risk) ── */}
        <motion.div
          whileHover={{ y: -6, scale: 1.01 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="p-7 rounded-3xl bg-gradient-to-b from-[#12080c]/95 via-[#090812]/95 to-[#05050a]/95 border border-rose-500/35 hover:border-rose-400 transition-all duration-300 space-y-6 shadow-[0_25px_60px_rgba(0,0,0,0.85)] backdrop-blur-2xl relative overflow-hidden text-left flex flex-col justify-between group"
        >
          <div className="space-y-4">
            {/* Category & Metric */}
            <div className="flex items-center justify-between pb-3 border-b border-rose-500/20">
              <span className="text-[10px] font-mono font-extrabold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                INSPECTION ACCURACY
              </span>
              <span className="text-2xl font-black text-rose-400 font-mono tracking-tight">85%</span>
            </div>

            <h3 className="text-xl font-black text-white group-hover:text-rose-300 transition-colors">
              Unacceptable False-PASS Risk
            </h3>

            <p className="text-xs text-zinc-400 leading-relaxed font-medium">
              Blurred packaging photos, low-contrast text and inspection fatigue create opportunities for non-compliant products to pass manual review.
            </p>

            {/* Interactive Visual Selector */}
            <div className="p-3.5 rounded-2xl bg-[#070812] border border-zinc-800/90 space-y-3 font-mono text-[10px]">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setActiveCard1Tab("signal")}
                    className={`px-2 py-0.5 rounded transition-all ${
                      activeCard1Tab === "signal" ? "bg-rose-500/20 text-rose-300 border border-rose-500/40" : "text-zinc-500"
                    }`}
                  >
                    SIGNAL DEGRADATION
                  </button>
                  <button
                    onClick={() => setActiveCard1Tab("defects")}
                    className={`px-2 py-0.5 rounded transition-all ${
                      activeCard1Tab === "defects" ? "bg-rose-500/20 text-rose-300 border border-rose-500/40" : "text-zinc-500"
                    }`}
                  >
                    DEFECT MAP
                  </button>
                </div>
                <span className="text-rose-400 font-bold">DEGRADED</span>
              </div>

              {activeCard1Tab === "signal" ? (
                <div className="space-y-2">
                  <div className="space-y-1">
                    <div className="flex justify-between text-zinc-300">
                      <span>Image Quality (Photo Blur)</span>
                      <span className="text-emerald-400 font-bold">95%</span>
                    </div>
                    <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-400 w-[95%]" />
                    </div>
                  </div>

                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between text-zinc-300">
                      <span>OCR Text Readability</span>
                      <span className="text-amber-400 font-bold">55%</span>
                    </div>
                    <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-400 w-[55%]" />
                    </div>
                  </div>

                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between text-zinc-300">
                      <span>Human Inspection Confidence</span>
                      <span className="text-rose-400 font-bold">20%</span>
                    </div>
                    <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-rose-500 w-[20%] animate-pulse" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 p-2 bg-[#05050c] rounded-xl border border-rose-500/30 text-[9px] text-zinc-300">
                  <div className="flex justify-between text-rose-400 font-bold">
                    <span>⚠️ MISSED DECLARATIONS</span>
                    <span>3 ERRORS</span>
                  </div>
                  <div className="text-zinc-400 space-y-1">
                    <p>• Net Qty font height &lt; 3mm (Violates Rule 7)</p>
                    <p>• Consumer Helpline email truncated</p>
                    <p>• Unit Price formula absent on front panel</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Impact & Status Badges */}
          <div className="pt-4 border-t border-rose-500/20 flex items-center justify-between text-[10px] font-mono font-bold">
            <span className="text-zinc-400">IMPACT: <span className="text-rose-400">UNENFORCED FINES</span></span>
            <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">CRITICAL</span>
          </div>
        </motion.div>

        {/* ── CARD 2 — VERIFICATION BOTTLENECK (Throughput Risk) ── */}
        <motion.div
          whileHover={{ y: -6, scale: 1.01 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="p-7 rounded-3xl bg-gradient-to-b from-[#130f08]/95 via-[#090812]/95 to-[#05050a]/95 border border-amber-500/35 hover:border-amber-400 transition-all duration-300 space-y-6 shadow-[0_25px_60px_rgba(0,0,0,0.85)] backdrop-blur-2xl relative overflow-hidden text-left flex flex-col justify-between group"
        >
          <div className="space-y-4">
            {/* Category & Metric */}
            <div className="flex items-center justify-between pb-3 border-b border-amber-500/20">
              <span className="text-[10px] font-mono font-extrabold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                OPERATIONAL THROUGHPUT
              </span>
              <span className="text-2xl font-black text-amber-400 font-mono tracking-tight">15+ MIN</span>
            </div>

            <h3 className="text-xl font-black text-white group-hover:text-amber-300 transition-colors">
              Manual Verification Bottlenecks
            </h3>

            <p className="text-xs text-zinc-400 leading-relaxed font-medium">
              Officers manually calculate unit prices, validate manufacturing and expiry dates, and cross-reference manufacturer entities.
            </p>

            {/* Interactive Timeline Breakdown */}
            <div className="p-3.5 rounded-2xl bg-[#070812] border border-zinc-800/90 space-y-2 font-mono text-[10px]">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <div className="flex items-center gap-1 text-[9px]">
                  {(["fmcg", "commodity", "pharma"] as const).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setActiveCard2Category(cat)}
                      className={`px-2 py-0.5 rounded uppercase ${
                        activeCard2Category === cat ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold" : "text-zinc-500"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                <span className="text-amber-400 font-bold">18m DELAY</span>
              </div>

              <div className="space-y-1.5 text-zinc-300">
                <div className="flex justify-between items-center">
                  <span>1. Unit Price Math</span>
                  <span className="text-zinc-400 font-mono">4.5 min</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>2. Mfg Date Threshold</span>
                  <span className="text-zinc-400 font-mono">5.0 min</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>3. Manufacturer Lookup</span>
                  <span className="text-amber-400 font-mono font-bold">
                    {activeCard2Category === "fmcg" ? "6.0 min" : activeCard2Category === "commodity" ? "8.5 min" : "9.0 min"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>4. Manual Paper Log Entry</span>
                  <span className="text-zinc-400 font-mono">2.5 min</span>
                </div>
              </div>
            </div>
          </div>

          {/* Impact & Status Badges */}
          <div className="pt-4 border-t border-amber-500/20 flex items-center justify-between text-[10px] font-mono font-bold">
            <span className="text-zinc-400">IMPACT: <span className="text-amber-400">SEVERE BACKLOG</span></span>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">DELAY</span>
          </div>
        </motion.div>

        {/* ── CARD 3 — EVIDENCE INTEGRITY (Legal Risk) ── */}
        <motion.div
          whileHover={{ y: -6, scale: 1.01 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="p-7 rounded-3xl bg-gradient-to-b from-[#13090c]/95 via-[#090812]/95 to-[#05050a]/95 border border-orange-500/35 hover:border-orange-400 transition-all duration-300 space-y-6 shadow-[0_25px_60px_rgba(0,0,0,0.85)] backdrop-blur-2xl relative overflow-hidden text-left flex flex-col justify-between group"
        >
          <div className="space-y-4">
            {/* Category & Metric */}
            <div className="flex items-center justify-between pb-3 border-b border-orange-500/20">
              <span className="text-[10px] font-mono font-extrabold text-orange-400 uppercase tracking-wider flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-orange-400" />
                LEGAL TRACEABILITY
              </span>
              <span className="text-2xl font-black text-orange-400 font-mono tracking-tight">0%</span>
            </div>

            <h3 className="text-xl font-black text-white group-hover:text-orange-300 transition-colors">
              Zero Court Evidence Integrity
            </h3>

            <p className="text-xs text-zinc-400 leading-relaxed font-medium">
              Legacy paper reports lack pixel-level spatial evidence, immutable verification records and auditable supervisor overrides.
            </p>

            {/* Document Evidence Stack Visual */}
            <div className="p-3.5 rounded-2xl bg-[#070812] border border-zinc-800/90 space-y-2 font-mono text-[10px]">
              <div className="flex justify-between text-zinc-400 pb-1 border-b border-zinc-800">
                <span>EVIDENCE INTEGRITY LAYERS</span>
                <span className="text-rose-400 font-bold">UNCHECKED</span>
              </div>

              <div className="space-y-1.5 text-zinc-300">
                <div className="flex justify-between items-center">
                  <span>Paper Document Log</span>
                  <span className="text-amber-400 font-bold">PHYSICAL ONLY</span>
                </div>
                <div className="flex justify-between items-center text-rose-400">
                  <span>Spatial Bounding Box</span>
                  <span className="font-bold flex items-center gap-1"><XCircle className="w-3 h-3"/> ABSENT</span>
                </div>
                <div className="flex justify-between items-center text-rose-400">
                  <span>Immutable Audit Trail</span>
                  <span className="font-bold flex items-center gap-1"><XCircle className="w-3 h-3"/> ABSENT</span>
                </div>
                <div className="flex justify-between items-center text-rose-400">
                  <span>Supervisor Override Log</span>
                  <span className="font-bold flex items-center gap-1"><XCircle className="w-3 h-3"/> EDITABLE</span>
                </div>
              </div>
            </div>
          </div>

          {/* Impact & Status Badges */}
          <div className="pt-4 border-t border-orange-500/20 flex items-center justify-between text-[10px] font-mono font-bold">
            <span className="text-zinc-400">IMPACT: <span className="text-orange-400">COURT DISMISSALS</span></span>
            <span className="px-2.5 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/40">LEGAL RISK</span>
          </div>
        </motion.div>
      </motion.div>

      {/* ───────────────────────────────────────────────────────────────────────
          SECTION 4 — CENTRAL INSIGHT STRIP (Enterprise Risk Assessment)
      ─────────────────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 35 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#12080c]/95 via-[#0c0a18]/95 to-[#0b0c1a]/95 border border-amber-500/35 shadow-[0_30px_90px_rgba(0,0,0,0.9)] backdrop-blur-2xl text-left grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative overflow-hidden group hover:border-amber-400/60 transition-all"
      >
        {/* Subtle Ambient Background Glow */}
        <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />

        {/* Left Insight Text */}
        <div className="lg:col-span-7 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-mono font-extrabold tracking-wider shadow-[0_0_15px_rgba(245,158,11,0.2)]">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>THE CORE FAILURE</span>
          </div>
          <h4 className="text-lg sm:text-2xl font-black text-white leading-snug tracking-tight">
            "Manual inspection does not fail at a single step. <br className="hidden sm:inline" />
            It fails because every step depends on human attention, manual calculation and paper-based evidence."
          </h4>
          <p className="text-xs text-zinc-400 font-mono">
            Source: Legal Metrology Enforcement Audit & Verification Risk Matrix 2026
          </p>
        </div>

        {/* Right Risk Assessment Progress Bars */}
        <div className="lg:col-span-5 p-5 rounded-2xl bg-[#05060e] border border-zinc-800/90 space-y-3.5 font-mono text-[11px] shadow-2xl">
          <div className="text-zinc-400 font-extrabold text-[10px] tracking-wider pb-1.5 border-b border-zinc-800 flex justify-between items-center">
            <span>ENTERPRISE RISK ASSESSMENT</span>
            <span className="text-rose-400 font-bold px-2 py-0.2 rounded bg-rose-500/15 border border-rose-500/30">
              HIGH SEVERITY
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-zinc-300 text-[10px]">
              <span>HUMAN DEPENDENCY</span>
              <span className="text-rose-400 font-bold">90% (HIGH)</span>
            </div>
            <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden p-0.5 border border-zinc-700/50">
              <div className="h-full bg-gradient-to-r from-rose-500 to-rose-400 rounded-full w-[90%]" />
            </div>
          </div>

          <div className="space-y-1 pt-1">
            <div className="flex justify-between text-zinc-300 text-[10px]">
              <span>VERIFICATION DELAY</span>
              <span className="text-amber-400 font-bold">85% (HIGH)</span>
            </div>
            <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden p-0.5 border border-zinc-700/50">
              <div className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full w-[85%]" />
            </div>
          </div>

          <div className="space-y-1 pt-1">
            <div className="flex justify-between text-zinc-300 text-[10px]">
              <span>EVIDENCE TRACEABILITY</span>
              <span className="text-orange-400 font-bold">15% (LOW)</span>
            </div>
            <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden p-0.5 border border-zinc-700/50">
              <div className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full w-[15%]" />
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
