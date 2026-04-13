/**
 * HIFDHI — Audio Configuration
 * 
 * Uses EveryAyah.com for per-verse audio files.
 * URL pattern: https://everyayah.com/data/{reciterPath}/{SSSAAA}.mp3
 *   - SSS = 3-digit surah number (zero-padded)
 *   - AAA = 3-digit ayah number (zero-padded)
 * 
 * Example: Surah 2, Ayah 255 by Mishary Alafasy:
 *   https://everyayah.com/data/Alafasy_128kbps/002255.mp3
 */

// ─── 4 Reciters with EveryAyah.com paths ───
export const RECITERS = [
  {
    id: 1,
    ar: "مشاري العفاسي",
    en: "Mishary Rashid Alafasy",
    path: "Alafasy_128kbps",
    quality: "128kbps",
    style: "Murattal",
  },
  {
    id: 2,
    ar: "محمود خليل الحصري",
    en: "Mahmoud Khalil Al-Husary",
    path: "Husary_128kbps",
    quality: "128kbps",
    style: "Murattal",
  },
  {
    id: 3,
    ar: "عبد الباسط عبد الصمد",
    en: "Abdul Basit Abdul Samad",
    path: "Abdul_Basit_Murattal_192kbps",
    quality: "192kbps",
    style: "Murattal",
  },
  {
    id: 4,
    ar: "محمد صديق المنشاوي",
    en: "Mohamed Siddiq Al-Minshawi",
    path: "Minshawy_Murattal_128kbps",
    quality: "128kbps",
    style: "Murattal",
  },
];

// ─── Base URL ───
export const EVERYAYAH_BASE = import.meta.env.VITE_EVERYAYAH_BASE || "https://everyayah.com/data";

/**
 * Build the audio URL for a specific verse.
 * 
 * @param {string} reciterPath - e.g. "Alafasy_128kbps"
 * @param {number} surah       - Surah number (1-114)
 * @param {number} ayah        - Ayah number (1-based)
 * @returns {string} Full URL to the MP3 file
 * 
 * @example
 *   getAudioUrl("Alafasy_128kbps", 1, 1)
 *   // => "https://everyayah.com/data/Alafasy_128kbps/001001.mp3"
 * 
 *   getAudioUrl("Husary_128kbps", 36, 1)
 *   // => "https://everyayah.com/data/Husary_128kbps/036001.mp3"
 */
export function getAudioUrl(reciterPath, surah, ayah) {
  const s = String(surah).padStart(3, "0");
  const a = String(ayah).padStart(3, "0");
  return `${EVERYAYAH_BASE}/${reciterPath}/${s}${a}.mp3`;
}

/**
 * Build the Basmala audio URL (verse 0 of any surah = Bismillah).
 * Surah 9 (At-Tawbah) has no Basmala.
 * Surah 1 (Al-Fatiha) Basmala IS verse 1, not verse 0.
 */
export function getBasmalaUrl(reciterPath) {
  return `${EVERYAYAH_BASE}/${reciterPath}/001001.mp3`;
}

/**
 * Get all verse URLs for a full surah.
 * 
 * @param {string} reciterPath - e.g. "Alafasy_128kbps"
 * @param {number} surah       - Surah number (1-114)
 * @param {number} versesCount - Total verses in the surah
 * @returns {string[]} Array of MP3 URLs
 */
export function getSurahAudioUrls(reciterPath, surah, versesCount) {
  const urls = [];
  for (let a = 1; a <= versesCount; a++) {
    urls.push(getAudioUrl(reciterPath, surah, a));
  }
  return urls;
}

export default RECITERS;
