#!/usr/bin/env node
/**
 * fetch-tajweed.js
 * 
 * Fetches all 114 surahs from the Quran.com API v4 (uthmani_tajweed endpoint)
 * and generates a single offline JSON file: data/quran-tajweed.json
 * 
 * Usage:
 *   node scripts/fetch-tajweed.js
 * 
 * Output format:
 * {
 *   meta: { generated, api, totalVerses, totalSurahs },
 *   surahs: [
 *     {
 *       id: 1,
 *       name_arabic: "الفاتحة",
 *       name_english: "Al-Fatiha",
 *       name_transliteration: "Al-Faatiha",
 *       revelation_place: "makkah",
 *       verses_count: 7,
 *       juz: [1],
 *       verses: [
 *         {
 *           number: 1,
 *           key: "1:1",
 *           text_uthmani_tajweed: "<raw HTML>",
 *           segments: [
 *             { text: "بِسْمِ", color: null, rule: null },
 *             { text: "ٱ", color: "#AAAAAA", rule: "ham_wasl" },
 *             ...
 *           ],
 *           text_plain: "بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ"
 *         }
 *       ]
 *     }
 *   ]
 * }
 */

const fs = require("fs");
const path = require("path");
const https = require("https");

const API_BASE = process.env.VITE_QURAN_API_BASE || "https://api.quran.com/api/v4";
const OUTPUT_DIR = path.join(__dirname, "..", "data");
const OUTPUT_FILE = path.join(OUTPUT_DIR, "quran-tajweed.json");

// ─── Dar Al-Maarifah Tajweed Color Palette (17 rules) ───
const TAJWEED_COLORS = {
  // Hamzat al-Wasl
  ham_wasl:                "#AAAAAA",
  // Lam Shamsiyyah
  laam_shamsiyah:          "#D4A017",
  // Madd (4 types)
  madda_normal:            "#FF7F00",
  madda_permissible:       "#E12B29",
  madda_obligatory:        "#CA0004",
  madda_necesssary:        "#B90053",   // note: API has triple-s typo
  // Qalqalah
  qalqala:                 "#4050EC",
  // Ghunnah
  ghunnah:                 "#16A858",
  // Ikhfa (2 types)
  ikhfa_shafawi:           "#D97EF2",
  ikhfa:                   "#9B30D4",
  // Idgham (5 types)
  idghaam_ghunnah:         "#169777",
  idghaam_wo_ghunnah:      "#169777",
  idghaam_no_ghunnah:      "#169777",
  idghaam_shafawi:         "#169777",
  idghaam_mutajanisayn:    "#A6461F",
  idghaam_mutaqaribayn:    "#A6461F",
  // Iqlab
  iqlab:                   "#26A4CC",
  // Silent
  silent:                  "#AAAAAA",
};

// ─── HTTP helper with retry ───
function httpGet(url, retries = 3) {
  return new Promise((resolve, reject) => {
    const attempt = (n) => {
      https.get(url, { headers: { "Accept": "application/json" } }, (res) => {
        if (res.statusCode === 429 || res.statusCode >= 500) {
          if (n > 0) {
            const delay = (4 - n) * 2000 + Math.random() * 1000;
            console.log(`  ⏳ Rate limited / server error (${res.statusCode}), retrying in ${Math.round(delay)}ms...`);
            setTimeout(() => attempt(n - 1), delay);
            res.resume();
            return;
          }
        }
        if (res.statusCode !== 200) {
          res.resume();
          return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        }
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try { resolve(JSON.parse(data)); }
          catch (e) { reject(new Error(`JSON parse error: ${e.message}`)); }
        });
      }).on("error", (err) => {
        if (n > 0) {
          const delay = (4 - n) * 2000;
          console.log(`  ⏳ Network error, retrying in ${delay}ms...`);
          setTimeout(() => attempt(n - 1), delay);
        } else {
          reject(err);
        }
      });
    };
    attempt(retries);
  });
}

// ─── Tajweed HTML Parser ───
function parseTajweedHTML(html) {
  if (!html) return [];
  const segments = [];
  // Remove verse-end marker spans
  const clean = html.replace(/<span[^>]*class=end[^>]*>[^<]*<\/span>/g, "");

  let cursor = 0;
  const tagRegex = /<tajweed\s+class=([a-z_]+)>([\s\S]*?)<\/tajweed>/g;
  let match;

  while ((match = tagRegex.exec(clean)) !== null) {
    if (match.index > cursor) {
      const before = clean.slice(cursor, match.index);
      if (before) segments.push({ text: before, color: null, rule: null });
    }
    const rule = match[1];
    const text = match[2];
    const color = TAJWEED_COLORS[rule] || null;
    if (text) segments.push({ text, color, rule });
    cursor = match.index + match[0].length;
  }

  if (cursor < clean.length) {
    const rest = clean.slice(cursor);
    if (rest) segments.push({ text: rest, color: null, rule: null });
  }

  return segments.length > 0
    ? segments
    : [{ text: html.replace(/<[^>]+>/g, ""), color: null, rule: null }];
}

