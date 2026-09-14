"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  LayoutDashboard,
  FileCheck2,
  BarChart3,
  Search,
  User,
  Settings,
  Bug,
  Shield,
  HelpCircle,
  Sparkles,
  Sun,
  Bell,
  LogOut,
  Lock,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
} from "lucide-react";

export const Navigation: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [themeMode, setThemeMode] = useState<"dark" | "light">("dark");
  const [userInfo, setUserInfo] = useState<{ email: string; name: string; initials: string }>({
    email: "supervisor@demo.ps26034",
    name: "Supervisor Officer",
    initials: "SO",
  });

  useEffect(() => {
    const savedEmail = typeof window !== "undefined" ? localStorage.getItem("ps26034_user_email") || "supervisor@demo.ps26034" : "supervisor@demo.ps26034";
    const savedName =
      typeof window !== "undefined" && localStorage.getItem("ps26034_user_name")
        ? localStorage.getItem("ps26034_user_name")!
        : savedEmail
            .split("@")[0]
            .replace(/[._-]/g, " ")
            .split(" ")
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ");

    const parts = savedName.trim().split(" ");
    const initials =
      parts.length >= 2
        ? (parts[0][0] + parts[1][0]).toUpperCase()
        : (savedName.substring(0, 2) || "US").toUpperCase();

    setUserInfo({ email: savedEmail, name: savedName, initials });
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem("ps26034_auth_token");
    localStorage.removeItem("ps26034_user_email");
    localStorage.removeItem("ps26034_user_name");
    setIsProfileOpen(false);
    router.push("/login");
  };

  if (pathname === "/login") {
    return null;
  }

  const navItems = [
    { href: "/", label: "Executive Dashboard", icon: LayoutDashboard, badge: null },
    { href: "/inspections", label: "Inspections Registry", icon: FileCheck2, badge: "Live" },
    { href: "/review", label: "REVIEW Studio", icon: Sparkles, badge: "Dual-OCR" },
    { href: "/analytics", label: "Decision Quality", icon: BarChart3, badge: "Gap 4" },
  ];

  return (
    <>
      {/* Floating Expand Sidebar Button when Sidebar is Completely Hidden */}
      <AnimatePresence>
        {isCollapsed && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, x: -20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: -20 }}
            onClick={() => setIsCollapsed(false)}
            className="fixed top-4 left-4 z-50 p-2 rounded-xl bg-[#121218]/90 border border-zinc-700/80 text-amber-400 hover:text-amber-300 hover:bg-zinc-800 backdrop-blur-md shadow-2xl transition-all flex items-center justify-center"
            title="Expand Sidebar"
          >
            <ChevronsRight className="w-5 h-5 animate-pulse" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Main Collapsible Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          width: isCollapsed ? 0 : 260,
          opacity: isCollapsed ? 0 : 1,
        }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="bg-[#07070b]/95 border-r border-zinc-800/80 flex flex-col justify-between h-screen sticky top-0 z-40 select-none shrink-0 overflow-hidden backdrop-blur-2xl shadow-2xl"
      >
        <div className="flex flex-col h-full justify-between">
          <div>
            {/* Brand Header */}
            <div className="p-4 border-b border-zinc-800/80 flex items-center justify-between min-h-[68px] min-w-[260px]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-amber-500 via-yellow-500 to-amber-400 text-black flex items-center justify-center font-black shadow-[0_0_20px_rgba(245,158,11,0.3)] shrink-0 border border-amber-300/40">
                  <ShieldCheck className="w-5 h-5 text-black" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h1 className="text-sm font-extrabold text-white tracking-tight truncate">PS 26034</h1>
                    <span className="text-[9px] font-mono font-extrabold px-1.5 py-0.2 rounded bg-zinc-800/90 text-amber-300 border border-zinc-700">
                      v1.0
                    </span>
                  </div>
                  <p className="text-[10px] font-semibold text-zinc-400 truncate">Legal Metrology Studio</p>
                </div>
              </div>

              {/* Three-Arrow Hide Sidebar Toggle Button */}
              <button
                onClick={() => setIsCollapsed(true)}
                className="p-2 rounded-xl bg-[#121218] border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 hover:bg-zinc-800 transition-all shadow-inner shrink-0 flex items-center justify-center active:scale-95"
                title="Hide Sidebar Completely"
              >
                <ChevronsLeft className="w-4 h-4 text-zinc-400 hover:text-white" />
              </button>
            </div>

            {/* Quick Search */}
            <div className="p-3.5 min-w-[260px]">
              <div
                onClick={() => window.dispatchEvent(new CustomEvent("open-command-palette"))}
                className="relative cursor-pointer group"
                title="Click or press Ctrl + K to Search"
              >
                <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-zinc-500 group-hover:text-amber-400 transition-colors shrink-0" />
                <input
                  type="text"
                  readOnly
                  placeholder="Search audits... (Ctrl K)"
                  className="w-full bg-[#121218] border border-zinc-800 group-hover:border-zinc-700 rounded-xl pl-9.5 pr-3 py-2 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none cursor-pointer font-medium transition-all shadow-inner"
                />
              </div>
            </div>

            {/* Navigation Menu */}
            <nav className="px-3 py-2 space-y-1.5 min-w-[260px]">
              <div className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest px-3 mb-2 font-mono">
                Main Menu
              </div>

              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group relative flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs transition-all ${
                      isActive
                        ? "bg-gradient-to-r from-zinc-800/90 to-zinc-800/40 text-white font-extrabold shadow-lg border border-zinc-700/80"
                        : "text-zinc-400 hover:text-white hover:bg-zinc-800/40 font-medium"
                    }`}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-amber-400 shadow-[0_0_10px_#f59e0b]" />
                    )}

                    <div className="flex items-center gap-3">
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          isActive ? "text-amber-400" : "text-zinc-500 group-hover:text-zinc-300"
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.badge ? (
                      <span
                        className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full shrink-0 ${
                          isActive
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_8px_rgba(245,158,11,0.2)]"
                            : "bg-zinc-800/80 text-zinc-400 border border-zinc-700/50"
                        }`}
                      >
                        {item.badge}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Separate Floating Profile Card at Sidebar Bottom */}
          <div className="p-3.5 min-w-[260px]">
            <div
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="p-3 rounded-2xl bg-[#121218] border border-zinc-800 hover:border-zinc-700 flex items-center justify-between cursor-pointer hover:bg-zinc-800/60 transition-all shadow-lg group relative"
              title="Click for Profile Menu"
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* User Avatar Circle with Emerald Status */}
                <div className="relative shrink-0">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-400 text-black font-black text-xs flex items-center justify-center shadow-md border border-amber-300/40">
                    {userInfo.initials}
                  </div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#09090d] animate-pulse" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-white truncate group-hover:text-amber-400 transition-colors">
                    {userInfo.name}
                  </div>
                  <div className="text-[10px] text-zinc-400 truncate">{userInfo.email}</div>
                </div>
              </div>

              <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white shrink-0 transition-transform group-hover:translate-x-0.5" />
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Modern Profile Dropdown Flyout Modal (Matching User Reference Image) */}
      <AnimatePresence>
        {isProfileOpen && (
          <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-md flex items-start sm:items-center justify-center p-4">
            {/* Backdrop Dismiss */}
            <div className="absolute inset-0" onClick={() => setIsProfileOpen(false)} />

            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 15 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 bg-[#121218] border border-zinc-700/80 rounded-3xl max-w-sm w-full p-4 shadow-2xl space-y-3.5 text-xs text-zinc-200 overflow-hidden"
            >
              {/* Header: Omkar dubey Profile Header */}
              <div className="p-3 rounded-2xl bg-[#181820] border border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative shrink-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 via-amber-400 to-orange-400 text-black font-black text-sm flex items-center justify-center shadow-lg border border-amber-300/40">
                      {userInfo.initials}
                    </div>
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-[#181820]" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-extrabold text-white truncate">{userInfo.name}</h3>
                    <p className="text-[11px] text-zinc-400 truncate">{userInfo.email}</p>
                  </div>
                </div>

                <button
                  onClick={() => setIsProfileOpen(false)}
                  className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Menu List Options matching user reference UI */}
              <div className="space-y-0.5">
                <button
                  onClick={() => setIsProfileOpen(false)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-zinc-800/80 text-zinc-200 hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-zinc-400" />
                    <span className="font-semibold">My Profile</span>
                  </div>
                </button>

                <button
                  onClick={() => setIsProfileOpen(false)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-zinc-800/80 text-zinc-200 hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Settings className="w-4 h-4 text-zinc-400" />
                    <span className="font-semibold">Account</span>
                  </div>
                </button>

                <button
                  onClick={() => setIsProfileOpen(false)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-zinc-800/80 text-zinc-400 hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Bug className="w-4 h-4 text-zinc-500" />
                    <span className="font-semibold">Buganizer</span>
                  </div>
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                </button>

                <button
                  onClick={() => setIsProfileOpen(false)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-zinc-800/80 text-zinc-400 hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Shield className="w-4 h-4 text-zinc-500" />
                    <span className="font-semibold">Sessions</span>
                  </div>
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                </button>

                <button
                  onClick={() => setIsProfileOpen(false)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-zinc-800/80 text-zinc-200 hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <HelpCircle className="w-4 h-4 text-zinc-400" />
                    <span className="font-semibold">Troubleshooting</span>
                  </div>
                </button>

                <button
                  onClick={() => setIsProfileOpen(false)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-zinc-800/80 text-zinc-200 hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span className="font-semibold">New Features</span>
                  </div>
                </button>

                <button
                  onClick={() => setThemeMode(themeMode === "dark" ? "light" : "dark")}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-zinc-800/80 text-zinc-200 hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Sun className="w-4 h-4 text-amber-400" />
                    <span className="font-semibold">Light Mode</span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400">Dark</span>
                </button>

                <button
                  onClick={() => setIsProfileOpen(false)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-zinc-800/80 text-zinc-200 hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Bell className="w-4 h-4 text-zinc-400" />
                    <span className="font-semibold">Notification</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
                </button>
              </div>

              {/* Red Divider Logout Button */}
              <div className="pt-2 border-t border-zinc-800">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 transition-all font-bold cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-rose-400" />
                  <span>Logout</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
