"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertTriangle, Sparkles, X, Info } from "lucide-react";

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type?: "success" | "warning" | "info";
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-5 right-5 z-50 space-y-2 max-w-sm w-full pointer-events-none select-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          const isSuccess = toast.type === "success" || !toast.type;
          const isWarning = toast.type === "warning";

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="pointer-events-auto bg-[#121218]/95 border border-zinc-700/80 rounded-2xl p-4 shadow-2xl backdrop-blur-md flex items-start justify-between gap-3 text-xs text-white relative overflow-hidden group"
            >
              {/* Left Accent Bar */}
              <div
                className={`absolute left-0 top-0 bottom-0 w-1 ${
                  isSuccess ? "bg-emerald-500" : isWarning ? "bg-amber-500" : "bg-indigo-500"
                }`}
              />

              <div className="flex items-start gap-3 pl-1 min-w-0">
                {isSuccess ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : isWarning ? (
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                ) : (
                  <Sparkles className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                )}

                <div className="min-w-0">
                  <div className="font-extrabold text-white text-xs truncate">{toast.title}</div>
                  {toast.description && (
                    <div className="text-[11px] text-zinc-400 mt-0.5 leading-snug">
                      {toast.description}
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={() => onDismiss(toast.id)}
                className="p-1 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
