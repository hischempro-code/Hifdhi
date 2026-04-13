/**
 * HIFDHI — Main App Entry Point
 * 
 * Orchestrates the 4 screens and manages global state.
 * Uses offline quran-tajweed.json data (no internet needed).
 */
import React, { useState, useEffect, useCallback } from "react";
import HomeScreen from "./screens/HomeScreen";
import LearnListScreen from "./screens/LearnListScreen";
import MushafScreen from "./screens/MushafScreen";
import StudyScreen from "./screens/StudyScreen";
import ReviewScreen from "./screens/ReviewScreen";
import { RECITERS } from "./constants/audio";
import { getSurah, isDataAvailable, loadQuranData } from "./data/loader";
import {
  loadProgress,
  updateVerseProgress,
  loadStreak,
  recordActivity,
  loadSettings,
  saveSettings,
  getDueReviews,
  updateSpacedRepetition,
} from "./storage/storage";
import { GOOGLE_FONTS_URL, WEB_FONT_FACE } from "./constants/fonts";

export default function App() {
  const [screen, setScreen] = useState("home");
  const [progress, setProgress] = useState({});
  const [streak, setStreak] = useState(0);
  const [reciter, setReciter] = useState(RECITERS[0]);
  const [dueReviews, setDueReviews] = useState([]);
  const [ready, setReady] = useState(false);

  // Study screen params
  const [studySurahId, setStudySurahId] = useState(null);
  const [studyStartVerse, setStudyStartVerse] = useState(0);

  // Load quran data + saved state on mount
  useEffect(() => {
    (async () => {
      // Load the 11 MB JSON first
      await loadQuranData();

      const p = await loadProgress();
      setProgress(p);

      const s = await loadStreak();
      setStreak(s.currentStreak || 0);

      const settings = await loadSettings();
      const r = RECITERS.find((x) => x.id === settings.reciterId);
      if (r) setReciter(r);

      const due = await getDueReviews();
      setDueReviews(due);

      setReady(true);
    })();
  }, []);

  const totalMem = Object.values(progress).filter((x) => x.memorized).length;

  // Navigation
  const navigate = (s) => setScreen(s);

  // Select surah for learning
  const handleSelectSurah = useCallback((surah) => {
    setStudySurahId(surah.id);
    setStudyStartVerse(0);
    setScreen("study");
  }, []);

  // Jump to specific verse from mushaf
  const handleStudyVerse = useCallback((surahId, verseIdx) => {
    setStudySurahId(surahId);
    setStudyStartVerse(verseIdx);
    setScreen("study");
  }, []);

  // Verse memorized callback
  const handleVerseMemorized = useCallback(
    async (verseKey) => {
      const updated = await updateVerseProgress(verseKey, {
        memorized: true,
        // Initialize SR schedule on first memorization
        srNextReview: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        srInterval: 1,
        srLevel: 1,
      });
      setProgress(updated);

      const s = await recordActivity(1);
      setStreak(s.currentStreak);
    },
    []
  );

  // Reciter change
  const handleSelectReciter = useCallback(async (r) => {
    setReciter(r);
    await saveSettings({ reciterId: r.id });
  }, []);

  // Review complete
  const handleReviewComplete = useCallback(async (verseKey, quality) => {
    await updateSpacedRepetition(verseKey, quality);
    const p = await loadProgress();
    setProgress(p);
    await recordActivity(0);
  }, []);

  return (
    <div style={{ minHeight: "100vh", fontFamily: "'Outfit', sans-serif" }}>
      {/* Font loading */}
      <style>{`
        @import url('${GOOGLE_FONTS_URL}');
        ${WEB_FONT_FACE}
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes slideOut { from { opacity: 1 } to { opacity: 0; transform: translateX(-12px) } }
        @keyframes pulse { 0%, 100% { transform: scale(1) } 50% { transform: scale(1.2); opacity: .7 } }
        @keyframes wave { 0%, 100% { height: 5px } 50% { height: 18px } }
        * { box-sizing: border-box; margin: 0; padding: 0 }
        button { cursor: pointer; font-family: 'Outfit', sans-serif }
        button:active { transform: scale(.98) }
        ::-webkit-scrollbar { width: 4px }
        ::-webkit-scrollbar-thumb { background: #C5A02830; border-radius: 3px }
      `}</style>

      {!ready && (
        <div style={{ minHeight: "100vh", background: "linear-gradient(170deg, #F5ECD0, #EDE3C4)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 80, height: 80, borderRadius: 20, background: "linear-gradient(135deg, #1E8C52, #145533)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
            <span style={{ fontSize: 40, fontFamily: "'Amiri', serif", color: "#F5E6B8", fontWeight: 700 }}>حِ</span>
          </div>
          <div style={{ fontSize: 14, color: "#8B7D3C", marginTop: 10 }}>Chargement des données...</div>
        </div>
      )}

      {ready && screen === "home" && (
        <HomeScreen
          totalMem={totalMem}
          streak={streak}
          onNavigate={navigate}
        />
      )}

      {screen === "learn-list" && (
        <LearnListScreen
          progress={progress}
          reciter={reciter}
          onSelectReciter={handleSelectReciter}
          onSelectSurah={handleSelectSurah}
          onBack={() => navigate("home")}
        />
      )}

      {screen === "mushaf" && (
        <MushafScreen
          progress={progress}
          onBack={() => navigate("home")}
          onStudyVerse={handleStudyVerse}
        />
      )}

      {screen === "study" && studySurahId && (
        <StudyScreen
          surahId={studySurahId}
          startVerse={studyStartVerse}
          reciter={reciter}
          progress={progress}
          onVerseMemorized={handleVerseMemorized}
          onBack={() => navigate("learn-list")}
        />
      )}

      {screen === "review" && (
        <ReviewScreen
          progress={progress}
          dueVerses={dueReviews}
          onReviewComplete={handleReviewComplete}
          onBack={() => navigate("home")}
        />
      )}
    </div>
  );
}
