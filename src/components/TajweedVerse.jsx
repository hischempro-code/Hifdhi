/**
 * TajweedVerse — React Web version
 * 
 * Renders parsed tajweed segments as nested <span> elements.
 * Preserves Arabic cursive by keeping all segments inside a single
 * inline flow — no block-level breaks between letters.
 * 
 * Props:
 *   segments: [{ text, color, rule }]  — from quran-tajweed.json
 *   isMem:    boolean                  — if true, entire verse is green (memorized)
 *   fontSize: number                   — optional override (default 26)
 */
import React from "react";
import { TAJWEED_COLORS } from "../constants/tajweed-colors";

const FONT_FAMILY = "'KFGQPC Uthman Taha Naskh', 'Amiri', 'Scheherazade New', serif";

export default function TajweedVerse({ segments, isMem = false, fontSize = 26 }) {
  if (!segments || segments.length === 0) return null;

  return (
    <span
      style={{
        fontSize,
        fontFamily: FONT_FAMILY,
        lineHeight: 2.8,
        color: "#2C2416",
        direction: "rtl",
        unicodeBidi: "bidi-override",
      }}
    >
      {segments.map((seg, i) => {
        // Memorized mode: uniform green
        if (isMem) {
          return (
            <span key={i} style={{ color: "#1B9E5A" }}>
              {seg.text}
            </span>
          );
        }

        // Normal Tajweed coloring
        const style = seg.color
          ? { color: seg.color, fontWeight: 700 }
          : {};

        return (
          <span key={i} style={style}>
            {seg.text}
          </span>
        );
      })}
    </span>
  );
}

/**
 * TajweedVersePlain — Renders plain text without tajweed colors.
 * Used for hidden/blurred mode in study screen.
 */
export function TajweedVersePlain({ text, fontSize = 26, blurred = false }) {
  return (
    <span
      style={{
        fontSize,
        fontFamily: FONT_FAMILY,
        lineHeight: 2.8,
        color: "#2C2416",
        direction: "rtl",
        ...(blurred
          ? { filter: "blur(22px)", userSelect: "none", WebkitUserSelect: "none" }
          : {}),
      }}
    >
      {text}
    </span>
  );
}
