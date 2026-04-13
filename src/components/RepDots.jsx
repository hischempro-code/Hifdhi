/**
 * RepDots — Repetition progress dots for study screen
 * Shows filled/empty dots with count label.
 */
import React from "react";

export default function RepDots({ current, total }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, marginTop: 14 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          style={{
            width: 9,
            height: 9,
            borderRadius: "50%",
            background: i < current ? "#1E8C52" : "transparent",
            border: `2px solid ${i < current ? "#1E8C52" : "#C5A028"}`,
            boxShadow: i < current ? "0 0 5px #1E8C5240" : "none",
            transition: "all 0.3s",
          }}
        />
      ))}
      <span style={{ fontSize: 10, color: "#8B7D3C80", marginLeft: 4 }}>
        {current}/{total}
      </span>
    </div>
  );
}
