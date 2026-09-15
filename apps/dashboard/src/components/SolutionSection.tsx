"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ScanLine,
  Cpu,
  CheckCircle2,
  UserCheck,
  Lock,
  ArrowRight,
  ShieldCheck,
  Check,
  AlertTriangle,
  RefreshCw,
  FileCheck2,
  Layers,
  Sparkles,
  Terminal,
  Crosshair,
  Shield,
  Activity,
  FileText,
  Key,
  ChevronRight,
  Database,
  Eye,
  Sliders,
  Maximize2,
  CheckCircle,
} from "lucide-react";

export default function SolutionSection() {
  const [activeStage, setActiveStage] = useState<number>(0);
  const [reconciliationChoice, setReconciliationChoice] = useState<"pending" | "ai" | "inspector" | "recheck">("pending");

  const pipelineStages = [
    {
      id: "stage-01",
      number: "01",
      eyebrow: "01 / CAPTURE",
      title: "Packaging Evidence",
      shortDesc: "High-res multi-slot field capture",
      icon: ScanLine,
      accentColor: "cyan",
      badge: "INPUT EVIDENCE",
    },
    {
      id: "stage-02",
      number: "02",
      eyebrow: "02 / PERCEPTION",
      title: "Spatial OCR & Mapping",
      shortDesc: "Pixel coordinates + entity extraction",
      icon: Cpu,
      accentColor: "sky",
      badge: "DUAL-OCR 99.8%",
    },
    {
      id: "stage-03",
      number: "03",
      eyebrow: "03 / COMPLIANCE",
      title: "Deterministic Rule Engine",
      shortDesc: "Rule 2011 pure-function validation",
      icon: CheckCircle2,
      accentColor: "emerald",
      badge: "0% HALLUCINATION",
    },
    {
      id: "stage-04",
      number: "04",
      eyebrow: "04 / HUMAN + AI",
      title: "Inspector-AI Reconciliation",
      shortDesc: "Conflict detection & supervisor review",
      icon: UserCheck,
      accentColor: "amber",
      badge: "HUMAN DECIDES",
    },
    {
      id: "stage-05",
      number: "05",
      eyebrow: "05 / EVIDENCE",
      title: "Court-Ready Audit Trail",
      shortDesc: "Cryptographic hash & locked decision",
      icon: Lock,
      accentColor: "indigo",
      badge: "APPEND-ONLY",
    },
  ];

  return (
    <section id="solution" className="py-24 px-4 sm:px-6 max-w-7xl mx-auto space-y-16 relative z-10 font-sans selection:bg-cyan-500 selection:text-black">
      {/* Background Ambient Glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-r from-cyan-500/10 via-blue-600/10 to-violet-600/10 rounded-full blur-[140px]" />
      </div>

      {/* SECTION HERO HEADER */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="text-center space-y-5 max-w-4xl mx-auto"
      >
        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-bold uppercase tracking-widest shadow-[0_0_20px_rgba(6,182,212,0.2)] backdrop-blur-xl">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>THE PS26034 SOLUTION</span>
        </div>

        {/* Main Headline */}
        <h2 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-white leading-[1.08]">
          From Inspection <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500 drop-shadow-[0_0_35px_rgba(6,182,212,0.4)]">
            to Defensible Evidence.
          </span>
        </h2>

        {/* Supporting Line */}
        <p className="text-xs sm:text-base text-zinc-400 max-w-3xl mx-auto font-medium leading-relaxed">
          PS26034 transforms raw packaging evidence into a structured, rule-validated and auditable compliance decision — without relying on fragmented manual workflows.
        </p>

        {/* Central Transformation Indicator Strip */}
        <div className="pt-4 flex flex-wrap items-center justify-center gap-3 text-xs font-mono">
          <span className="px-3 py-1.5 rounded-lg bg-zinc-900/90 border border-zinc-800 text-zinc-400">
            UNSTRUCTURED FIELD EVIDENCE
          </span>
          <div className="flex items-center gap-1.5 text-cyan-400 font-bold px-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            <ArrowRight className="w-4 h-4 text-cyan-400" />
            <span className="text-[11px] uppercase tracking-wider text-cyan-300">PS26034 INTELLIGENCE LAYER</span>
            <ArrowRight className="w-4 h-4 text-cyan-400" />
          </div>
          <span className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/40 text-cyan-300 font-bold">
            STRUCTURED DEFENSIBLE DECISION
          </span>
        </div>
      </motion.div>

      {/* PIPELINE NAVIGATION BAR (DESKTOP & MOBILE STAGE TRACKER) */}
      <div className="w-full max-w-6xl mx-auto space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {pipelineStages.map((stage, idx) => {
            const isActive = activeStage === idx;
            const IconComponent = stage.icon;
            return (
              <button
                key={stage.id}
                onClick={() => setActiveStage(idx)}
                className={`relative p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between min-h-[95px] ${
                  isActive
                    ? "bg-gradient-to-b from-[#0e1626] to-[#0a0f1c] border-cyan-500/60 shadow-[0_10px_30px_rgba(6,182,212,0.25)] scale-[1.02]"
                    : "bg-[#080912]/80 border-zinc-800/80 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md ${
                    isActive ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40" : "bg-zinc-900 text-zinc-500"
                  }`}>
                    {stage.eyebrow}
                  </span>
                  <IconComponent className={`w-4 h-4 ${isActive ? "text-cyan-400" : "text-zinc-500"}`} />
                </div>

                <div className="space-y-0.5 pt-2">
                  <div className={`text-xs font-bold truncate ${isActive ? "text-white" : "text-zinc-300"}`}>
                    {stage.title}
                  </div>
                  <div className="text-[10px] text-zinc-500 font-mono truncate">{stage.shortDesc}</div>
                </div>

                {/* Animated active indicator bar */}
                {isActive && (
                  <motion.div
                    layoutId="pipelineActiveBar"
                    className="absolute -bottom-1 inset-x-4 h-0.5 bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 rounded-full shadow-[0_0_10px_#06b6d4]"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* PIPELINE CONNECTING DATA STREAM LINE */}
        <div className="relative w-full h-1 bg-zinc-900 rounded-full overflow-hidden hidden lg:block">
          <motion.div
            className="absolute top-0 bottom-0 bg-gradient-to-r from-cyan-500 via-sky-400 to-blue-600 rounded-full shadow-[0_0_12px_#06b6d4]"
            animate={{
              left: `${(activeStage / 4) * 80}%`,
              width: "20%",
            }}
            transition={{ type: "spring", stiffness: 250, damping: 25 }}
          />
        </div>
      </div>

      {/* MAIN ENTERPRISE INSPECTION PIPELINE STAGE DISPLAY */}
      <div className="w-full max-w-6xl mx-auto">
        <AnimatePresence mode="wait">
          {/* STAGE 01: RAW EVIDENCE CAPTURE */}
          {activeStage === 0 && (
            <motion.div
              key="stage-01-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.35 }}
              className="p-6 sm:p-10 rounded-3xl bg-gradient-to-b from-[#0a0f1c]/95 via-[#080b16]/95 to-[#05070f]/95 border border-cyan-500/35 shadow-[0_25px_80px_rgba(0,0,0,0.8)] backdrop-blur-2xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
            >
              {/* Left Column Description */}
              <div className="lg:col-span-5 space-y-6">
                <div className="flex items-center gap-3">
                  <span className="p-2.5 rounded-xl bg-cyan-500/15 border border-cyan-500/40 text-cyan-400">
                    <ScanLine className="w-5 h-5" />
                  </span>
                  <div>
                    <span className="text-[10px] font-mono font-extrabold text-cyan-400 uppercase tracking-widest">
                      STAGE 01 / CAPTURE
                    </span>
                    <h3 className="text-2xl font-black text-white">Packaging Evidence</h3>
                  </div>
                </div>

                <p className="text-xs text-zinc-300 leading-relaxed font-medium">
                  The inspection pipeline starts directly from actual field evidence. Field officers capture structured front, back, and detail label images with EXIF timestamping and pHash duplicate protection.
                </p>

                {/* Metadata badges */}
                <div className="space-y-2 pt-2 border-t border-zinc-800">
                  <div className="text-[11px] font-mono text-zinc-400 font-semibold uppercase tracking-wider">
                    EVIDENCE METADATA ATTACHED
                  </div>
                  <div className="flex flex-wrap gap-2 text-[10px] font-mono">
                    <span className="px-2.5 py-1 rounded-md bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 font-bold flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                      IMAGE RECEIVED (4K HDR)
                    </span>
                    <span className="px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300 font-bold">
                      TIMESTAMP: 2026-09-15 14:32:08
                    </span>
                    <span className="px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300 font-bold">
                      LAT/LONG: 28.6139, 77.2090
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column Visual Mockup */}
              <div className="lg:col-span-7 bg-[#04050a] p-6 rounded-2xl border border-cyan-500/30 shadow-inner relative overflow-hidden space-y-4">
                <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 border-b border-zinc-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Crosshair className="w-4 h-4 text-cyan-400 animate-spin" style={{ animationDuration: "8s" }} />
                    <span className="font-bold text-white">FIELD EVIDENCE DISPLAY</span>
                  </div>
                  <span className="text-cyan-400 font-bold bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/30">
                    RAW IMAGE #8921
                  </span>
                </div>

                {/* Stylized Package Label CSS Visual */}
                <div className="relative p-6 rounded-xl bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-zinc-700/80 space-y-4 font-mono">
                  {/* Bounding Box Overlay 1: MRP */}
                  <div className="relative p-3 rounded-lg bg-cyan-950/40 border-2 border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                    <span className="absolute -top-3 right-3 text-[9px] font-black bg-cyan-500 text-black px-1.5 rounded uppercase">
                      BOUNDING [X:142 Y:388]
                    </span>
                    <div className="text-xs text-zinc-400">MAX RETAIL PRICE (INCL. TAXES):</div>
                    <div className="text-xl font-extrabold text-white flex items-center justify-between pt-0.5">
                      <span>MRP ₹149.00</span>
                      <span className="text-[10px] text-cyan-300 font-bold">(₹0.298/g)</span>
                    </div>
                  </div>

                  {/* Other Label Data */}
                  <div className="grid grid-cols-2 gap-3 text-xs text-zinc-300">
                    <div className="p-2.5 rounded-lg bg-zinc-900/90 border border-zinc-800 space-y-0.5">
                      <div className="text-[10px] text-zinc-500 font-bold uppercase">NET QUANTITY</div>
                      <div className="font-bold text-white">500g (Net Wt.)</div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-zinc-900/90 border border-zinc-800 space-y-0.5">
                      <div className="text-[10px] text-zinc-500 font-bold uppercase">MFG & PKD DATE</div>
                      <div className="font-bold text-white">08/2026</div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-zinc-900/90 border border-zinc-800 space-y-0.5">
                    <div className="text-[10px] text-zinc-500 font-bold uppercase">MANUFACTURER ADDRESS</div>
                    <div className="font-bold text-zinc-200 text-[11px] truncate">Hindustan Metrology Corp, Unit 4, Sector 62, Noida UP</div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* STAGE 02: SPATIAL OCR & PERCEPTION */}
          {activeStage === 1 && (
            <motion.div
              key="stage-02-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.35 }}
              className="p-6 sm:p-10 rounded-3xl bg-gradient-to-b from-[#0a1220]/95 via-[#080d18]/95 to-[#05070f]/95 border border-sky-500/35 shadow-[0_25px_80px_rgba(0,0,0,0.8)] backdrop-blur-2xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
            >
              {/* Left Column Description */}
              <div className="lg:col-span-5 space-y-6">
                <div className="flex items-center gap-3">
                  <span className="p-2.5 rounded-xl bg-sky-500/15 border border-sky-500/40 text-sky-400">
                    <Cpu className="w-5 h-5" />
                  </span>
                  <div>
                    <span className="text-[10px] font-mono font-extrabold text-sky-400 uppercase tracking-widest">
                      STAGE 02 / PERCEPTION
                    </span>
                    <h3 className="text-2xl font-black text-white">Spatial OCR & Mapping</h3>
                  </div>
                </div>

                <p className="text-xs text-zinc-300 leading-relaxed font-medium">
                  PS26034 doesn't just read text; it maps exact 1:1 pixel coordinate bounding boxes. The Dual-OCR engine (EasyOCR + Tesseract) cross-validates characters with 99.8% confidence.
                </p>

                {/* Flow Diagram */}
                <div className="p-3.5 rounded-xl bg-black/50 border border-sky-500/20 text-xs font-mono space-y-2">
                  <div className="text-[10px] text-sky-300 font-bold uppercase">PERCEPTION TRANSFORMATION FLOW</div>
                  <div className="flex items-center justify-between text-[11px] text-zinc-300 font-bold">
                    <span>IMAGE</span>
                    <ArrowRight className="w-3.5 h-3.5 text-sky-400" />
                    <span>TEXT</span>
                    <ArrowRight className="w-3.5 h-3.5 text-sky-400" />
                    <span>COORDINATES</span>
                    <ArrowRight className="w-3.5 h-3.5 text-sky-400" />
                    <span className="text-sky-300">EVIDENCE</span>
                  </div>
                </div>
              </div>

              {/* Right Column Spatial OCR Scanning Engine Screen */}
              <div className="lg:col-span-7 bg-[#04050a] p-6 rounded-2xl border border-sky-500/30 shadow-inner relative space-y-4">
                <div className="flex items-center justify-between text-[11px] font-mono border-b border-zinc-800 pb-3">
                  <span className="font-bold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
                    SPATIAL OVERLAY SCANNER
                  </span>
                  <span className="text-sky-300 font-bold">CONFIDENCE: 99.8%</span>
                </div>

                {/* Scanning Laser animation line */}
                <div className="relative p-5 rounded-xl bg-zinc-950 border border-sky-500/40 space-y-3 font-mono overflow-hidden">
                  <motion.div
                    animate={{ y: [0, 140, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-sky-400 to-transparent shadow-[0_0_15px_#38bdf8] z-10"
                  />

                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-sky-950/30 border border-sky-500/40 text-xs">
                    <div>
                      <span className="text-sky-300 font-bold">ENTITY: MRP</span>
                      <div className="text-[10px] text-zinc-400">Text: "₹149.00"</div>
                    </div>
                    <div className="text-[10px] font-mono text-sky-400 font-bold text-right">
                      CONF: 99.8% <br />
                      BOX: [X:142 Y:388 W:96 H:32]
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-sky-950/30 border border-sky-500/40 text-xs">
                    <div>
                      <span className="text-sky-300 font-bold">ENTITY: NET_QUANTITY</span>
                      <div className="text-[10px] text-zinc-400">Text: "500 g"</div>
                    </div>
                    <div className="text-[10px] font-mono text-sky-400 font-bold text-right">
                      CONF: 99.4% <br />
                      BOX: [X:142 Y:430 W:80 H:28]
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-sky-950/30 border border-sky-500/40 text-xs">
                    <div>
                      <span className="text-sky-300 font-bold">ENTITY: MFG_DATE</span>
                      <div className="text-[10px] text-zinc-400">Text: "08/2026"</div>
                    </div>
                    <div className="text-[10px] font-mono text-sky-400 font-bold text-right">
                      CONF: 99.1% <br />
                      BOX: [X:230 Y:430 W:75 H:28]
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* STAGE 03: DETERMINISTIC RULE ENGINE */}
          {activeStage === 2 && (
            <motion.div
              key="stage-03-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.35 }}
              className="p-6 sm:p-10 rounded-3xl bg-gradient-to-b from-[#0a1812]/95 via-[#08120d]/95 to-[#05070f]/95 border border-emerald-500/35 shadow-[0_25px_80px_rgba(0,0,0,0.8)] backdrop-blur-2xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
            >
              {/* Left Column Description */}
              <div className="lg:col-span-5 space-y-6">
                <div className="flex items-center gap-3">
                  <span className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400">
                    <CheckCircle2 className="w-5 h-5" />
                  </span>
                  <div>
                    <span className="text-[10px] font-mono font-extrabold text-emerald-400 uppercase tracking-widest">
                      STAGE 03 / COMPLIANCE
                    </span>
                    <h3 className="text-2xl font-black text-white">Deterministic Rule Engine</h3>
                  </div>
                </div>

                <p className="text-xs text-zinc-300 leading-relaxed font-medium">
                  Legal metrology compliance is validated using pure-function deterministic mathematical validators — <span className="text-emerald-300 font-bold">NEVER generated by an LLM</span>. Rule 2011 formulas execute with 0% hallucination risk.
                </p>

                {/* Rule Execution Flow */}
                <div className="p-3.5 rounded-xl bg-black/50 border border-emerald-500/20 text-xs font-mono space-y-2">
                  <div className="text-[10px] text-emerald-300 font-bold uppercase">PURE FUNCTION EVALUATION</div>
                  <div className="text-[11px] text-zinc-300 font-semibold">
                    INPUT (₹149 / 500g) → RULE_2011_UNIT_PRICE → RESULT (<span className="text-emerald-400 font-bold">₹298/kg PASS</span>)
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 text-[10px] font-mono">
                  <span className="px-2.5 py-1 rounded-md bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-bold">
                    PURE FUNCTION
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-bold">
                    DETERMINISTIC
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300 font-bold">
                    AUDITABLE
                  </span>
                </div>
              </div>

              {/* Right Column Rule Validation Table Visual */}
              <div className="lg:col-span-7 bg-[#04050a] p-6 rounded-2xl border border-emerald-500/30 shadow-inner space-y-3 font-mono">
                <div className="flex items-center justify-between text-[11px] border-b border-zinc-800 pb-3">
                  <span className="font-bold text-white flex items-center gap-2">
                    <FileCheck2 className="w-4 h-4 text-emerald-400" />
                    RULE 2011 LEGAL EXECUTION MATRIX
                  </span>
                  <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                    STATUS: ACTIVE
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-900/90 border border-emerald-500/30">
                    <div>
                      <span className="text-white font-bold">MRP / UNIT PRICE FORMULA</span>
                      <div className="text-[10px] text-zinc-400">Unit Price = ₹298.00 / kg (Calculated)</div>
                    </div>
                    <span className="px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-black flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> PASS
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-900/90 border border-emerald-500/30">
                    <div>
                      <span className="text-white font-bold">NET QUANTITY STANDARDS</span>
                      <div className="text-[10px] text-zinc-400">500g within Rule 2011 Schedule 2 Tolerance</div>
                    </div>
                    <span className="px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-black flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> PASS
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-900/90 border border-emerald-500/30">
                    <div>
                      <span className="text-white font-bold">MFG / EXPIRY DATE THRESHOLD</span>
                      <div className="text-[10px] text-zinc-400">Date 08/2026 verified valid format</div>
                    </div>
                    <span className="px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-black flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> PASS
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-900/90 border border-amber-500/30">
                    <div>
                      <span className="text-white font-bold">CONSUMER HELPLINE PROXIMITY</span>
                      <div className="text-[10px] text-zinc-400">Helpline text located within 12px of edge boundary</div>
                    </div>
                    <span className="px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 font-black flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> REVIEW
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* STAGE 04: INSPECTOR VS AI RECONCILIATION */}
          {activeStage === 3 && (
            <motion.div
              key="stage-04-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.35 }}
              className="p-6 sm:p-10 rounded-3xl bg-gradient-to-b from-[#18120a]/95 via-[#120e08]/95 to-[#05070f]/95 border border-amber-500/35 shadow-[0_25px_80px_rgba(0,0,0,0.8)] backdrop-blur-2xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
            >
              {/* Left Column Description */}
              <div className="lg:col-span-5 space-y-6">
                <div className="flex items-center gap-3">
                  <span className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-400">
                    <UserCheck className="w-5 h-5" />
                  </span>
                  <div>
                    <span className="text-[10px] font-mono font-extrabold text-amber-400 uppercase tracking-widest">
                      STAGE 04 / HUMAN + AI
                    </span>
                    <h3 className="text-2xl font-black text-white">Inspector vs AI Reconciliation</h3>
                  </div>
                </div>

                <p className="text-xs text-zinc-300 leading-relaxed font-medium">
                  PS26034 doesn't override human authority. When field officer input differs from spatial OCR detection, a structured disagreement resolution workflow is triggered.
                </p>

                <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/40 text-amber-200 text-xs font-mono font-bold space-y-1">
                  <div>PRINCIPLE: AI ASSISTS. HUMAN DECIDES.</div>
                  <div className="text-[10px] text-zinc-400 font-medium">
                    Every supervisor override is recorded into the immutable court audit trail.
                  </div>
                </div>
              </div>

              {/* Right Column Split Reconciliation Interface */}
              <div className="lg:col-span-7 bg-[#04050a] p-6 rounded-2xl border border-amber-500/30 shadow-inner space-y-4 font-mono">
                <div className="flex items-center justify-between text-[11px] border-b border-zinc-800 pb-3">
                  <span className="font-bold text-white flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 animate-pulse" />
                    FIELD RECONCILIATION INTERFACE
                  </span>
                  <span className="text-amber-300 font-bold bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/40">
                    DISAGREEMENT DETECTED
                  </span>
                </div>

                {/* Split comparison card */}
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-700 space-y-2">
                    <div className="text-[10px] text-zinc-400 uppercase font-bold">FIELD INSPECTOR INPUT</div>
                    <div className="text-xl font-black text-white">MRP = ₹180.00</div>
                    <div className="text-[10px] text-zinc-500">Manual Entry by Officer #402</div>
                  </div>

                  <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/50 space-y-2">
                    <div className="text-[10px] text-amber-400 uppercase font-bold">PS26034 AI OCR DETECTION</div>
                    <div className="text-xl font-black text-amber-300">MRP = ₹149.00</div>
                    <div className="text-[10px] text-amber-200/70">Bounding Box B-142 (99.8%)</div>
                  </div>
                </div>

                {/* Resolution actions buttons */}
                <div className="pt-2 space-y-2">
                  <div className="text-[10px] text-zinc-400 font-bold uppercase">SELECT RECONCILIATION ACTION:</div>
                  <div className="grid grid-cols-3 gap-2 text-xs font-bold">
                    <button
                      onClick={() => setReconciliationChoice("ai")}
                      className={`py-2.5 px-2 rounded-lg border transition-all cursor-pointer text-center ${
                        reconciliationChoice === "ai"
                          ? "bg-amber-500 text-black border-amber-400 font-black shadow-[0_0_15px_rgba(245,158,11,0.4)]"
                          : "bg-zinc-900 text-amber-300 border-amber-500/40 hover:bg-zinc-800"
                      }`}
                    >
                      ACCEPT AI (₹149)
                    </button>
                    <button
                      onClick={() => setReconciliationChoice("inspector")}
                      className={`py-2.5 px-2 rounded-lg border transition-all cursor-pointer text-center ${
                        reconciliationChoice === "inspector"
                          ? "bg-amber-500 text-black border-amber-400 font-black shadow-[0_0_15px_rgba(245,158,11,0.4)]"
                          : "bg-zinc-900 text-zinc-300 border-zinc-700 hover:bg-zinc-800"
                      }`}
                    >
                      ACCEPT INSPECTOR
                    </button>
                    <button
                      onClick={() => setReconciliationChoice("recheck")}
                      className={`py-2.5 px-2 rounded-lg border transition-all cursor-pointer text-center ${
                        reconciliationChoice === "recheck"
                          ? "bg-amber-500 text-black border-amber-400 font-black shadow-[0_0_15px_rgba(245,158,11,0.4)]"
                          : "bg-zinc-900 text-zinc-400 border-zinc-700 hover:bg-zinc-800"
                      }`}
                    >
                      REQUEST RECHECK
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* STAGE 05: COURT-READY AUDIT RECORD */}
          {activeStage === 4 && (
            <motion.div
              key="stage-05-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.35 }}
              className="p-6 sm:p-10 rounded-3xl bg-gradient-to-b from-[#0e1026]/95 via-[#090b1c]/95 to-[#05070f]/95 border border-indigo-500/35 shadow-[0_25px_80px_rgba(0,0,0,0.8)] backdrop-blur-2xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
            >
              {/* Left Column Description */}
              <div className="lg:col-span-5 space-y-6">
                <div className="flex items-center gap-3">
                  <span className="p-2.5 rounded-xl bg-indigo-500/15 border border-indigo-500/40 text-indigo-400">
                    <Lock className="w-5 h-5" />
                  </span>
                  <div>
                    <span className="text-[10px] font-mono font-extrabold text-indigo-400 uppercase tracking-widest">
                      STAGE 05 / EVIDENCE
                    </span>
                    <h3 className="text-2xl font-black text-white">Court-Ready Audit Trail</h3>
                  </div>
                </div>

                <p className="text-xs text-zinc-300 leading-relaxed font-medium">
                  The complete inspection decision is sealed into an un-editable, append-only court evidence record with SHA-256 cryptographic hashes and supervisor verification signatures.
                </p>

                {/* Vertical Audit Progression */}
                <div className="p-3.5 rounded-xl bg-black/50 border border-indigo-500/20 text-xs font-mono space-y-2">
                  <div className="text-[10px] text-indigo-300 font-bold uppercase">TRACEABLE EVIDENCE PIPELINE</div>
                  <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-bold text-zinc-300">
                    <span className="text-indigo-400">CAPTURED</span>
                    <ChevronRight className="w-3 h-3 text-zinc-600" />
                    <span className="text-indigo-400">ANALYZED</span>
                    <ChevronRight className="w-3 h-3 text-zinc-600" />
                    <span className="text-indigo-400">VALIDATED</span>
                    <ChevronRight className="w-3 h-3 text-zinc-600" />
                    <span className="text-indigo-400">REVIEWED</span>
                    <ChevronRight className="w-3 h-3 text-zinc-600" />
                    <span className="text-emerald-400 font-black">SEALED</span>
                  </div>
                </div>
              </div>

              {/* Right Column Sealed Evidence Document Visual */}
              <div className="lg:col-span-7 bg-[#04050a] p-6 rounded-2xl border border-indigo-500/30 shadow-inner space-y-4 font-mono">
                <div className="flex items-center justify-between text-[11px] border-b border-zinc-800 pb-3">
                  <span className="font-bold text-white flex items-center gap-2">
                    <Lock className="w-4 h-4 text-indigo-400" />
                    CRYPTOGRAPHIC EVIDENCE RECORD
                  </span>
                  <span className="text-indigo-300 font-bold bg-indigo-500/20 px-2 py-0.5 rounded border border-indigo-500/40">
                    STATUS: APPEND-ONLY
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-zinc-950 border border-indigo-500/30 space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-3 text-[11px]">
                    <div>
                      <span className="text-zinc-500 text-[10px] uppercase font-bold">CASE RECORD ID</span>
                      <div className="font-extrabold text-white">PS26034-INS-00182</div>
                    </div>
                    <div>
                      <span className="text-zinc-500 text-[10px] uppercase font-bold">TIMESTAMP</span>
                      <div className="font-extrabold text-white">15 SEP 2026 · 14:32:08</div>
                    </div>
                    <div>
                      <span className="text-zinc-500 text-[10px] uppercase font-bold">EVIDENCE HASH</span>
                      <div className="font-extrabold text-indigo-300 truncate">8F4A91C2...E701B4</div>
                    </div>
                    <div>
                      <span className="text-zinc-500 text-[10px] uppercase font-bold">RULE RESULTS</span>
                      <div className="font-extrabold text-emerald-400">7 PASS / 1 REVIEW</div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-zinc-800 flex items-center justify-between text-[11px]">
                    <span className="text-zinc-400">SUPERVISOR APPROVAL: <strong className="text-white">VERIFIED (#SUP-902)</strong></span>
                    <span className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-black text-[10px]">
                      SEALED COURT EVIDENCE
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* KEY DIFFERENTIATOR CAPABILITY STRIP */}
      <div className="w-full max-w-6xl mx-auto pt-6 space-y-6">
        <div className="text-center space-y-1">
          <div className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest">
            ENTERPRISE SYSTEM ARCHITECTURE
          </div>
          <h3 className="text-2xl font-black text-white">ONE INSPECTION. ONE TRACEABLE DECISION.</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-[#090b14]/90 border border-cyan-500/30 space-y-2 backdrop-blur-xl shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-cyan-400">01 / CAPABILITY</span>
              <Crosshair className="w-4 h-4 text-cyan-400" />
            </div>
            <h4 className="text-sm font-black text-white">SPATIAL EVIDENCE</h4>
            <p className="text-xs text-zinc-400 font-medium leading-relaxed">
              1:1 pixel coordinate bounding box overlays directly linked to OCR source characters.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#090b14]/90 border border-emerald-500/30 space-y-2 backdrop-blur-xl shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-emerald-400">02 / CAPABILITY</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <h4 className="text-sm font-black text-white">DETERMINISTIC RULES</h4>
            <p className="text-xs text-zinc-400 font-medium leading-relaxed">
              Packaged Commodities Rule 2011 pure functions with zero LLM hallucination risk.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#090b14]/90 border border-amber-500/30 space-y-2 backdrop-blur-xl shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-amber-400">03 / CAPABILITY</span>
              <UserCheck className="w-4 h-4 text-amber-400" />
            </div>
            <h4 className="text-sm font-black text-white">HUMAN-AI RECONCILIATION</h4>
            <p className="text-xs text-zinc-400 font-medium leading-relaxed">
              Inspector vs AI conflict detection with mandatory supervisor override audit logs.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#090b14]/90 border border-indigo-500/30 space-y-2 backdrop-blur-xl shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-indigo-400">04 / CAPABILITY</span>
              <Lock className="w-4 h-4 text-indigo-400" />
            </div>
            <h4 className="text-sm font-black text-white">IMMUTABLE AUDIT TRAIL</h4>
            <p className="text-xs text-zinc-400 font-medium leading-relaxed">
              SHA-256 cryptographic hash seals preserving court-admissible evidence integrity.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
