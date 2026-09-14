"use client";

import React, { useState, useRef, useEffect } from "react";

export interface BoundingBoxPercent {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface EvidenceViewerProps {
  /** Package image URL */
  imageUrl: string;
  /** Raw bbox coordinates from OCR API: [[x1,y1],[x2,y1],[x2,y2],[x1,y2]] or [x1,y1,x2,y2] */
  bbox?: any;
  /** Known original image width from backend metadata (optional) */
  originalWidth?: number | null;
  /** Known original image height from backend metadata (optional) */
  originalHeight?: number | null;
  /** Currently selected field name */
  fieldName?: string;
  /** Decision status ('PASS' | 'FAIL' | 'REVIEW') */
  decision?: string;
  /** OCR confidence score (0 to 1) */
  ocrConfidence?: number | null;
  /** Optional custom CSS classes for the container */
  className?: string;
  /** Optional image alt attribute */
  alt?: string;
}

/**
 * Parses and validates raw EasyOCR / API bounding box coordinates,
 * converting them from original image pixel space to responsive percentage values.
 */
export function calculatePercentBbox(
  rawBbox: any,
  imageWidth: number,
  imageHeight: number
): BoundingBoxPercent | null {
  // Check image dimension validity
  if (!imageWidth || !imageHeight || imageWidth <= 0 || imageHeight <= 0) {
    return null;
  }

  // Check bbox validity
  if (!rawBbox || !Array.isArray(rawBbox) || rawBbox.length === 0) {
    return null;
  }

  let x1: number, y1: number, x2: number, y2: number;

  // EasyOCR polygon format: [[x1, y1], [x2, y1], [x2, y2], [x1, y2]]
  if (Array.isArray(rawBbox[0]) && rawBbox[0].length >= 2) {
    const xs = rawBbox.map((p: any) => Number(p[0]));
    const ys = rawBbox.map((p: any) => Number(p[1]));

    if (xs.some((x) => isNaN(x)) || ys.some((y) => isNaN(y))) {
      return null;
    }

    x1 = Math.min(...xs);
    x2 = Math.max(...xs);
    y1 = Math.min(...ys);
    y2 = Math.max(...ys);
  } else if (rawBbox.length === 4) {
    // Flat 4-tuple format: [x1, y1, x2, y2]
    const coords = rawBbox.map((n: any) => Number(n));
    if (coords.some((c) => isNaN(c))) {
      return null;
    }
    x1 = Math.min(coords[0], coords[2]);
    x2 = Math.max(coords[0], coords[2]);
    y1 = Math.min(coords[1], coords[3]);
    y2 = Math.max(coords[1], coords[3]);
  } else {
    return null;
  }

  // Ensure non-negative bounds and x2 >= x1, y2 >= y1
  if (x2 < x1 || y2 < y1) {
    return null;
  }

  // Calculate percentage-based positioning relative to original image dimensions
  const left = Math.max(0, Math.min(100, (x1 / imageWidth) * 100));
  const top = Math.max(0, Math.min(100, (y1 / imageHeight) * 100));
  const width = Math.max(0.5, Math.min(100 - left, ((x2 - x1) / imageWidth) * 100));
  const height = Math.max(0.5, Math.min(100 - top, ((y2 - y1) / imageHeight) * 100));

  return { left, top, width, height };
}

export const EvidenceViewer: React.FC<EvidenceViewerProps> = ({
  imageUrl,
  bbox,
  originalWidth,
  originalHeight,
  fieldName,
  decision,
  ocrConfidence,
  className = "",
  alt = "Package inspection evidence image",
}) => {
  const [naturalDim, setNaturalDim] = useState<{ w: number; h: number } | null>(
    originalWidth && originalHeight && originalWidth > 0 && originalHeight > 0
      ? { w: originalWidth, h: originalHeight }
      : null
  );
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (originalWidth && originalHeight && originalWidth > 0 && originalHeight > 0) {
      setNaturalDim({ w: originalWidth, h: originalHeight });
    }
  }, [originalWidth, originalHeight, imageUrl]);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (img.naturalWidth > 0 && img.naturalHeight > 0) {
      setNaturalDim({
        w: img.naturalWidth,
        h: img.naturalHeight,
      });
    }
  };

  const percentBbox = naturalDim
    ? calculatePercentBbox(bbox, naturalDim.w, naturalDim.h)
    : null;

  // Border & background styling based on decision status
  let overlayStyleClass = "border-2 border-red-500 bg-red-500/20 text-red-200 shadow-[0_0_15px_rgba(239,68,68,0.3)]";
  let badgeBgClass = "bg-red-600 text-white";

  if (decision === "PASS") {
    overlayStyleClass = "border-2 border-emerald-500 bg-emerald-500/20 text-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.3)]";
    badgeBgClass = "bg-emerald-600 text-white";
  } else if (decision === "REVIEW") {
    overlayStyleClass = "border-2 border-amber-500 bg-amber-500/20 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.3)]";
    badgeBgClass = "bg-amber-600 text-white";
  }

  return (
    <div className={`relative inline-block w-full overflow-hidden rounded-2xl bg-zinc-950 border border-zinc-800 ${className}`}>
      {/* Package Image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        src={imageUrl}
        alt={alt}
        onLoad={handleImageLoad}
        className="w-full h-auto object-contain max-h-[560px] mx-auto block rounded-2xl"
      />

      {/* Bounding Box Overlay */}
      {percentBbox && (
        <div
          style={{
            left: `${percentBbox.left}%`,
            top: `${percentBbox.top}%`,
            width: `${percentBbox.width}%`,
            height: `${percentBbox.height}%`,
          }}
          className={`absolute rounded-md transition-all duration-150 pointer-events-none z-20 ${overlayStyleClass}`}
        >
          {/* Corner markers */}
          <span className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-white rounded-tl-sm" />
          <span className="absolute -top-1 -right-1 w-2 h-2 border-t-2 border-r-2 border-white rounded-tr-sm" />
          <span className="absolute -bottom-1 -left-1 w-2 h-2 border-b-2 border-l-2 border-white rounded-bl-sm" />
          <span className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-white rounded-br-sm" />

          {/* Label Badge on overlay */}
          {fieldName && (
            <div className="absolute -top-6 left-0 z-30 pointer-events-auto">
              <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider shadow-md flex items-center gap-1 font-mono whitespace-nowrap ${badgeBgClass}`}>
                <span>{fieldName.replace(/_/g, " ")}</span>
                {ocrConfidence !== undefined && ocrConfidence !== null && (
                  <span className="opacity-90 font-mono text-[9px] bg-black/40 px-1 rounded">
                    {(ocrConfidence * 100).toFixed(0)}%
                  </span>
                )}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

