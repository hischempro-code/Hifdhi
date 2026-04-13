/**
 * TajweedLegend — Color legend showing active tajweed rules
 * Can render compact (inline) or full (with descriptions).
 */
import React from "react";
import { TAJWEED_LEGEND } from "../constants/tajweed-colors";

export function TajweedLegendCompact() {
  const compact = [
    { ar: "غُنَّة", en: "Ghunnah", c: "#16A858" },
    { ar: "إِخْفَاء", en: "Ikhfā'", c: "#9B30D4" },
    { ar: "إِدْغَام", en: "Idghām", c: "#169777" },
    { ar: "إِقْلَاب", en: "Iqlāb", c: "#26A4CC" },
    { ar: "قَلْقَلَة", en: "Qalqalah", c: "#4050EC" },
    { ar: "مَدّ", en: "Madd", c: "#FF7F00" },
    { ar: "لام شمسية", en: "Lām Shams.", c: "#D4A017" },
  ];

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 6,
        justifyContent: "center",
        padding: "6px 4px 2px",
        borderTop: "1px solid #D4A01730",
        marginTop: 6,
      }}
    >
      {compact.map((r) => (
        <div key={r.c} style={{ display: "flex", alignItems: "center", gap: 3 }}>
          <div style={{ width: 7, height: 7, borderRadius: 2, background: r.c }} />
          <span style={{ fontSize: 8, color: "#6B5C2A" }}>{r.ar}</span>
        </div>
      ))}
    </div>
  );
}

export function TajweedLegendFull() {
  return (
    <div
      style={{
        background: "#FFFDF0",
        border: "1px solid #E0D5BF",
        borderRadius: 14,
        padding: "12px 14px",
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 700, color: "#2C2416", marginBottom: 10 }}>
        🎨 Palette Tajweed — Dar Al-Maarifah
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        {TAJWEED_LEGEND.map((item) => (
          <div key={item.rule} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: 3,
                background: item.color,
                flexShrink: 0,
              }}
            />
            <div>
              <span
                style={{
                  fontSize: 12,
                  fontFamily: "'Amiri', serif",
                  color: item.color,
                  fontWeight: 700,
                }}
              >
                {item.ar}
              </span>
              <span style={{ fontSize: 9, color: "#8B7D3C90", marginLeft: 4 }}>
                {item.en}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TajweedLegendCompact;
