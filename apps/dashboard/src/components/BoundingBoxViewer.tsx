"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RuleResult, InspectionImageMeta } from "../lib/types";
import {
  Eye,
  EyeOff,
  Sparkles,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  ScanLine,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  Activity,
  Maximize2,
  Copy,
  Check,
} from "lucide-react";

interface Props {
  images: InspectionImageMeta[];
  fieldResults: RuleResult[];
  activeField?: string | null;
  onSelectField?: (fieldName: string) => void;
}

export function normalizeBbox(rawBbox: any): [number, number, number, number] | null {
  if (!rawBbox || !Array.isArray(rawBbox) || rawBbox.length === 0) return null;

  // EasyOCR polygon format: [[x1, y1], [x2, y1], [x2, y2], [x1, y2]]
  if (Array.isArray(rawBbox[0]) && rawBbox[0].length >= 2) {
    const xs = rawBbox.map((p: any) => Number(p[0]) || 0);
    const ys = rawBbox.map((p: any) => Number(p[1]) || 0);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    return [minX, minY, maxX, maxY];
  }

  // Flat 4-tuple format: [x1, y1, x2, y2]
  if (rawBbox.length === 4) {
    const coords = rawBbox.map((n: any) => Number(n) || 0);
    return [coords[0], coords[1], coords[2], coords[3]];
  }

  return null;
}

