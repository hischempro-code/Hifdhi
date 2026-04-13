/**
 * HomeScreen — Landing page with logo, stats, and navigation buttons
 */
import React from "react";

export default function HomeScreen({ totalMem, streak, onNavigate }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(170deg, #F5ECD0, #EDE3C4)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      {/* Logo */}
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: 20,
          background: "linear-gradient(135deg, #1E8C52, #145533)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 8px 30px #14553320",
          marginBottom: 14,
        }}
      >
        <span
          style={{
            fontSize: 40,
            fontFamily: "'KFGQPC Uthman Taha Naskh', 'Amiri', serif",
            color: "#F5E6B8",
            fontWeight: 700,
          }}
        >
          حِ
        </span>
      </div>

      <div style={{ fontSize: 32, fontWeight: 700, color: "#1E8C52" }}>Hifdhi</div>
      <div style={{ fontSize: 18, fontFamily: "'Amiri', serif", color: "#8B7D3C" }}>
        حِفْظِي
      </div>
      <div
        style={{
          fontSize: 13,
          color: "#8B7D3C90",
          marginBottom: 36,
          marginTop: 4,
          textAlign: "center",
        }}
      >
        Mémorise le Coran avec le vrai Tajweed
      </div>

      {/* Buttons */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14, width: "100%", maxWidth: 320 }}>
        <button style={S.btnG} onClick={() => onNavigate("learn-list")}>
          <span style={{ fontSize: 26 }}>🧠</span>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: 17 }}>Apprendre</div>
            <div style={{ fontSize: 11, fontWeight: 400, opacity: 0.8 }}>8× visible + 8× caché</div>
          </div>
        </button>

        <button style={S.btnM} onClick={() => onNavigate("mushaf")}>
          <span style={{ fontSize: 26 }}>📖</span>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: 17, color: "#4A3D1A" }}>Mushaf Tajweed</div>
            <div style={{ fontSize: 11, fontWeight: 400, color: "#8B7D3C" }}>
              Données offline — 114 sourates
            </div>
          </div>
        </button>

        <button style={S.btnR} onClick={() => onNavigate("review")}>
          <span style={{ fontSize: 26 }}>🔄</span>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: 17, color: "#4A3D1A" }}>Révision</div>
            <div style={{ fontSize: 11, fontWeight: 400, color: "#8B7D3C" }}>
              Spaced repetition
            </div>
          </div>
        </button>
      </div>

      {/* Stats */}
      {totalMem > 0 && (
        <div style={{ display: "flex", gap: 20, marginTop: 30 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#1E8C52" }}>{totalMem}</div>
            <div style={{ fontSize: 10, color: "#8B7D3C80" }}>Mémorisés</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#1E8C52" }}>🔥 {streak}</div>
            <div style={{ fontSize: 10, color: "#8B7D3C80" }}>Jours consécutifs</div>
          </div>
        </div>
      )}
    </div>
  );
}

const S = {
  btnG: {
    padding: "18px",
    borderRadius: 16,
    border: "none",
    background: "linear-gradient(135deg, #1E8C52, #145533)",
    color: "#F5E6B8",
    fontWeight: 700,
    boxShadow: "0 6px 24px #14553320",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    fontFamily: "'Outfit'",
  },
  btnM: {
    padding: "18px",
    borderRadius: 16,
    border: "2.5px solid #C5A028",
    background: "#FFFDF0",
    fontWeight: 700,
    boxShadow: "0 4px 16px #C5A02815",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    fontFamily: "'Outfit'",
  },
  btnR: {
    padding: "18px",
    borderRadius: 16,
    border: "2.5px solid #E0D5BF",
    background: "#FFFDF0",
    fontWeight: 700,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    fontFamily: "'Outfit'",
  },
};
