/**
 * StudyScreen — Verse memorization screen
 * 3-phase flow: Listen → Visible (8×) → Hidden (8×) → Done
 * Uses offline data + EveryAyah.com audio.
 */
import React, { useState, useEffect, useCallback } from "react";
import TajweedVerse, { TajweedVersePlain } from "../components/TajweedVerse";
import AyahMarker from "../components/AyahMarker";
import RepDots from "../components/RepDots";
import ProgressBar from "../components/ProgressBar";
import { getAudioUrl } from "../constants/audio";
import { getSurah } from "../data/loader";

const REPS_TARGET = 8;

export default function StudyScreen({
  surahId,
  startVerse = 0,
  reciter,
  progress,
  onVerseMemorized,
  onBack,
}) {
  const [surah, setSurah] = useState(null);
  const [curV, setCurV] = useState(startVerse);
  const [phase, setPhase] = useState("listen"); // listen | visible | hidden
  const [reps, setReps] = useState(0);
  const [isRec, setIsRec] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [valid, setValid] = useState(null); // null | "ok" | "no"
  const [anim, setAnim] = useState("fadeIn");

  useEffect(() => {
    const data = getSurah(surahId);
    if (data) setSurah(data);
  }, [surahId]);

  const playAudio = useCallback(() => {
    if (!surah || playing) return;
    const verse = surah.verses[curV];
    if (!verse) return;

    setPlaying(true);

    // Build audio URL from EveryAyah.com
    const url = getAudioUrl(reciter.path, surahId, curV + 1);
    const audio = new Audio(url);

    audio.onended = () => {
      setPlaying(false);
      if (phase === "listen") setPhase("visible");
    };
    audio.onerror = () => {
      setPlaying(false);
      // Fallback: advance after simulated delay
      const len = verse.text_plain?.length || 20;
      setTimeout(() => {
        if (phase === "listen") setPhase("visible");
      }, Math.max(1400, Math.min(len * 45, 3500)));
    };

    audio.play().catch(() => {
      setPlaying(false);
      // If audio blocked, advance with delay
      setTimeout(() => {
        if (phase === "listen") setPhase("visible");
      }, 2000);
    });
  }, [surah, curV, reciter, playing, phase, surahId]);

  const recStart = () => {
    setIsRec(true);
    setValid(null);
  };

  const recStop = () => {
    setIsRec(false);
    const ok = Math.random() > 0.12; // placeholder for real ASR
    setValid(ok ? "ok" : "no");

    if (ok) {
      const nr = reps + 1;
      setReps(nr);
      setTimeout(() => {
        setValid(null);
        if (phase === "visible" && nr >= REPS_TARGET) {
          setReps(0);
          setPhase("hidden");
        } else if (phase === "hidden" && nr >= REPS_TARGET) {
          completeVerse();
        }
      }, 700);
    } else {
      setTimeout(() => setValid(null), 900);
    }
  };

  const completeVerse = () => {
    if (!surah) return;
    const key = `${surahId}:${curV}`;
    if (onVerseMemorized) onVerseMemorized(key);

    if (curV < surah.verses.length - 1) {
      setAnim("out");
      setTimeout(() => {
        setCurV((c) => c + 1);
        setReps(0);
        setPhase("listen");
        setAnim("fadeIn");
      }, 250);
    } else {
      // Surah complete!
      onBack();
    }
  };

  if (!surah) {
    return (
      <div style={{ textAlign: "center", padding: 60, color: "#8B7D3C" }}>
        Chargement...
      </div>
    );
  }

  const verse = surah.verses[curV];
  if (!verse) return null;
  const hidden = phase === "hidden";
  const totalVerses = surah.verses.length;
  const fontSize = (verse.text_plain?.length || 0) > 80 ? 22 : (verse.text_plain?.length || 0) > 40 ? 28 : 34;

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
          marginBottom: 6,
        }}
      >
        <button style={S.bk} onClick={onBack}>‹ Retour</button>
        <span style={{ fontSize: 12, color: "#6B5C2A", fontWeight: 600 }}>
          سورة {surah.name_arabic || surah.ar} · {curV + 1}/{totalVerses}
        </span>
      </div>

      {/* Global progress */}
      <div style={{ marginBottom: 12 }}>
        <ProgressBar value={curV} max={totalVerses} />
      </div>

      {/* Phase indicator */}
      <div style={{ display: "flex", justifyContent: "center", gap: 0, marginBottom: 14 }}>
        {[
          { k: "listen", i: "🎧", l: "Écoute" },
          { k: "visible", i: "📖", l: `Visible (×${REPS_TARGET})` },
          { k: "hidden", i: "🧠", l: `Caché (×${REPS_TARGET})` },
        ].map((s, idx) => (
          <div key={s.k} style={{ display: "flex", alignItems: "center" }}>
            {idx > 0 && (
              <div
                style={{
                  width: 14,
                  height: 2,
                  borderRadius: 1,
                  background:
                    phase === s.k ||
                    (idx === 1 && phase !== "listen") ||
                    (idx === 2 && phase === "hidden")
                      ? "#1E8C52"
                      : "#D4C08060",
                }}
              />
            )}
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                padding: "5px 7px",
                borderRadius: 8,
                background: phase === s.k ? "#1E8C5220" : "transparent",
                color: phase === s.k ? "#1E8C52" : "#8B7D3C60",
                display: "flex",
                alignItems: "center",
                gap: 3,
              }}
            >
              <span>{s.i}</span>
              {s.l}
            </div>
          </div>
        ))}
      </div>

      {/* Verse card */}
      <div
        style={{
          background: "#FFFDF0",
          border: "2.5px solid #C5A028",
          borderRadius: 8,
          padding: "26px 14px 18px",
          textAlign: "center",
          position: "relative",
          minHeight: 130,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "inset 0 0 0 4px #FFFDF0, inset 0 0 0 5px #D4A01730",
          animation:
            anim === "fadeIn"
              ? "fadeIn 0.4s"
              : anim === "out"
              ? "slideOut 0.3s"
              : "none",
        }}
      >
        <div style={{ marginBottom: 6 }}>
          <AyahMarker n={curV + 1} />
        </div>
        <div
          style={{
            fontSize,
            fontFamily: "'KFGQPC Uthman Taha Naskh', 'Amiri', serif",
            lineHeight: 2.6,
            color: "#2C2416",
            direction: "rtl",
            transition: "all 0.4s",
            ...(hidden ? { filter: "blur(22px)", userSelect: "none" } : {}),
          }}
        >
          {hidden ? (
            verse.text_plain
          ) : (
            <TajweedVerse segments={verse.segments} isMem={false} fontSize={fontSize} />
          )}
        </div>

        {/* Rep dots */}
        {phase !== "listen" && <RepDots current={reps} total={REPS_TARGET} />}
      </div>

      {/* Validation feedback */}
      {valid && (
        <div
          style={{
            textAlign: "center",
            padding: "8px",
            borderRadius: 10,
            marginTop: 10,
            background: valid === "ok" ? "#1E8C5215" : "#C0392B12",
            border: `1.5px solid ${valid === "ok" ? "#1E8C5240" : "#C0392B40"}`,
            animation: "fadeIn 0.3s",
          }}
        >
          {valid === "ok" ? (
            <span style={{ color: "#1E8C52", fontWeight: 700, fontSize: 14 }}>✓ أحسنت</span>
          ) : (
            <span style={{ color: "#C0392B", fontWeight: 700, fontSize: 14 }}>
              ✗ حاول مرة أخرى
            </span>
          )}
        </div>
      )}

      {/* Controls */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 10,
          marginTop: 14,
        }}
      >
        {phase === "listen" && (
          <button style={S.gBtn} onClick={playAudio} disabled={playing}>
            {playing ? (
              <div style={{ display: "flex", gap: 3, height: 18 }}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    style={{
                      width: 3,
                      height: 5,
                      background: "#F5E6B8",
                      borderRadius: 2,
                      animation: `wave 0.6s ${i * 0.1}s ease-in-out infinite`,
                    }}
                  />
                ))}
              </div>
            ) : (
              <>▶ Écouter {reciter.ar}</>
            )}
          </button>
        )}

        {(phase === "visible" || phase === "hidden") && (
          <>
            <button
              style={{ ...S.rBtn, ...(isRec ? S.rOn : {}) }}
              onMouseDown={recStart}
              onMouseUp={recStop}
              onTouchStart={(e) => {
                e.preventDefault();
                recStart();
              }}
              onTouchEnd={recStop}
            >
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  background: "#C0392B",
                  ...(isRec ? { animation: "pulse 1s infinite" } : {}),
                }}
              />
              <span style={{ fontSize: 13 }}>
                {isRec ? "Relâche pour valider..." : "Maintiens pour réciter"}
              </span>
            </button>
            {!isRec && (
              <button
                style={{
                  background: "none",
                  border: "none",
                  color: "#8B7D3C90",
                  fontSize: 11,
                  cursor: "pointer",
                }}
                onClick={playAudio}
              >
                🔄 Réécouter
              </button>
            )}
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
    padding: "6px 12px",
    fontSize: 14,
    color: "#4A3D1A",
    cursor: "pointer",
    fontFamily: "'Outfit'",
  },
  gBtn: {
    background: "linear-gradient(135deg, #1E8C52, #145533)",
    color: "#F5E6B8",
    border: "none",
    borderRadius: 14,
    padding: "14px 28px",
    fontSize: 14,
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    gap: 7,
    boxShadow: "0 5px 18px #14553320",
    fontFamily: "'Outfit'",
    cursor: "pointer",
  },
  rBtn: {
    background: "#C0392B08",
    border: "2.5px solid #C0392B30",
    borderRadius: 16,
    padding: "14px 24px",
    color: "#4A3D1A",
    fontWeight: 600,
    display: "flex",
    alignItems: "center",
    gap: 9,
    userSelect: "none",
    WebkitUserSelect: "none",
    fontFamily: "'Outfit'",
    cursor: "pointer",
  },
  rOn: {
    background: "#C0392B15",
    borderColor: "#C0392B",
    boxShadow: "0 0 20px #C0392B15",
  },
};
