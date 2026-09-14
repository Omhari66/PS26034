"use client";

import React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, ShieldCheck, Activity, Bell, X, CheckCheck } from "lucide-react";

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const notifications = [
    {
      id: "notif-1",
      title: "Priority REVIEW Required",
      desc: "#demo-insp-001 (Parle-G Gold) has 84% MRP OCR ambiguity.",
      time: "2 hours ago",
      icon: AlertTriangle,
      color: "text-amber-400 bg-amber-500/10 border-amber-500/30",
      href: "/inspections/insp_01",
    },
    {
      id: "notif-2",
      title: "Dual-OCR Evaluation Completed",
      desc: "Himalaya Neem Facewash verified with 92% confidence score.",
      time: "4 hours ago",
      icon: ShieldCheck,
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
      href: "/inspections/insp_02",
    },
    {
      id: "notif-3",
      title: "System Telemetry Active",
      desc: "Legal Metrology Act v1.0 deterministic rule engine online.",
      time: "6 hours ago",
      icon: Activity,
      color: "text-purple-400 bg-purple-500/10 border-purple-500/30",
      href: "/analytics",
    },
  ];

  return (
    <AnimatePresence>
      <div className="absolute right-0 top-12 z-50 w-80 sm:w-96 select-none">
        {/* Backdrop overlay */}
        <div className="fixed inset-0 z-40" onClick={onClose} />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-50 bg-[#121218] border border-zinc-700/80 rounded-3xl p-4 shadow-2xl space-y-3 overflow-hidden backdrop-blur-xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2.5 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-black text-white uppercase tracking-wider">
                Notifications (3)
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* List */}
          <div className="space-y-2 max-h-80 overflow-y-auto pr-0.5">
            {notifications.map((n) => {
              const Icon = n.icon;
              return (
                <Link
                  key={n.id}
                  href={n.href}
                  onClick={onClose}
                  className="flex items-start gap-3 p-3 rounded-2xl bg-[#181820]/60 hover:bg-zinc-800/80 border border-zinc-800/80 hover:border-zinc-700 transition-all group"
                >
                  <div
                    className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 ${n.color}`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors">
                      {n.title}
                    </div>
                    <div className="text-[11px] text-zinc-400 mt-0.5 leading-snug">
                      {n.desc}
                    </div>
                    <div className="text-[9px] font-mono text-zinc-500 mt-1">{n.time}</div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Footer */}
          <div className="pt-2 border-t border-zinc-800 flex items-center justify-between">
            <button
              onClick={onClose}
              className="text-[11px] font-semibold text-zinc-400 hover:text-amber-400 transition-colors flex items-center gap-1"
            >
              <CheckCheck className="w-3.5 h-3.5" /> Mark all read
            </button>
            <Link
              href="/inspections?decision=REVIEW"
              onClick={onClose}
              className="text-[11px] font-bold text-amber-400 hover:text-amber-300 transition-colors"
            >
              Process Queue ➔
            </Link>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
