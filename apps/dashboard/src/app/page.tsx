"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useScroll, useTransform, useInView } from "framer-motion";
import KineticGrid from "@/components/ui/kinetic-grid";
import ProblemSection from "@/components/ProblemSection";
import SolutionSection from "@/components/SolutionSection";
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
  Eye,
  Crosshair,
  Shield,
  ScanLine,
  XCircle,
  AlertCircle,
  Clock,
  CheckCircle,
  Star,
  Send,
  MessageSquare,
  Phone,
  Mail,
  MapPin,
  ShieldAlert,
  Scale,
  TrendingUp,
  User,
  Github,
  Linkedin,
  Instagram,
  ArrowUpRight,
} from "lucide-react";

// Dynamic Typewriter Effect Component
const TypewriterText: React.FC<{ phrases: string[]; speed?: number; pause?: number }> = ({
  phrases,
  speed = 90,
  pause = 2000,
}) => {
  const [index, setIndex] = useState(0);
  const [subIndex, setSubIndex] = useState(0);
  const [reverse, setReverse] = useState(false);

  useEffect(() => {
    if (subIndex === phrases[index].length + 1 && !reverse) {
      const timeout = setTimeout(() => {
        setReverse(true);
      }, pause);
      return () => clearTimeout(timeout);
    }

    if (subIndex === 0 && reverse) {
      setReverse(false);
      setIndex((prev) => (prev + 1) % phrases.length);
      return;
    }

    const timeout = setTimeout(() => {
      setSubIndex((prev) => prev + (reverse ? -1 : 1));
    }, reverse ? speed / 2 : speed);

    return () => clearTimeout(timeout);
  }, [subIndex, index, reverse, phrases, speed, pause]);

  return (
    <span className="inline-block relative font-black bg-clip-text text-transparent bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500">
      {phrases[index].substring(0, subIndex)}
      <span className="inline-block w-[3px] h-[1em] ml-1 bg-amber-400 align-middle animate-pulse shadow-[0_0_10px_#f59e0b]" />
    </span>
  );
};

// Scroll Triggered Animated Count-Up Number Counter
const CountUpNumber: React.FC<{ target: number; suffix?: string; prefix?: string; decimals?: number }> = ({
  target,
  suffix = "",
  prefix = "",
  decimals = 0,
}) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const duration = 1600;
    const steps = 35;
    const increment = target / steps;
    const stepTime = duration / steps;

    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [isInView, target]);

  return (
    <div ref={ref} className="font-mono">
      {prefix}
      {count.toFixed(decimals)}
      {suffix}
    </div>
  );
};

