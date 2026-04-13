/**
 * ReviewScreen — Spaced Repetition review queue
 * Shows verses due for review based on SM-2 scheduling.
 */
import React, { useState, useEffect } from "react";
import TajweedVerse from "../components/TajweedVerse";
import AyahMarker from "../components/AyahMarker";
import { getVerse } from "../data/loader";
import ALL_SURAHS from "../constants/surahs";

export default function ReviewScreen({ progress, dueVerses = [], onReviewComplete, onBack }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const current = dueVerses[currentIdx];

  if (!current || dueVerses.length === 0) {
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
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <button style={S.bk} onClick={onBack}>‹</button>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#2C2416" }}>Révision</div>
        </div>
        <div
          style={{
            background: "#FFFDF0",
            border: "1px solid #E0D5BF",
            borderRadius: 14,
            padding: "40px 20px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#1E8C52", marginBottom: 6 }}>
            Rien à réviser !
          </div>
          <div style={{ fontSize: 12, color: "#8B7D3C" }}>
            Tes versets mémorisés seront programmés automatiquement pour révision.
          </div>
        </div>
      </div>
    );
  }

  // Parse verse key "surahId:verseIndex"
  const [surahId, verseIdx] = current.split(":").map(Number);
  const verse = getVerse(surahId, verseIdx);
  const surahMeta = ALL_SURAHS.find((s) => s.id === surahId);

  if (!verse) {
    return (
      <div style={{ textAlign: "center", padding: 60, color: "#8B7D3C" }}>
        Verset non trouvé.
      </div>
    );
  }

  const handleRate = (quality) => {
    if (onReviewComplete) onReviewComplete(current, quality);
    setRevealed(false);
    if (currentIdx < dueVerses.length - 1) {
      setCurrentIdx((i) => i + 1);
    } else {
      onBack();
    }
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
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 14,
        }}
      >
        <button style={S.bk} onClick={onBack}>‹</button>
        <span style={{ fontSize: 14, fontWeight: 700, color: "#2C2416" }}>
          Révision · {currentIdx + 1}/{dueVerses.length}
        </span>
      </div>

      {/* Progress */}
      <div
        style={{
          height: 4,
          background: "#E0D5BF",
          borderRadius: 3,
          marginBottom: 16,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${((currentIdx + 1) / dueVerses.length) * 100}%`,
            background: "#1E8C52",
            borderRadius: 3,
            transition: "width 0.4s",
          }}
        />
      </div>

      {/* Surah info */}
      <div style={{ textAlign: "center", marginBottom: 10 }}>
        <span style={{ fontSize: 12, color: "#8B7D3C" }}>
          {surahMeta?.en} · Verset {verseIdx + 1}
        </span>
      </div>

      {/* Verse card */}
      <div
        style={{
          background: "#FFFDF0",
          border: "2.5px solid #C5A028",
          borderRadius: 8,
          padding: "26px 14px 18px",
          textAlign: "center",
          minHeight: 130,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ marginBottom: 6 }}>
          <AyahMarker n={verseIdx + 1} />
        </div>
        <div
          style={{
            fontSize: 28,
            fontFamily: "'KFGQPC Uthman Taha Naskh', 'Amiri', serif",
            lineHeight: 2.6,
            color: "#2C2416",
            direction: "rtl",
            ...(revealed ? {} : { filter: "blur(22px)", userSelect: "none" }),
            transition: "filter 0.4s",
          }}
        >
          {revealed ? (
            <TajweedVerse segments={verse.segments} fontSize={28} />
          ) : (
            verse.text_plain
          )}
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, marginTop: 16 }}>
        {!revealed ? (
          <button style={S.gBtn} onClick={() => setRevealed(true)}>
            👁 Révéler le verset
          </button>
        ) : (
          <>
            <div style={{ fontSize: 12, color: "#8B7D3C", marginBottom: 4 }}>
              Comment c'était ?
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={S.rateBtn("#C0392B")} onClick={() => handleRate(1)}>
                😞 Difficile
              </button>
              <button style={S.rateBtn("#E67E22")} onClick={() => handleRate(3)}>
                🤔 Moyen
              </button>
              <button style={S.rateBtn("#1E8C52")} onClick={() => handleRate(5)}>
                😊 Facile
              </button>
            </div>
          </>
        )}
      </div>
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
  gBtn: {
    background: "linear-gradient(135deg, #1E8C52, #145533)",
    color: "#F5E6B8",
    border: "none",
    borderRadius: 14,
    padding: "14px 28px",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "'Outfit'",
  },
  rateBtn: (color) => ({
    background: `${color}10`,
    border: `2px solid ${color}40`,
    borderRadius: 12,
    padding: "10px 14px",
    fontSize: 12,
    fontWeight: 600,
    color: color,
    cursor: "pointer",
    fontFamily: "'Outfit'",
  }),
};
