/**
 * HIFDHI — Storage Helpers
 * 
 * Unified API for AsyncStorage (React Native) and localStorage (web).
 * Handles JSON serialization, defaults, streak logic, and spaced repetition updates.
 */

import {
  STORAGE_KEYS,
  DEFAULT_VERSE_PROGRESS,
  DEFAULT_STREAK,
  DEFAULT_SETTINGS,
  DEFAULT_SR_QUEUE,
} from "./schema";

// ─── Platform-agnostic storage adapter ───
// Override this with AsyncStorage for React Native
let _storage = null;

/**
 * Initialize with platform storage.
 * - React Native: pass AsyncStorage
 * - Web: pass null (uses localStorage)
 */
export function initStorage(asyncStorage) {
  _storage = asyncStorage;
}

async function getItem(key) {
  if (_storage) {
    return await _storage.getItem(key);
  }
  if (typeof window !== "undefined" && window.localStorage) {
    return window.localStorage.getItem(key);
  }
  return null;
}

async function setItem(key, value) {
  if (_storage) {
    await _storage.setItem(key, value);
    return;
  }
  if (typeof window !== "undefined" && window.localStorage) {
    window.localStorage.setItem(key, value);
  }
}

async function getJSON(key, fallback) {
  try {
    const raw = await getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

async function setJSON(key, value) {
  await setItem(key, JSON.stringify(value));
}

// ═══════════════════════════════════════════
// PROGRESS
// ═══════════════════════════════════════════

export async function loadProgress() {
  return await getJSON(STORAGE_KEYS.PROGRESS, {});
}

export async function saveProgress(progress) {
  await setJSON(STORAGE_KEYS.PROGRESS, progress);
}

/**
 * Mark a verse as memorized (or update reps).
 * @param {string} verseKey - "surahId:verseIndex" (0-indexed)
 * @param {Partial<VerseProgress>} update
 */
export async function updateVerseProgress(verseKey, update) {
  const progress = await loadProgress();
  const current = progress[verseKey] || { ...DEFAULT_VERSE_PROGRESS };
  const now = new Date().toISOString();

  progress[verseKey] = {
    ...current,
    ...update,
    lastReviewAt: now,
    reviewCount: (current.reviewCount || 0) + (update.memorized ? 1 : 0),
    firstMemAt: current.firstMemAt || (update.memorized ? now : null),
  };

  await saveProgress(progress);
  return progress;
}

/**
 * Get memorization stats for a surah.
 */
export async function getSurahStats(surahId, versesCount) {
  const progress = await loadProgress();
  let memorized = 0;
  for (let i = 0; i < versesCount; i++) {
    if (progress[`${surahId}:${i}`]?.memorized) memorized++;
  }
  return { memorized, total: versesCount, percent: Math.round((memorized / versesCount) * 100) };
}

// ═══════════════════════════════════════════
// STREAK
// ═══════════════════════════════════════════

function todayStr() {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

function yesterdayStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

export async function loadStreak() {
  return await getJSON(STORAGE_KEYS.STREAK, { ...DEFAULT_STREAK });
}

/**
 * Record activity for today. Updates streak counter.
 * Call this after each verse memorization.
 */
export async function recordActivity(versesMemorized = 1) {
  const streak = await loadStreak();
  const today = todayStr();
  const yesterday = yesterdayStr();

  if (streak.lastActiveDate === today) {
    // Already active today — just increment counts
    streak.totalVersesMemorized += versesMemorized;
    streak.weeklyHistory[today] = (streak.weeklyHistory[today] || 0) + versesMemorized;
  } else if (streak.lastActiveDate === yesterday) {
    // Consecutive day — extend streak
    streak.currentStreak += 1;
    streak.longestStreak = Math.max(streak.longestStreak, streak.currentStreak);
    streak.lastActiveDate = today;
    streak.totalSessions += 1;
    streak.totalVersesMemorized += versesMemorized;
    streak.weeklyHistory[today] = versesMemorized;
  } else {
    // Streak broken or first time
    streak.currentStreak = 1;
    streak.lastActiveDate = today;
    streak.totalSessions += 1;
    streak.totalVersesMemorized += versesMemorized;
    streak.weeklyHistory[today] = versesMemorized;
  }

  // Prune weekly history (keep last 30 days)
  const keys = Object.keys(streak.weeklyHistory).sort();
  if (keys.length > 30) {
    for (const k of keys.slice(0, keys.length - 30)) {
      delete streak.weeklyHistory[k];
    }
  }

  await setJSON(STORAGE_KEYS.STREAK, streak);
  return streak;
}

// ═══════════════════════════════════════════
// SETTINGS
// ═══════════════════════════════════════════

export async function loadSettings() {
  return await getJSON(STORAGE_KEYS.SETTINGS, { ...DEFAULT_SETTINGS });
}

export async function saveSettings(settings) {
  await setJSON(STORAGE_KEYS.SETTINGS, settings);
}

// ═══════════════════════════════════════════
// SPACED REPETITION (SM-2 variant)
// ═══════════════════════════════════════════

/**
 * Update SM-2 parameters after a review.
 * @param {string} verseKey
 * @param {number} quality - 0-5 (0=total fail, 5=perfect)
 */
export async function updateSpacedRepetition(verseKey, quality) {
  const progress = await loadProgress();
  const v = progress[verseKey] || { ...DEFAULT_VERSE_PROGRESS };
  const now = new Date();

  let { srEaseFactor, srInterval, srLevel } = v;

  if (quality >= 3) {
    // Correct response
    if (srLevel === 0) {
      srInterval = 1; // review tomorrow
    } else if (srLevel === 1) {
      srInterval = 3; // review in 3 days
    } else {
      srInterval = Math.round(srInterval * srEaseFactor);
    }
    srLevel += 1;
  } else {
    // Failed — reset
    srLevel = 0;
    srInterval = 1;
  }

  // Update ease factor (SM-2 formula)
  srEaseFactor = Math.max(
    1.3,
    srEaseFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  );

  const nextReview = new Date(now);
  nextReview.setDate(nextReview.getDate() + srInterval);

  progress[verseKey] = {
    ...v,
    srLevel,
    srInterval,
    srEaseFactor,
    srNextReview: nextReview.toISOString(),
    lastReviewAt: now.toISOString(),
    reviewCount: (v.reviewCount || 0) + 1,
  };

  await saveProgress(progress);
  return progress[verseKey];
}

/**
 * Get all verses due for review today.
 * @returns {string[]} Array of verse keys
 */
export async function getDueReviews() {
  const progress = await loadProgress();
  const now = new Date().toISOString();
  const due = [];

  for (const [key, v] of Object.entries(progress)) {
    if (v.memorized && v.srNextReview && v.srNextReview <= now) {
      due.push(key);
    }
  }

  // Sort by oldest due first
  due.sort((a, b) => {
    const da = progress[a].srNextReview || "";
    const db = progress[b].srNextReview || "";
    return da.localeCompare(db);
  });

  return due;
}
