/**
 * SurahBanner — Decorative surah title banner
 * Green gradient with gold border, matching Mushaf style.
 */
import React from "react";

export default function SurahBanner({ name, number }) {
  return (
    <div style={{ margin: "6px 0 2px", textAlign: "center" }}>
      <div
        style={{
          display: "inline-block",
          background: "linear-gradient(180deg, #1E8C52, #14643A)",
          border: "2.5px solid #D4A017",
          borderRadius: 4,
          padding: "5px 28px",
          position: "relative",
          minWidth: "65%",
        }}
      >
        {/* Inner border */}
        <div
          style={{
            position: "absolute",
            inset: 3,
            border: "1px solid #D4A01760",
            borderRadius: 2,
          }}
        />
        <div
          style={{
            fontSize: 18,
            fontFamily: "'KFGQPC Uthman Taha Naskh', 'Amiri', serif",
            fontWeight: 700,
            color: "#FFFDE8",
            letterSpacing: 1,
            position: "relative",
            zIndex: 1,
            textShadow: "0 1px 2px #0003",
          }}
        >
          {number && (
            <span style={{ fontSize: 12, opacity: 0.7, marginLeft: 8 }}>
              {number}
            </span>
          )}
          سُورَةُ {name}
        </div>
      </div>
    </div>
  );
}