// Apple iMac Desktop Monitor 3D Scroll Reveal Showcase Component
const IMacShowcase: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "center center"],
  });

  // Dynamic 3D Scroll Transforms: As user scrolls down, iMac monitor tilts smoothly into view!
  const rotateX = useTransform(scrollYProgress, [0, 1], [25, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.85, 1]);
  const opacity = useTransform(scrollYProgress, [0, 0.4], [0.2, 1]);

  return (
    <div ref={containerRef} className="pt-12 pb-20 max-w-6xl mx-auto px-4 perspective-[1400px]">
      <motion.div
        style={{
          rotateX,
          scale,
          opacity,
          transformStyle: "preserve-3d",
        }}
        className="relative mx-auto max-w-5xl"
      >
        {/* Apple iMac Desktop Monitor Outer Body */}
        <div className="relative rounded-[2.2rem] bg-[#161724] border-[10px] border-[#292b3f] p-4 sm:p-6 shadow-[0_35px_120px_rgba(0,0,0,0.95)] backdrop-blur-2xl overflow-hidden group hover:border-amber-500/30 transition-colors">
          {/* Top Center Camera/Sensor Bar */}
          <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-14 h-3 bg-black rounded-full flex items-center justify-center gap-2 z-30 shadow-inner">
            <span className="w-1.5 h-1.5 rounded-full bg-[#12131b] border border-zinc-700" />
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#10b981]" />
          </div>

          {/* Inner iMac Display Screen */}
          <div className="rounded-2xl bg-[#080911] border border-zinc-800/90 p-4 sm:p-6 space-y-5 overflow-hidden">
            {/* macOS / Dashboard Top Navigation Header Bar */}
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80 text-xs text-zinc-400">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-rose-500 inline-block shadow-sm" />
                  <span className="w-3 h-3 rounded-full bg-amber-500 inline-block shadow-sm" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block shadow-sm" />
                </div>
                <div className="flex items-center gap-2 text-zinc-300 font-mono font-bold">
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>LIVE AUDIT SESSION: #AUD-8921-IN-GOVT</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[10px] font-bold flex items-center gap-1.5 shadow-[0_0_12px_rgba(16,185,129,0.2)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  AI GUARDIAN ACTIVE
                </span>
              </div>
            </div>

            {/* Dashboard Content Grid Matching iMac Reference Layout */}
            <div className="space-y-4 text-left font-sans">
              {/* Top Row: Left Live OCR Target + Right Integrity Metric Index */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left: Camera/OCR HUD Frame */}
                <div className="relative rounded-2xl bg-[#0d0e18] border border-zinc-800 p-4 space-y-3 overflow-hidden">
                  <div className="flex items-center justify-between text-[10px] font-mono font-bold">
                    <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                      LIVE 30 FPS
                    </span>
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      AI CONFIDENCE 99.8%
                    </span>
                  </div>

                  <div className="relative h-40 rounded-xl bg-black/80 border border-amber-500/40 p-3 flex flex-col justify-between overflow-hidden group">
                    {/* Laser Scanner Bar */}
                    <motion.div
                      animate={{ y: [0, 130, 0] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_15px_#f59e0b] z-10"
                    />

                    {/* Bounding Box Highlights */}
                    <div className="absolute top-4 left-4 border-2 border-emerald-400 rounded bg-emerald-500/10 px-2 py-1 text-[10px] font-mono text-emerald-300 font-bold shadow-[0_0_10px_rgba(16,185,129,0.3)]">
                      [MRP: ₹149.00] (0.98)
                    </div>
                    <div className="absolute bottom-4 left-4 border-2 border-amber-400 rounded bg-amber-500/10 px-2 py-1 text-[10px] font-mono text-amber-300 font-bold shadow-[0_0_10px_rgba(245,158,11,0.3)]">
                      [NET_QTY: 500 g] (0.96)
                    </div>

                    <div className="text-[10px] font-mono text-zinc-500">SPATIAL_BOUNDING_BOX_HUD</div>
                    <div className="text-[11px] font-mono text-zinc-400">Packaging Front #AUD-8921</div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-zinc-300 font-semibold">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-[10px]">
                        SO
                      </div>
                      <span>Supervisor Officer</span>
                    </div>
                    <span className="font-mono text-[10px] text-zinc-500">#INSP-4902</span>
                  </div>
                </div>

                {/* Right: Compliance Integrity Index Card with Curve Graph */}
                <div className="rounded-2xl bg-[#0d0e18] border border-zinc-800 p-5 flex flex-col justify-between space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-[11px] font-mono font-extrabold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-amber-400" />
                        <span>COMPLIANCE INTEGRITY INDEX</span>
                      </div>
                      <div className="flex items-baseline gap-3 pt-2">
                        <span className="text-4xl font-black text-white font-mono">99.4%</span>
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-mono font-bold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          OPTIMAL
                        </span>
                      </div>
                    </div>
                    <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
                      <Sparkles className="w-5 h-5" />
                    </div>
                  </div>

                  {/* SVG Wave Sparkline Animation */}
                  <div className="relative h-20 w-full overflow-hidden">
                    <svg className="w-full h-full" viewBox="0 0 300 80" fill="none">
                      <path
                        d="M0,50 Q40,30 80,55 T160,25 T240,40 T300,20"
                        fill="none"
                        stroke="url(#gradientCurve)"
                        strokeWidth="4"
                      />
                      <defs>
                        <linearGradient id="gradientCurve" x1="0" y1="0" x2="300" y2="0" gradientUnits="userSpaceOnUse">
                          <stop stopColor="#f59e0b" />
                          <stop offset="0.5" stopColor="#eab308" />
                          <stop offset="1" stopColor="#10b981" />
                        </linearGradient>
                      </defs>
                      <circle cx="300" cy="20" r="5" fill="#10b981" className="animate-ping" />
                      <circle cx="300" cy="20" r="4" fill="#10b981" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Middle Row: Rule Telemetry + Gaze Tracking + Audio Spectrum */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* AI Proctor Telemetry */}
                <div className="rounded-2xl bg-[#0d0e18] border border-zinc-800 p-4 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between font-mono font-extrabold text-[11px] text-zinc-300">
                    <div className="flex items-center gap-1.5 text-amber-400">
                      <Cpu className="w-3.5 h-3.5" />
                      <span>RULE TELEMETRY</span>
                    </div>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <div className="space-y-1.5 pt-1 text-[11px]">
                    <div className="flex justify-between items-center text-zinc-400">
                      <span>MRP Violations:</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono font-bold">
                        0 Detected
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-zinc-400">
                      <span>Address Proximity:</span>
                      <span className="text-zinc-200 font-medium">Verified</span>
                    </div>
                    <div className="flex justify-between items-center text-zinc-400">
                      <span>Dual-OCR Alignment:</span>
                      <span className="text-emerald-400 font-mono font-bold">99.2% Match</span>
                    </div>
                  </div>
                </div>

                {/* OCR Confidence */}
                <div className="rounded-2xl bg-[#0d0e18] border border-zinc-800 p-4 flex flex-col justify-between text-xs">
                  <div className="flex items-center justify-between text-zinc-400 text-[11px] font-mono">
                    <span>OCR CONFIDENCE</span>
                    <Eye className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <div className="py-2">
                    <span className="text-lg font-bold text-white font-mono">Centered</span>
                  </div>
                  <div className="flex justify-end">
                    <span className="px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono font-bold text-[11px]">
                      99.2%
                    </span>
                  </div>
                </div>

                {/* Equalizer Spectrum Bars */}
                <div className="rounded-2xl bg-[#0d0e18] border border-zinc-800 p-4 flex flex-col justify-between text-xs">
                  <div className="flex items-center justify-between text-zinc-400 text-[11px] font-mono">
                    <span>SIGNAL SPECTRUM</span>
                    <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <div className="flex items-end gap-1.5 h-8 pt-2">
                    {[40, 65, 80, 50, 90, 70, 85, 45, 60, 95].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 bg-gradient-to-t from-amber-500 to-emerald-400 rounded-t"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Row: Live Telemetry Log Table */}
              <div className="rounded-2xl bg-[#0d0e18] border border-zinc-800 p-4 space-y-2 font-mono text-[11px]">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800 text-zinc-400">
                  <span className="text-amber-400 font-bold">&gt;_ LIVE TELEMETRY LOG</span>
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[9px] font-bold">
                    Deterministic Engine
                  </span>
                </div>
                <div className="space-y-1 text-zinc-400 text-left pt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-600">14:02:44</span>
                    <span className="text-zinc-500">▶</span>
                    <span>Dual-OCR EasyOCR + Tesseract text extracted (Confidence: 99.8%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-600">14:02:22</span>
                    <span className="text-zinc-500">▶</span>
                    <span>Deterministic Rule 2011 check passed (MRP Unit Price: ₹0.30/g)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-amber-400 font-bold">14:01:45</span>
                    <span className="text-amber-400">▶</span>
                    <span className="text-amber-300 font-bold">Spatial bounding box evidence verified by Supervisor</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* iMac Desktop Monitor Stand (Neck & Base) */}
        <div className="relative z-0">
          <div className="w-28 h-14 bg-gradient-to-b from-[#252738] via-[#1c1d29] to-[#12131b] mx-auto shadow-2xl border-x border-zinc-700/40" />
          <div className="w-56 h-3 bg-gradient-to-r from-[#20212f] via-[#303348] to-[#20212f] rounded-b-xl mx-auto shadow-2xl border-t border-zinc-600/60" />
        </div>
      </motion.div>
    </div>
  );
};

export default function PublicLandingPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<string>("home");
  const [contactSubmitted, setContactSubmitted] = useState<boolean>(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<boolean>(false);
  const [contactFormTab, setContactFormTab] = useState<"contact" | "feedback">("contact");

  useEffect(() => {
    const token = localStorage.getItem("ps26034_auth_token");
    if (token) {
      setIsAuthenticated(true);
    }

    const sectionIds = [
      "home",
      "problem",
      "solution",
      "features",
      "how-it-works",
      "ai-engine",
      "testimonial",
      "faq",
      "contact",
      "feedback",
    ];

    const handleScroll = () => {
      const scrollPosition = window.scrollY + 220; // Offset for header & viewport top

      for (let i = sectionIds.length - 1; i >= 0; i--) {
        const id = sectionIds[i];
        const el = document.getElementById(id);
        if (el) {
          const top = el.offsetTop;
          if (scrollPosition >= top) {
            setActiveTab(id);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const typewriterPhrases = [
    "Inspection Intelligence",
    "Compliance Automation",
    "Dual-OCR Spatial Validation",
    "Zero Non-Compliance Audits",
    "Deterministic Rule Engine",
  ];

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactSubmitted(true);
    setTimeout(() => setContactSubmitted(false), 4000);
  };

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackSubmitted(true);
    setTimeout(() => setFeedbackSubmitted(false), 4500);
  };

  return (
    <KineticGrid className="bg-[#030306]">
      <div className="min-h-screen w-full text-white font-sans selection:bg-amber-500 selection:text-black relative overflow-x-hidden">
      {/* Background Glowing Ambient Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <motion.div
          animate={{
            scale: [1, 1.25, 1],
            opacity: [0.3, 0.45, 0.3],
            x: [0, 40, 0],
            y: [0, -30, 0],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-40 left-1/2 -translate-x-1/2 w-[1100px] h-[650px] bg-gradient-to-br from-amber-500/25 via-yellow-600/15 to-transparent rounded-full blur-[160px]"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.35, 0.2],
            x: [0, -50, 0],
            y: [0, 40, 0],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-96 right-[-100px] w-[700px] h-[700px] bg-gradient-to-bl from-indigo-600/25 via-purple-600/15 to-transparent rounded-full blur-[170px]"
        />
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.3, 0.2],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[1100px] left-[-100px] w-[700px] h-[700px] bg-gradient-to-tr from-emerald-500/25 via-teal-600/15 to-transparent rounded-full blur-[170px]"
        />

        {/* Dynamic Full Screen Grid Overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.6) 1px, transparent 1px)`,
            backgroundSize: "36px 36px",
          }}
        />
      </div>

      {/* Floating Capsule Navbar (Exact requested order & scroll-spy active section indicator) */}
      <header className="fixed top-4 inset-x-0 z-50 px-4 max-w-7xl mx-auto flex items-center justify-between pointer-events-auto">
        {/* Brand Logo Left */}
        <Link href="/" className="flex items-center gap-3 group bg-[#090a12]/80 backdrop-blur-2xl px-4 py-2 rounded-2xl border border-zinc-800/80 shadow-xl hover:border-amber-500/40 transition-all">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-amber-500 via-yellow-500 to-amber-400 text-black shadow-[0_0_20px_rgba(245,158,11,0.4)] group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-5 h-5 text-black" />
          </div>
          <div>
            <div className="text-xs font-black tracking-tight text-white flex items-center gap-1.5">
              <span>PS 26034</span>
              <span className="text-amber-400 font-extrabold text-[9px] px-1.5 py-0.2 rounded-full bg-amber-500/15 border border-amber-500/30">AI</span>
            </div>
            <p className="text-[9px] font-mono text-zinc-400 font-semibold tracking-wide uppercase">Legal Metrology Studio</p>
          </div>
        </Link>

        {/* Center Floating Pill Navigation Capsule (Scroll-Spy Active Section Tracking) */}
        <nav className="hidden lg:flex items-center gap-1 bg-[#0d0e17]/85 backdrop-blur-2xl border border-zinc-800/90 rounded-full px-4 py-1.5 shadow-[0_10px_35px_rgba(0,0,0,0.6)]">
          {[
            { id: "home", label: "Home", href: "#home" },
            { id: "problem", label: "Problem", href: "#problem" },
            { id: "solution", label: "Solution", href: "#solution" },
            { id: "features", label: "Features", href: "#features" },
            { id: "how-it-works", label: "How it Works", href: "#how-it-works" },
            { id: "ai-engine", label: "AI Engine", href: "#ai-engine" },
            { id: "testimonial", label: "Testimonial", href: "#testimonial" },
            { id: "faq", label: "FAQ", href: "#faq" },
            { id: "contact", label: "Contact", href: "#contact" },
            { id: "feedback", label: "Feedback", href: "#feedback" },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <a
                key={tab.id}
                href={tab.href}
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTab(tab.id);
                  const el = document.getElementById(tab.id);
                  if (el) {
                    el.scrollIntoView({ behavior: "smooth" });
                  }
                }}
                className={`relative px-3.5 py-1.5 rounded-full text-[11px] font-semibold transition-all ${
                  isActive ? "text-amber-300 font-black" : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activePillTab"
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/15 border border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.25)]"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{tab.label}</span>
              </a>
            );
          })}
        </nav>

        {/* Action Button Right (ONLY Log in button when unauthenticated as requested) */}
        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <Link
              href="/dashboard"
              className="px-5 py-2.5 rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 text-black font-black text-xs hover:scale-105 transition-all shadow-[0_0_25px_rgba(16,185,129,0.35)] flex items-center gap-2 border border-emerald-300/40"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Go to Dashboard →</span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="px-6 py-2.5 rounded-full bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-400 text-black font-extrabold text-xs hover:scale-105 transition-all shadow-[0_0_20px_rgba(245,158,11,0.4)] flex items-center gap-2 border border-amber-300/40"
            >
              <span>Log in</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section id="home" className="relative pt-36 pb-16 px-6 max-w-7xl mx-auto text-center space-y-8 z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="space-y-8"
        >
          {/* Live Badge */}
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-zinc-900/90 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold uppercase tracking-wider shadow-[0_0_25px_rgba(245,158,11,0.2)] backdrop-blur-xl">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#10b981]" />
            <span>PS 26034 Legal Metrology Platform 2.0 is Live</span>
          </div>

          {/* Dynamic Typewriter Headline */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[1.1] max-w-5xl mx-auto text-white min-h-[140px] sm:min-h-[160px] flex flex-col justify-center items-center">
            <span>Enterprise Legal Metrology</span>
            <div className="pt-2">
              <TypewriterText phrases={typewriterPhrases} speed={80} pause={2200} />
            </div>
            <span className="text-2xl sm:text-4xl text-zinc-400 font-extrabold pt-2">for Govt & Industry</span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-zinc-400 max-w-3xl mx-auto font-medium leading-relaxed">
            Automate Indian Legal Metrology (Packaged Commodities Rules 2011) compliance audits with Dual-OCR cross-checks, spatial bounding box evidence, deterministic rule validation, and supervisor review workflows.
          </p>

          {/* Hero CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            {isAuthenticated ? (
              <Link
                href="/dashboard"
                className="px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 text-black font-black text-sm hover:scale-105 transition-all shadow-[0_0_40px_rgba(16,185,129,0.45)] flex items-center gap-3 border border-emerald-300/40"
              >
                <span>Go to Executive Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <Link
                href="/login"
                className="px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-400 text-black font-black text-sm hover:scale-105 transition-all shadow-[0_0_40px_rgba(245,158,11,0.45)] flex items-center gap-3 border border-amber-300/40"
              >
                <span>Launch Supervisor Portal</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </motion.div>

        {/* Apple iMac Desktop Monitor 3D Scroll Reveal Showcase */}
        <IMacShowcase />

        {/* Scroll Triggered Animated Count-Up System Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 35 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 max-w-5xl mx-auto"
        >
          <div className="p-6 rounded-2xl bg-[#090a12]/80 border border-zinc-800 hover:border-emerald-500/40 transition-all text-center space-y-1 backdrop-blur-xl shadow-lg">
            <div className="text-3xl sm:text-4xl font-black text-emerald-400">
              <CountUpNumber target={0.0} suffix="%" decimals={1} />
            </div>
            <div className="text-xs text-zinc-400 font-bold uppercase tracking-wider">False-PASS Rate</div>
          </div>
          <div className="p-6 rounded-2xl bg-[#090a12]/80 border border-zinc-800 hover:border-amber-500/40 transition-all text-center space-y-1 backdrop-blur-xl shadow-lg">
            <div className="text-3xl sm:text-4xl font-black text-amber-400 font-mono">Dual-OCR</div>
            <div className="text-xs text-zinc-400 font-bold uppercase tracking-wider">EasyOCR + Tesseract</div>
          </div>
          <div className="p-6 rounded-2xl bg-[#090a12]/80 border border-zinc-800 hover:border-purple-500/40 transition-all text-center space-y-1 backdrop-blur-xl shadow-lg">
            <div className="text-3xl sm:text-4xl font-black text-purple-400">
              <CountUpNumber target={100} suffix="%" />
            </div>
            <div className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Deterministic Rules</div>
          </div>
          <div className="p-6 rounded-2xl bg-[#090a12]/80 border border-zinc-800 hover:border-blue-500/40 transition-all text-center space-y-1 backdrop-blur-xl shadow-lg">
            <div className="text-3xl sm:text-4xl font-black text-white">
              <CountUpNumber target={20} prefix="< " suffix="s" />
            </div>
            <div className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Audit Execution Time</div>
          </div>
        </motion.div>
      </section>

      {/* Upgraded Enterprise Problem Section */}
      <ProblemSection />

      {/* Upgraded Enterprise Inspection Intelligence Pipeline Solution Section */}
      <SolutionSection />

      {/* Features Grid Matrix with Scroll FadeUp */}
      <section id="features" className="py-20 px-6 max-w-7xl mx-auto space-y-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 35 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-3"
        >
          <div className="text-xs font-mono font-extrabold text-amber-400 uppercase tracking-widest">Platform Capabilities</div>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">Engineered for Zero Non-Compliance</h2>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl mx-auto">
            From mobile camera capture to supervisor decision quality tracking, every layer is audited and append-only.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 35 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <div className="p-7 rounded-3xl bg-[#07080e]/90 border border-zinc-800 hover:border-amber-500/50 transition-all space-y-4 shadow-xl backdrop-blur-xl group">
            <div className="p-3.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30 w-fit group-hover:scale-110 transition-transform">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-extrabold text-white">Role-Based Photo Capture</h3>
            <p className="text-xs text-zinc-400 leading-relaxed font-medium">
              Enforced Front, Back, and Close-up photo slots with blur quality scoring and DCT perceptual hash (pHash) duplicate photo protection.
            </p>
          </div>

          <div className="p-7 rounded-3xl bg-[#07080e]/90 border border-zinc-800 hover:border-purple-500/50 transition-all space-y-4 shadow-xl backdrop-blur-xl group">
            <div className="p-3.5 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/30 w-fit group-hover:scale-110 transition-transform">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-extrabold text-white">Dual-OCR Spatial Map</h3>
            <p className="text-xs text-zinc-400 leading-relaxed font-medium">
              EasyOCR + Tesseract secondary cross-check with 1:1 pixel coordinate bounding boxes mapped across packaging labels.
            </p>
          </div>

          <div className="p-7 rounded-3xl bg-[#07080e]/90 border border-zinc-800 hover:border-emerald-500/50 transition-all space-y-4 shadow-xl backdrop-blur-xl group">
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 w-fit group-hover:scale-110 transition-transform">
              <FileCheck2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-extrabold text-white">Deterministic Rule Engine</h3>
            <p className="text-xs text-zinc-400 leading-relaxed font-medium">
              Pure-function validators for MRP, Net Quantity, Mfg Date, Manufacturer entities, and Consumer Helpline proximity rules.
            </p>
          </div>

          <div className="p-7 rounded-3xl bg-[#07080e]/90 border border-zinc-800 hover:border-blue-500/50 transition-all space-y-4 shadow-xl backdrop-blur-xl group">
            <div className="p-3.5 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/30 w-fit group-hover:scale-110 transition-transform">
              <UserCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-extrabold text-white">Inspector-vs-AI Reconciliation</h3>
            <p className="text-xs text-zinc-400 leading-relaxed font-medium">
              Surfaces field disagreements directly on mobile (`You entered MRP ₹180, AI detected ₹149`) with explicit resolution actions.
            </p>
          </div>

          <div className="p-7 rounded-3xl bg-[#07080e]/90 border border-zinc-800 hover:border-amber-500/50 transition-all space-y-4 shadow-xl backdrop-blur-xl group">
            <div className="p-3.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30 w-fit group-hover:scale-110 transition-transform">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-extrabold text-white">Append-Only Audit Trail</h3>
            <p className="text-xs text-zinc-400 leading-relaxed font-medium">
              Un-editable legal inspection logs with supervisor override reasons (`ReviewRecord`) protecting court evidence integrity.
            </p>
          </div>

          <div className="p-7 rounded-3xl bg-[#07080e]/90 border border-zinc-800 hover:border-rose-500/50 transition-all space-y-4 shadow-xl backdrop-blur-xl group">
            <div className="p-3.5 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/30 w-fit group-hover:scale-110 transition-transform">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-extrabold text-white">Decision Quality Analytics</h3>
            <p className="text-xs text-zinc-400 leading-relaxed font-medium">
              Real-time Recharts KPI metrics tracking review rates, supervisor override vs confirmation rates, and top review fields.
            </p>
          </div>
        </motion.div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-6 max-w-7xl mx-auto space-y-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 35 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-3"
        >
          <div className="text-xs font-mono font-extrabold text-emerald-400 uppercase tracking-widest">Inspection Lifecycle</div>
          <h2 className="text-3xl sm:text-5xl font-black text-white">How the Inspection Engine Operates</h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 35 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 relative"
        >
          <div className="p-6 rounded-3xl bg-[#080910] border border-zinc-800 space-y-3 shadow-lg">
            <div className="text-2xl font-black text-amber-400 font-mono">01</div>
            <h4 className="text-sm font-extrabold text-white">Capture Photos</h4>
            <p className="text-xs text-zinc-400 leading-relaxed font-medium">
              Inspector snaps Front, Back, and Close-up packaging photos on Mobile app.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-[#080910] border border-zinc-800 space-y-3 shadow-lg">
            <div className="text-2xl font-black text-purple-400 font-mono">02</div>
            <h4 className="text-sm font-extrabold text-white">Dual-OCR & Context Scoring</h4>
            <p className="text-xs text-zinc-400 leading-relaxed font-medium">
              Backend runs EasyOCR + Tesseract, scores context windows, and evaluates rule compliance.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-[#080910] border border-zinc-800 space-y-3 shadow-lg">
            <div className="text-2xl font-black text-blue-400 font-mono">03</div>
            <h4 className="text-sm font-extrabold text-white">Reconcile Diff</h4>
            <p className="text-xs text-zinc-400 leading-relaxed font-medium">
              Inspector confirms AI extraction or enters structured correction for REVIEW fields.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-[#080910] border border-zinc-800 space-y-3 shadow-lg">
            <div className="text-2xl font-black text-emerald-400 font-mono">04</div>
            <h4 className="text-sm font-extrabold text-white">Supervisor Verification</h4>
            <p className="text-xs text-zinc-400 leading-relaxed font-medium">
              Supervisors inspect visual Bounding Boxes on Web Portal and log append-only report.
            </p>
          </div>
        </motion.div>
      </section>

      {/* AI Engine Section */}
      <section id="ai-engine" className="py-20 px-6 max-w-7xl mx-auto space-y-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 35 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-3"
        >
          <div className="text-xs font-mono font-extrabold text-purple-400 uppercase tracking-widest">Architecture Core</div>
          <h2 className="text-3xl sm:text-5xl font-black text-white">Dual-OCR & Rule Engine Synergy</h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 35 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="p-8 sm:p-12 rounded-3xl bg-[#090a12]/90 border border-zinc-800 space-y-8 backdrop-blur-2xl shadow-2xl"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4 text-left">
              <h3 className="text-2xl font-black text-white">Why Pure-Function Validators Outperform LLMs</h3>
              <p className="text-xs text-zinc-400 leading-relaxed font-medium">
                LLMs can hallucinate non-existent text or misread numeric cutoffs. In legal enforcement, compliance verdicts MUST withstand court challenges. PS 26034 combines EasyOCR + Tesseract with 100% deterministic pure functions.
              </p>
              <div className="space-y-2 text-xs font-mono">
                <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                  <span className="text-zinc-400">EasyOCR Primary Extraction</span>
                  <span className="text-amber-400 font-bold">0.98 Confidence</span>
                </div>
                <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                  <span className="text-zinc-400">Tesseract Cross-Check</span>
                  <span className="text-purple-400 font-bold">1:1 Overlay Match</span>
                </div>
                <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                  <span className="text-zinc-400">Rule 2011 Unit Price Check</span>
                  <span className="text-emerald-400 font-bold">PASSED (₹0.30/g)</span>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-black/60 border border-zinc-800 space-y-4 font-mono text-xs text-left">
              <div className="text-emerald-400 font-bold flex items-center justify-between">
                <span>&gt;_ PIPELINE_BENCHMARK_REPORT</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20">VERIFIED</span>
              </div>
              <div className="space-y-2 text-[11px] text-zinc-400">
                <p>▶ Photo Quality Score: 98.4 / 100 (No Blur)</p>
                <p>▶ pHash Duplicate Check: Passed (Unique Sample)</p>
                <p>▶ Spatial Bounding Boxes: 4 Labels Detected</p>
                <p>▶ Consumer Helpline Match: 1800-11-4000 (Exact)</p>
                <p>▶ Output Verdict: PASS (Zero Missing Declarations)</p>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Testimonial Section - Infinite Train Marquee */}
      <section id="testimonial" className="py-24 space-y-12 relative z-10 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 35 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-4 px-6 max-w-7xl mx-auto"
        >
          <div className="text-xs font-mono font-extrabold text-amber-400 uppercase tracking-widest px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 w-fit mx-auto shadow-[0_0_20px_rgba(245,158,11,0.25)]">
            TESTIMONIALS & TRUST
          </div>
          <h2 className="text-4xl sm:text-6xl font-black tracking-tight text-white max-w-4xl mx-auto leading-tight">
            Trusted by Controllers & <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 drop-shadow-[0_0_25px_rgba(245,158,11,0.4)]">
              Enforcement Officers Nationwide.
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl mx-auto font-medium leading-relaxed">
            See how state Metrology divisions and senior controllers use PS 26034 to eliminate non-compliance bottlenecks.
          </p>
        </motion.div>

        {/* Infinite Marquee Train Wrapper */}
        <div className="relative w-full overflow-hidden py-4 group/track">
          {/* Side Fade Gradient Masks */}
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-20 sm:w-44 bg-gradient-to-r from-[#050508] via-[#050508]/85 to-transparent z-20" />
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-20 sm:w-44 bg-gradient-to-l from-[#050508] via-[#050508]/85 to-transparent z-20" />

          {/* Marquee Train Track */}
          <div className="flex gap-6 w-max animate-marquee-train group-hover/track:[animation-play-state:paused] py-4 px-6">
            {[
              {
                name: "Dr. Rajesh V. Sharma",
                role: "Deputy Controller of Legal Metrology",
                avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
                quote: "PS26034 reduced our packaging inspection audit cycle from 18 minutes down to under 20 seconds. The zero false-PASS guarantee gives us complete legal confidence.",
              },
              {
                name: "Anita Roy",
                role: "Chief Compliance Officer",
                avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
                quote: "The 1:1 pixel spatial coordinate bounding boxes and append-only supervisor override records stand up flawlessly in legal courtroom enforcement proceedings.",
              },
              {
                name: "Sanjay K. Verma",
                role: "Senior Field Enforcement Inspector",
                avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
                quote: "The mobile-to-web inspector reconciliation workflow resolved 100% of field label declaration mismatches before final supervisor sign-off.",
              },
              {
                name: "Dr. Meera Nambiar",
                role: "Director of Standards & Weights",
                avatar: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=150&auto=format&fit=crop&q=80",
                quote: "PS26034's automated OCR verification catches missing MRP, net quantity, and manufacturer details across thousands of e-commerce listings instantly.",
              },
              {
                name: "Vikramaditya Rao",
                role: "Head of Regulatory Quality Assurance",
                avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
                quote: "Eliminated manual packaging inspection backlogs across 14 state zones. The real-time legal rulebook engine ensures zero non-compliance penalties.",
              },
              {
                name: "Priya Sundaram",
                role: "Lead Consumer Protection Strategist",
                avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
                quote: "The ability to audit pre-packaged commodities in bulk with AI spatial bounding boxes has transformed consumer protection enforcement nationwide.",
              },
              {
                name: "Karan Malhotra",
                role: "Legal Metrology Technical Director",
                avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80",
                quote: "We audited over 100,000 packaging designs. The system flagged font height violations and ambiguous date formatting that human eyes missed.",
              },
              {
                name: "Arjun Deshmukh",
                role: "Senior Inspection Operations Lead",
                avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80",
                quote: "Security, tamper-evident audit logs, and zero-trust verification put our enforcement officers at ease. PS26034 is the gold standard for Legal Metrology.",
              },

              // Duplicated for seamless loop
              {
                name: "Dr. Rajesh V. Sharma",
                role: "Deputy Controller of Legal Metrology",
                avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
                quote: "PS26034 reduced our packaging inspection audit cycle from 18 minutes down to under 20 seconds. The zero false-PASS guarantee gives us complete legal confidence.",
              },
              {
                name: "Anita Roy",
                role: "Chief Compliance Officer",
                avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
                quote: "The 1:1 pixel spatial coordinate bounding boxes and append-only supervisor override records stand up flawlessly in legal courtroom enforcement proceedings.",
              },
              {
                name: "Sanjay K. Verma",
                role: "Senior Field Enforcement Inspector",
                avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
                quote: "The mobile-to-web inspector reconciliation workflow resolved 100% of field label declaration mismatches before final supervisor sign-off.",
              },
              {
                name: "Dr. Meera Nambiar",
                role: "Director of Standards & Weights",
                avatar: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=150&auto=format&fit=crop&q=80",
                quote: "PS26034's automated OCR verification catches missing MRP, net quantity, and manufacturer details across thousands of e-commerce listings instantly.",
              },
              {
                name: "Vikramaditya Rao",
                role: "Head of Regulatory Quality Assurance",
                avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
                quote: "Eliminated manual packaging inspection backlogs across 14 state zones. The real-time legal rulebook engine ensures zero non-compliance penalties.",
              },
              {
                name: "Priya Sundaram",
                role: "Lead Consumer Protection Strategist",
                avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
                quote: "The ability to audit pre-packaged commodities in bulk with AI spatial bounding boxes has transformed consumer protection enforcement nationwide.",
              },
              {
                name: "Karan Malhotra",
                role: "Legal Metrology Technical Director",
                avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80",
                quote: "We audited over 100,000 packaging designs. The system flagged font height violations and ambiguous date formatting that human eyes missed.",
              },
              {
                name: "Arjun Deshmukh",
                role: "Senior Inspection Operations Lead",
                avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80",
                quote: "Security, tamper-evident audit logs, and zero-trust verification put our enforcement officers at ease. PS26034 is the gold standard for Legal Metrology.",
              },
            ].map((item, index) => (
              <div
                key={index}
                className="w-[300px] sm:w-[350px] shrink-0 rounded-[2rem] bg-[#080912]/95 border border-amber-500/20 p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 group-hover/track:opacity-40 hover:!opacity-100 hover:scale-[1.06] hover:z-30 hover:border-amber-500/70 hover:shadow-[0_0_40px_rgba(245,158,11,0.25)] backdrop-blur-2xl cursor-pointer relative"
              >
                <div>
                  {/* Avatar + Name & Role Header */}
                  <div className="flex items-center gap-3.5">
                    <img
                      src={item.avatar}
                      alt={item.name}
                      className="w-11 h-11 rounded-full object-cover border border-amber-500/30 shrink-0 shadow-md"
                    />
                    <div className="overflow-hidden">
                      <h4 className="text-sm font-bold text-white tracking-wide truncate">{item.name}</h4>
                      <p className="text-[11px] text-zinc-400 truncate">{item.role}</p>
                    </div>
                  </div>

                  {/* 5 Amber/Gold Stars */}
                  <div className="flex items-center gap-1 my-4 text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                    ))}
                  </div>

                  {/* Quote */}
                  <p className="text-xs text-zinc-300 leading-relaxed font-normal">
                    "{item.quote}"
                  </p>
                </div>

                <div>
                  {/* Bottom Divider */}
                  <div className="border-t border-zinc-800/90 my-4" />

                  {/* Read More Link */}
                  <span className="text-amber-400 text-xs font-semibold hover:text-amber-300 transition-colors inline-flex items-center gap-1 group/btn">
                    Read more
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-1 text-amber-400" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section id="faq" className="py-20 px-6 max-w-4xl mx-auto space-y-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 35 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-3"
        >
          <div className="text-xs font-mono font-extrabold text-amber-400 uppercase tracking-widest">Questions & Answers</div>
          <h2 className="text-3xl sm:text-5xl font-black text-white">Frequently Asked Questions</h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 35 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="space-y-4"
        >
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
              className="p-6 rounded-2xl bg-[#08090f] border border-zinc-800 cursor-pointer hover:border-amber-500/40 transition-all space-y-2 backdrop-blur-xl"
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
        </motion.div>
      </section>

      {/* ───────────────────────────────────────────────────────────────────────
          CONTACT & FEEDBACK UNIFIED SECTION (With Crisp Visible Watermark & Mode Toggle)
      ─────────────────────────────────────────────────────────────────────── */}
      <section id="contact" className="py-24 px-4 sm:px-6 max-w-5xl mx-auto relative z-10 select-none">
        {/* Giant Crisp Watermark Text behind the Card */}
        <div className="relative w-full flex items-center justify-center">
          <AnimatePresence mode="wait">
            {contactFormTab === "contact" ? (
              <motion.span
                key="watermark-contact"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1.1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="absolute -top-20 sm:-top-28 font-black text-[100px] sm:text-[176px] md:text-[232px] text-white/80 tracking-tight uppercase pointer-events-none select-none leading-none z-0 drop-shadow-[0_0_60px_rgba(255,255,255,0.35)] scale-x-105"
              >
                CONTACT
              </motion.span>
            ) : (
              <motion.span
                key="watermark-feedback"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1.1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="absolute -top-20 sm:-top-28 font-black text-[90px] sm:text-[165px] md:text-[210px] text-amber-300/80 tracking-tight uppercase pointer-events-none select-none leading-none z-0 drop-shadow-[0_0_60px_rgba(245,158,11,0.4)] scale-x-105"
              >
                FEEDBACK
              </motion.span>
            )}
          </AnimatePresence>

          {/* Interactive Form Card Wrapper with Dynamic Mode Switching */}
          <AnimatePresence mode="wait">
            {contactFormTab === "contact" ? (
              /* Contact Form Card (Midnight Obsidian Glass + Neon Indigo Glow - Option 2) */
              <motion.div
                key="contact-card"
                initial={{ opacity: 0, scale: 0.96, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: -15 }}
                transition={{ duration: 0.35, ease: "easeInOut" }}
                className="relative z-10 w-full rounded-[2.5rem] bg-[#0b0c16]/90 border border-indigo-500/40 p-6 sm:p-10 md:p-12 text-white shadow-[0_25px_90px_rgba(99,102,241,0.25)] backdrop-blur-3xl text-left"
              >
                {/* Card Header & Mode Switcher Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-extrabold uppercase tracking-widest text-indigo-300 bg-indigo-500/15 px-3 py-1 rounded-full border border-indigo-500/30">
                      REACH ME
                    </span>
                  </div>

                  {/* Right Action Bar: Mode Switcher Buttons */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Toggle Button Capsule */}
                    <div className="flex items-center gap-1 bg-zinc-900/80 p-1 rounded-full border border-zinc-700/80 shadow-inner">
                      <button
                        type="button"
                        onClick={() => setContactFormTab("contact")}
                        className="px-4 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]"
                      >
                        Contact Form
                      </button>
                      <button
                        type="button"
                        onClick={() => setContactFormTab("feedback")}
                        className="px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer text-zinc-400 hover:text-white"
                      >
                        Feedback Form
                      </button>
                    </div>

                    <div className="hidden sm:flex items-center gap-2 text-xs font-bold">
                      <a
                        href="https://instagram.com"
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-full bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <span>INSTAGRAM</span>
                      </a>
                      <a
                        href="https://linkedin.com"
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-full bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <span>LINKEDIN</span>
                      </a>
                    </div>
                  </div>
                </div>

                {/* Card Headline */}
                <div className="space-y-2 pb-6">
                  <h2 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight text-white">
                    Let’s build something <span className="underline decoration-indigo-400 decoration-wavy decoration-2 text-indigo-300">extraordinary</span> together.
                  </h2>
                </div>

                {contactSubmitted ? (
                  <div className="p-8 rounded-3xl bg-zinc-900/80 border border-indigo-500/40 text-white text-center space-y-3">
                    <CheckCircle className="w-12 h-12 mx-auto text-emerald-400 animate-bounce" />
                    <h3 className="text-xl font-black">Official Message Dispatched!</h3>
                    <p className="text-xs text-zinc-400">Our metrology technical team will contact your department within 24 hours.</p>
                  </div>
                ) : (
                  <form onSubmit={handleContactSubmit} className="space-y-5 text-xs">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Left Column Fields */}
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="font-mono font-extrabold text-[11px] uppercase tracking-wider text-indigo-300">
                            FIRST NAME
                          </label>
                          <input
                            required
                            type="text"
                            placeholder="John"
                            className="w-full bg-zinc-900/80 border border-zinc-700/80 focus:border-indigo-400 rounded-2xl px-4 py-3 text-white placeholder:text-zinc-500 outline-none font-medium transition-all shadow-inner"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="font-mono font-extrabold text-[11px] uppercase tracking-wider text-indigo-300">
                            LAST NAME
                          </label>
                          <input
                            required
                            type="text"
                            placeholder="Doe"
                            className="w-full bg-zinc-900/80 border border-zinc-700/80 focus:border-indigo-400 rounded-2xl px-4 py-3 text-white placeholder:text-zinc-500 outline-none font-medium transition-all shadow-inner"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="font-mono font-extrabold text-[11px] uppercase tracking-wider text-indigo-300">
                            EMAIL
                          </label>
                          <input
                            required
                            type="email"
                            placeholder="john@example.com"
                            className="w-full bg-zinc-900/80 border border-zinc-700/80 focus:border-indigo-400 rounded-2xl px-4 py-3 text-white placeholder:text-zinc-500 outline-none font-medium transition-all shadow-inner"
                          />
                        </div>
                      </div>

                      {/* Right Column Textarea */}
                      <div className="space-y-1.5 flex flex-col">
                        <label className="font-mono font-extrabold text-[11px] uppercase tracking-wider text-indigo-300">
                          TYPE YOUR MESSAGE HERE
                        </label>
                        <textarea
                          required
                          rows={6}
                          placeholder="Tell me about your project, idea, or role..."
                          className="w-full h-full min-h-[160px] bg-zinc-900/80 border border-zinc-700/80 focus:border-indigo-400 rounded-2xl p-4 text-white placeholder:text-zinc-500 outline-none font-medium transition-all resize-none shadow-inner"
                        />
                      </div>
                    </div>

                    {/* Bottom Row Footer */}
                    <div className="pt-4 flex flex-wrap items-center justify-between gap-4 border-t border-zinc-800">
                      <div className="space-y-1 max-w-sm">
                        <label className="flex items-center gap-2 cursor-pointer text-[11px] text-zinc-300 font-medium">
                          <input type="checkbox" required className="w-4 h-4 rounded accent-indigo-500 border-zinc-700 cursor-pointer" />
                          <span>I give permission to contact me at this email address.</span>
                        </label>
                        <p className="text-[10px] text-zinc-500 font-mono">
                          For urgent inquiries, contact <span className="underline font-bold text-indigo-300">Official Metrology Division</span>
                        </p>
                      </div>

                      <button
                        type="submit"
                        className="px-8 py-4 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 text-white font-black text-xs hover:scale-105 active:scale-95 transition-all shadow-[0_0_25px_rgba(99,102,241,0.4)] flex items-center gap-2 cursor-pointer shrink-0"
                      >
                        <span>Send Message</span>
                        <Send className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  </form>
                )}
              </motion.div>
            ) : (
              /* Feedback Form Card (Glowing Sunset Coral Gradient) */
              <motion.div
                key="feedback-card"
                initial={{ opacity: 0, scale: 0.96, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: -15 }}
                transition={{ duration: 0.35, ease: "easeInOut" }}
                className="relative z-10 w-full rounded-[2.5rem] bg-gradient-to-br from-orange-500 via-amber-500 to-rose-600 p-6 sm:p-10 md:p-12 text-white shadow-[0_25px_90px_rgba(249,115,22,0.45)] border border-orange-300/40 backdrop-blur-2xl text-left"
              >
                {/* Card Header & Mode Switcher Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-extrabold uppercase tracking-widest text-orange-100 bg-black/20 px-3 py-1 rounded-full border border-white/20">
                      SHARE FEEDBACK
                    </span>
                  </div>

                  {/* Right Action Bar: Mode Switcher Buttons */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Toggle Button Capsule */}
                    <div className="flex items-center gap-1 bg-black/30 p-1 rounded-full border border-white/25 shadow-inner">
                      <button
                        type="button"
                        onClick={() => setContactFormTab("contact")}
                        className="px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer text-white/90 hover:text-white hover:bg-white/10"
                      >
                        Contact Form
                      </button>
                      <button
                        type="button"
                        onClick={() => setContactFormTab("feedback")}
                        className="px-4 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer bg-white text-orange-700 shadow-md"
                      >
                        Feedback Form
                      </button>
                    </div>

                    <div className="hidden sm:flex items-center gap-2 text-xs font-extrabold">
                      <span className="px-3 py-1.5 rounded-full bg-black/20 border border-white/20 text-orange-100 flex items-center gap-1.5">
                        <Star className="w-3.5 h-3.5 fill-amber-200 text-amber-200" />
                        <span>5 STAR RATING</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Headline */}
                <div className="space-y-2 pb-6">
                  <h2 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight text-white">
                    Help us improve <span className="underline decoration-orange-200 decoration-wavy decoration-2">PS 26034</span> Metrology Intelligence.
                  </h2>
                </div>

                {feedbackSubmitted ? (
                  <div className="p-8 rounded-3xl bg-black/30 border border-white/30 text-white text-center space-y-3">
                    <CheckCircle className="w-12 h-12 mx-auto text-amber-200 animate-bounce" />
                    <h3 className="text-xl font-black">Feedback Logged Successfully!</h3>
                    <p className="text-xs text-orange-100">Thank you for helping us refine the legal metrology inspection engine.</p>
                  </div>
                ) : (
                  <form onSubmit={handleFeedbackSubmit} className="space-y-5 text-xs">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Left Column Fields */}
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="font-mono font-extrabold text-[11px] uppercase tracking-wider text-orange-100">
                            OFFICER NAME / YOUR NAME
                          </label>
                          <input
                            required
                            type="text"
                            placeholder="Officer Rajesh Sharma"
                            className="w-full bg-black/20 border border-white/30 focus:border-white rounded-2xl px-4 py-3 text-white placeholder:text-orange-200/60 outline-none font-medium transition-all shadow-inner"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="font-mono font-extrabold text-[11px] uppercase tracking-wider text-orange-100">
                            DEPARTMENT / ENFORCEMENT UNIT
                          </label>
                          <input
                            required
                            type="text"
                            placeholder="Legal Metrology Division"
                            className="w-full bg-black/20 border border-white/30 focus:border-white rounded-2xl px-4 py-3 text-white placeholder:text-orange-200/60 outline-none font-medium transition-all shadow-inner"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="font-mono font-extrabold text-[11px] uppercase tracking-wider text-orange-100">
                            OVERALL SYSTEM RATING
                          </label>
                          <select
                            required
                            className="w-full bg-black/20 border border-white/30 focus:border-white rounded-2xl px-4 py-3 text-white outline-none font-medium transition-all cursor-pointer shadow-inner"
                          >
                            <option value="5" className="bg-[#12131e] text-white">⭐⭐⭐⭐⭐ (5/5 - Exceptional Intelligence)</option>
                            <option value="4" className="bg-[#12131e] text-white">⭐⭐⭐⭐ (4/5 - Very Good)</option>
                            <option value="3" className="bg-[#12131e] text-white">⭐⭐⭐ (3/5 - Satisfactory)</option>
                          </select>
                        </div>
                      </div>

                      {/* Right Column Textarea */}
                      <div className="space-y-1.5 flex flex-col">
                        <label className="font-mono font-extrabold text-[11px] uppercase tracking-wider text-orange-100">
                          YOUR FEEDBACK & SUGGESTIONS
                        </label>
                        <textarea
                          required
                          rows={6}
                          placeholder="Share your thoughts on Dual-OCR accuracy, bounding box viewer, or feature requests..."
                          className="w-full h-full min-h-[160px] bg-black/20 border border-white/30 focus:border-white rounded-2xl p-4 text-white placeholder:text-orange-200/60 outline-none font-medium transition-all resize-none shadow-inner"
                        />
                      </div>
                    </div>

                    {/* Bottom Row Footer */}
                    <div className="pt-4 flex flex-wrap items-center justify-between gap-4 border-t border-white/20">
                      <div className="space-y-1 max-w-sm">
                        <label className="flex items-center gap-2 cursor-pointer text-[11px] text-orange-100 font-medium">
                          <input type="checkbox" defaultChecked className="w-4 h-4 rounded accent-orange-900 border-white/40 cursor-pointer" />
                          <span>Include diagnostic telemetry and rule logs with feedback.</span>
                        </label>
                        <p className="text-[10px] text-orange-200/80 font-mono">
                          Direct telemetry feedback channel to <span className="underline font-bold text-white">SIH Lead Engineering Team</span>
                        </p>
                      </div>

                      <button
                        type="submit"
                        className="px-8 py-4 rounded-full bg-white text-orange-700 hover:bg-orange-50 font-black text-xs hover:scale-105 active:scale-95 transition-all shadow-[0_10px_30px_rgba(0,0,0,0.3)] flex items-center gap-2 cursor-pointer shrink-0"
                      >
                        <span>Submit Feedback</span>
                        <MessageSquare className="w-4 h-4 text-orange-700" />
                      </button>
                    </div>
                  </form>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-black pt-16 pb-8 px-6 relative z-10 font-sans text-white">
        <div className="max-w-7xl mx-auto space-y-10">
          {/* Top Row Header Info (3 Columns) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start text-xs">
            {/* Left Column */}
            <div className="space-y-1.5">
              <h3 className="font-bold text-white text-sm">Legal Metrology AI Engine</h3>
              <p className="font-mono text-zinc-400">Dual-OCR • Rule 2011 Engine • YOLOv8 • Field Audit</p>
              <p className="font-mono text-zinc-500 text-[11px]">Autonomous Regulatory Compliance & Enforcement</p>
            </div>

            {/* Center Column */}
            <div className="space-y-1.5 md:text-center">
              <h3 className="font-bold text-white text-sm">PS 26034 Platform</h3>
              <a
                href="#features"
                className="inline-flex items-center gap-1 font-mono font-bold text-amber-400 hover:text-amber-300 transition-colors"
              >
                <span>Explore Features</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Right Column */}
            <div className="space-y-1.5 md:text-right">
              <h3 className="font-bold text-white text-sm">Smart India Hackathon 2026</h3>
              <p className="font-mono text-zinc-400">Govt of India Division</p>
            </div>
          </div>

          {/* Divider */}
          <div className="w-full border-t border-zinc-900" />

          {/* Middle Section: Massive Centered Typography */}
          <div className="relative py-4 flex items-center justify-center min-h-[140px] sm:min-h-[200px]">
            {/* Massive Center Typography */}
            <h1 className="text-center font-black text-5xl sm:text-7xl md:text-8xl lg:text-[110px] xl:text-[135px] tracking-tight text-white uppercase select-none font-sans leading-none w-full text-center">
              LEGAL METROLOGY
            </h1>
          </div>

          {/* Divider */}
          <div className="w-full border-t border-zinc-900" />

          {/* Bottom Bar Section (3 Columns) */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-zinc-400 pt-2">
            {/* Left */}
            <div>
              © 2026 PS 26034 Legal Metrology Platform | Built for SIH 2026
            </div>

            {/* Center */}
            <div className="flex items-center gap-3">
              <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>System Operational</span>
              </span>
            </div>

            {/* Right */}
            <div>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1 font-bold text-amber-400 hover:text-amber-300 transition-colors"
              >
                <span>Go to Dashboard</span>
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  </KineticGrid>
  );
}