function plainText(html) {
  if (!html) return "";
  return html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

// ─── Fetch surah metadata ───
async function fetchSurahMeta() {
  console.log("📖 Fetching surah metadata...");
  const data = await httpGet(`${API_BASE}/chapters?language=en`);
  return data.chapters; // array of 114 surahs
}

// ─── Fetch tajweed verses for one surah ───
async function fetchSurahTajweed(surahId) {
  const data = await httpGet(
    `${API_BASE}/quran/verses/uthmani_tajweed?chapter_number=${surahId}`
  );
  return (data.verses || []).map((v) => ({
    number: v.verse_number || parseInt((v.verse_key || "").split(":")[1]) || 0,
    key: v.verse_key,
    text_uthmani_tajweed: v.text_uthmani_tajweed,
    segments: parseTajweedHTML(v.text_uthmani_tajweed),
    text_plain: plainText(v.text_uthmani_tajweed),
  }));
}

// ─── Fetch juz mapping ───
async function fetchJuzMapping() {
  console.log("📖 Fetching juz mapping...");
  const juzMap = {}; // surahId -> Set of juz numbers
  for (let j = 1; j <= 30; j++) {
    try {
      const data = await httpGet(`${API_BASE}/juzs/${j}`);
      if (data && data.juz && data.juz.verse_mapping) {
        for (const key of Object.keys(data.juz.verse_mapping)) {
          const sid = parseInt(key);
          if (!juzMap[sid]) juzMap[sid] = new Set();
          juzMap[sid].add(j);
        }
      }
    } catch {
      // fallback: skip juz info
    }
  }
  return juzMap;
}

// ─── Main ───
async function main() {
  console.log("╔══════════════════════════════════════════════╗");
  console.log("║  HIFDHI — Quran Tajweed Offline Generator   ║");
  console.log("║  Source: Quran.com API v4                    ║");
  console.log("╚══════════════════════════════════════════════╝\n");

  // 1) Fetch metadata
  const chapters = await fetchSurahMeta();
  console.log(`✅ Got metadata for ${chapters.length} surahs\n`);

  // 2) Fetch all tajweed verses
  const surahs = [];
  let totalVerses = 0;

  for (const ch of chapters) {
    const surahId = ch.id;
    process.stdout.write(
      `  [${String(surahId).padStart(3, " ")}/114] ${ch.name_simple.padEnd(20)} `
    );

    const verses = await fetchSurahTajweed(surahId);
    totalVerses += verses.length;

    surahs.push({
      id: surahId,
      name_arabic: ch.name_arabic,
      name_english: ch.name_simple,
      name_transliteration: ch.name_simple,
      revelation_place: ch.revelation_place,
      verses_count: ch.verses_count,
      pages: ch.pages || [],
      verses,
    });

    console.log(`✅ ${verses.length} verses`);

    // Rate-limit: small delay between requests
    if (surahId < 114) {
      await new Promise((r) => setTimeout(r, 350));
    }
  }

  // 3) Build output
  const output = {
    meta: {
      generated: new Date().toISOString(),
      api: "Quran.com API v4 — /quran/verses/uthmani_tajweed",
      totalSurahs: surahs.length,
      totalVerses,
      colorPalette: "Dar Al-Maarifah (adapted)",
      tajweedRules: TAJWEED_COLORS,
    },
    surahs,
  };

  // 4) Write to file
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const jsonStr = JSON.stringify(output);
  fs.writeFileSync(OUTPUT_FILE, jsonStr, "utf-8");

  const sizeMB = (Buffer.byteLength(jsonStr, "utf-8") / (1024 * 1024)).toFixed(2);

  console.log(`\n╔══════════════════════════════════════════════╗`);
  console.log(`║  ✅ DONE                                     ║`);
  console.log(`║  📁 ${OUTPUT_FILE}`);
  console.log(`║  📊 ${surahs.length} surahs · ${totalVerses} verses · ${sizeMB} MB`);
  console.log(`╚══════════════════════════════════════════════╝`);
}

main().catch((err) => {
  console.error("\n❌ Fatal error:", err.message);
  process.exit(1);
});
