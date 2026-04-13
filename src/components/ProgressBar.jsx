/**
 * ProgressBar — Thin animated progress indicator
 */
import React from "react";

export default function ProgressBar({ value, max, color = "#1E8C52", height = 4 }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div
      style={{
        height,
        background: "#E0D5BF",
        borderRadius: height,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${pct}%`,
          background: color,
          borderRadius: height,
          transition: "width 0.4s ease",
        }}
      />
    </div>
  );
}
