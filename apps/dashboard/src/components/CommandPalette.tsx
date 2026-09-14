"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  FileCheck2,
  AlertTriangle,
  BarChart3,
  ShieldCheck,
  User,
  ArrowRight,
  Sparkles,
  Command,
  X,
} from "lucide-react";

export const CommandPalette: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleClose = () => {
    setIsOpen(false);
    setQuery("");
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl + K or Cmd + K
      if ((e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K" || e.code === "KeyK")) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    };

    const handleCustomOpen = () => {
      setIsOpen(true);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("open-command-palette", handleCustomOpen);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("open-command-palette", handleCustomOpen);
    };
  }, [isOpen]);

  const quickLinks = [
    {
      id: "review-queue",
      title: "Process Priority REVIEW Queue",
      category: "Quick Actions",
      icon: AlertTriangle,
      badge: "14 Pending",
      color: "text-amber-400",
      action: () => {
        router.push("/inspections?decision=REVIEW");
        handleClose();
      },
    },
    {
      id: "analytics",
      title: "Decision Quality Analytics",
      category: "Analytics",
      icon: BarChart3,
      badge: "Gap 4",
      color: "text-purple-400",
      action: () => {
        router.push("/analytics");
        handleClose();
      },
    },
    {
      id: "insp-1",
      title: "#demo-insp-001 — Parle-G Gold 200g",
      category: "Recent Audits",
      icon: FileCheck2,
      badge: "REVIEW Queue",
      color: "text-amber-400",
      action: () => {
        router.push("/inspections/insp_01");
        handleClose();
      },
    },
    {
      id: "insp-2",
      title: "#demo-insp-002 — Himalaya Neem Face Wash",
      category: "Recent Audits",
      icon: ShieldCheck,
      badge: "PASS",
      color: "text-emerald-400",
      action: () => {
        router.push("/inspections/insp_02");
        handleClose();
      },
    },
    {
      id: "all-inspections",
      title: "View All Inspections Queue",
      category: "Navigation",
      icon: FileCheck2,
      badge: "Live Queue",
      color: "text-zinc-300",
      action: () => {
        router.push("/inspections");
        handleClose();
      },
    },
  ];

  const filteredLinks = quickLinks.filter(
    (item) =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.category.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-start justify-center pt-16 sm:pt-24 p-4">
          {/* Backdrop click to dismiss */}
          <div className="absolute inset-0" onClick={handleClose} />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 bg-[#121218] border border-zinc-700/80 rounded-3xl max-w-xl w-full p-4 shadow-2xl space-y-3 overflow-hidden select-none"
          >
            {/* Top Search Input */}
            <div className="relative flex items-center border-b border-zinc-800 pb-3">
              <Search className="w-5 h-5 absolute left-3 text-amber-400" />
              <input
                type="text"
                autoFocus
                placeholder="Search audits, metrics, or type command..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-transparent pl-11 pr-10 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none font-medium"
              />
              <button
                onClick={handleClose}
                className="absolute right-2 p-1.5 rounded-xl text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Filtered Results */}
            <div className="max-h-80 overflow-y-auto space-y-1 pr-1">
              {filteredLinks.length > 0 ? (
                filteredLinks.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={item.action}
                      className="w-full flex items-center justify-between p-3 rounded-2xl bg-[#181820]/60 hover:bg-zinc-800/80 border border-zinc-800/80 hover:border-zinc-700 transition-all text-left group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-zinc-800/80 border border-zinc-700 flex items-center justify-center shrink-0">
                          <Icon className={`w-4 h-4 ${item.color}`} />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors truncate">
                            {item.title}
                          </div>
                          <div className="text-[10px] text-zinc-500 font-mono font-medium truncate">
                            {item.category}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {item.badge && (
                          <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                            {item.badge}
                          </span>
                        )}
                        <ArrowRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-white transition-transform group-hover:translate-x-0.5" />
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="py-8 text-center text-xs text-zinc-500 font-medium">
                  No matching commands or audits found for "{query}"
                </div>
              )}
            </div>

            {/* Footer Shortcuts hint */}
            <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[10px] text-zinc-500 font-mono">
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                  ↑↓
                </span>
                <span>Navigate</span>
                <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700 ml-1">
                  ↵
                </span>
                <span>Select</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                  ESC
                </span>
                <span>Close</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
