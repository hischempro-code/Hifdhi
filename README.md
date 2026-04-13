
# HIFDHI حِفْظِي

> A Quran memorization app with authentic Tajweed rendering, 
> 100% offline, built from scratch in React.

## Overview

Hifdhi is a personal project aimed at solving a real problem in Arabic 
digital education: most Quran apps either sacrifice traditional Tajweed 
color-coding for simplicity, or lock it behind paywalls and poor UX. 
Hifdhi reimplements the **17 Tajweed rules of the Dar Al-Maarifah tradition** 
in a fully offline, mobile-first interface — combining a traditional 
Mushaf viewer with a spaced-repetition memorization system (SM-2 variant) 
and a social layer for community learning.

The project is technically a cross-platform React + React Native codebase, 
but it's also an exploration of how Arabic-first interfaces (RTL typography, 
proper tajweed rendering, culturally accurate UX) can be built without the 
usual shortcuts. This intersects with questions I find increasingly 
important: how do we build AI and software tools that treat Arabic as 
a first-class language rather than an afterthought?

## Screenshots

![Home](screenshots/Home.png)
![Mushaf with Tajweed](screenshots/Mushaf.png)
![Study mode](screenshots/Study.png)

## Status

🚧 Active development. Core features functional: Mushaf viewer with 
full Tajweed coloring (114 surahs), memorization mode (3-phase), 
spaced repetition queue, offline storage. In progress: social layer 
(friends' real-time reading positions), mobile build refinements.

## Tech stack

- **Frontend**: React + Vite (web) / React Native (mobile)
- **Data**: Quran.com API v4 (fetched once, cached offline)
- **Audio**: EveryAyah.com (4 reciters)
- **Typography**: KFGQPC Uthman Taha Naskh (fallback: Amiri)
- **Storage**: AsyncStorage with custom schema for progress + SR state
- **Spaced repetition**: SM-2 variant (ease factor, interval, quality)

---

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/hischempro-code/Hifdhi.git
cd Hifdhi
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

The `.env.example` file already contains the default values for the public APIs used (Quran.com, EveryAyah.com, Google Fonts). You can modify them if needed.

### 4. Start the dev server

```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

### Environment variables

| Variable | Description | Default value |
|----------|-------------|---------------|
| `VITE_QURAN_API_BASE` | Quran.com API v4 base URL | `https://api.quran.com/api/v4` |
| `VITE_EVERYAYAH_BASE` | EveryAyah.com base URL (audio) | `https://everyayah.com/data` |
| `VITE_GOOGLE_FONTS_URL` | Google Fonts URL (Amiri + Outfit) | `https://fonts.googleapis.com/css2?...` |

## Architecture

```
Hifdhi/
├── README.md
├── hifdhi.jsx                          # Legacy single-file (v9)
│
├── scripts/
│   └── fetch-tajweed.js                # Node.js — generates quran-tajweed.json
│
├── data/
│   └── quran-tajweed.json              # Generated (5-8 MB) — 114 surahs offline
│
├── assets/
│   └── fonts/
│       ├── KFGQPCUthmanTahaNaskh.ttf   # Primary font (must be downloaded)
│       └── .gitkeep
│
└── src/
    ├── App.jsx                         # Entry point — orchestrates the 4 screens
    │
    ├── components/
    │   ├── index.js                    # Barrel exports
    │   ├── TajweedVerse.jsx            # React Web — nested <span> elements
    │   ├── TajweedVerse.native.jsx     # React Native — nested <Text> elements
    │   ├── AyahMarker.jsx              # Gold octagonal verse marker (Web)
    │   ├── AyahMarker.native.jsx       # Octagonal marker (RN + SVG)
    │   ├── SurahBanner.jsx             # Surah title banner
    │   ├── MushafFrame.jsx             # Ornamental Mushaf frame
    │   ├── TajweedLegend.jsx           # Color legend (compact + full)
    │   ├── ProgressBar.jsx             # Animated progress bar
    │   └── RepDots.jsx                 # Repetition dots
    │
    ├── screens/
    │   ├── index.js                    # Barrel exports
    │   ├── HomeScreen.jsx              # Screen 1 — Home + stats
    │   ├── LearnListScreen.jsx         # Screen 2 — 114 surahs list
    │   ├── StudyScreen.jsx             # Screen 3 — 3-phase memorization
    │   ├── MushafScreen.jsx            # Screen 4 — Full Tajweed Mushaf
    │   └── ReviewScreen.jsx            # Screen 5 — SR review (spaced rep)
    │
    ├── constants/
    │   ├── tajweed-colors.js           # 17 Dar Al-Maarifah rules + hex codes
    │   ├── audio.js                    # 4 reciters via EveryAyah.com
    │   ├── fonts.js                    # Font config + @font-face
    │   └── surahs.js                   # 114 surahs metadata
    │
    ├── data/
    │   └── loader.js                   # Offline loader for quran-tajweed.json
    │
    └── storage/
        ├── schema.js                   # Full AsyncStorage schema
        └── storage.js                  # CRUD + streak + SM-2 spaced rep
```

## Quick start

### Step 1 — Generate offline data

```bash
node scripts/fetch-tajweed.js
```

This calls the Quran.com API v4 for all 114 surahs and generates `data/quran-tajweed.json` (~5-8 MB).
**You only need to do this once.** After that, everything is offline.

### Step 2 — Install the font

Download **KFGQPC Uthman Taha Naskh** from:
- https://fonts.qurancomplex.gov.sa/
- Or search "KFGQPC Uthman Taha Naskh" on GitHub

Place the `.ttf` file in `assets/fonts/KFGQPCUthmanTahaNaskh.ttf`.

Automatic fallback to **Amiri** (Google Fonts) if the font is not available.

### Step 3 — Import in your project

```jsx
import App from './src/App';
// or
import { TajweedVerse, MushafFrame, AyahMarker } from './src/components';
```

## The 17 Tajweed rules (Dar Al-Maarifah palette)

| # | Rule | Arabic | Color |
|---|------|--------|-------|
| 1 | Ghunnah | غُنَّة | `#16A858` 🟢 |
| 2 | Ikhfā' Haqīqī | إِخْفَاء | `#9B30D4` 🟣 |
| 3 | Ikhfā' Shafawī | إِخْفَاء شَفَوِي | `#D97EF2` 🟪 |
| 4 | Idghām w/ Ghunnah | إِدْغَام بِغُنَّة | `#169777` 🟢 |
| 5 | Idghām w/o Ghunnah | إِدْغَام بِلَا غُنَّة | `#169777` |
| 6 | Idghām Shafawī | إِدْغَام شَفَوِي | `#169777` |
| 7 | Idghām Mutajānisayn | إِدْغَام مُتَجَانِسَيْن | `#A6461F` 🟤 |
| 8 | Idghām Mutaqāribayn | إِدْغَام مُتَقَارِبَيْن | `#A6461F` |
| 9 | Iqlāb | إِقْلَاب | `#26A4CC` 🔵 |
| 10 | Qalqalah | قَلْقَلَة | `#4050EC` 🔵 |
| 11 | Madd Ṭabī'ī | مَدّ طَبِيعِي | `#FF7F00` 🟠 |
| 12 | Madd Jā'iz | مَدّ جَائِز | `#E12B29` 🔴 |
| 13 | Madd Wājib | مَدّ وَاجِب | `#CA0004` 🔴 |
| 14 | Madd Lāzim | مَدّ لَازِم | `#B90053` 🟣 |
| 15 | Lām Shamsiyyah | لَام شَمْسِيَّة | `#D4A017` 🟡 |
| 16 | Hamzat al-Waṣl | هَمْزَة الوَصْل | `#AAAAAA` ⚪ |
| 17 | Silent letter | حَرْف لَا يُنْطَق | `#AAAAAA` ⚪ |

## Audio — 4 reciters (EveryAyah.com)

| Reciter | Path | Quality |
|---------|------|---------|
| Mishary Alafasy | `Alafasy_128kbps` | 128 kbps |
| Mahmoud Al-Husary | `Husary_128kbps` | 128 kbps |
| Abdul Basit | `Abdul_Basit_Murattal_192kbps` | 192 kbps |
| Al-Minshawi | `Minshawi_Murattal_128kbps` | 128 kbps |

URL pattern: `https://everyayah.com/data/{path}/{SSS}{AAA}.mp3`

## Storage (AsyncStorage)

| Key | Contents |
|-----|----------|
| `@hifdhi:progress` | `{ "surahId:verseIdx": { memorized, visibleReps, hiddenReps, srLevel, srInterval, srEaseFactor, srNextReview, ... } }` |
| `@hifdhi:streak` | `{ currentStreak, longestStreak, lastActiveDate, totalSessions, weeklyHistory }` |
| `@hifdhi:settings` | `{ reciterId, visibleRepsTarget, hiddenRepsTarget, tajweedEnabled, fontSize }` |
| `@hifdhi:sr_queue` | `{ dueToday: ["1:0", "2:3", ...], lastComputed }` |

**Spaced repetition** uses an SM-2 variant:
- Quality 0-2 → reset to day 1
- Quality 3+ → interval × easeFactor
- easeFactor adjusted by the SM-2 formula (min 1.3)
