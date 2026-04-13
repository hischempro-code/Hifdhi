/**
 * MushafFrame — Ornamental frame around Mushaf content
 * Green border with gold geometric patterns and corner medallions.
 */
import React from "react";

export default function MushafFrame({ children }) {
  return (
    <div style={{ maxWidth: 480, margin: "0 auto", background: "#EDE3C4", padding: 8 }}>
      <div
        style={{
          position: "relative",
          background: "linear-gradient(135deg, #1B6B8A, #1A7A5A, #2D8B57, #1A7A5A, #1B6B8A)",
          borderRadius: 5,
          padding: 10,
        }}
      >
        {/* Geometric pattern overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 5,
            overflow: "hidden",
            opacity: 0.22,
          }}
        >
          <svg width="100%" height="100%">
            <defs>
              <pattern
                id="mushaf-pattern"
                x="0"
                y="0"
                width="20"
                height="20"
                patternUnits="userSpaceOnUse"
              >
                <circle cx="10" cy="10" r="3.5" fill="none" stroke="#FFD700" strokeWidth="0.5" />
                <path d="M10 6.5 L11.5 10 L10 13.5 L8.5 10Z" fill="#FFD700" opacity="0.35" />
                <circle cx="10" cy="10" r="1.2" fill="#FFD700" opacity="0.4" />
                <circle cx="0" cy="0" r="2" fill="none" stroke="#FF69B4" strokeWidth="0.4" />
                <circle cx="20" cy="0" r="2" fill="none" stroke="#FF69B4" strokeWidth="0.4" />
                <circle cx="0" cy="20" r="2" fill="none" stroke="#FF69B4" strokeWidth="0.4" />
                <circle cx="20" cy="20" r="2" fill="none" stroke="#FF69B4" strokeWidth="0.4" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#mushaf-pattern)" />
          </svg>
        </div>

        {/* Corner medallions */}
        {[
          { top: 2, left: 2 },
          { top: 2, right: 2 },
          { bottom: 2, left: 2 },
          { bottom: 2, right: 2 },
        ].map((pos, i) => (
          <div key={i} style={{ position: "absolute", ...pos, width: 24, height: 24, zIndex: 3 }}>
            <svg width="24" height="24" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" fill="#E8C83A" opacity="0.8" />
              <circle cx="12" cy="12" r="7" fill="#1A7A5A" />
              <circle cx="12" cy="12" r="4" fill="#E8C83A" opacity="0.6" />
            </svg>
          </div>
        ))}

        {/* Gold inner border */}
        <div
          style={{
            position: "absolute",
            inset: 7,
            border: "1.5px solid #E8C83A",
            borderRadius: 3,
            pointerEvents: "none",
            zIndex: 2,
          }}
        />

        {/* Content area */}
        <div
          style={{
            position: "relative",
            background: "#FFFDF0",
            border: "3px solid #B22234",
            borderRadius: 2,
            zIndex: 1,
          }}
        >
          <div style={{ border: "1px solid #D4A01740", margin: 3, padding: "6px 8px 8px" }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
