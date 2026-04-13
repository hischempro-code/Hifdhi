/**
 * HIFDHI — Offline Quran Data Loader
 * 
 * Loads tajweed data from /quran-tajweed.json (served from public/).
 * Async fetch on first call, then cached in memory.
 */

let quranData = null;
let loadPromise = null;

/**
 * Load the quran data. Call once at app startup.
 * @returns {Promise<boolean>} true if loaded successfully
 */
export async function loadQuranData() {
  if (quranData) return true;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    try {
      const res = await fetch("/quran-tajweed.json");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      quranData = await res.json();
      console.log(`[HIFDHI] Loaded ${quranData.surahs?.length} surahs`);
      return true;
    } catch (e) {
      console.error("[HIFDHI] Failed to load quran-tajweed.json:", e);
      return false;
    }
  })();

  return loadPromise;
}

export function getAllSurahsData() {
  if (!quranData) return [];
  return quranData.surahs || [];
}

export function getSurah(surahId) {
  if (!quranData) return null;
  return (quranData.surahs || []).find((s) => s.id === surahId) || null;
}

export function getVerse(surahId, verseIndex) {
  const surah = getSurah(surahId);
  if (!surah || !surah.verses) return null;
  return surah.verses[verseIndex] || null;
}

export function getMeta() {
  if (!quranData) return null;
  return quranData.meta || null;
}

export function isDataAvailable() {
  return quranData !== null && Array.isArray(quranData.surahs) && quranData.surahs.length === 114;
}
