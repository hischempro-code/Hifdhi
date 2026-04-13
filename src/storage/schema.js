/**
 * HIFDHI — AsyncStorage Schema
 * 
 * All persistent data stored via AsyncStorage (React Native)
 * or localStorage wrapper (web).
 * 
 * ═══════════════════════════════════════════════════════════
 * KEY SCHEMA
 * ═══════════════════════════════════════════════════════════
 * 
 * @hifdhi:progress
 *   Type: Object<string, VerseProgress>
 *   Key format: "{surahId}:{verseIndex}"  (0-indexed verse)
 *   Example: { "114:0": { memorized: true, ... }, "114:1": { ... } }
 * 
 * @hifdhi:streak
 *   Type: StreakData
 * 
 * @hifdhi:settings
 *   Type: UserSettings
 * 
 * @hifdhi:sr_queue
 *   Type: SpacedRepetitionQueue
 * 
 * ═══════════════════════════════════════════════════════════
 */

// ─── Storage Keys ───
export const STORAGE_KEYS = {
  PROGRESS:  "@hifdhi:progress",
  STREAK:    "@hifdhi:streak",
  SETTINGS:  "@hifdhi:settings",
  SR_QUEUE:  "@hifdhi:sr_queue",
};

// ─── Default Values ───

/**
 * VerseProgress — per-verse memorization state
 * @typedef {Object} VerseProgress
 * @property {boolean}  memorized      - Has the user completed all reps?
 * @property {number}   visibleReps    - Reps completed in "visible" phase
 * @property {number}   hiddenReps     - Reps completed in "hidden" phase
 * @property {string}   firstMemAt     - ISO date when first memorized
 * @property {string}   lastReviewAt   - ISO date of last review
 * @property {number}   reviewCount    - Total number of reviews (for SR)
 * @property {number}   srLevel        - Spaced Repetition level (0-7)
 * @property {string}   srNextReview   - ISO date for next scheduled review
 * @property {number}   srEaseFactor   - SM-2 ease factor (default 2.5)
 * @property {number}   srInterval     - Current interval in days
 */
export const DEFAULT_VERSE_PROGRESS = {
  memorized: false,
  visibleReps: 0,
  hiddenReps: 0,
  firstMemAt: null,
  lastReviewAt: null,
  reviewCount: 0,
  // Spaced Repetition (SM-2 inspired)
  srLevel: 0,
  srNextReview: null,
  srEaseFactor: 2.5,
  srInterval: 0,
};

/**
 * StreakData — daily practice tracking
 * @typedef {Object} StreakData
 * @property {number}  currentStreak   - Consecutive days
 * @property {number}  longestStreak   - All-time best
 * @property {string}  lastActiveDate  - "YYYY-MM-DD" of last activity
 * @property {number}  totalSessions   - Total study sessions
 * @property {number}  totalVersesMemorized - Lifetime total
 * @property {Object}  weeklyHistory   - { "YYYY-MM-DD": versesCount }
 */
export const DEFAULT_STREAK = {
  currentStreak: 0,
  longestStreak: 0,
  lastActiveDate: null,
  totalSessions: 0,
  totalVersesMemorized: 0,
  weeklyHistory: {},
};

/**
 * UserSettings
 * @typedef {Object} UserSettings
 * @property {number}  reciterId       - Selected reciter ID (1-4)
 * @property {number}  visibleRepsTarget - Reps in visible phase (default 8)
 * @property {number}  hiddenRepsTarget  - Reps in hidden phase (default 8)
 * @property {boolean} tajweedEnabled  - Show tajweed colors
 * @property {number}  fontSize        - Arabic text size
 * @property {boolean} autoPlayAudio   - Auto-play on verse change
 * @property {boolean} srEnabled       - Spaced repetition enabled
 */
export const DEFAULT_SETTINGS = {
  reciterId: 1,
  visibleRepsTarget: 8,
  hiddenRepsTarget: 8,
  tajweedEnabled: true,
  fontSize: 26,
  autoPlayAudio: true,
  srEnabled: true,
};

/**
 * SpacedRepetitionQueue — verses due for review
 * @typedef {Object} SpacedRepetitionQueue
 * @property {string[]} dueToday     - Verse keys due today ["1:0", "2:3", ...]
 * @property {string}   lastComputed - ISO date when queue was last rebuilt
 */
export const DEFAULT_SR_QUEUE = {
  dueToday: [],
  lastComputed: null,
};