export const BoundingBoxViewer: React.FC<Props> = ({
  images,
  fieldResults,
  activeField: externalActiveField,
  onSelectField,
}) => {
  const [selectedImageId, setSelectedImageId] = useState<string>(images[0]?.id || "");
  const [naturalDim, setNaturalDim] = useState<{ w: number; h: number } | null>(null);
  const [activeFieldState, setActiveFieldState] = useState<string | null>(null);
  const [hoveredField, setHoveredField] = useState<string | null>(null);
  const [showAllBoxes, setShowAllBoxes] = useState<boolean>(true);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [decisionFilter, setDecisionFilter] = useState<"ALL" | "PASS" | "REVIEW" | "FAIL">("ALL");
  const [enableLaserBeam, setEnableLaserBeam] = useState<boolean>(true);
  const imgRef = useRef<HTMLImageElement>(null);

  const selectedImage = images.find((i) => i.id === selectedImageId) || images[0];
  const activeField = externalActiveField !== undefined ? externalActiveField : activeFieldState;

  useEffect(() => {
    if (images.length > 0 && !selectedImageId) {
      setSelectedImageId(images[0].id);
    }
  }, [images, selectedImageId]);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setNaturalDim({
      w: img.naturalWidth || selectedImage?.original_width || 1000,
      h: img.naturalHeight || selectedImage?.original_height || 750,
    });
  };

  const handleFieldClick = (fieldName: string) => {
    const next = activeField === fieldName ? null : fieldName;
    setActiveFieldState(next);
    if (onSelectField) onSelectField(fieldName);
  };

  const handleCopyBbox = (e: React.MouseEvent, fieldName: string, bboxCoords: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(bboxCoords);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const filteredFieldResults = fieldResults.filter((fr) => {
    if (decisionFilter === "ALL") return true;
    if (decisionFilter === "PASS") return fr.decision === "PASS";
    if (decisionFilter === "REVIEW") return fr.decision === "REVIEW";
    if (decisionFilter === "FAIL") return fr.decision === "FAIL";
    return true;
  });

  const evidencesWithBbox = filteredFieldResults
    .map((fr) => ({
      fr,
      parsedBbox: fr.evidence ? normalizeBbox(fr.evidence.bbox) : null,
    }))
    .filter((item): item is { fr: RuleResult; parsedBbox: [number, number, number, number] } => item.parsedBbox !== null);

  return (
    <div className="bg-gradient-to-br from-[#0b0c14] via-[#07070b] to-[#0d0a17] border border-white/15 rounded-3xl p-6 sm:p-7 shadow-[0_0_60px_rgba(0,0,0,0.9)] space-y-6 relative overflow-hidden">
      {/* Background Luxury Glow Accent */}
      <div className="absolute top-0 right-1/4 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-zinc-800/80 relative z-10">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-zinc-900 via-zinc-800 to-emerald-950/40 border border-emerald-500/30 flex items-center justify-center text-white shadow-[0_0_20px_rgba(16,185,129,0.15)]">
            <ScanLine className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2.5 tracking-wide">
              Bounding Box Evidence Studio
              <span className="text-[10px] font-mono font-extrabold px-3 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                EasyOCR + Tesseract Dual-Engine BBox
              </span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5 font-medium">
              Synchronized spatial bounding boxes, confidence telemetry, and candidate OCR extraction readings
            </p>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Laser Beam Toggle */}
          <button
            onClick={() => setEnableLaserBeam(!enableLaserBeam)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-extrabold border transition-all duration-200 ${
              enableLaserBeam
                ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white"
            }`}
            title="Toggle Laser Scan Line Beam"
          >
            <Sparkles className={`w-3.5 h-3.5 ${enableLaserBeam ? "text-emerald-400 animate-spin" : "text-zinc-500"}`} />
            <span>AI Beam</span>
          </button>

          {/* Show All BBoxes Toggle */}
          <button
            onClick={() => setShowAllBoxes(!showAllBoxes)}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-extrabold border transition-all duration-200 ${
              showAllBoxes
                ? "bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.3)] font-black"
                : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white hover:border-zinc-700"
            }`}
          >
            {showAllBoxes ? <Eye className="w-3.5 h-3.5 text-black" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>{showAllBoxes ? "Hide Unfocused Boxes" : "Show All BBoxes"}</span>
          </button>

          <div className="flex items-center bg-[#07070b] rounded-2xl p-1 border border-zinc-800/80 shadow-inner">
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.8, z - 0.2))}
              className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800/80 transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono font-bold px-3 text-white">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.2))}
              className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800/80 transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel(1)}
              className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800/80 transition-colors border-l border-zinc-800 ml-1"
              title="Reset Zoom"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Image Selection Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
        {/* Image Tabs */}
        {images.length > 0 && (
          <div className="flex gap-2.5">
            {images.map((img) => (
              <button
                key={img.id}
                onClick={() => setSelectedImageId(img.id)}
                className={`px-4.5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2.5 border ${
                  selectedImage?.id === img.id
                    ? "bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.25)] font-black"
                    : "bg-zinc-900/80 text-zinc-400 border-zinc-800 hover:text-white hover:bg-zinc-800"
                }`}
              >
                <span className="capitalize">{img.role} Panel Photo</span>
                <span
                  className={`text-[9px] px-2 py-0.5 rounded-md font-mono font-extrabold uppercase ${
                    selectedImage?.id === img.id ? "bg-black text-white" : "bg-[#07070b] text-zinc-400 border border-zinc-800"
                  }`}
                >
                  {img.quality} QUALITY
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Decision Filter Pills */}
        <div className="flex items-center bg-[#050508] p-1 rounded-2xl border border-zinc-800/80">
          {(["ALL", "PASS", "REVIEW", "FAIL"] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setDecisionFilter(filter)}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-extrabold font-mono transition-all ${
                decisionFilter === filter
                  ? "bg-gradient-to-r from-zinc-800 to-zinc-700 text-white shadow-md border border-white/20"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
        {/* Canvas Display */}
        <div className="lg:col-span-2 bg-[#040407] border border-zinc-800/90 rounded-3xl p-5 relative overflow-hidden min-h-[480px] flex items-center justify-center group/canvas shadow-inner">
          {/* Subtle Canvas Dot Grid Background */}
          <div className="absolute inset-0 bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:16px_16px] opacity-25 pointer-events-none" />

          {!selectedImage ? (
            <div className="text-center py-20 text-zinc-500 text-xs font-semibold">
              No product label photos uploaded for this inspection
            </div>
          ) : (
            <div
              className="relative max-w-full overflow-auto transition-transform duration-200"
              style={{ transform: `scale(${zoomLevel})`, transformOrigin: "top left" }}
            >
              {/* Image element */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={imgRef}
                src={selectedImage.url}
                alt={`Label photo - ${selectedImage.role}`}
                onLoad={handleImageLoad}
                className="rounded-2xl object-contain max-h-[540px] w-auto mx-auto border border-zinc-800/80 shadow-[0_0_50px_rgba(0,0,0,0.95)] relative z-0"
              />

              {/* Animated AI Laser Beam Overlay */}
              {enableLaserBeam && (
                <motion.div
                  initial={{ top: "0%" }}
                  animate={{ top: ["0%", "98%", "0%"] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_20px_#10b981] pointer-events-none z-10 opacity-75"
                />
              )}

              {/* Bounding Box Overlays */}
              {naturalDim &&
                evidencesWithBbox.map(({ fr, parsedBbox }) => {
                  const [x1, y1, x2, y2] = parsedBbox;

                  const left = (x1 / naturalDim.w) * 100;
                  const top = (y1 / naturalDim.h) * 100;
                  const width = Math.max(3, ((x2 - x1) / naturalDim.w) * 100);
                  const height = Math.max(3, ((y2 - y1) / naturalDim.h) * 100);

                  const isFocused = activeField === fr.field_name;
                  const isHovered = hoveredField === fr.field_name;
                  const isVisible = showAllBoxes || isFocused || isHovered;

                  if (!isVisible) return null;

                  let borderColor = "border-emerald-400/90 bg-emerald-500/10 text-emerald-300 shadow-emerald-500/20";
                  let tagBg = "bg-gradient-to-r from-emerald-600 to-teal-600";
                  let ledBg = "bg-emerald-400";

                  if (fr.evidence.state === "CONFLICTING") {
                    borderColor = "border-purple-400 bg-purple-500/20 text-purple-200 animate-pulse shadow-purple-500/30";
                    tagBg = "bg-gradient-to-r from-purple-600 to-indigo-600";
                    ledBg = "bg-purple-400";
                  } else if (fr.evidence.state === "NOT_VERIFIABLE") {
                    borderColor = "border-amber-400 bg-amber-500/20 text-amber-200 shadow-amber-500/20";
                    tagBg = "bg-gradient-to-r from-amber-600 to-orange-600";
                    ledBg = "bg-amber-400";
                  } else if (fr.decision === "FAIL") {
                    borderColor = "border-rose-500 bg-rose-500/20 text-rose-200 border-dashed shadow-rose-500/20";
                    tagBg = "bg-gradient-to-r from-rose-600 to-red-600";
                    ledBg = "bg-rose-400";
                  }

                  if (isFocused) {
                    borderColor += " ring-2 ring-white ring-offset-2 ring-offset-[#07070b] z-20 shadow-[0_0_30px_rgba(255,255,255,0.4)] scale-[1.02]";
                  }

                  return (
                    <motion.div
                      key={fr.field_name}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.2 }}
                      onClick={() => handleFieldClick(fr.field_name)}
                      onMouseEnter={() => setHoveredField(fr.field_name)}
                      onMouseLeave={() => setHoveredField(null)}
                      style={{
                        left: `${left}%`,
                        top: `${top}%`,
                        width: `${width}%`,
                        height: `${height}%`,
                      }}
                      className={`absolute border-2 rounded-xl transition-all cursor-pointer z-10 hover:z-30 backdrop-blur-[1px] ${borderColor}`}
                    >
                      {/* Laser Corner Markers */}
                      <span className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-white rounded-tl-sm" />
                      <span className="absolute -top-1 -right-1 w-2 h-2 border-t-2 border-r-2 border-white rounded-tr-sm" />
                      <span className="absolute -bottom-1 -left-1 w-2 h-2 border-b-2 border-l-2 border-white rounded-bl-sm" />
                      <span className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-white rounded-br-sm" />

                      {/* Compact Pill Tag Header */}
                      <span
                        className={`absolute -top-5.5 left-1 px-2.5 py-0.5 rounded-lg text-[9px] font-black text-white shadow-lg whitespace-nowrap flex items-center gap-1.5 border border-white/20 transition-all ${
                          isHovered || isFocused ? "opacity-100 z-30 scale-105 shadow-xl" : "opacity-90"
                        } ${tagBg}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${ledBg} animate-pulse`} />
                        <span className="uppercase tracking-wider">{fr.field_name.replace("_", " ")}</span>
                        {fr.evidence.ocr_confidence !== undefined && fr.evidence.ocr_confidence !== null && (
                          <span className="opacity-95 font-mono text-[8px] bg-black/40 px-1 rounded font-bold">
                            {Math.round(fr.evidence.ocr_confidence * 100)}%
                          </span>
                        )}
                      </span>
                    </motion.div>
                  );
                })}
            </div>
          )}
        </div>

        {/* Sidebar Field Cards */}
        <div className="space-y-3 max-h-[540px] overflow-y-auto pr-1.5 custom-scrollbar">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800/60">
            <h4 className="text-xs font-black text-zinc-300 uppercase tracking-wider flex items-center gap-2 font-mono">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              OCR Field Evidence ({filteredFieldResults.length})
            </h4>
            <span className="text-[10px] font-mono text-zinc-500 font-bold">
              {evidencesWithBbox.length} BBoxes Active
            </span>
          </div>

          {filteredFieldResults.length === 0 ? (
            <div className="p-6 text-center text-zinc-500 text-xs font-semibold bg-[#07070b] border border-zinc-800/80 rounded-2xl">
              No field evidence matches filter "{decisionFilter}"
            </div>
          ) : (
            filteredFieldResults.map((fr) => {
              const isSelected = activeField === fr.field_name;
              const isHovered = hoveredField === fr.field_name;
              const isHighlighted = isSelected || isHovered;
              const hasBbox = fr.evidence && fr.evidence.bbox;
              const parsedBbox = fr.evidence ? normalizeBbox(fr.evidence.bbox) : null;
              const bboxStr = parsedBbox ? `[${parsedBbox.join(", ")}]` : "N/A";

            return (
              <motion.div
                key={fr.field_name}
                whileHover={{ x: 2 }}
                onClick={() => handleFieldClick(fr.field_name)}
                onMouseEnter={() => setHoveredField(fr.field_name)}
                onMouseLeave={() => setHoveredField(null)}
                className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer relative overflow-hidden ${
                  isHighlighted
                    ? "bg-gradient-to-r from-zinc-900/90 to-[#12131e] border-white/40 shadow-[0_0_25px_rgba(255,255,255,0.08)] ring-1 ring-white/30"
                    : "bg-[#07070b] border-zinc-800/90 hover:border-zinc-700 hover:bg-zinc-800/40"
                }`}
              >
                {/* Field Header */}
                <div className="flex items-center justify-between">
                  <div className="font-extrabold text-xs text-white capitalize flex items-center gap-2 tracking-wide">
                    <span>{fr.field_name.replace(/_/g, " ")}</span>
                    {hasBbox ? (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]" title="BBox active" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-zinc-700" title="No BBox" />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {fr.evidence?.ocr_engine && (
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-zinc-900 text-zinc-300 font-mono font-black uppercase border border-zinc-700/80">
                        {fr.evidence.ocr_engine}
                      </span>
                    )}
                    <span
                      className={`text-[10px] font-black px-2.5 py-0.5 rounded-md border ${
                        fr.decision === "PASS"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                          : fr.decision === "FAIL"
                          ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                          : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                      }`}
                    >
                      {fr.decision}
                    </span>
                  </div>
                </div>

                {/* Extracted Value Box */}
                <div className="mt-3 text-xs text-white font-mono font-bold bg-[#040406] p-3 rounded-xl border border-zinc-800/90 flex items-center justify-between">
                  <span className="truncate">
                    {fr.evidence?.value || <span className="text-rose-400 font-sans italic text-[11px]">Not extracted</span>}
                  </span>
                  {fr.evidence?.ocr_confidence !== undefined && fr.evidence?.ocr_confidence !== null && (
                    <span className="text-[10px] text-white font-black ml-2 shrink-0 bg-zinc-800/80 px-2 py-0.5 rounded-md border border-zinc-700">
                      {Math.round(fr.evidence.ocr_confidence * 100)}%
                    </span>
                  )}
                </div>

                {/* Confidence Bar Meter */}
                {fr.evidence?.ocr_confidence !== undefined && fr.evidence?.ocr_confidence !== null && (
                  <div className="mt-2.5 w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden border border-zinc-800/60">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        fr.evidence.ocr_confidence >= 0.9
                          ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                          : fr.evidence.ocr_confidence >= 0.75
                          ? "bg-gradient-to-r from-amber-500 to-yellow-400"
                          : "bg-gradient-to-r from-rose-500 to-red-400"
                      }`}
                      style={{ width: `${Math.round(fr.evidence.ocr_confidence * 100)}%` }}
                    />
                  </div>
                )}

                {/* State & BBox Coordinates */}
                <div className="mt-3 flex items-center justify-between text-[11px] text-zinc-400 font-medium">
                  <span>State: <strong className="text-white font-bold">{fr.evidence?.state || "N/A"}</strong></span>
                  {parsedBbox && (
                    <button
                      onClick={(e) => handleCopyBbox(e, fr.field_name, bboxStr)}
                      className="text-[10px] font-mono text-zinc-400 hover:text-white flex items-center gap-1 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800/80 transition-colors"
                      title="Copy BBox Coordinates"
                    >
                      {copiedField === fr.field_name ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-2.5 h-2.5" />
                      )}
                      <span>{bboxStr}</span>
                    </button>
                  )}
                </div>

                {/* Candidate Readings */}
                {fr.evidence?.candidates && fr.evidence.candidates.length > 1 && (
                  <div className="mt-2.5 text-[10px] text-purple-300 bg-gradient-to-r from-purple-950/60 to-indigo-950/60 p-2.5 rounded-xl border border-purple-800/50 font-mono flex items-center justify-between">
                    <span className="font-sans text-purple-400 font-bold">Candidates:</span>
                    <span className="font-bold text-white">{fr.evidence.candidates.join(" | ")}</span>
                  </div>
                )}
              </motion.div>
            );
          })
          )}
        </div>
      </div>
    </div>
  );
};
