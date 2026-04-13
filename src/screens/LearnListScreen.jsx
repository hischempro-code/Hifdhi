/**
 * LearnListScreen — Surah selection list for memorization
 * Shows all 114 surahs with progress indicators.
 */
import React from "react";
import ALL_SURAHS from "../constants/surahs";
import { RECITERS } from "../constants/audio";

export default function LearnListScreen({
  progress,
  reciter,
  onSelectReciter,
  onSelectSurah,
  onBack,
}) {
  const memCount = (surahId, versesCount) => {
    let c = 0;
    for (let i = 0; i < versesCount; i++) {
      if (progress[`${surahId}:${i}`]?.memorized) c++;
    }
    return c;
  };

  return (
    <div
      style={{
        maxWidth: 460,
        margin: "0 auto",
        padding: "12px 16px",
        minHeight: "100vh",
        background: "#F5ECD0",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <button style={S.bk} onClick={onBack}>‹</button>
        <div style={{ fontSize: 20, fontWeight: 700, color: "#2C2416" }}>Apprendre</div>
      </div>

      {/* Method card */}
      <div style={S.methodCard}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#1E8C52", marginBottom: 4 }}>
          📋 Méthode
        </div>
        <div style={{ fontSize: 11, color: "#4A3D1A", lineHeight: 1.7 }}>
          <b>1.</b> Écoute le récitateur · <b>2.</b> Répète <b>8× en regardant</b> ·{" "}
          <b>3.</b> Répète <b>8× sans regarder</b> · <b>4.</b> Verset validé ✓
        </div>
      </div>

      {/* Reciter selector */}
      <div style={{ display: "flex", gap: 5, marginBottom: 14, overflowX: "auto", paddingBottom: 3 }}>
        {RECITERS.map((r) => (
          <button
            key={r.id}
            style={{
              padding: "7px 12px",
              borderRadius: 9,
              fontSize: 12,
              fontWeight: 600,
              background: r.id === reciter.id ? "#1E8C52" : "#FFFDF0",
              color: r.id === reciter.id ? "#F5E6B8" : "#4A3D1A",
              border: `1.5px solid ${r.id === reciter.id ? "#1E8C52" : "#E0D5BF"}`,
              whiteSpace: "nowrap",
              cursor: "pointer",
              fontFamily: "'Outfit'",
            }}
            onClick={() => onSelectReciter(r)}
          >
            {r.ar}
          </button>
        ))}
      </div>

      {/* Surah list */}
      {ALL_SURAHS.map((s) => {
        const m = memCount(s.id, s.v);
        const pct = Math.round((m / s.v) * 100);
        return (
          <div key={s.id} style={S.card} onClick={() => onSelectSurah(s)}>
            <div style={S.cardNum}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#F5E6B8" }}>{s.id}</span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: "#2C2416" }}>{s.en}</span>
                <span style={{ fontSize: 18, fontFamily: "'Amiri', serif", color: "#2C2416" }}>
                  {s.ar}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 3 }}>
                <span style={{ fontSize: 10, color: "#8B7D3C90" }}>
                  {s.v} v. · Juz {s.juz}
                </span>
                {pct > 0 && (
                  <>
                    <div style={S.barBg}>
                      <div style={{ ...S.barFill, width: `${pct}%` }} />
                    </div>
                    <span style={{ fontSize: 9, fontWeight: 700, color: "#1E8C52" }}>{pct}%</span>
                  </>
                )}
              </div>
            </div>
            <span style={{ color: "#C5A028", fontSize: 18 }}>›</span>
          </div>
        );
      })}
    </div>
  );
}

const S = {
  bk: {
    background: "#FFFDF0",
    border: "1.5px solid #D4C080",
    borderRadius: 10,
    width: 34,
    height: 34,
    fontSize: 18,
    color: "#4A3D1A",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    cursor: "pointer",
  },
  methodCard: {
    background: "#FFFDF0",
    border: "1px solid #E0D5BF",
    borderRadius: 14,
    padding: "12px 14px",
    marginBottom: 14,
  },
  card: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    background: "#FFFDF0",
    border: "1px solid #E0D5BF",
    borderRadius: 12,
    padding: "12px 14px",
    marginBottom: 6,
    cursor: "pointer",
  },
  cardNum: {
    width: 40,
    height: 40,
    borderRadius: 10,
    background: "linear-gradient(135deg, #1E8C52, #145533)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  barBg: {
    flex: 1,
    maxWidth: 40,
    height: 3,
    background: "#E0D5BF",
    borderRadius: 2,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    background: "#1E8C52",
    borderRadius: 2,
  },
};
