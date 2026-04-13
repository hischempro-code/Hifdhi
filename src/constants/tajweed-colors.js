/**
 * HIFDHI — Dar Al-Maarifah Complete Tajweed Color Palette
 * 
 * 17 rules mapped from the Quran.com API v4 class names
 * to the standard Mushaf Dar Al-Maarifah (King Fahd Complex) colors.
 * 
 * Reference: Mushaf Al-Tajweed — Dar Al-Maarifah, Damascus
 * These colors match the printed Tajweed Quran used worldwide.
 */

// ─── COMPLETE 17-RULE PALETTE ───
export const TAJWEED_COLORS = {
  // 1. Hamzat al-Wasl (همزة الوصل) — grey, silent connector
  ham_wasl:                "#AAAAAA",

  // 2. Lam Shamsiyyah (لام شمسية) — golden, assimilated lam
  laam_shamsiyah:          "#D4A017",

  // 3. Madd Normal (مد طبيعي) — orange, 2 harakāt
  madda_normal:            "#FF7F00",

  // 4. Madd Permissible / Jā'iz (مد جائز) — red
  madda_permissible:       "#E12B29",

  // 5. Madd Obligatory / Wājib (مد واجب) — dark red
  madda_obligatory:        "#CA0004",

  // 6. Madd Necessary / Lāzim (مد لازم) — magenta-red, 6 harakāt
  madda_necesssary:        "#B90053",   // API typo: triple-s

  // 7. Qalqalah (قلقلة) — blue, bouncing letters ق ط ب ج د
  qalqala:                 "#4050EC",

  // 8. Ghunnah (غنة) — green, nasalization 2 harakāt
  ghunnah:                 "#16A858",

  // 9. Ikhfā' Shafawī (إخفاء شفوي) — light purple, lip hiding
  ikhfa_shafawi:           "#D97EF2",

  // 10. Ikhfā' Haqīqī (إخفاء حقيقي) — deep purple, true hiding
  ikhfa:                   "#9B30D4",

  // 11. Idghām with Ghunnah (إدغام بغنة) — teal
  idghaam_ghunnah:         "#169777",

  // 12. Idghām without Ghunnah (إدغام بلا غنة) — teal (same family)
  idghaam_wo_ghunnah:      "#169777",

  // 13. Idghām without Ghunnah alt (إدغام بدون غنة)
  idghaam_no_ghunnah:      "#169777",

  // 14. Idghām Shafawī (إدغام شفوي) — teal, lip merging
  idghaam_shafawi:         "#169777",

  // 15. Idghām Mutajānisayn (إدغام متجانسين) — brown, same articulation
  idghaam_mutajanisayn:    "#A6461F",

  // 16. Idghām Mutaqāribayn (إدغام متقاربين) — brown, close articulation
  idghaam_mutaqaribayn:    "#A6461F",

  // 17. Iqlāb (إقلاب) — sky blue, nūn → mīm conversion
  iqlab:                   "#26A4CC",

  // Silent letters (حروف لا تنطق)
  silent:                  "#AAAAAA",
};

// ─── LEGEND for UI display ───
export const TAJWEED_LEGEND = [
  { rule: "ghunnah",              ar: "غُنَّة",           en: "Ghunnah",             color: "#16A858",  desc: "Nasalisation (2 temps)" },
  { rule: "ikhfa",                ar: "إِخْفَاء",          en: "Ikhfā'",              color: "#9B30D4",  desc: "Dissimulation du nūn sākin" },
  { rule: "ikhfa_shafawi",        ar: "إِخْفَاء شَفَوِي",   en: "Ikhfā' Shafawī",      color: "#D97EF2",  desc: "Dissimulation labiale" },
  { rule: "idghaam_ghunnah",      ar: "إِدْغَام بِغُنَّة",   en: "Idghām w/ Ghunnah",    color: "#169777",  desc: "Fusion avec nasalisation" },
  { rule: "idghaam_wo_ghunnah",   ar: "إِدْغَام بِلَا غُنَّة", en: "Idghām w/o Ghunnah",   color: "#169777",  desc: "Fusion sans nasalisation" },
  { rule: "idghaam_shafawi",      ar: "إِدْغَام شَفَوِي",   en: "Idghām Shafawī",       color: "#169777",  desc: "Fusion labiale" },
  { rule: "idghaam_mutajanisayn", ar: "إِدْغَام مُتَجَانِسَيْن", en: "Idghām Mutajānisayn", color: "#A6461F",  desc: "Fusion de même point d'articulation" },
  { rule: "idghaam_mutaqaribayn", ar: "إِدْغَام مُتَقَارِبَيْن", en: "Idghām Mutaqāribayn", color: "#A6461F",  desc: "Fusion de points proches" },
  { rule: "iqlab",                ar: "إِقْلَاب",          en: "Iqlāb",               color: "#26A4CC",  desc: "Conversion nūn → mīm" },
  { rule: "qalqala",              ar: "قَلْقَلَة",          en: "Qalqalah",            color: "#4050EC",  desc: "Rebond (ق ط ب ج د)" },
  { rule: "madda_normal",         ar: "مَدّ طَبِيعِي",      en: "Madd Ṭabī'ī",         color: "#FF7F00",  desc: "Prolongation naturelle (2 temps)" },
  { rule: "madda_permissible",    ar: "مَدّ جَائِز",        en: "Madd Jā'iz",          color: "#E12B29",  desc: "Prolongation permise (2-4-6)" },
  { rule: "madda_obligatory",     ar: "مَدّ وَاجِب",        en: "Madd Wājib",          color: "#CA0004",  desc: "Prolongation obligatoire (4-5)" },
  { rule: "madda_necesssary",     ar: "مَدّ لَازِم",        en: "Madd Lāzim",          color: "#B90053",  desc: "Prolongation nécessaire (6 temps)" },
  { rule: "laam_shamsiyah",       ar: "لَام شَمْسِيَّة",     en: "Lām Shamsiyyah",      color: "#D4A017",  desc: "Lam solaire assimilé" },
  { rule: "ham_wasl",             ar: "هَمْزَة الوَصْل",    en: "Hamzat al-Waṣl",      color: "#AAAAAA",  desc: "Hamza de liaison" },
  { rule: "silent",               ar: "حَرْف لَا يُنْطَق",   en: "Silent Letter",       color: "#AAAAAA",  desc: "Lettre non prononcée" },
];

export default TAJWEED_COLORS;
