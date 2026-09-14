"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  Zap,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Layers,
  FileCheck2,
  Activity,
  BarChart3,
  Search,
  Lock,
  ChevronDown,
  Globe,
  Award,
  Sliders,
  AlertTriangle,
  Cpu,
  UserCheck,
  Building2,
  Check,
  ExternalLink,
} from "lucide-react";

export default function PublicLandingPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("ps26034_auth_token");
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-[#030306] text-white font-sans selection:bg-amber-500 selection:text-black relative overflow-x-hidden">
      {/* Background Mesh Gradient Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-indigo-600/15 via-purple-600/10 to-transparent blur-[140px] pointer-events-none" />
      <div className="absolute top-96 right-0 w-[500px] h-[500px] bg-amber-500/10 blur-[150px] pointer-events-none" />
      <div className="absolute top-[1200px] left-0 w-[500px] h-[500px] bg-emerald-500/10 blur-[150px] pointer-events-none" />

      {/* Grid Overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px)`,
          backgroundSize: "32px 32px",
        }}
      />

      {/* Sticky Glass Navbar */}
      <header className="sticky top-0 z-50 backdrop-blur-2xl bg-[#050508]/80 border-b border-white/10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-amber-500 via-yellow-500 to-amber-400 text-black shadow-[0_0_25px_rgba(245,158,11,0.35)] group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="text-base font-black tracking-tight text-white flex items-center gap-1.5">
                <span>PS 26034</span>
                <span className="text-amber-400 font-extrabold text-xs px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30">AI</span>
              </div>
              <p className="text-[10px] font-mono text-zinc-400 font-semibold tracking-wide uppercase">Legal Metrology Portal</p>
            </div>
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-bold text-zinc-400">
            <a href="#home" className="text-white hover:text-amber-400 transition-colors">Home</a>
            <a href="#features" className="hover:text-amber-400 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-amber-400 transition-colors">How it Works</a>
            <a href="#ai-engine" className="hover:text-amber-400 transition-colors">AI Engine</a>
            <a href="#faq" className="hover:text-amber-400 transition-colors">FAQ</a>
          </nav>

          {/* Action CTA Buttons */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link
                href="/dashboard"
                className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-black font-extrabold text-xs hover:scale-105 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center gap-2"
              >
                <Activity className="w-4 h-4" />
                <span>Go to Dashboard →</span>
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-xl text-xs font-extrabold text-zinc-300 hover:text-white hover:bg-zinc-800/60 transition-all border border-transparent hover:border-zinc-700"
                >
                  Log in
                </Link>
                <Link
                  href="/login"
                  className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-extrabold text-xs hover:scale-105 transition-all shadow-[0_0_25px_rgba(245,158,11,0.35)] flex items-center gap-2"
                >
                  <Zap className="w-3.5 h-3.5 fill-black" />
                  <span>Try Demo</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="home" className="relative pt-20 pb-24 px-6 max-w-7xl mx-auto text-center space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-900/90 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(245,158,11,0.15)]"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>PS 26034 Legal Metrology Platform 2.0 is Live</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.1] max-w-5xl mx-auto"
        >
          Enterprise Legal Metrology <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500">
            Inspection Intelligence
          </span>{" "}
          for Govt & Industry
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-base sm:text-lg text-zinc-400 max-w-3xl mx-auto font-medium leading-relaxed"
        >
          Automate Indian Legal Metrology (Packaged Commodities Rules 2011) compliance audits with Dual-OCR cross-checks, spatial bounding box evidence, deterministic rule validation, and supervisor review workflows.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-wrap items-center justify-center gap-4 pt-4"
        >
          <Link
            href="/dashboard"
            className="px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-400 text-black font-black text-sm hover:scale-105 transition-all shadow-[0_0_35px_rgba(245,158,11,0.4)] flex items-center gap-3"
          >
            <span>Launch Supervisor Portal</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/login"
            className="px-8 py-4 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-white font-extrabold text-sm transition-all border border-zinc-700/80 hover:border-zinc-500 flex items-center gap-3 shadow-lg"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Try Demo Credentials</span>
          </Link>
        </motion.div>

        {/* Live System Stats Banner */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-12 max-w-5xl mx-auto"
        >
          <div className="p-5 rounded-2xl bg-[#090a12] border border-white/10 text-center space-y-1">
            <div className="text-3xl font-black text-emerald-400 font-mono">0.0%</div>
            <div className="text-xs text-zinc-400 font-bold uppercase tracking-wider">False-PASS Rate</div>
          </div>
          <div className="p-5 rounded-2xl bg-[#090a12] border border-white/10 text-center space-y-1">
            <div className="text-3xl font-black text-amber-400 font-mono">Dual-OCR</div>
            <div className="text-xs text-zinc-400 font-bold uppercase tracking-wider">EasyOCR + Tesseract</div>
          </div>
          <div className="p-5 rounded-2xl bg-[#090a12] border border-white/10 text-center space-y-1">
            <div className="text-3xl font-black text-purple-400 font-mono">100%</div>
            <div className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Deterministic Validators</div>
          </div>
          <div className="p-5 rounded-2xl bg-[#090a12] border border-white/10 text-center space-y-1">
            <div className="text-3xl font-black text-white font-mono">&lt; 20s</div>
            <div className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Audit Execution Time</div>
          </div>
        </motion.div>
      </section>

      {/* Features Grid Matrix */}
      <section id="features" className="py-20 px-6 max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-3">
          <div className="text-xs font-mono font-extrabold text-amber-400 uppercase tracking-widest">Platform Capabilities</div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">Engineered for Zero Non-Compliance</h2>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl mx-auto">
            From mobile camera capture to supervisor decision quality tracking, every layer is audited and append-only.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-7 rounded-3xl bg-[#07080e] border border-white/10 hover:border-amber-500/40 transition-all space-y-4 shadow-xl group">
            <div className="p-3.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30 w-fit group-hover:scale-110 transition-transform">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-extrabold text-white">Role-Based Photo Capture</h3>
            <p className="text-xs text-zinc-400 leading-relaxed font-medium">
              Enforced Front, Back, and Close-up photo slots with blur quality scoring and DCT perceptual hash (pHash) duplicate photo protection.
            </p>
          </div>

          <div className="p-7 rounded-3xl bg-[#07080e] border border-white/10 hover:border-purple-500/40 transition-all space-y-4 shadow-xl group">
            <div className="p-3.5 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/30 w-fit group-hover:scale-110 transition-transform">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-extrabold text-white">Dual-OCR Spatial Map</h3>
            <p className="text-xs text-zinc-400 leading-relaxed font-medium">
              EasyOCR + Tesseract secondary cross-check with 1:1 pixel coordinate bounding boxes mapped across packaging labels.
            </p>
          </div>

          <div className="p-7 rounded-3xl bg-[#07080e] border border-white/10 hover:border-emerald-500/40 transition-all space-y-4 shadow-xl group">
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 w-fit group-hover:scale-110 transition-transform">
              <FileCheck2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-extrabold text-white">Deterministic Rule Engine</h3>
            <p className="text-xs text-zinc-400 leading-relaxed font-medium">
              Pure-function validators for MRP, Net Quantity, Mfg Date, Manufacturer entities, and Consumer Helpline proximity rules.
            </p>
          </div>

          <div className="p-7 rounded-3xl bg-[#07080e] border border-white/10 hover:border-blue-500/40 transition-all space-y-4 shadow-xl group">
            <div className="p-3.5 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/30 w-fit group-hover:scale-110 transition-transform">
              <UserCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-extrabold text-white">Inspector-vs-AI Reconciliation</h3>
            <p className="text-xs text-zinc-400 leading-relaxed font-medium">
              Surfaces field disagreements directly on mobile (`You entered MRP ₹180, AI detected ₹149`) with explicit resolution actions.
            </p>
          </div>

          <div className="p-7 rounded-3xl bg-[#07080e] border border-white/10 hover:border-amber-500/40 transition-all space-y-4 shadow-xl group">
            <div className="p-3.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30 w-fit group-hover:scale-110 transition-transform">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-extrabold text-white">Append-Only Audit Trail</h3>
            <p className="text-xs text-zinc-400 leading-relaxed font-medium">
              Un-editable legal inspection logs with supervisor override reasons (`ReviewRecord`) protecting court evidence integrity.
            </p>
          </div>

          <div className="p-7 rounded-3xl bg-[#07080e] border border-white/10 hover:border-rose-500/40 transition-all space-y-4 shadow-xl group">
            <div className="p-3.5 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/30 w-fit group-hover:scale-110 transition-transform">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-extrabold text-white">Decision Quality Analytics</h3>
            <p className="text-xs text-zinc-400 leading-relaxed font-medium">
              Real-time Recharts KPI metrics tracking review rates, supervisor override vs confirmation rates, and top review fields.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works Timeline */}
      <section id="how-it-works" className="py-20 px-6 max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-3">
          <div className="text-xs font-mono font-extrabold text-emerald-400 uppercase tracking-widest">Inspection Lifecycle</div>
          <h2 className="text-3xl sm:text-4xl font-black text-white">How the Inspection Engine Operates</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
          <div className="p-6 rounded-3xl bg-zinc-950 border border-zinc-800 space-y-3">
            <div className="text-2xl font-black text-amber-400 font-mono">01</div>
            <h4 className="text-sm font-extrabold text-white">Capture Photos</h4>
            <p className="text-xs text-zinc-400 leading-relaxed font-medium">
              Inspector snaps Front, Back, and Close-up packaging photos on Mobile app.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-zinc-950 border border-zinc-800 space-y-3">
            <div className="text-2xl font-black text-purple-400 font-mono">02</div>
            <h4 className="text-sm font-extrabold text-white">Dual-OCR & Context Scoring</h4>
            <p className="text-xs text-zinc-400 leading-relaxed font-medium">
              Backend runs EasyOCR + Tesseract, scores context windows, and evaluates rule compliance.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-zinc-950 border border-zinc-800 space-y-3">
            <div className="text-2xl font-black text-blue-400 font-mono">03</div>
            <h4 className="text-sm font-extrabold text-white">Reconcile Diff</h4>
            <p className="text-xs text-zinc-400 leading-relaxed font-medium">
              Inspector confirms AI extraction or enters structured correction for REVIEW fields.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-zinc-950 border border-zinc-800 space-y-3">
            <div className="text-2xl font-black text-emerald-400 font-mono">04</div>
            <h4 className="text-sm font-extrabold text-white">Supervisor Verification</h4>
            <p className="text-xs text-zinc-400 leading-relaxed font-medium">
              Supervisors inspect visual Bounding Boxes on Web Portal and log append-only report.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section id="faq" className="py-20 px-6 max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-3">
          <div className="text-xs font-mono font-extrabold text-amber-400 uppercase tracking-widest">Questions & Answers</div>
          <h2 className="text-3xl font-black text-white">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-4">
          {[
            {
              q: "Why is LLM not allowed to decide PASS or FAIL compliance verdicts?",
              a: "Per CONTRACTS.md §6, LLMs can hallucinate non-existent text or misread numeric cutoffs. Compliance verdicts MUST be 100% deterministic, repeatable, and pure functions to withstand legal court challenges.",
            },
            {
              q: "How does the system handle blurry photos or unsupported languages?",
              a: "Blurry images trigger low-confidence OCR scores (< 0.60), and unrecognized scripts trigger NOT_VERIFIABLE. Both safely cap the outcome at REVIEW — never a guessed PASS or silent FAIL.",
            },
            {
              q: "Can supervisors override an AI decision on the Web Dashboard?",
              a: "Yes. Supervisors can view bounding box evidence on the Web Portal and submit an override. The override is saved as a new ReviewRecord with reviewer_id and reason, leaving the original report intact for legal auditability.",
            },
          ].map((item, index) => (
            <div
              key={index}
              onClick={() => toggleFaq(index)}
              className="p-6 rounded-2xl bg-[#08090f] border border-white/10 cursor-pointer hover:border-amber-500/40 transition-all space-y-2"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-extrabold text-white">{item.q}</h4>
                <ChevronDown className={`w-4 h-4 text-amber-400 transition-transform ${activeFaq === index ? 'rotate-180' : ''}`} />
              </div>
              {activeFaq === index && (
                <p className="text-xs text-zinc-400 leading-relaxed pt-2 font-medium">{item.a}</p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#020204] py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-6 text-xs text-zinc-500 font-medium">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            <span className="text-zinc-300 font-bold">PS 26034 Legal Metrology Platform</span>
            <span>— Smart India Hackathon Govt of India Division</span>
          </div>
          <div>© 2026 PS 26034 Team. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
