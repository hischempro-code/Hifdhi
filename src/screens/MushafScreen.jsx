/**
 * MushafScreen — Full Mushaf view with Tajweed coloring
 * Loads data from offline quran-tajweed.json.
 */
import React, { useState, useEffect } from "react";
import MushafFrame from "../components/MushafFrame";
import SurahBanner from "../components/SurahBanner";
import AyahMarker from "../components/AyahMarker";
import TajweedVerse from "../components/TajweedVerse";
import { TajweedLegendCompact } from "../components/TajweedLegend";
import { getSurah } from "../data/loader";
import ALL_SURAHS from "../constants/surahs";

const PAGE_PRESETS = [
  { label: "Al-Fatiha", ids: [1] },
  { label: "Ya-Sin", ids: [36] },
  { label: "Ar-Rahman", ids: [55] },
  { label: "Al-Mulk", ids: [67] },
  { label: "Quraysh→Kawthar", ids: [106, 107, 108] },
  { label: "Kafirun→Nas", ids: [109, 110, 111, 112, 113, 114] },
  { label: "Juz 30 début", ids: [78, 79, 80] },
  { label: "Ad-Duhaa+Sharh", ids: [93, 94] },
];

export default function MushafScreen({ progress, onBack, onStudyVerse }) {
  const [pageIds, setPageIds] = useState([106, 107, 108]);
  const [surahs, setSurahs] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadPage = (ids) => {
    setLoading(true);
    setPageIds(ids);
    const results = [];
    for (const id of ids) {
      const data = getSurah(id);
      const meta = ALL_SURAHS.find((s) => s.id === id);
      if (data && meta) {
        results.push({ ...meta, ...data });
      }
    }
    setSurahs(results);
    setLoading(false);
  };

  useEffect(() => {
    loadPage(pageIds);
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#EDE3C4", paddingBottom: 16 }}>
      {/* Header */}
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "6px 4px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 10px 6px" }}>
          <button style={S.bk} onClick={onBack}>‹</button>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#2C2416" }}>
            Mushaf Tajweed
          </span>
          <span style={{ fontSize: 10, color: "#8B7D3C80", marginLeft: "auto" }}>
            Données offline
          </span>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 60 }}>
          <div style={{ fontSize: 13, color: "#8B7D3C", marginTop: 10 }}>
            Chargement...
          </div>
        </div>
      ) : surahs.length > 0 ? (
        <MushafFrame>
          {surahs.map((surah, si) => (
            <div key={surah.id}>
              <SurahBanner name={surah.ar || surah.name_arabic} number={surah.id} />
              {/* Basmala (not for At-Tawbah, and Al-Fatiha has it as verse 1) */}
              {surah.id !== 1 && surah.id !== 9 && (
                <div
                  style={{
                    textAlign: "center",
                    fontSize: 22,
                    fontFamily: "'KFGQPC Uthman Taha Naskh', 'Amiri', serif",
                    color: "#2C2416",
                    lineHeight: 2.4,
                    margin: "6px 0 8px",
                  }}
                >
                  بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
                </div>
              )}
              <div
                style={{
                  direction: "rtl",
                  textAlign: "justify",
                  lineHeight: 3.2,
                  padding: "0 4px 4px",
                  wordSpacing: 3,
                }}
              >
                {(surah.verses || []).map((v, vi) => {
                  const isMem = progress[`${surah.id}:${vi}`]?.memorized;
                  return (
                    <span key={vi}>
                      <span
                        style={{ cursor: "pointer" }}
                        onClick={() => onStudyVerse && onStudyVerse(surah.id, vi)}
                      >
                        <TajweedVerse segments={v.segments} isMem={isMem} />
                      </span>
                      {" "}
                      <AyahMarker n={vi + 1} />
                      {" "}
                    </span>
                  );
                })}
              </div>
              {si < surahs.length - 1 && (
                <div style={{ borderBottom: "1.5px solid #D4A01730", margin: "2px 16px 4px" }} />
              )}
            </div>
          ))}
          <TajweedLegendCompact />
        </MushafFrame>
      ) : (
        <div style={{ textAlign: "center", padding: 40, color: "#8B7D3C" }}>
          Données non trouvées. Lance <code>node scripts/fetch-tajweed.js</code> d'abord.
        </div>
      )}

      {/* Page selector */}
      <div
        style={{
          display: "flex",
          gap: 6,
          justifyContent: "center",
          padding: "12px 10px",
          flexWrap: "wrap",
        }}
      >
        {PAGE_PRESETS.map((p) => (
          <button
            key={p.label}
            style={{
              padding: "6px 12px",
              borderRadius: 8,
              fontSize: 10,
              fontWeight: 600,
              background:
                JSON.stringify(pageIds) === JSON.stringify(p.ids) ? "#1E8C52" : "#FFFDF0",
              color:
                JSON.stringify(pageIds) === JSON.stringify(p.ids) ? "#F5E6B8" : "#4A3D1A",
              border: `1px solid ${
                JSON.stringify(pageIds) === JSON.stringify(p.ids) ? "#1E8C52" : "#E0D5BF"
              }`,
              cursor: "pointer",
              fontFamily: "'Outfit'",
            }}
            onClick={() => loadPage(p.ids)}
          >
            {p.label}
          </button>
        ))}
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
};
