import { useState, useEffect, useCallback, useRef } from "react";

/*
 * HIFDHI حِفْظِي v10
 * 
 * Data source: Quran.com API v4 — /quran/verses/uthmani_tajweed
 * Audio: EveryAyah.com (verse-level) + QuranicAudio.com (surah-level fallback)
 * Tajweed classes from API → Dar Al-Maarifah color palette
 */

const API = import.meta.env.VITE_QURAN_API_BASE || "https://api.quran.com/api/v4";
const EVERYAYAH = import.meta.env.VITE_EVERYAYAH_BASE || "https://everyayah.com/data";

// ====== DAR AL-MAARIFAH COLOR MAP ======
const TAJWEED_COLORS = {
  ham_wasl:                "#AAAAAA",
  laam_shamsiyah:          "#D4A017",
  madda_normal:            "#E85D4A",
  madda_permissible:       "#D94030",
  madda_obligatory:        "#B8301A",
  madda_necesssary:        "#A01060",
  qalqala:                 "#1980C4",
  ghunnah:                 "#169777",
  ikhfa_shafawi:           "#D97EF2",
  ikhfa:                   "#9B30D4",
  idghaam_ghunnah:         "#169777",
  idghaam_wo_ghunnah:      "#A6461F",
  idghaam_no_ghunnah:      "#A6461F",
  idghaam_shafawi:         "#169777",
  idghaam_mutajanisayn:    "#A6461F",
  idghaam_mutaqaribayn:    "#A6461F",
  iqlab:                   "#26A69A",
  silent:                  "#AAAAAA",
};

const LEGEND = [
  { ar: "غُنَّة", en: "Ghunnah", c: "#169777" },
  { ar: "إِخْفَاء", en: "Ikhfa", c: "#9B30D4" },
  { ar: "إِدْغَام", en: "Idgham", c: "#A6461F" },
  { ar: "إِقْلاب", en: "Iqlab", c: "#26A69A" },
  { ar: "قَلْقَلَة", en: "Qalqala", c: "#1980C4" },
  { ar: "مَدّ", en: "Madd", c: "#E85D4A" },
  { ar: "لام شمسية", en: "Lam Sh.", c: "#D4A017" },
];

// ====== TAJWEED HTML PARSER ======
function parseTajweedHTML(html) {
  if (!html) return [];
  const segments = [];
  // Remove end-of-ayah markers
  let clean = html.replace(/<span[^>]*class=end[^>]*>[^<]*<\/span>/g, "");
  // Normalize malformed closing tags: </tajweed/> → </tajweed>
  clean = clean.replace(/<\/tajweed\s*\/?>/g, "</tajweed>");
  let cursor = 0;
  const tagRegex = /<tajweed\s+class=([a-z_]+)>([\s\S]*?)<\/tajweed>/g;
  let match;
  while ((match = tagRegex.exec(clean)) !== null) {
    if (match.index > cursor) {
      const before = clean.slice(cursor, match.index).replace(/<[^>]*>/g, "");
      if (before) segments.push({ text: before, color: null });
    }
    const rule = match[1];
    // Recursively strip any nested tags inside the matched text
    const text = match[2].replace(/<[^>]*>/g, "");
    const color = TAJWEED_COLORS[rule] || null;
    if (text) segments.push({ text, color });
    cursor = match.index + match[0].length;
  }
  if (cursor < clean.length) {
    const rest = clean.slice(cursor).replace(/<[^>]*>/g, "");
    if (rest) segments.push({ text: rest, color: null });
  }
  return segments.length > 0 ? segments : [{ text: html.replace(/<[^>]+>/g, ""), color: null }];
}

function plainText(html) {
  if (!html) return "";
  return html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

// ====== SURAH METADATA — All 114 surahs ======
const ALL_SURAHS = [
  {id:1,ar:"الفاتحة",en:"Al-Fatiha",v:7,juz:1},
  {id:2,ar:"البقرة",en:"Al-Baqarah",v:286,juz:1},
  {id:3,ar:"آل عمران",en:"Ali 'Imran",v:200,juz:3},
  {id:4,ar:"النساء",en:"An-Nisa",v:176,juz:4},
  {id:5,ar:"المائدة",en:"Al-Ma'idah",v:120,juz:6},
  {id:6,ar:"الأنعام",en:"Al-An'am",v:165,juz:7},
  {id:7,ar:"الأعراف",en:"Al-A'raf",v:206,juz:8},
  {id:8,ar:"الأنفال",en:"Al-Anfal",v:75,juz:9},
  {id:9,ar:"التوبة",en:"At-Tawbah",v:129,juz:10},
  {id:10,ar:"يونس",en:"Yunus",v:109,juz:11},
  {id:11,ar:"هود",en:"Hud",v:123,juz:11},
  {id:12,ar:"يوسف",en:"Yusuf",v:111,juz:12},
  {id:13,ar:"الرعد",en:"Ar-Ra'd",v:43,juz:13},
  {id:14,ar:"إبراهيم",en:"Ibrahim",v:52,juz:13},
  {id:15,ar:"الحجر",en:"Al-Hijr",v:99,juz:14},
  {id:16,ar:"النحل",en:"An-Nahl",v:128,juz:14},
  {id:17,ar:"الإسراء",en:"Al-Isra",v:111,juz:15},
  {id:18,ar:"الكهف",en:"Al-Kahf",v:110,juz:15},
  {id:19,ar:"مريم",en:"Maryam",v:98,juz:16},
  {id:20,ar:"طه",en:"Ta-Ha",v:135,juz:16},
  {id:21,ar:"الأنبياء",en:"Al-Anbiya",v:112,juz:17},
  {id:22,ar:"الحج",en:"Al-Hajj",v:78,juz:17},
  {id:23,ar:"المؤمنون",en:"Al-Mu'minun",v:118,juz:18},
  {id:24,ar:"النور",en:"An-Nur",v:64,juz:18},
  {id:25,ar:"الفرقان",en:"Al-Furqan",v:77,juz:18},
  {id:26,ar:"الشعراء",en:"Ash-Shu'ara",v:227,juz:19},
  {id:27,ar:"النمل",en:"An-Naml",v:93,juz:19},
  {id:28,ar:"القصص",en:"Al-Qasas",v:88,juz:20},
  {id:29,ar:"العنكبوت",en:"Al-'Ankabut",v:69,juz:20},
  {id:30,ar:"الروم",en:"Ar-Rum",v:60,juz:21},
  {id:31,ar:"لقمان",en:"Luqman",v:34,juz:21},
  {id:32,ar:"السجدة",en:"As-Sajdah",v:30,juz:21},
  {id:33,ar:"الأحزاب",en:"Al-Ahzab",v:73,juz:21},
  {id:34,ar:"سبأ",en:"Saba",v:54,juz:22},
  {id:35,ar:"فاطر",en:"Fatir",v:45,juz:22},
  {id:36,ar:"يس",en:"Ya-Sin",v:83,juz:22},
  {id:37,ar:"الصافات",en:"As-Saffat",v:182,juz:23},
  {id:38,ar:"ص",en:"Sad",v:88,juz:23},
  {id:39,ar:"الزمر",en:"Az-Zumar",v:75,juz:23},
  {id:40,ar:"غافر",en:"Ghafir",v:85,juz:24},
  {id:41,ar:"فصلت",en:"Fussilat",v:54,juz:24},
  {id:42,ar:"الشورى",en:"Ash-Shura",v:53,juz:25},
  {id:43,ar:"الزخرف",en:"Az-Zukhruf",v:89,juz:25},
  {id:44,ar:"الدخان",en:"Ad-Dukhan",v:59,juz:25},
  {id:45,ar:"الجاثية",en:"Al-Jathiyah",v:37,juz:25},
  {id:46,ar:"الأحقاف",en:"Al-Ahqaf",v:35,juz:26},
  {id:47,ar:"محمد",en:"Muhammad",v:38,juz:26},
  {id:48,ar:"الفتح",en:"Al-Fath",v:29,juz:26},
  {id:49,ar:"الحجرات",en:"Al-Hujurat",v:18,juz:26},
  {id:50,ar:"ق",en:"Qaf",v:45,juz:26},
  {id:51,ar:"الذاريات",en:"Adh-Dhariyat",v:60,juz:26},
  {id:52,ar:"الطور",en:"At-Tur",v:49,juz:27},
  {id:53,ar:"النجم",en:"An-Najm",v:62,juz:27},
  {id:54,ar:"القمر",en:"Al-Qamar",v:55,juz:27},
  {id:55,ar:"الرحمن",en:"Ar-Rahman",v:78,juz:27},
  {id:56,ar:"الواقعة",en:"Al-Waqi'ah",v:96,juz:27},
  {id:57,ar:"الحديد",en:"Al-Hadid",v:29,juz:27},
  {id:58,ar:"المجادلة",en:"Al-Mujadila",v:22,juz:28},
  {id:59,ar:"الحشر",en:"Al-Hashr",v:24,juz:28},
  {id:60,ar:"الممتحنة",en:"Al-Mumtahina",v:13,juz:28},
  {id:61,ar:"الصف",en:"As-Saff",v:14,juz:28},
  {id:62,ar:"الجمعة",en:"Al-Jumu'ah",v:11,juz:28},
  {id:63,ar:"المنافقون",en:"Al-Munafiqun",v:11,juz:28},
  {id:64,ar:"التغابن",en:"At-Taghabun",v:18,juz:28},
  {id:65,ar:"الطلاق",en:"At-Talaq",v:12,juz:28},
  {id:66,ar:"التحريم",en:"At-Tahrim",v:12,juz:28},
  {id:67,ar:"الملك",en:"Al-Mulk",v:30,juz:29},
  {id:68,ar:"القلم",en:"Al-Qalam",v:52,juz:29},
  {id:69,ar:"الحاقة",en:"Al-Haqqah",v:52,juz:29},
  {id:70,ar:"المعارج",en:"Al-Ma'arij",v:44,juz:29},
  {id:71,ar:"نوح",en:"Nuh",v:28,juz:29},
  {id:72,ar:"الجن",en:"Al-Jinn",v:28,juz:29},
  {id:73,ar:"المزمل",en:"Al-Muzzammil",v:20,juz:29},
  {id:74,ar:"المدثر",en:"Al-Muddaththir",v:56,juz:29},
  {id:75,ar:"القيامة",en:"Al-Qiyamah",v:40,juz:29},
  {id:76,ar:"الإنسان",en:"Al-Insan",v:31,juz:29},
  {id:77,ar:"المرسلات",en:"Al-Mursalat",v:50,juz:29},
  // ── Juz 30 ──
  {id:78,ar:"النبأ",en:"An-Naba",v:40,juz:30},
  {id:79,ar:"النازعات",en:"An-Nazi'at",v:46,juz:30},
  {id:80,ar:"عبس",en:"'Abasa",v:42,juz:30},
  {id:81,ar:"التكوير",en:"At-Takwir",v:29,juz:30},
  {id:82,ar:"الانفطار",en:"Al-Infitar",v:19,juz:30},
  {id:83,ar:"المطففين",en:"Al-Mutaffifin",v:36,juz:30},
  {id:84,ar:"الانشقاق",en:"Al-Inshiqaq",v:25,juz:30},
  {id:85,ar:"البروج",en:"Al-Buruj",v:22,juz:30},
  {id:86,ar:"الطارق",en:"At-Tariq",v:17,juz:30},
  {id:87,ar:"الأعلى",en:"Al-A'la",v:19,juz:30},
  {id:88,ar:"الغاشية",en:"Al-Ghashiyah",v:26,juz:30},
  {id:89,ar:"الفجر",en:"Al-Fajr",v:30,juz:30},
  {id:90,ar:"البلد",en:"Al-Balad",v:20,juz:30},
  {id:91,ar:"الشمس",en:"Ash-Shams",v:15,juz:30},
  {id:92,ar:"الليل",en:"Al-Layl",v:21,juz:30},
  {id:93,ar:"الضحى",en:"Ad-Duhaa",v:11,juz:30},
  {id:94,ar:"الشرح",en:"Ash-Sharh",v:8,juz:30},
  {id:95,ar:"التين",en:"At-Tin",v:8,juz:30},
  {id:96,ar:"العلق",en:"Al-'Alaq",v:19,juz:30},
  {id:97,ar:"القدر",en:"Al-Qadr",v:5,juz:30},
  {id:98,ar:"البينة",en:"Al-Bayyinah",v:8,juz:30},
  {id:99,ar:"الزلزلة",en:"Az-Zalzalah",v:8,juz:30},
  {id:100,ar:"العاديات",en:"Al-'Adiyat",v:11,juz:30},
  {id:101,ar:"القارعة",en:"Al-Qari'ah",v:11,juz:30},
  {id:102,ar:"التكاثر",en:"At-Takathur",v:8,juz:30},
  {id:103,ar:"العصر",en:"Al-'Asr",v:3,juz:30},
  {id:104,ar:"الهمزة",en:"Al-Humazah",v:9,juz:30},
  {id:105,ar:"الفيل",en:"Al-Fil",v:5,juz:30},
  {id:106,ar:"قريش",en:"Quraysh",v:4,juz:30},
  {id:107,ar:"الماعون",en:"Al-Ma'un",v:7,juz:30},
  {id:108,ar:"الكوثر",en:"Al-Kawthar",v:3,juz:30},
  {id:109,ar:"الكافرون",en:"Al-Kafirun",v:6,juz:30},
  {id:110,ar:"النصر",en:"An-Nasr",v:3,juz:30},
  {id:111,ar:"المسد",en:"Al-Masad",v:5,juz:30},
  {id:112,ar:"الإخلاص",en:"Al-Ikhlas",v:4,juz:30},
  {id:113,ar:"الفلق",en:"Al-Falaq",v:5,juz:30},
  {id:114,ar:"الناس",en:"An-Nas",v:6,juz:30},
];

// ====== RECITERS — 10 reciters (EveryAyah verse-level) ======
const RECITERS = [
  {id:1,ar:"مشاري العفاسي",en:"Mishary Alafasy",path:"Alafasy_128kbps"},
  {id:2,ar:"محمود الحصري",en:"Al-Husary",path:"Husary_128kbps"},
  {id:3,ar:"عبدالباسط",en:"Abdul Basit",path:"Abdul_Basit_Murattal_192kbps"},
  {id:4,ar:"المنشاوي",en:"Al-Minshawy",path:"Minshawy_Murattal_128kbps"},
  {id:5,ar:"ماهر المعيقلي",en:"Maher Al-Muaiqly",path:"MaherAlMuaiqly128kbps"},
  {id:6,ar:"ياسر الدوسري",en:"Yasser Ad-Dussary",path:"Yasser_Ad-Dussary_128kbps"},
  {id:7,ar:"محمد أيوب",en:"Muhammad Ayyoub",path:"Muhammad_Ayyoub_128kbps"},
  {id:8,ar:"صالح البدير",en:"Salah Al-Budair",path:"Salah_Al_Budair_128kbps"},
  {id:9,ar:"ناصر القطامي",en:"Nasser Al-Qatami",path:"Nasser_Alqatami_128kbps"},
  {id:10,ar:"سعود الشريم",en:"Sa'ud Ash-Shuraym",path:"Saood_ash-Shuraym_128kbps"},
];

const REP_OPTIONS = [3, 5, 7, 10, 15];

// ====== DECORATIVE COMPONENTS ======
const AyahMarker = ({n}) => (
  <span style={{display:"inline-block",verticalAlign:"middle",margin:"0 2px",width:32,height:32}}>
    <svg width="32" height="32" viewBox="0 0 36 36">
      <polygon points="18,1 26,5 32,11 32,25 26,31 18,35 10,31 4,25 4,11 10,5" fill="none" stroke="#C5A028" strokeWidth="1.8"/>
      <polygon points="18,5 24,8 28,13 28,23 24,28 18,31 12,28 8,23 8,13 12,8" fill="none" stroke="#C5A028" strokeWidth="0.5" opacity="0.4"/>
      {[[18,2],[32,12],[32,24],[18,34],[4,24],[4,12]].map(([x,y],i)=><circle key={i} cx={x} cy={y} r="1.5" fill="#C5A028" opacity="0.6"/>)}
      <text x="18" y="22" textAnchor="middle" fill="#5C4A1E" fontSize="12" fontWeight="700" fontFamily="Outfit">{n}</text>
    </svg>
  </span>
);

const SurahBanner = ({name}) => (
  <div style={{margin:"6px 0 2px",textAlign:"center"}}>
    <div style={{display:"inline-block",background:"linear-gradient(180deg,#1E8C52,#14643A)",border:"2.5px solid #D4A017",borderRadius:4,padding:"5px 28px",position:"relative",minWidth:"65%"}}>
      <div style={{position:"absolute",inset:3,border:"1px solid #D4A01760",borderRadius:2}}/>
      <div style={{fontSize:18,fontFamily:"'Amiri',serif",fontWeight:700,color:"#FFFDE8",letterSpacing:1,position:"relative",zIndex:1,textShadow:"0 1px 2px #0003"}}>
        سُورَةُ {name}
      </div>
    </div>
  </div>
);

const TajweedVerse = ({segments, isMem, dk}) => (
  <span style={{fontSize:24,fontFamily:"'Amiri',serif",lineHeight:3.2,color:dk?"#E8E0D0":"#2C2416"}}>
    {segments.map((s,i)=>(
      <span key={i} style={isMem ? {color:"#1B9E5A"} : s.color ? {color:s.color,fontWeight:700} : {}}>{s.text}</span>
    ))}
  </span>
);

// Ornamental mushaf frame
const MushafFrame = ({children, dark: dk}) => (
  <div style={{maxWidth:480,margin:"0 auto",background:dk?"#141425":"#EDE3C4",padding:8}}>
    <div style={{position:"relative",background:dk?"linear-gradient(135deg,#1A2A4A,#1A3A5A,#1A2A4A)":"linear-gradient(135deg,#1B6B8A,#1A7A5A,#2D8B57,#1A7A5A,#1B6B8A)",borderRadius:5,padding:10}}>
      <div style={{position:"absolute",inset:0,borderRadius:5,overflow:"hidden",opacity:dk?0.12:0.22}}>
        <svg width="100%" height="100%"><defs>
          <pattern id="fp" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="10" cy="10" r="3.5" fill="none" stroke={dk?"#7B9EC8":"#FFD700"} strokeWidth="0.5"/>
            <path d="M10 6.5 L11.5 10 L10 13.5 L8.5 10Z" fill={dk?"#7B9EC8":"#FFD700"} opacity="0.35"/>
            <circle cx="10" cy="10" r="1.2" fill={dk?"#7B9EC8":"#FFD700"} opacity="0.4"/>
            <circle cx="0" cy="0" r="2" fill="none" stroke={dk?"#5A7AAA":"#FF69B4"} strokeWidth="0.4"/>
            <circle cx="20" cy="0" r="2" fill="none" stroke={dk?"#5A7AAA":"#FF69B4"} strokeWidth="0.4"/>
            <circle cx="0" cy="20" r="2" fill="none" stroke={dk?"#5A7AAA":"#FF69B4"} strokeWidth="0.4"/>
            <circle cx="20" cy="20" r="2" fill="none" stroke={dk?"#5A7AAA":"#FF69B4"} strokeWidth="0.4"/>
          </pattern>
        </defs><rect width="100%" height="100%" fill="url(#fp)"/></svg>
      </div>
      {[{t:2,l:2},{t:2,r:2},{b:2,l:2},{b:2,r:2}].map((p,i)=>(
        <div key={i} style={{position:"absolute",...p,width:24,height:24,zIndex:3}}>
          <svg width="24" height="24" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" fill={dk?"#5A7AAA":"#E8C83A"} opacity="0.8"/>
            <circle cx="12" cy="12" r="7" fill={dk?"#1A2A4A":"#1A7A5A"}/>
            <circle cx="12" cy="12" r="4" fill={dk?"#5A7AAA":"#E8C83A"} opacity="0.6"/>
          </svg>
        </div>
      ))}
      <div style={{position:"absolute",inset:7,border:`1.5px solid ${dk?"#5A7AAA":"#E8C83A"}`,borderRadius:3,pointerEvents:"none",zIndex:2}}/>
      <div style={{position:"relative",background:dk?"#1E1E32":"#FFFDF0",border:`3px solid ${dk?"#2A3A5C":"#B22234"}`,borderRadius:2,zIndex:1}}>
        <div style={{border:`1px solid ${dk?"#2A3A5C40":"#D4A01740"}`,margin:3,padding:"6px 8px 8px"}}>
          {children}
        </div>
      </div>
    </div>
  </div>
);

// ====== MAIN APP ======
export default function Hifdhi() {
  const [screen, setScreen] = useState("home");
  const [reciter, setReciter] = useState(RECITERS[0]);
  const audioRef = useRef(null);
  
  // Mushaf state — page-by-page (1–604)
  const [mushafPageNum, setMushafPageNum] = useState(()=>{
    try{const p=localStorage.getItem("hifdhi_mushaf_page");return p?parseInt(p):604;}catch{return 604;}
  });
  const [mushafVerses, setMushafVerses] = useState([]);
  const [mushafLoading, setMushafLoading] = useState(false);
  const [mushafGoTo, setMushafGoTo] = useState("");
  const [mushafBookmarks, setMushafBookmarks] = useState(()=>{
    try{const b=localStorage.getItem("hifdhi_bookmarks");return b?JSON.parse(b):[];}catch{return[];}
  });
  const [mushafSearch, setMushafSearch] = useState("");
  const [mushafSearchResults, setMushafSearchResults] = useState(null);
  const mushafTouchRef = useRef({startX:0,startY:0});
  const saveMushafPage = (p) => { setMushafPageNum(p); localStorage.setItem("hifdhi_mushaf_page", String(p)); };
  const toggleBookmark = (page) => {
    setMushafBookmarks(prev => {
      const next = prev.includes(page) ? prev.filter(x=>x!==page) : [...prev, page].sort((a,b)=>a-b);
      localStorage.setItem("hifdhi_bookmarks", JSON.stringify(next));
      return next;
    });
  };
  
  // Learn state
  const [learnSurah, setLearnSurah] = useState(null);
  const [learnLoading, setLearnLoading] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [surahPage, setSurahPage] = useState(0);
  const SURAHS_PER_PAGE = 12;
  const [juzFilter, setJuzFilter] = useState(0); // 0 = all

  // Favorites
  const [favorites, setFavorites] = useState(()=>{
    try{const f=localStorage.getItem("hifdhi_favs");return f?JSON.parse(f):[];}catch{return[];}
  });
  const toggleFav = (id) => setFavorites(prev => {
    const next = prev.includes(id) ? prev.filter(x=>x!==id) : [...prev, id];
    try{localStorage.setItem("hifdhi_favs",JSON.stringify(next));}catch{}
    return next;
  });

  // Listen mode
  const [listenMode, setListenMode] = useState(false);
  const [listenSurah, setListenSurah] = useState(null);
  const [listenIdx, setListenIdx] = useState(0);
  const [listenPlaying, setListenPlaying] = useState(false);
  const listenAudioRef = useRef(null);
  
  // Study state
  const [curV, setCurV] = useState(0);
  const [phase, setPhase] = useState("listen");
  const [reps, setReps] = useState(0);
  const [isRec, setIsRec] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [anim, setAnim] = useState("");
  const [showCelebration, setShowCelebration] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [autoAdvance, setAutoAdvance] = useState(false);
  const [repVisible, setRepVisible] = useState(5);
  const [repHidden, setRepHidden] = useState(5);

  // Verse range selection
  const [rangeStart, setRangeStart] = useState(1);
  const [rangeEnd, setRangeEnd] = useState(null);

  // Translation & transliteration
  const [showTranslation, setShowTranslation] = useState(false);
  const [showTranslit, setShowTranslit] = useState(false);
  const [translations, setTranslations] = useState({});
  const [transliterations, setTransliterations] = useState({});

  // Dark mode
  const [dark, setDark] = useState(()=>{
    try{return localStorage.getItem("hifdhi_dark")==="true";}catch{return false;}
  });
  useEffect(()=>{try{localStorage.setItem("hifdhi_dark",dark?"true":"false");}catch{}},[dark]);

  const [progress, setProgress] = useState({});
  const [streak, setStreak] = useState(0);
  const [todayCount, setTodayCount] = useState(0);

  // Load saved data
  useEffect(()=>{
    try{
      const p=localStorage.getItem("hifdhi_progress");if(p)setProgress(JSON.parse(p));
      const s=localStorage.getItem("hifdhi_streak");if(s){const d=JSON.parse(s);setStreak(d.s||0);setTodayCount(d.today||0);if(d.date!==new Date().toISOString().slice(0,10)){setTodayCount(0);setStreak(d.date===yesterday()?d.s:0);}}
    }catch{}
  },[]);

  function yesterday(){const d=new Date();d.setDate(d.getDate()-1);return d.toISOString().slice(0,10);}

  const save=useCallback(p=>{
    setProgress(p);
    try{localStorage.setItem("hifdhi_progress",JSON.stringify(p));}catch{}
  },[]);

  const saveStreak=useCallback((s,tc)=>{
    setStreak(s);setTodayCount(tc);
    try{localStorage.setItem("hifdhi_streak",JSON.stringify({s,today:tc,date:new Date().toISOString().slice(0,10)}));}catch{}
  },[]);

  // ====== FETCH TAJWEED DATA ======
  const fetchTajweed = async (surahId) => {
    try {
      const res = await fetch(`${API}/quran/verses/uthmani_tajweed?chapter_number=${surahId}`);
      const data = await res.json();
      return (data.verses || []).map(v => ({
        html: v.text_uthmani_tajweed,
        segments: parseTajweedHTML(v.text_uthmani_tajweed),
        plain: plainText(v.text_uthmani_tajweed),
        key: v.verse_key,
      }));
    } catch (e) {
      console.error("API fetch failed for surah", surahId, e);
      return null;
    }
  };

  const loadMushafPageByNum = async (pageNum) => {
    setMushafLoading(true);
    saveMushafPage(pageNum);
    try {
      const res = await fetch(`${API}/verses/by_page/${pageNum}?language=ar&words=false&fields=text_uthmani_tajweed,verse_key,verse_number,chapter_id`);
      const data = await res.json();
      const verses = (data.verses || []).map(v => ({
        key: v.verse_key,
        surahId: v.chapter_id,
        verseNum: v.verse_number,
        segments: parseTajweedHTML(v.text_uthmani_tajweed || ""),
        plain: plainText(v.text_uthmani_tajweed || ""),
      }));
      setMushafVerses(verses);
    } catch (e) {
      console.error("Mushaf page load failed", e);
      setMushafVerses([]);
    }
    setMushafLoading(false);
  };

  // Fetch French translation (Montada Islamic Foundation — resource 136)
  const fetchTranslation = async (surahId) => {
    try {
      const res = await fetch(`${API}/quran/translations/136?chapter_number=${surahId}`);
      const data = await res.json();
      const map = {};
      (data.translations || []).forEach(t => { map[t.verse_key] = t.text.replace(/<[^>]+>/g, ''); });
      return map;
    } catch { return {}; }
  };

  // Fetch transliteration (resource 57 = transliteration)
  const fetchTransliteration = async (surahId) => {
    try {
      const res = await fetch(`${API}/quran/translations/57?chapter_number=${surahId}`);
      const data = await res.json();
      const map = {};
      (data.translations || []).forEach(t => { map[t.verse_key] = t.text.replace(/<[^>]+>/g, ''); });
      return map;
    } catch { return {}; }
  };

  const loadLearnSurah = async (surah, startV = null, endV = null) => {
    setLearnLoading(true);
    const verses = await fetchTajweed(surah.id);
    if (verses) {
      const s = (startV || 1) - 1;
      const e = endV || verses.length;
      const sliced = verses.slice(s, e);
      setLearnSurah({ ...surah, verses: sliced, allVerses: verses, rangeOffset: s });
      setCurV(0); setReps(0); setPhase("listen"); setAnim("fadeIn");
      setScreen("study");
      // Fetch translation & transliteration in background
      fetchTranslation(surah.id).then(t => setTranslations(prev => ({...prev, [surah.id]: t})));
      fetchTransliteration(surah.id).then(t => setTransliterations(prev => ({...prev, [surah.id]: t})));
    } else {
      alert("Erreur de chargement. Vérifie ta connexion.");
    }
    setLearnLoading(false);
  };

  // ====== AUDIO ======
  const playAudio = useCallback((onEnd) => {
    if(audioRef.current){audioRef.current.pause();audioRef.current=null;}
    if(!learnSurah) return;
    setPlaying(true);
    const s = String(learnSurah.id).padStart(3,"0");
    const offset = learnSurah.rangeOffset || 0;
    const a = String(curV + 1 + offset).padStart(3,"0");
    const url = `${EVERYAYAH}/${reciter.path}/${s}${a}.mp3`;
    const audio = new Audio(url);
    audio.playbackRate = playbackRate;
    audioRef.current = audio;
    audio.onended = () => { setPlaying(false); audioRef.current=null; if(onEnd) onEnd(); };
    audio.onerror = () => {
      setPlaying(false); audioRef.current=null;
      if(onEnd) setTimeout(onEnd, 1200);
    };
    audio.play().catch(() => { setPlaying(false); if(onEnd) setTimeout(onEnd, 1200); });
  },[learnSurah, curV, reciter, playbackRate]);

  const playAndAdvance = useCallback(()=>{
    playAudio(()=>setPhase("visible"));
  },[playAudio]);

  const replayAudio = useCallback(()=>{
    playAudio(null);
  },[playAudio]);

  // Stop audio on unmount / screen change
  useEffect(()=>{return()=>{if(audioRef.current){audioRef.current.pause();audioRef.current=null;}};},[screen]);

  // ====== RECITATION — Always accept, no random failure ======
  const recStart=()=>{setIsRec(true);};
  const recStop=()=>{
    setIsRec(false);
    const curRep = phase === "visible" ? repVisible : repHidden;
    const nr = reps + 1;
    setReps(nr);
    if (nr >= curRep) {
      if (phase === "visible") {
        setTimeout(()=>{setReps(0);setPhase("hidden");},400);
      } else {
        compV();
      }
    }
  };

  // Skip current phase
  const skipPhase = () => {
    if (phase === "listen") { setPhase("visible"); }
    else if (phase === "visible") { setReps(0); setPhase("hidden"); }
    else if (phase === "hidden") { compV(); }
  };

  const compV = async () => {
    const offset = learnSurah.rangeOffset || 0;
    const k = `${learnSurah.id}:${curV + offset}`;
    const np = {...progress,[k]:{m:true,t:Date.now()}};
    save(np);
    const newToday = todayCount + 1;
    saveStreak(Math.max(streak, 1), newToday);

    // Celebration
    setShowCelebration(true);
    setTimeout(()=>{
      setShowCelebration(false);
      if(curV < learnSurah.verses.length - 1){
        setAnim("out");
        setTimeout(()=>{
          setCurV(c=>c+1); setReps(0); setPhase("listen"); setAnim("fadeIn");
          if(autoAdvance) setTimeout(()=>playAndAdvance(), 600);
        },250);
      } else {
        // Surah completed!
        setScreen("complete");
      }
    },1200);
  };

  const memC=(id,vc)=>{let c=0;for(let i=0;i<vc;i++)if(progress[`${id}:${i}`]?.m)c++;return c;};
  const totalMem=Object.values(progress).filter(x=>x.m).length;

  // Filter surahs by search + juz
  const baseFiltered = (() => {
    let list = ALL_SURAHS;
    if (juzFilter > 0) list = list.filter(s => s.juz === juzFilter);
    if (searchQ) list = list.filter(s => s.ar.includes(searchQ) || s.en.toLowerCase().includes(searchQ.toLowerCase()) || String(s.id) === searchQ);
    return list;
  })();
  const totalPages = Math.ceil(baseFiltered.length / SURAHS_PER_PAGE);
  const safePage = Math.min(surahPage, Math.max(0, totalPages - 1));
  const filteredSurahs = (searchQ || juzFilter > 0) ? baseFiltered : baseFiltered.slice(safePage * SURAHS_PER_PAGE, (safePage + 1) * SURAHS_PER_PAGE);
  const favSurahs = ALL_SURAHS.filter(s => favorites.includes(s.id));

  // Verse range picker state
  const [rangeSurah, setRangeSurah] = useState(null);
  const [pickStart, setPickStart] = useState(1);
  const [pickEnd, setPickEnd] = useState(null);

  const openRangePicker = (s) => {
    setRangeSurah(s);
    setPickStart(1);
    setPickEnd(s.v);
  };

  const launchWithRange = () => {
    if (!rangeSurah) return;
    loadLearnSurah(rangeSurah, pickStart, pickEnd);
    setRangeSurah(null);
  };

  // Get memorized verses for a surah as array of verse indices
  const getMemVerses = (surahId, total) => {
    const arr = [];
    for (let i = 0; i < total; i++) if (progress[`${surahId}:${i}`]?.m) arr.push(i);
    return arr;
  };

  // Review: pick random memorized verses
  const startReview = () => {
    const allMem = Object.entries(progress).filter(([,v]) => v.m).map(([k]) => k);
    if (allMem.length === 0) { alert("Aucun verset mémorisé à réviser !"); return; }
    setScreen("review-pick");
  };

  // ====== THEME COLORS ======
  const T = dark ? {
    bg: "#1A1A2E", bg2: "#16213E", card: "#1F2940", cardBorder: "#2A3A5C",
    text: "#E8E8E8", textSub: "#8899AA", textMuted: "#5A6A7A",
    accent: "#2ECC71", gold: "#D4A017", green: "#1E8C52",
  } : {
    bg: "linear-gradient(170deg,#F5ECD0,#EDE3C4)", bg2: "#F5ECD0", card: "#FFFDF0", cardBorder: "#E0D5BF",
    text: "#2C2416", textSub: "#8B7D3C", textMuted: "#8B7D3C80",
    accent: "#1E8C52", gold: "#C5A028", green: "#1E8C52",
  };

  // ====== LISTEN MODE ======
  const startListenMode = async (surah) => {
    setLearnLoading(true);
    const verses = await fetchTajweed(surah.id);
    if (!verses) { alert("Erreur de chargement."); setLearnLoading(false); return; }
    setListenSurah({ ...surah, verses });
    setListenIdx(0);
    setListenPlaying(true);
    setListenMode(true);
    setScreen("listen");
    setLearnLoading(false);
    // start playing first verse
    setTimeout(() => playListenVerse(surah.id, 0, verses.length), 300);
  };

  const playListenVerse = (surahId, idx, total) => {
    if (idx >= total) { setListenPlaying(false); return; }
    const s = String(surahId).padStart(3, "0");
    const a = String(idx + 1).padStart(3, "0");
    if (listenAudioRef.current) { listenAudioRef.current.pause(); }
    const audio = new Audio(`${EVERYAYAH}/${reciter.path}/${s}${a}.mp3`);
    audio.playbackRate = playbackRate;
    listenAudioRef.current = audio;
    setListenIdx(idx);
    setListenPlaying(true);
    audio.play().catch(() => {});
    audio.onended = () => {
      playListenVerse(surahId, idx + 1, total);
    };
  };

  const pauseListenMode = () => {
    if (listenAudioRef.current) { listenAudioRef.current.pause(); }
    setListenPlaying(false);
  };

  const resumeListenMode = () => {
    if (listenSurah) {
      playListenVerse(listenSurah.id, listenIdx, listenSurah.verses.length);
    }
  };

  // ====== HOME ======
  const renderHome = () => (
    <div style={{minHeight:"100vh",background:dark?T.bg:"linear-gradient(170deg,#F5ECD0,#EDE3C4)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24}}>
      {/* Dark mode toggle */}
      <button onClick={()=>setDark(!dark)} style={{position:"absolute",top:16,right:16,background:dark?"#2A3A5C":"#FFFDF0",border:`1.5px solid ${dark?"#3A4A6C":"#E0D5BF"}`,borderRadius:10,width:40,height:40,fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
        {dark?"☀️":"🌙"}
      </button>

      <div style={{width:90,height:90,borderRadius:22,background:"linear-gradient(135deg,#1E8C52,#145533)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 8px 30px #14553330",marginBottom:14}}>
        <span style={{fontSize:44,fontFamily:"'Amiri',serif",color:"#F5E6B8",fontWeight:700}}>حِ</span>
      </div>
      <div style={{fontSize:34,fontWeight:700,color:T.accent,letterSpacing:-0.5}}>Hifdhi</div>
      <div style={{fontSize:20,fontFamily:"'Amiri',serif",color:T.textSub}}>حِفْظِي</div>
      <div style={{fontSize:13,color:T.textMuted,marginBottom:28,marginTop:4,textAlign:"center"}}>
        Mémorise le Coran avec le Tajweed
      </div>

      {/* Stats */}
      <div style={{display:"flex",gap:10,marginBottom:24,flexWrap:"wrap",justifyContent:"center"}}>
        <div style={{background:T.card,border:`1.5px solid ${T.cardBorder}`,borderRadius:14,padding:"12px 16px",textAlign:"center",minWidth:80}}>
          <div style={{fontSize:24,fontWeight:700,color:T.accent}}>{totalMem}</div>
          <div style={{fontSize:9,color:T.textMuted}}>Versets mémorisés</div>
        </div>
        <div style={{background:T.card,border:`1.5px solid ${T.cardBorder}`,borderRadius:14,padding:"12px 16px",textAlign:"center",minWidth:80}}>
          <div style={{fontSize:24,fontWeight:700,color:"#E67E22"}}>🔥 {streak}</div>
          <div style={{fontSize:9,color:T.textMuted}}>Jours consécutifs</div>
        </div>
        <div style={{background:T.card,border:`1.5px solid ${T.cardBorder}`,borderRadius:14,padding:"12px 16px",textAlign:"center",minWidth:80}}>
          <div style={{fontSize:24,fontWeight:700,color:"#1980C4"}}>{todayCount}</div>
          <div style={{fontSize:9,color:T.textMuted}}>Aujourd'hui</div>
        </div>
      </div>

      {/* Favorites quick access */}
      {favSurahs.length > 0 && (
        <div style={{width:"100%",maxWidth:340,marginBottom:18}}>
          <div style={{fontSize:12,fontWeight:700,color:T.textSub,marginBottom:6}}>⭐ Favoris</div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {favSurahs.map(s=>(
              <button key={s.id} onClick={()=>{openRangePicker(s);setScreen("learn-list");}} style={{
                padding:"6px 12px",borderRadius:10,fontSize:11,fontWeight:600,cursor:"pointer",
                background:T.card,border:`1.5px solid ${T.cardBorder}`,color:T.text,fontFamily:"'Outfit'",
                display:"flex",alignItems:"center",gap:4
              }}>
                <span style={{fontFamily:"'Amiri',serif",fontSize:14}}>{s.ar}</span>
                <span style={{color:T.textMuted,fontSize:9}}>{s.v}v</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{display:"flex",flexDirection:"column",gap:10,width:"100%",maxWidth:340}}>
        <button style={{...S.btnG,...(dark?{background:"linear-gradient(135deg,#2ECC71,#1E8C52)"}:{})}} onClick={()=>setScreen("learn-list")}>
          <span style={{fontSize:24}}>🧠</span>
          <div style={{textAlign:"left",flex:1}}><div style={{fontSize:16}}>Apprendre</div><div style={{fontSize:10,fontWeight:400,opacity:.8}}>114 sourates · {repVisible}× visible + {repHidden}× caché</div></div>
          <span style={{fontSize:16,opacity:.6}}>›</span>
        </button>
        <button style={{...S.btnM,...(dark?{background:T.card,borderColor:T.cardBorder}:{})}} onClick={startReview}>
          <span style={{fontSize:24}}>📝</span>
          <div style={{textAlign:"left",flex:1}}><div style={{fontSize:16,color:dark?T.text:"#4A3D1A"}}>Réviser</div><div style={{fontSize:10,fontWeight:400,color:T.textMuted}}>Quiz sur les versets mémorisés</div></div>
          <span style={{fontSize:16,color:T.gold}}>›</span>
        </button>
        <div style={{display:"flex",gap:10}}>
          <button style={{...S.btnM,...(dark?{background:T.card,borderColor:T.cardBorder}:{}),flex:1,padding:"14px 12px"}} onClick={()=>setScreen("listen-pick")}>
            <span style={{fontSize:22}}>🎧</span>
            <div style={{textAlign:"left",flex:1}}><div style={{fontSize:14,color:dark?T.text:"#4A3D1A"}}>Écouter</div><div style={{fontSize:9,fontWeight:400,color:T.textMuted}}>Mode baladeur</div></div>
          </button>
          <button style={{...S.btnM,...(dark?{background:T.card,borderColor:T.cardBorder}:{}),flex:1,padding:"14px 12px"}} onClick={()=>setScreen("stats")}>
            <span style={{fontSize:22}}>📊</span>
            <div style={{textAlign:"left",flex:1}}><div style={{fontSize:14,color:dark?T.text:"#4A3D1A"}}>Stats</div><div style={{fontSize:9,fontWeight:400,color:T.textMuted}}>Progression</div></div>
          </button>
        </div>
        <button style={{...S.btnM,...(dark?{background:T.card,borderColor:T.cardBorder}:{}),padding:"14px 16px"}} onClick={()=>{setScreen("mushaf");loadMushafPageByNum(mushafPageNum);}}>
          <span style={{fontSize:22}}>📖</span>
          <div style={{textAlign:"left",flex:1}}><div style={{fontSize:14,color:dark?T.text:"#4A3D1A"}}>Mushaf Tajweed</div><div style={{fontSize:9,fontWeight:400,color:T.textMuted}}>Page {mushafPageNum}/604</div></div>
          <span style={{fontSize:16,color:T.gold}}>›</span>
        </button>
      </div>

      {/* Quick resume */}
      {learnSurah && (
        <button style={{marginTop:16,background:"none",border:`1.5px dashed ${T.accent}50`,borderRadius:12,padding:"10px 20px",color:T.accent,fontSize:12,fontWeight:600,cursor:"pointer"}}
          onClick={()=>setScreen("study")}>
          ↺ Reprendre {learnSurah.ar} — verset {curV+1}
        </button>
      )}

      <div style={{fontSize:10,color:T.textMuted,marginTop:24}}>
        {RECITERS.length} récitateurs · {ALL_SURAHS.length} sourates · Quran.com API v4
      </div>
    </div>
  );

  // ====== LEARN LIST ======
  const renderLearnList = () => (
    <div style={{maxWidth:460,margin:"0 auto",padding:"12px 16px",minHeight:"100vh",background:dark?T.bg:"#F5ECD0"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
        <button style={{...S.bk,...(dark?{background:T.card,borderColor:T.cardBorder,color:T.text}:{})}} onClick={()=>setScreen("home")}>‹</button>
        <div style={{fontSize:20,fontWeight:700,color:T.text,flex:1}}>Apprendre</div>
        <span style={{fontSize:11,color:T.textMuted}}>{totalMem} mémorisés</span>
      </div>

      {/* Méthode */}
      <div style={{background:T.card,border:`1px solid ${T.cardBorder}`,borderRadius:14,padding:"12px 14px",marginBottom:12}}>
        <div style={{fontSize:12,fontWeight:700,color:T.accent,marginBottom:4}}>📋 Méthode</div>
        <div style={{fontSize:11,color:T.text,lineHeight:1.7}}>
          <b>1.</b> Écoute le récitateur · <b>2.</b> Répète <b>{repVisible}× en regardant</b> · <b>3.</b> Répète <b>{repHidden}× sans regarder</b> · <b>4.</b> Verset validé ✓
        </div>
      </div>

      {/* Repetition selector */}
      <div style={{background:T.card,border:`1px solid ${T.cardBorder}`,borderRadius:14,padding:"12px 14px",marginBottom:12}}>
        <div style={{fontSize:12,fontWeight:700,color:T.accent,marginBottom:8}}>🔁 Nombre de répétitions</div>
        <div style={{display:"flex",gap:12,alignItems:"center"}}>
          <div style={{flex:1}}>
            <div style={{fontSize:11,color:T.textSub,marginBottom:5}}>📖 Visible</div>
            <div style={{display:"flex",gap:4}}>
              {REP_OPTIONS.map(n=>(
                <button key={n} onClick={()=>setRepVisible(n)} style={{width:34,height:34,borderRadius:8,fontSize:13,fontWeight:700,cursor:"pointer",
                  background:repVisible===n?T.accent:"transparent",color:repVisible===n?"#F5E6B8":T.text,
                  border:`1.5px solid ${repVisible===n?T.accent:T.cardBorder}`,fontFamily:"'Outfit'"}}>{n}</button>
              ))}
            </div>
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:11,color:T.textSub,marginBottom:5}}>🧠 Caché</div>
            <div style={{display:"flex",gap:4}}>
              {REP_OPTIONS.map(n=>(
                <button key={n} onClick={()=>setRepHidden(n)} style={{width:34,height:34,borderRadius:8,fontSize:13,fontWeight:700,cursor:"pointer",
                  background:repHidden===n?T.accent:"transparent",color:repHidden===n?"#F5E6B8":T.text,
                  border:`1.5px solid ${repHidden===n?T.accent:T.cardBorder}`,fontFamily:"'Outfit'"}}>{n}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Reciters */}
      <div style={{marginBottom:12}}>
        <div style={{fontSize:12,fontWeight:600,color:T.textSub,marginBottom:6}}>🎙 Récitateur</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:6}}>
          {RECITERS.map(r=>(
            <button key={r.id} style={{padding:"10px 12px",borderRadius:12,cursor:"pointer",textAlign:"center",
              background:r.id===reciter.id?T.accent:T.card,
              border:`2px solid ${r.id===reciter.id?T.accent:T.cardBorder}`,
              boxShadow:r.id===reciter.id?"0 2px 10px #1E8C5225":"none",transition:"all 0.2s"}}
              onClick={()=>setReciter(r)}>
              <div style={{fontSize:15,fontFamily:"'Amiri',serif",fontWeight:700,color:r.id===reciter.id?"#F5E6B8":T.text,lineHeight:1.3}}>{r.ar}</div>
              <div style={{fontSize:10,fontWeight:500,color:r.id===reciter.id?"#F5E6B8A0":T.textMuted,marginTop:2}}>{r.en}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Search — sticky */}
      <div style={{position:"sticky",top:0,zIndex:10,background:dark?"#1A1A2E":"#F5ECD0",paddingBottom:8,paddingTop:2}}>
        <div style={{position:"relative"}}>
          <input value={searchQ} onChange={e=>{setSearchQ(e.target.value);setSurahPage(0);}} placeholder="Rechercher une sourate (nom, n°)..."
            style={{width:"100%",padding:"11px 38px 11px 36px",borderRadius:14,border:`1.5px solid ${T.cardBorder}`,background:T.card,fontSize:13,fontFamily:"'Outfit'",outline:"none",color:T.text,boxShadow:dark?"0 2px 8px #00000030":"0 2px 8px #C5A02810"}}/>
          <span style={{position:"absolute",left:12,top:11,fontSize:14,color:T.textMuted,pointerEvents:"none"}}>🔍</span>
          {searchQ && (
            <button onClick={()=>{setSearchQ("");setSurahPage(0);}} style={{position:"absolute",right:8,top:7,background:dark?"#2A3A5C":"#E0D5BF",border:"none",borderRadius:"50%",width:26,height:26,fontSize:13,color:T.textSub,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
          )}
        </div>

        {/* Juz filter tabs */}
        <div style={{display:"flex",gap:4,overflowX:"auto",paddingBottom:4,marginTop:8,scrollbarWidth:"none",WebkitOverflowScrolling:"touch"}}>
          <button onClick={()=>{setJuzFilter(0);setSurahPage(0);}} style={{padding:"5px 12px",borderRadius:8,fontSize:10,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap",flexShrink:0,
            background:juzFilter===0?T.accent:T.card,color:juzFilter===0?"#F5E6B8":T.text,
            border:`1px solid ${juzFilter===0?T.accent:T.cardBorder}`,fontFamily:"'Outfit'"}}>Tout</button>
          <button onClick={()=>{setJuzFilter(-1);setSurahPage(0);}} style={{padding:"5px 12px",borderRadius:8,fontSize:10,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap",flexShrink:0,
            background:juzFilter===-1?"#E67E22":T.card,color:juzFilter===-1?"#fff":T.text,
            border:`1px solid ${juzFilter===-1?"#E67E22":T.cardBorder}`,fontFamily:"'Outfit'"}}>⭐ Favoris</button>
          {Array.from({length:30}).map((_,i)=>(
            <button key={i+1} onClick={()=>{setJuzFilter(i+1);setSurahPage(0);}} style={{padding:"5px 10px",borderRadius:8,fontSize:10,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap",flexShrink:0,
              background:juzFilter===i+1?T.accent:T.card,color:juzFilter===i+1?"#F5E6B8":T.text,
              border:`1px solid ${juzFilter===i+1?T.accent:T.cardBorder}`,fontFamily:"'Outfit'"}}>Juz {i+1}</button>
          ))}
        </div>

        {/* Pagination — only when no filter/search active */}
        {!searchQ && juzFilter===0 && totalPages > 1 && (
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:4,marginTop:6}}>
            <button disabled={safePage===0} onClick={()=>setSurahPage(p=>Math.max(0,p-1))} style={{width:28,height:28,borderRadius:8,border:`1px solid ${T.cardBorder}`,background:T.card,color:T.text,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"'Outfit'",display:"flex",alignItems:"center",justifyContent:"center"}}>‹</button>
            {Array.from({length:totalPages}).map((_,i)=>(
              <button key={i} onClick={()=>setSurahPage(i)} style={{minWidth:28,height:28,borderRadius:8,fontSize:10,fontWeight:700,cursor:"pointer",
                background:i===safePage?T.accent:T.card,color:i===safePage?"#F5E6B8":T.text,
                border:`1px solid ${i===safePage?T.accent:T.cardBorder}`,fontFamily:"'Outfit'",display:"flex",alignItems:"center",justifyContent:"center"}}>{i+1}</button>
            ))}
            <button disabled={safePage>=totalPages-1} onClick={()=>setSurahPage(p=>Math.min(totalPages-1,p+1))} style={{width:28,height:28,borderRadius:8,border:`1px solid ${T.cardBorder}`,background:T.card,color:T.text,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"'Outfit'",display:"flex",alignItems:"center",justifyContent:"center"}}>›</button>
          </div>
        )}
      </div>

      {learnLoading && <div style={{textAlign:"center",padding:40,color:T.textSub}}>Chargement des versets Tajweed...</div>}

      {filteredSurahs.length === 0 && searchQ && (
        <div style={{textAlign:"center",padding:30,color:T.textMuted}}>
          <div style={{fontSize:32,marginBottom:6}}>🔍</div>
          <div style={{fontSize:13}}>Aucune sourate trouvée pour « {searchQ} »</div>
        </div>
      )}

      {(juzFilter===-1 ? favSurahs : filteredSurahs).map(s=>{
        const m=memC(s.id,s.v);const pct=Math.round((m/s.v)*100);const done=pct===100;const isFav=favorites.includes(s.id);
        return(
          <div key={s.id} style={{...S.card,background:done?(dark?"#1E8C5215":"#F0FFF4"):T.card,borderColor:done?`${T.accent}40`:T.cardBorder}}>
            <div style={{...S.cardNum,...(done?{background:"linear-gradient(135deg,#2ECC71,#1E8C52)"}:{})}} onClick={()=>openRangePicker(s)}><span style={{fontSize:14,fontWeight:700,color:"#F5E6B8"}}>{done?"✓":s.id}</span></div>
            <div style={{flex:1,cursor:"pointer"}} onClick={()=>openRangePicker(s)}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{fontSize:14,fontWeight:600,color:T.text}}>{s.en}</span>
                <span style={{fontSize:18,fontFamily:"'Amiri',serif",color:T.text}}>{s.ar}</span>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:5,marginTop:4}}>
                <span style={{fontSize:10,color:T.textMuted}}>{s.v} v. · Juz {s.juz}</span>
                <div style={{flex:1,maxWidth:60,height:3,background:dark?"#2A3A5C":"#E0D5BF",borderRadius:2,overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${pct}%`,background:done?"#2ECC71":T.accent,borderRadius:2,transition:"width 0.4s"}}/>
                </div>
                {pct>0&&<span style={{fontSize:9,fontWeight:700,color:done?"#2ECC71":T.accent}}>{m}/{s.v}</span>}
              </div>
            </div>
            <button onClick={(e)=>{e.stopPropagation();toggleFav(s.id);}} style={{background:"none",border:"none",fontSize:16,cursor:"pointer",padding:4,flexShrink:0,filter:isFav?"none":"grayscale(1) opacity(0.4)"}}>{isFav?"⭐":"☆"}</button>
            <span style={{color:T.gold,fontSize:18,cursor:"pointer"}} onClick={()=>openRangePicker(s)}>›</span>
          </div>
        );
      })}

      {juzFilter===-1 && favSurahs.length===0 && (
        <div style={{textAlign:"center",padding:30,color:T.textMuted}}>
          <div style={{fontSize:32,marginBottom:6}}>⭐</div>
          <div style={{fontSize:13}}>Aucun favori. Clique sur l'étoile pour en ajouter !</div>
        </div>
      )}

      {/* Bottom pagination */}
      {!searchQ && totalPages > 1 && (
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:4,marginTop:12,paddingTop:12,borderTop:`1px solid ${T.cardBorder}`}}>
          <button disabled={safePage===0} onClick={()=>{setSurahPage(p=>Math.max(0,p-1));window.scrollTo({top:0,behavior:"smooth"});}} style={{padding:"8px 14px",borderRadius:10,border:`1px solid ${T.cardBorder}`,background:T.card,color:safePage===0?T.textMuted:T.text,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"'Outfit'"}}>‹ Précédent</button>
          <span style={{fontSize:11,color:T.textMuted,padding:"0 8px"}}>{safePage+1} / {totalPages}</span>
          <button disabled={safePage>=totalPages-1} onClick={()=>{setSurahPage(p=>Math.min(totalPages-1,p+1));window.scrollTo({top:0,behavior:"smooth"});}} style={{padding:"8px 14px",borderRadius:10,border:`1px solid ${T.cardBorder}`,background:T.card,color:safePage>=totalPages-1?T.textMuted:T.text,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"'Outfit'"}}>Suivant ›</button>
        </div>
      )}

      {/* Verse range picker modal */}
      {rangeSurah && (
        <div style={{position:"fixed",inset:0,background:"#00000080",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={()=>setRangeSurah(null)}>
          <div style={{background:dark?T.bg2:"#FFFDF0",borderRadius:20,padding:"24px 20px",maxWidth:360,width:"100%",boxShadow:"0 20px 60px #00000040",animation:"fadeIn 0.3s"}} onClick={e=>e.stopPropagation()}>
            <div style={{textAlign:"center",marginBottom:16}}>
              <div style={{fontSize:22,fontFamily:"'Amiri',serif",fontWeight:700,color:T.text}}>{rangeSurah.ar}</div>
              <div style={{fontSize:14,color:T.textSub}}>{rangeSurah.en} · {rangeSurah.v} versets</div>
            </div>

            <div style={{display:"flex",gap:12,marginBottom:16}}>
              <div style={{flex:1}}>
                <label style={{fontSize:11,fontWeight:600,color:T.textSub,marginBottom:4,display:"block"}}>Du verset</label>
                <input type="number" min={1} max={rangeSurah.v} value={pickStart} onChange={e=>setPickStart(Math.max(1,Math.min(Number(e.target.value),rangeSurah.v)))}
                  style={{width:"100%",padding:"10px 12px",borderRadius:10,border:`1.5px solid ${T.cardBorder}`,background:dark?T.card:"#FFFDF0",fontSize:16,fontWeight:700,textAlign:"center",color:T.text,outline:"none",fontFamily:"'Outfit'"}}/>
              </div>
              <div style={{flex:1}}>
                <label style={{fontSize:11,fontWeight:600,color:T.textSub,marginBottom:4,display:"block"}}>Au verset</label>
                <input type="number" min={1} max={rangeSurah.v} value={pickEnd} onChange={e=>setPickEnd(Math.max(1,Math.min(Number(e.target.value),rangeSurah.v)))}
                  style={{width:"100%",padding:"10px 12px",borderRadius:10,border:`1.5px solid ${T.cardBorder}`,background:dark?T.card:"#FFFDF0",fontSize:16,fontWeight:700,textAlign:"center",color:T.text,outline:"none",fontFamily:"'Outfit'"}}/>
              </div>
            </div>

            <div style={{fontSize:11,color:T.textMuted,textAlign:"center",marginBottom:14}}>
              {Math.max(0, pickEnd - pickStart + 1)} versets sélectionnés
            </div>

            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>setRangeSurah(null)} style={{flex:1,padding:"12px",borderRadius:12,border:`1.5px solid ${T.cardBorder}`,background:"transparent",color:T.textSub,fontWeight:600,fontSize:13,cursor:"pointer",fontFamily:"'Outfit'"}}>Annuler</button>
              <button onClick={launchWithRange} style={{flex:2,padding:"12px",borderRadius:12,border:"none",background:"linear-gradient(135deg,#1E8C52,#145533)",color:"#F5E6B8",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"'Outfit'",boxShadow:"0 4px 14px #14553320"}}>
                Commencer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // ====== MUSHAF ======
  const JUZ_PAGES = [1,1,22,42,62,82,102,121,142,161,177,197,222,236,249,262,274,282,293,305,312,322,332,342,350,359,367,377,385,396,404,411,419,428,434,440,446,453,458,467,477,483,489,496,502,507,511,515,518,520,523,526,528,531,534,537,542,545,549,553,554,556,558,560,562,564,566,568,570,572,574,575,577,578,580,582,583,585,587,589,591,593,594,596,597,599,600,601,602,603,604];

  const searchMushaf = async (query) => {
    if (!query || query.trim().length < 2) { setMushafSearchResults(null); return; }
    try {
      const res = await fetch(`${API}/search?q=${encodeURIComponent(query.trim())}&size=10&language=ar`);
      const data = await res.json();
      const results = (data.search?.results || []).map(r => ({
        verseKey: r.verse_key,
        text: (r.text || "").replace(/<[^>]+>/g, ""),
        surahId: parseInt(r.verse_key?.split(":")[0]) || 0,
        verseNum: parseInt(r.verse_key?.split(":")[1]) || 0,
      }));
      setMushafSearchResults(results);
    } catch { setMushafSearchResults([]); }
  };

  const getPageForVerse = async (surahId, verseNum) => {
    try {
      const res = await fetch(`${API}/verses/by_key/${surahId}:${verseNum}?fields=page_number`);
      const data = await res.json();
      return data.verse?.page_number || null;
    } catch { return null; }
  };

  const renderMushaf = () => {
    // Group verses by surah for display
    const surahGroups = [];
    let currentSurah = null;
    for (const v of mushafVerses) {
      if (!currentSurah || currentSurah.id !== v.surahId) {
        const meta = ALL_SURAHS.find(s => s.id === v.surahId);
        currentSurah = { id: v.surahId, ar: meta?.ar || "", en: meta?.en || "", verses: [] };
        surahGroups.push(currentSurah);
      }
      currentSurah.verses.push(v);
    }

    const goPage = (p) => { if (p >= 1 && p <= 604) { loadMushafPageByNum(p); window.scrollTo({top:0,behavior:"smooth"}); } };
    const isBookmarked = mushafBookmarks.includes(mushafPageNum);

    // Swipe handlers
    const onTouchStart = (e) => {
      mushafTouchRef.current = { startX: e.touches[0].clientX, startY: e.touches[0].clientY };
    };
    const onTouchEnd = (e) => {
      const dx = e.changedTouches[0].clientX - mushafTouchRef.current.startX;
      const dy = e.changedTouches[0].clientY - mushafTouchRef.current.startY;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        // Arabic reading: swipe left = next page, swipe right = previous page
        if (dx < 0 && mushafPageNum < 604) goPage(mushafPageNum + 1);
        if (dx > 0 && mushafPageNum > 1) goPage(mushafPageNum - 1);
      }
    };

    return (
      <div style={{minHeight:"100vh",background:dark?"#1A1A2E":"#EDE3C4",paddingBottom:16}}
        onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <div style={{maxWidth:480,margin:"0 auto",padding:"6px 4px 0"}}>
          {/* Header */}
          <div style={{display:"flex",alignItems:"center",gap:8,padding:"4px 10px 6px"}}>
            <button style={{...S.bk,...(dark?{background:T.card,borderColor:T.cardBorder,color:T.text}:{})}} onClick={()=>setScreen("home")}>‹</button>
            <span style={{fontSize:14,fontWeight:700,color:dark?T.text:"#2C2416"}}>Mushaf Tajweed</span>
            <button onClick={()=>toggleBookmark(mushafPageNum)} style={{marginLeft:"auto",background:"none",border:"none",fontSize:18,cursor:"pointer",padding:4}}>
              {isBookmarked ? "🔖" : "🏷️"}
            </button>
            <span style={{fontSize:11,color:dark?T.textMuted:"#8B7D3C80",fontWeight:600}}>p.{mushafPageNum}</span>
          </div>

          {/* Search bar */}
          <div style={{display:"flex",alignItems:"center",gap:4,padding:"0 10px 6px"}}>
            <input type="text" value={mushafSearch} onChange={e=>setMushafSearch(e.target.value)}
              placeholder="🔍 Rechercher un mot arabe..."
              onKeyDown={e=>{if(e.key==="Enter") searchMushaf(mushafSearch);}}
              style={{flex:1,padding:"8px 10px",borderRadius:10,border:`1.5px solid ${T.cardBorder}`,background:T.card,fontSize:12,color:T.text,outline:"none",fontFamily:"'Amiri','Outfit',serif",direction:"rtl"}}/>
            {mushafSearch && <button onClick={()=>{setMushafSearch("");setMushafSearchResults(null);}} style={{background:"none",border:"none",fontSize:14,cursor:"pointer",color:T.textMuted}}>✕</button>}
            <button onClick={()=>searchMushaf(mushafSearch)}
              style={{padding:"8px 12px",borderRadius:10,border:"none",background:T.accent,color:"#F5E6B8",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"'Outfit'"}}>بحث</button>
          </div>

          {/* Search results dropdown */}
          {mushafSearchResults !== null && (
            <div style={{padding:"0 10px 8px"}}>
              {mushafSearchResults.length === 0 ? (
                <div style={{background:T.card,border:`1px solid ${T.cardBorder}`,borderRadius:10,padding:"10px 12px",fontSize:11,color:T.textMuted,textAlign:"center"}}>Aucun résultat</div>
              ) : (
                <div style={{background:T.card,border:`1px solid ${T.cardBorder}`,borderRadius:10,overflow:"hidden",maxHeight:200,overflowY:"auto"}}>
                  {mushafSearchResults.map((r, ri) => {
                    const meta = ALL_SURAHS.find(s => s.id === r.surahId);
                    return (
                      <div key={ri} style={{padding:"8px 12px",borderBottom:ri<mushafSearchResults.length-1?`1px solid ${T.cardBorder}`:"none",cursor:"pointer",fontSize:11}}
                        onClick={async()=>{
                          const pg = await getPageForVerse(r.surahId, r.verseNum);
                          if(pg) goPage(pg);
                          setMushafSearchResults(null); setMushafSearch("");
                        }}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:2}}>
                          <span style={{fontWeight:700,color:T.accent,fontSize:10}}>{meta?.ar || ""} ({r.verseKey})</span>
                          <span style={{fontSize:9,color:T.textMuted}}>→ aller</span>
                        </div>
                        <div style={{fontFamily:"'Amiri',serif",fontSize:14,color:T.text,direction:"rtl",lineHeight:1.8,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.text}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Bookmarks bar (if any) */}
          {mushafBookmarks.length > 0 && (
            <div style={{display:"flex",gap:4,overflowX:"auto",padding:"0 10px 6px",scrollbarWidth:"none"}}>
              <span style={{fontSize:9,color:T.textMuted,fontWeight:700,flexShrink:0,display:"flex",alignItems:"center"}}>🔖</span>
              {mushafBookmarks.map(b=>(
                <button key={b} onClick={()=>goPage(b)} style={{padding:"3px 8px",borderRadius:6,fontSize:9,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap",flexShrink:0,
                  background:mushafPageNum===b?T.gold:T.card,color:mushafPageNum===b?"#2C2416":T.text,
                  border:`1px solid ${mushafPageNum===b?T.gold:T.cardBorder}`,fontFamily:"'Outfit'"}}>p.{b}</button>
              ))}
            </div>
          )}

          {/* Top navigation */}
          <div style={{display:"flex",alignItems:"center",gap:6,padding:"0 10px 8px"}}>
            <button disabled={mushafPageNum<=1} onClick={()=>goPage(mushafPageNum-1)}
              style={{padding:"7px 14px",borderRadius:10,border:`1.5px solid ${T.cardBorder}`,background:T.card,color:T.text,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"'Outfit'"}}>‹</button>
            <div style={{flex:1,display:"flex",alignItems:"center",gap:4}}>
              <input type="number" min={1} max={604} value={mushafGoTo} onChange={e=>setMushafGoTo(e.target.value)}
                placeholder={String(mushafPageNum)}
                onKeyDown={e=>{if(e.key==="Enter"){const n=parseInt(mushafGoTo);if(n>=1&&n<=604){goPage(n);setMushafGoTo("");}}} }
                style={{flex:1,padding:"7px 8px",borderRadius:10,border:`1.5px solid ${T.cardBorder}`,background:T.card,fontSize:13,fontWeight:700,textAlign:"center",color:T.text,outline:"none",fontFamily:"'Outfit'",minWidth:0}}/>
              <button onClick={()=>{const n=parseInt(mushafGoTo);if(n>=1&&n<=604){goPage(n);setMushafGoTo("");}}}
                style={{padding:"7px 12px",borderRadius:10,border:"none",background:T.accent,color:"#F5E6B8",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"'Outfit'"}}>Aller</button>
            </div>
            <button disabled={mushafPageNum>=604} onClick={()=>goPage(mushafPageNum+1)}
              style={{padding:"7px 14px",borderRadius:10,border:`1.5px solid ${T.cardBorder}`,background:T.card,color:T.text,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"'Outfit'"}}>›</button>
          </div>

          {/* Juz quick jump */}
          <div style={{display:"flex",gap:4,overflowX:"auto",padding:"0 10px 8px",scrollbarWidth:"none"}}>
            {[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30].map(j=>{
              const start = JUZ_PAGES[j-1] || 1;
              const end = (JUZ_PAGES[j] || 605) - 1;
              const active = mushafPageNum >= start && mushafPageNum <= end;
              return (
                <button key={j} onClick={()=>goPage(start)} style={{padding:"4px 8px",borderRadius:6,fontSize:9,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap",flexShrink:0,
                  background:active?T.accent:T.card,color:active?"#F5E6B8":T.text,
                  border:`1px solid ${active?T.accent:T.cardBorder}`,fontFamily:"'Outfit'"}}>{j}</button>
              );
            })}
          </div>
        </div>

        {mushafLoading ? (
          <div style={{textAlign:"center",padding:60}}>
            <div style={{display:"inline-flex",gap:4}}>
              {[0,1,2].map(i=><div key={i} style={{width:8,height:8,borderRadius:"50%",background:"#1E8C52",animation:`pulse 1s ${i*.15}s infinite`}}/>)}
            </div>
            <div style={{fontSize:13,color:dark?T.textMuted:"#8B7D3C",marginTop:10}}>Chargement de la page {mushafPageNum}...</div>
          </div>
        ) : mushafVerses.length > 0 ? (
          <MushafFrame dark={dark}>
            {surahGroups.map((sg, gi) => (
              <div key={`${sg.id}-${gi}`}>
                {sg.verses[0].verseNum === 1 && (
                  <>
                    <SurahBanner name={sg.ar} />
                    {sg.id !== 1 && sg.id !== 9 && (
                      <div style={{textAlign:"center",fontSize:22,fontFamily:"'Amiri',serif",color:dark?"#E8E0D0":"#2C2416",lineHeight:2.4,margin:"6px 0 8px"}}>
                        بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
                      </div>
                    )}
                  </>
                )}
                {sg.verses[0].verseNum !== 1 && gi === 0 && (
                  <div style={{textAlign:"center",fontSize:11,color:dark?T.textMuted:"#8B7D3C80",fontFamily:"'Outfit'",padding:"4px 0 2px"}}>
                    تتمة سورة {sg.ar} — v.{sg.verses[0].verseNum}
                  </div>
                )}
                <div style={{direction:"rtl",textAlign:"justify",lineHeight:3.2,padding:"0 4px 4px",wordSpacing:3}}>
                  {sg.verses.map((v, vi) => {
                    const isMem = progress[`${v.surahId}:${v.verseNum - 1}`]?.m;
                    return (
                      <span key={vi}>
                        <TajweedVerse segments={v.segments} isMem={isMem} dk={dark} />
                        {" "}<AyahMarker n={v.verseNum} />{" "}
                      </span>
                    );
                  })}
                </div>
                {gi < surahGroups.length - 1 && <div style={{borderBottom:`1.5px solid ${dark?"#2A3A5C40":"#D4A01730"}`,margin:"2px 16px 4px"}} />}
              </div>
            ))}
            <div style={{display:"flex",flexWrap:"wrap",gap:6,justifyContent:"center",padding:"6px 4px 2px",borderTop:`1px solid ${dark?"#2A3A5C40":"#D4A01730"}`,marginTop:6}}>
              {LEGEND.map(r=>(
                <div key={r.c} style={{display:"flex",alignItems:"center",gap:3}}>
                  <div style={{width:7,height:7,borderRadius:2,background:r.c}}/>
                  <span style={{fontSize:8,color:dark?T.textMuted:"#6B5C2A"}}>{r.ar}</span>
                </div>
              ))}
            </div>
          </MushafFrame>
        ) : (
          <div style={{textAlign:"center",padding:40,color:dark?T.textMuted:"#8B7D3C"}}>Erreur de chargement. Vérifie ta connexion.</div>
        )}

        {/* Swipe hint */}
        <div style={{textAlign:"center",fontSize:9,color:T.textMuted,padding:"6px 0 2px"}}>← Glisse pour changer de page →</div>

        {/* Bottom page navigation */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:12,padding:"6px 10px 8px"}}>
          <button disabled={mushafPageNum<=1} onClick={()=>goPage(mushafPageNum-1)}
            style={{padding:"10px 20px",borderRadius:12,border:`1.5px solid ${T.cardBorder}`,background:T.card,color:mushafPageNum<=1?T.textMuted:T.text,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"'Outfit'"}}>‹ Précédent</button>
          <span style={{fontSize:12,fontWeight:700,color:T.textSub}}>{mushafPageNum} / 604</span>
          <button disabled={mushafPageNum>=604} onClick={()=>goPage(mushafPageNum+1)}
            style={{padding:"10px 20px",borderRadius:12,border:`1.5px solid ${T.cardBorder}`,background:T.card,color:mushafPageNum>=604?T.textMuted:T.text,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"'Outfit'"}}>Suivant ›</button>
        </div>

        {/* Quick surah jumps */}
        <div style={{display:"flex",gap:4,justifyContent:"center",flexWrap:"wrap",padding:"0 10px 8px"}}>
          {[{l:"الفاتحة",p:1},{l:"البقرة",p:2},{l:"الكهف",p:293},{l:"يس",p:440},{l:"الرحمن",p:531},{l:"الملك",p:562},{l:"النبأ",p:582},{l:"الناس",p:604}].map(q=>(
            <button key={q.p} onClick={()=>goPage(q.p)} style={{
              padding:"5px 10px",borderRadius:8,fontSize:11,fontWeight:600,cursor:"pointer",
              fontFamily:"'Amiri',serif",
              background:mushafPageNum===q.p?T.accent:T.card,color:mushafPageNum===q.p?"#F5E6B8":T.text,
              border:`1px solid ${mushafPageNum===q.p?T.accent:T.cardBorder}`,
            }}>{q.l}</button>
          ))}
        </div>
      </div>
    );
  };

  // ====== STUDY ======
  const renderStudy = () => {
    if(!learnSurah) return null;
    const v = learnSurah.verses[curV]; if(!v) return null;
    const hidden = phase === "hidden";
    const vv = learnSurah.verses;
    const curRep = phase === "visible" ? repVisible : repHidden;
    const offset = learnSurah.rangeOffset || 0;
    const verseKey = `${learnSurah.id}:${curV + 1 + offset}`;
    const trans = translations[learnSurah.id]?.[verseKey] || null;
    const translit = transliterations[learnSurah.id]?.[verseKey] || null;

    return (
      <div style={{maxWidth:460,margin:"0 auto",padding:"12px 16px",minHeight:"100vh",background:dark?T.bg:"#F5ECD0"}}>
        {/* Header */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
          <button style={{...S.bk,...(dark?{background:T.card,borderColor:T.cardBorder,color:T.text}:{})}} onClick={()=>setScreen("learn-list")}>‹</button>
          <span style={{fontSize:13,color:dark?T.textSub:"#6B5C2A",fontWeight:600,fontFamily:"'Amiri',serif"}}>سورة {learnSurah.ar}</span>
          <span style={{fontSize:11,color:T.textMuted,fontWeight:600}}>{curV+1}/{vv.length}</span>
        </div>

        {/* Progress bar */}
        <div style={{height:4,background:dark?"#2A3A5C":"#E0D5BF",borderRadius:3,marginBottom:14,overflow:"hidden"}}>
          <div style={{height:"100%",width:`${((curV + (phase==="hidden"?.7:phase==="visible"?.3:0))/vv.length)*100}%`,background:"linear-gradient(90deg,#1E8C52,#2ECC71)",borderRadius:3,transition:"width 0.6s ease"}}/>
        </div>

        {/* Phase indicators */}
        <div style={{display:"flex",justifyContent:"center",gap:0,marginBottom:16}}>
          {[
            {k:"listen",i:"🎧",l:"Écoute"},
            {k:"visible",i:"📖",l:`Visible (${repVisible}×)`},
            {k:"hidden",i:"🧠",l:`Caché (${repHidden}×)`}
          ].map((s,idx)=>{
            const active = phase===s.k;
            const past = (idx===0&&phase!=="listen")||(idx===1&&phase==="hidden");
            return(
              <div key={s.k} style={{display:"flex",alignItems:"center"}}>
                {idx>0&&<div style={{width:16,height:2,borderRadius:1,background:(active||past)?T.accent:(dark?"#2A3A5C60":"#D4C08060")}}/>}
                <div style={{fontSize:10,fontWeight:700,padding:"5px 8px",borderRadius:8,background:active?`${T.accent}20`:past?`${T.accent}08`:"transparent",color:active?T.accent:past?`${T.accent}80`:T.textMuted,display:"flex",alignItems:"center",gap:3}}>
                  <span>{past?"✓":s.i}</span>{s.l}
                </div>
              </div>
            );
          })}
        </div>

        {/* Verse card */}
        <div style={{background:dark?T.card:"#FFFDF0",border:`2.5px solid ${dark?T.cardBorder:"#C5A028"}`,borderRadius:10,padding:"28px 16px 20px",textAlign:"center",position:"relative",minHeight:140,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",boxShadow:dark?"none":`inset 0 0 0 4px #FFFDF0,inset 0 0 0 5px #D4A01730`,animation:anim==="fadeIn"?"fadeIn 0.4s":anim==="out"?"slideOut 0.3s":"none"}}>
          <div style={{marginBottom:8}}><AyahMarker n={curV+1+offset}/></div>
          <div style={{
            fontSize:v.plain.length>100?20:v.plain.length>60?24:v.plain.length>30?30:36,
            fontFamily:"'Amiri',serif",lineHeight:2.6,color:T.text,direction:"rtl",transition:"all 0.5s",
            ...(hidden?{filter:"blur(22px)",userSelect:"none"}:{}),
          }}>
            {hidden ? v.plain : <TajweedVerse segments={v.segments} isMem={false}/>}
          </div>

          {/* Transliteration */}
          {showTranslit && translit && !hidden && (
            <div style={{fontSize:13,color:dark?"#8899AA":"#6B5C2A",marginTop:8,fontStyle:"italic",lineHeight:1.8,direction:"ltr"}}>{translit}</div>
          )}

          {/* Translation */}
          {showTranslation && trans && (
            <div style={{fontSize:12,color:T.textSub,marginTop:8,lineHeight:1.6,direction:"ltr",padding:"8px 4px",borderTop:`1px solid ${dark?"#2A3A5C40":"#E0D5BF40"}`}}>{trans}</div>
          )}

          {/* Repetition dots */}
          {phase!=="listen"&&(
            <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:5,marginTop:16}}>
              {Array.from({length:curRep}).map((_,i)=>(
                <div key={i} style={{width:10,height:10,borderRadius:"50%",background:i<reps?T.accent:"transparent",border:`2px solid ${i<reps?T.accent:(dark?"#2A3A5C60":"#C5A02860")}`,boxShadow:i<reps?`0 0 6px ${T.accent}40`:"none",transition:"all 0.3s"}}/>
              ))}
              <span style={{fontSize:10,color:T.textMuted,marginLeft:5}}>{reps}/{curRep}</span>
            </div>
          )}

          {/* Celebration overlay */}
          {showCelebration && (
            <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:dark?"#1F2940E8":"#FFFDF0E8",borderRadius:8,animation:"fadeIn 0.3s",zIndex:5}}>
              <div style={{fontSize:48,animation:"pulse 0.6s infinite"}}>✅</div>
              <div style={{fontSize:16,fontWeight:700,color:T.accent,marginTop:6}}>أحسنت!</div>
              <div style={{fontSize:12,color:T.textSub}}>Verset mémorisé</div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:10,marginTop:16}}>
          {phase==="listen"&&(
            <button style={S.gBtn} onClick={playAndAdvance} disabled={playing}>
              {playing ? (
                <div style={{display:"flex",gap:3,height:18,alignItems:"flex-end"}}>
                  {[1,2,3,4,5].map(i=><div key={i} style={{width:3,background:"#F5E6B8",borderRadius:2,animation:`wave 0.6s ${i*.1}s ease-in-out infinite`}}/>)}
                </div>
              ) : <>▶ Écouter {reciter.ar}</>}
            </button>
          )}

          {(phase==="visible"||phase==="hidden")&&(
            <>
              <button style={{...S.rBtn,...(isRec?S.rOn:{})}}
                onMouseDown={recStart} onMouseUp={recStop}
                onTouchStart={e=>{e.preventDefault();recStart();}} onTouchEnd={recStop}>
                <div style={{width:14,height:14,borderRadius:"50%",background:isRec?"#E74C3C":"#C0392B",...(isRec?{animation:"pulse 0.8s infinite"}:{})}}/>
                <span style={{fontSize:13,color:T.text}}>{isRec?"Relâche pour valider...":"Maintiens pour réciter"}</span>
                <span style={{fontSize:11,color:T.textMuted,marginLeft:4}}>{reps}/{curRep}</span>
              </button>

              <div style={{display:"flex",gap:12,alignItems:"center"}}>
                <button style={{background:"none",border:"none",color:T.textMuted,fontSize:11,cursor:"pointer"}} onClick={replayAudio}>
                  {playing?"⏸":"🔊"} Réécouter
                </button>
                <button style={{background:"none",border:"none",color:T.textMuted,fontSize:11,cursor:"pointer"}} onClick={skipPhase}>
                  ⏭ Passer
                </button>
              </div>
            </>
          )}
        </div>

        {/* Translation/Transliteration toggles */}
        <div style={{display:"flex",justifyContent:"center",gap:8,marginTop:14}}>
          <button onClick={()=>setShowTranslit(!showTranslit)} style={{
            padding:"5px 10px",borderRadius:8,fontSize:10,fontWeight:600,cursor:"pointer",
            background:showTranslit?`${T.accent}20`:"transparent",color:showTranslit?T.accent:T.textMuted,
            border:`1px solid ${showTranslit?T.accent:T.cardBorder}`,fontFamily:"'Outfit'"
          }}>
            ا Translittération
          </button>
          <button onClick={()=>setShowTranslation(!showTranslation)} style={{
            padding:"5px 10px",borderRadius:8,fontSize:10,fontWeight:600,cursor:"pointer",
            background:showTranslation?`${T.accent}20`:"transparent",color:showTranslation?T.accent:T.textMuted,
            border:`1px solid ${showTranslation?T.accent:T.cardBorder}`,fontFamily:"'Outfit'"
          }}>
            🇫🇷 Traduction
          </button>
        </div>

        {/* Bottom controls */}
        <div style={{display:"flex",justifyContent:"center",gap:16,marginTop:14,paddingTop:14,borderTop:`1px solid ${dark?"#2A3A5C40":"#E0D5BF40"}`}}>
          {/* Playback speed */}
          <div style={{display:"flex",alignItems:"center",gap:4}}>
            <span style={{fontSize:10,color:T.textMuted}}>Vitesse</span>
            {[0.7,1,1.25].map(r=>(
              <button key={r} onClick={()=>setPlaybackRate(r)} style={{
                padding:"3px 7px",borderRadius:6,fontSize:10,fontWeight:600,cursor:"pointer",
                background:playbackRate===r?T.accent:"transparent",color:playbackRate===r?"#F5E6B8":T.textMuted,
                border:`1px solid ${playbackRate===r?T.accent:T.cardBorder}`,fontFamily:"'Outfit'"
              }}>{r}×</button>
            ))}
          </div>

          {/* Auto-advance toggle */}
          <button onClick={()=>setAutoAdvance(!autoAdvance)} style={{
            padding:"3px 8px",borderRadius:6,fontSize:10,fontWeight:600,cursor:"pointer",
            background:autoAdvance?`${T.accent}20`:"transparent",color:autoAdvance?T.accent:T.textMuted,
            border:`1px solid ${autoAdvance?T.accent:T.cardBorder}`,fontFamily:"'Outfit'"
          }}>
            {autoAdvance?"⏩ Auto":"⏩ Auto"}
          </button>
        </div>
      </div>
    );
  };

  // ====== SURAH COMPLETE ======
  const renderComplete = () => (
    <div style={{minHeight:"100vh",background:dark?T.bg:"linear-gradient(170deg,#F5ECD0,#EDE3C4)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24,animation:"fadeIn 0.5s"}}>
      <div style={{fontSize:60,marginBottom:10}}>🎉</div>
      <div style={{fontSize:24,fontWeight:700,color:T.accent,marginBottom:6}}>ما شاء الله</div>
      <div style={{fontSize:18,fontFamily:"'Amiri',serif",color:T.text,marginBottom:4}}>
        سورة {learnSurah?.ar}
      </div>
      <div style={{fontSize:14,color:T.textSub,marginBottom:24}}>
        Sourate complétée ! {learnSurah?.verses?.length || learnSurah?.v} versets mémorisés
      </div>

      <div style={{display:"flex",gap:12,marginBottom:28}}>
        <div style={{background:T.card,border:`1.5px solid ${T.cardBorder}`,borderRadius:14,padding:"14px 20px",textAlign:"center"}}>
          <div style={{fontSize:22,fontWeight:700,color:T.accent}}>{totalMem}</div>
          <div style={{fontSize:10,color:T.textMuted}}>Total mémorisés</div>
        </div>
        <div style={{background:T.card,border:`1.5px solid ${T.cardBorder}`,borderRadius:14,padding:"14px 20px",textAlign:"center"}}>
          <div style={{fontSize:22,fontWeight:700,color:"#E67E22"}}>🔥 {todayCount}</div>
          <div style={{fontSize:10,color:T.textMuted}}>Aujourd'hui</div>
        </div>
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:10,width:"100%",maxWidth:280}}>
        <button style={S.btnG} onClick={()=>setScreen("learn-list")}>📋 Autre sourate</button>
        <button style={{...S.btnM,...(dark?{background:T.card,borderColor:T.cardBorder,color:T.text}:{})}} onClick={()=>setScreen("home")}>🏠 Accueil</button>
      </div>
    </div>
  );

  // ====== REVIEW PICK ======
  const [reviewSurah, setReviewSurah] = useState(null);
  const [reviewVerses, setReviewVerses] = useState([]);
  const [reviewIdx, setReviewIdx] = useState(0);
  const [reviewRevealed, setReviewRevealed] = useState(false);
  const [reviewScore, setReviewScore] = useState(0);
  const [reviewTotal, setReviewTotal] = useState(0);

  const launchReview = async (surah) => {
    const memVs = getMemVerses(surah.id, surah.v);
    if (memVs.length === 0) { alert("Aucun verset mémorisé dans cette sourate !"); return; }
    setLearnLoading(true);
    const verses = await fetchTajweed(surah.id);
    if (!verses) { alert("Erreur de chargement."); setLearnLoading(false); return; }
    // Shuffle memorized verses
    const shuffled = memVs.sort(() => Math.random() - 0.5).slice(0, Math.min(10, memVs.length));
    const rvs = shuffled.map(i => ({ ...verses[i], idx: i }));
    setReviewSurah(surah);
    setReviewVerses(rvs);
    setReviewIdx(0);
    setReviewRevealed(false);
    setReviewScore(0);
    setReviewTotal(rvs.length);
    // Fetch translation for review too
    fetchTranslation(surah.id).then(t => setTranslations(prev => ({...prev, [surah.id]: t})));
    setScreen("review");
    setLearnLoading(false);
  };

  const reviewNext = (knew) => {
    if (knew) setReviewScore(s => s + 1);
    if (reviewIdx < reviewVerses.length - 1) {
      setReviewIdx(i => i + 1);
      setReviewRevealed(false);
    } else {
      setScreen("review-done");
    }
  };

  const renderReviewPick = () => {
    const surahsWithMem = ALL_SURAHS.filter(s => memC(s.id, s.v) > 0);
    return (
      <div style={{maxWidth:460,margin:"0 auto",padding:"12px 16px",minHeight:"100vh",background:dark?T.bg:"#F5ECD0"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
          <button style={{...S.bk,...(dark?{background:T.card,borderColor:T.cardBorder,color:T.text}:{})}} onClick={()=>setScreen("home")}>‹</button>
          <div style={{fontSize:20,fontWeight:700,color:T.text,flex:1}}>📝 Réviser</div>
        </div>

        <div style={{background:T.card,border:`1px solid ${T.cardBorder}`,borderRadius:14,padding:"12px 14px",marginBottom:14}}>
          <div style={{fontSize:12,fontWeight:700,color:T.accent,marginBottom:4}}>🧠 Mode révision</div>
          <div style={{fontSize:11,color:T.text,lineHeight:1.7}}>
            Le verset s'affiche flouté. Essaie de le réciter de mémoire, puis révèle-le pour vérifier. Note toi-même !
          </div>
        </div>

        {learnLoading && <div style={{textAlign:"center",padding:40,color:T.textSub}}>Chargement...</div>}

        {surahsWithMem.length === 0 ? (
          <div style={{textAlign:"center",padding:40,color:T.textSub}}>
            <div style={{fontSize:40,marginBottom:10}}>📚</div>
            <div>Aucun verset mémorisé pour l'instant.</div>
            <div style={{fontSize:12,marginTop:4}}>Commence par apprendre quelques versets !</div>
          </div>
        ) : surahsWithMem.map(s => {
          const m = memC(s.id, s.v);
          return (
            <div key={s.id} style={{...S.card,background:T.card,borderColor:T.cardBorder}} onClick={() => launchReview(s)}>
              <div style={S.cardNum}><span style={{fontSize:14,fontWeight:700,color:"#F5E6B8"}}>{s.id}</span></div>
              <div style={{flex:1}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{fontSize:14,fontWeight:600,color:T.text}}>{s.en}</span>
                  <span style={{fontSize:18,fontFamily:"'Amiri',serif",color:T.text}}>{s.ar}</span>
                </div>
                <div style={{fontSize:10,color:T.textMuted,marginTop:3}}>{m} verset{m>1?"s":""} mémorisé{m>1?"s":""}</div>
              </div>
              <span style={{color:T.gold,fontSize:18}}>›</span>
            </div>
          );
        })}
      </div>
    );
  };

  // ====== REVIEW QUIZ ======
  const renderReview = () => {
    if (!reviewSurah || reviewVerses.length === 0) return null;
    const rv = reviewVerses[reviewIdx];
    if (!rv) return null;
    const verseKey = `${reviewSurah.id}:${rv.idx + 1}`;
    const trans = translations[reviewSurah.id]?.[verseKey] || null;

    return (
      <div style={{maxWidth:460,margin:"0 auto",padding:"12px 16px",minHeight:"100vh",background:dark?T.bg:"#F5ECD0"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <button style={{...S.bk,...(dark?{background:T.card,borderColor:T.cardBorder,color:T.text}:{})}} onClick={()=>setScreen("review-pick")}>‹</button>
          <span style={{fontSize:13,color:T.textSub,fontWeight:600,fontFamily:"'Amiri',serif"}}>سورة {reviewSurah.ar}</span>
          <span style={{fontSize:11,color:T.textMuted,fontWeight:600}}>{reviewIdx+1}/{reviewTotal}</span>
        </div>

        {/* Progress */}
        <div style={{height:4,background:dark?"#2A3A5C":"#E0D5BF",borderRadius:3,marginBottom:16,overflow:"hidden"}}>
          <div style={{height:"100%",width:`${((reviewIdx)/reviewTotal)*100}%`,background:"linear-gradient(90deg,#E67E22,#F39C12)",borderRadius:3,transition:"width 0.4s"}}/>
        </div>

        {/* Verse card */}
        <div style={{background:dark?T.card:"#FFFDF0",border:`2.5px solid ${dark?T.cardBorder:"#C5A028"}`,borderRadius:10,padding:"28px 16px 20px",textAlign:"center",position:"relative",minHeight:160,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",boxShadow:dark?"none":"inset 0 0 0 4px #FFFDF0,inset 0 0 0 5px #D4A01730"}}>
          <div style={{marginBottom:8}}><AyahMarker n={rv.idx+1}/></div>
          <div style={{
            fontSize:rv.plain.length>100?20:rv.plain.length>60?24:rv.plain.length>30?30:36,
            fontFamily:"'Amiri',serif",lineHeight:2.6,color:T.text,direction:"rtl",transition:"all 0.5s",
            ...(!reviewRevealed?{filter:"blur(22px)",userSelect:"none"}:{}),
          }}>
            {reviewRevealed ? <TajweedVerse segments={rv.segments} isMem={false}/> : rv.plain}
          </div>

          {reviewRevealed && showTranslation && trans && (
            <div style={{fontSize:12,color:T.textSub,marginTop:8,lineHeight:1.6,direction:"ltr",padding:"8px 4px",borderTop:`1px solid ${dark?"#2A3A5C40":"#E0D5BF40"}`}}>{trans}</div>
          )}
        </div>

        {/* Actions */}
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:10,marginTop:18}}>
          {!reviewRevealed ? (
            <>
              <div style={{fontSize:12,color:T.textSub,marginBottom:4}}>Essaie de réciter ce verset de mémoire...</div>
              <button style={S.gBtn} onClick={()=>setReviewRevealed(true)}>
                👁 Révéler le verset
              </button>
              <button style={{background:"none",border:"none",color:T.textMuted,fontSize:11,cursor:"pointer"}} onClick={()=>{
                const s=String(reviewSurah.id).padStart(3,"0"); const a=String(rv.idx+1).padStart(3,"0");
                const audio=new Audio(`${EVERYAYAH}/${reciter.path}/${s}${a}.mp3`);
                audio.playbackRate=playbackRate; audio.play().catch(()=>{});
              }}>
                🔊 Écouter un indice
              </button>
            </>
          ) : (
            <>
              <div style={{fontSize:12,color:T.textSub,marginBottom:4}}>Tu connaissais ce verset ?</div>
              <div style={{display:"flex",gap:12}}>
                <button onClick={()=>reviewNext(false)} style={{padding:"12px 24px",borderRadius:12,border:`2px solid #E74C3C`,background:dark?"#E74C3C15":"#FDF2F2",color:"#E74C3C",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"'Outfit'"}}>
                  ✘ Pas sûr
                </button>
                <button onClick={()=>reviewNext(true)} style={{padding:"12px 24px",borderRadius:12,border:"none",background:"linear-gradient(135deg,#1E8C52,#145533)",color:"#F5E6B8",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"'Outfit'",boxShadow:"0 4px 14px #14553320"}}>
                  ✔ Je savais
                </button>
              </div>
            </>
          )}
        </div>

        {/* Score */}
        <div style={{textAlign:"center",marginTop:16,fontSize:11,color:T.textMuted}}>
          Score: {reviewScore}/{reviewIdx + (reviewRevealed?1:0)}
        </div>
      </div>
    );
  };

  // ====== REVIEW DONE ======
  const renderReviewDone = () => {
    const pct = reviewTotal > 0 ? Math.round((reviewScore / reviewTotal) * 100) : 0;
    return (
      <div style={{minHeight:"100vh",background:dark?T.bg:"linear-gradient(170deg,#F5ECD0,#EDE3C4)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24,animation:"fadeIn 0.5s"}}>
        <div style={{fontSize:60,marginBottom:10}}>{pct>=80?"🌟":pct>=50?"💪":"📚"}</div>
        <div style={{fontSize:24,fontWeight:700,color:T.accent,marginBottom:6}}>
          {pct>=80?"ممتاز!":pct>=50?"جيد!":"واصل!"}
        </div>
        <div style={{fontSize:18,fontFamily:"'Amiri',serif",color:T.text,marginBottom:4}}>
          سورة {reviewSurah?.ar}
        </div>
        <div style={{fontSize:14,color:T.textSub,marginBottom:24}}>
          Score: {reviewScore}/{reviewTotal} ({pct}%)
        </div>

        <div style={{display:"flex",gap:12,marginBottom:28}}>
          <div style={{background:T.card,border:`1.5px solid ${T.cardBorder}`,borderRadius:14,padding:"14px 20px",textAlign:"center"}}>
            <div style={{fontSize:22,fontWeight:700,color:T.accent}}>{reviewScore}</div>
            <div style={{fontSize:10,color:T.textMuted}}>Corrects</div>
          </div>
          <div style={{background:T.card,border:`1.5px solid ${T.cardBorder}`,borderRadius:14,padding:"14px 20px",textAlign:"center"}}>
            <div style={{fontSize:22,fontWeight:700,color:"#E74C3C"}}>{reviewTotal - reviewScore}</div>
            <div style={{fontSize:10,color:T.textMuted}}>À revoir</div>
          </div>
          <div style={{background:T.card,border:`1.5px solid ${T.cardBorder}`,borderRadius:14,padding:"14px 20px",textAlign:"center"}}>
            <div style={{fontSize:22,fontWeight:700,color:"#E67E22"}}>{pct}%</div>
            <div style={{fontSize:10,color:T.textMuted}}>Score</div>
          </div>
        </div>

        <div style={{display:"flex",flexDirection:"column",gap:10,width:"100%",maxWidth:280}}>
          <button style={S.btnG} onClick={()=>launchReview(reviewSurah)}>🔁 Recommencer</button>
          <button style={{...S.btnM,...(dark?{background:T.card,borderColor:T.cardBorder,color:T.text}:{})}} onClick={()=>setScreen("review-pick")}>📋 Autre sourate</button>
          <button style={{background:"none",border:`1.5px dashed ${T.cardBorder}`,borderRadius:12,padding:"10px 20px",color:T.textSub,fontSize:12,fontWeight:600,cursor:"pointer"}} onClick={()=>setScreen("home")}>🏠 Accueil</button>
        </div>
      </div>
    );
  };

  // ====== STATS ======
  const renderStats = () => {
    const juzStats = {};
    for (let j = 1; j <= 30; j++) {
      const surahs = ALL_SURAHS.filter(s => s.juz === j);
      const totalV = surahs.reduce((a, s) => a + s.v, 0);
      const memV = surahs.reduce((a, s) => a + memC(s.id, s.v), 0);
      juzStats[j] = { surahs: surahs.length, totalV, memV, pct: totalV > 0 ? Math.round((memV / totalV) * 100) : 0 };
    }
    const totalAllV = ALL_SURAHS.reduce((a, s) => a + s.v, 0);
    const globalPct = totalAllV > 0 ? Math.round((totalMem / totalAllV) * 100) : 0;

    const exportData = () => {
      const data = { progress, favorites, streak, todayCount, date: new Date().toISOString() };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = "hifdhi-backup.json"; a.click();
      URL.revokeObjectURL(url);
    };

    const importData = () => {
      const input = document.createElement("input"); input.type = "file"; input.accept = ".json";
      input.onchange = (e) => {
        const file = e.target.files[0]; if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
          try {
            const data = JSON.parse(ev.target.result);
            if (data.progress) { setProgress(data.progress); localStorage.setItem("hifdhi_progress", JSON.stringify(data.progress)); }
            if (data.favorites) { setFavorites(data.favorites); localStorage.setItem("hifdhi_favs", JSON.stringify(data.favorites)); }
            alert("Données importées avec succès !");
          } catch { alert("Fichier invalide."); }
        };
        reader.readAsText(file);
      };
      input.click();
    };

    return (
      <div style={{maxWidth:460,margin:"0 auto",padding:"12px 16px",minHeight:"100vh",background:dark?T.bg:"#F5ECD0"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
          <button style={{...S.bk,...(dark?{background:T.card,borderColor:T.cardBorder,color:T.text}:{})}} onClick={()=>setScreen("home")}>‹</button>
          <div style={{fontSize:20,fontWeight:700,color:T.text,flex:1}}>📊 Statistiques</div>
        </div>

        {/* Global stats */}
        <div style={{background:T.card,border:`1.5px solid ${T.cardBorder}`,borderRadius:16,padding:"18px 16px",marginBottom:14,textAlign:"center"}}>
          <div style={{fontSize:36,fontWeight:700,color:T.accent}}>{totalMem}</div>
          <div style={{fontSize:12,color:T.textSub,marginBottom:10}}>versets mémorisés sur {totalAllV}</div>
          <div style={{height:8,background:dark?"#2A3A5C":"#E0D5BF",borderRadius:4,overflow:"hidden",marginBottom:6}}>
            <div style={{height:"100%",width:`${globalPct}%`,background:"linear-gradient(90deg,#1E8C52,#2ECC71)",borderRadius:4,transition:"width 0.6s"}}/>
          </div>
          <div style={{fontSize:11,color:T.textMuted}}>{globalPct}% du Coran</div>
        </div>

        {/* Daily stats */}
        <div style={{display:"flex",gap:10,marginBottom:14}}>
          <div style={{flex:1,background:T.card,border:`1.5px solid ${T.cardBorder}`,borderRadius:14,padding:"14px",textAlign:"center"}}>
            <div style={{fontSize:24,fontWeight:700,color:"#E67E22"}}>🔥 {streak}</div>
            <div style={{fontSize:10,color:T.textMuted}}>Jours consécutifs</div>
          </div>
          <div style={{flex:1,background:T.card,border:`1.5px solid ${T.cardBorder}`,borderRadius:14,padding:"14px",textAlign:"center"}}>
            <div style={{fontSize:24,fontWeight:700,color:"#1980C4"}}>{todayCount}</div>
            <div style={{fontSize:10,color:T.textMuted}}>Aujourd'hui</div>
          </div>
          <div style={{flex:1,background:T.card,border:`1.5px solid ${T.cardBorder}`,borderRadius:14,padding:"14px",textAlign:"center"}}>
            <div style={{fontSize:24,fontWeight:700,color:T.accent}}>{favorites.length}</div>
            <div style={{fontSize:10,color:T.textMuted}}>Favoris</div>
          </div>
        </div>

        {/* Per-Juz breakdown */}
        <div style={{fontSize:13,fontWeight:700,color:T.textSub,marginBottom:8}}>Progression par Juz</div>
        <div style={{display:"flex",flexDirection:"column",gap:4,marginBottom:16}}>
          {Object.entries(juzStats).map(([j, st]) => (
            <div key={j} style={{background:T.card,border:`1px solid ${T.cardBorder}`,borderRadius:10,padding:"8px 12px",display:"flex",alignItems:"center",gap:10}}>
              <div style={{fontSize:11,fontWeight:700,color:T.accent,minWidth:42}}>Juz {j}</div>
              <div style={{flex:1,height:6,background:dark?"#2A3A5C":"#E0D5BF",borderRadius:3,overflow:"hidden"}}>
                <div style={{height:"100%",width:`${st.pct}%`,background:st.pct===100?"#2ECC71":st.pct>0?T.accent:"transparent",borderRadius:3,transition:"width 0.4s"}}/>
              </div>
              <div style={{fontSize:10,fontWeight:600,color:st.pct===100?"#2ECC71":T.textMuted,minWidth:36,textAlign:"right"}}>{st.memV}/{st.totalV}</div>
              <div style={{fontSize:9,fontWeight:700,color:st.pct===100?"#2ECC71":T.textMuted,minWidth:28,textAlign:"right"}}>{st.pct}%</div>
            </div>
          ))}
        </div>

        {/* Export / Import */}
        <div style={{fontSize:13,fontWeight:700,color:T.textSub,marginBottom:8}}>💾 Sauvegarde</div>
        <div style={{display:"flex",gap:8,marginBottom:16}}>
          <button onClick={exportData} style={{flex:1,padding:"12px",borderRadius:12,border:`1.5px solid ${T.cardBorder}`,background:T.card,color:T.text,fontWeight:600,fontSize:12,cursor:"pointer",fontFamily:"'Outfit'"}}>
            📤 Exporter
          </button>
          <button onClick={importData} style={{flex:1,padding:"12px",borderRadius:12,border:`1.5px solid ${T.cardBorder}`,background:T.card,color:T.text,fontWeight:600,fontSize:12,cursor:"pointer",fontFamily:"'Outfit'"}}>
            📥 Importer
          </button>
        </div>
      </div>
    );
  };

  // ====== LISTEN PICK ======
  const renderListenPick = () => (
    <div style={{maxWidth:460,margin:"0 auto",padding:"12px 16px",minHeight:"100vh",background:dark?T.bg:"#F5ECD0"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
        <button style={{...S.bk,...(dark?{background:T.card,borderColor:T.cardBorder,color:T.text}:{})}} onClick={()=>setScreen("home")}>‹</button>
        <div style={{fontSize:20,fontWeight:700,color:T.text,flex:1}}>🎧 Écouter</div>
      </div>

      <div style={{background:T.card,border:`1px solid ${T.cardBorder}`,borderRadius:14,padding:"12px 14px",marginBottom:14}}>
        <div style={{fontSize:12,fontWeight:700,color:T.accent,marginBottom:4}}>🎵 Mode écoute continue</div>
        <div style={{fontSize:11,color:T.text,lineHeight:1.7}}>
          Écoute toute la sourate en continu avec {reciter.ar}. Idéal pour la révision passive et la mémorisation par l'écoute.
        </div>
      </div>

      {learnLoading && <div style={{textAlign:"center",padding:40,color:T.textSub}}>Chargement...</div>}

      {ALL_SURAHS.map(s => (
        <div key={s.id} style={{...S.card,background:T.card,borderColor:T.cardBorder}} onClick={() => startListenMode(s)}>
          <div style={S.cardNum}><span style={{fontSize:14,fontWeight:700,color:"#F5E6B8"}}>{s.id}</span></div>
          <div style={{flex:1}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontSize:14,fontWeight:600,color:T.text}}>{s.en}</span>
              <span style={{fontSize:18,fontFamily:"'Amiri',serif",color:T.text}}>{s.ar}</span>
            </div>
            <div style={{fontSize:10,color:T.textMuted,marginTop:3}}>{s.v} versets · Juz {s.juz}</div>
          </div>
          <span style={{color:T.accent,fontSize:16}}>▶</span>
        </div>
      ))}
    </div>
  );

  // ====== LISTEN PLAYER ======
  const renderListen = () => {
    if (!listenSurah) return null;
    const v = listenSurah.verses[listenIdx];
    const pct = listenSurah.verses.length > 0 ? Math.round(((listenIdx + 1) / listenSurah.verses.length) * 100) : 0;

    return (
      <div style={{maxWidth:460,margin:"0 auto",padding:"12px 16px",minHeight:"100vh",background:dark?T.bg:"#F5ECD0",display:"flex",flexDirection:"column"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <button style={{...S.bk,...(dark?{background:T.card,borderColor:T.cardBorder,color:T.text}:{})}} onClick={()=>{pauseListenMode();setScreen("listen-pick");}}>‹</button>
          <span style={{fontSize:13,color:T.textSub,fontWeight:600,fontFamily:"'Amiri',serif"}}>سورة {listenSurah.ar}</span>
          <span style={{fontSize:11,color:T.textMuted,fontWeight:600}}>{listenIdx+1}/{listenSurah.verses.length}</span>
        </div>

        {/* Progress */}
        <div style={{height:4,background:dark?"#2A3A5C":"#E0D5BF",borderRadius:3,marginBottom:16,overflow:"hidden"}}>
          <div style={{height:"100%",width:`${pct}%`,background:"linear-gradient(90deg,#9B59B6,#8E44AD)",borderRadius:3,transition:"width 0.4s"}}/>
        </div>

        {/* Verse display */}
        <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:300}}>
          <div style={{background:dark?T.card:"#FFFDF0",border:`2.5px solid ${dark?T.cardBorder:"#C5A028"}`,borderRadius:10,padding:"28px 16px 20px",textAlign:"center",width:"100%",boxShadow:dark?"none":"inset 0 0 0 4px #FFFDF0,inset 0 0 0 5px #D4A01730"}}>
            <div style={{marginBottom:8}}><AyahMarker n={listenIdx+1}/></div>
            {v && (
              <div style={{fontSize:v.plain.length>100?18:v.plain.length>60?22:v.plain.length>30?28:34,fontFamily:"'Amiri',serif",lineHeight:2.6,color:T.text,direction:"rtl",animation:"fadeIn 0.3s"}}>
                <TajweedVerse segments={v.segments} isMem={false}/>
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:12,marginTop:16,paddingBottom:20}}>
          {/* Playback controls */}
          <div style={{display:"flex",alignItems:"center",gap:16}}>
            <button onClick={()=>{if(listenIdx>0)playListenVerse(listenSurah.id,listenIdx-1,listenSurah.verses.length);}} disabled={listenIdx===0}
              style={{width:44,height:44,borderRadius:"50%",border:`1.5px solid ${T.cardBorder}`,background:T.card,color:T.text,fontSize:18,display:"flex",alignItems:"center",justifyContent:"center"}}>⏮</button>
            <button onClick={()=>listenPlaying?pauseListenMode():resumeListenMode()}
              style={{width:60,height:60,borderRadius:"50%",border:"none",background:"linear-gradient(135deg,#1E8C52,#145533)",color:"#F5E6B8",fontSize:24,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 16px #14553330"}}>
              {listenPlaying?"⏸":"▶"}
            </button>
            <button onClick={()=>{if(listenIdx<listenSurah.verses.length-1)playListenVerse(listenSurah.id,listenIdx+1,listenSurah.verses.length);}} disabled={listenIdx>=listenSurah.verses.length-1}
              style={{width:44,height:44,borderRadius:"50%",border:`1.5px solid ${T.cardBorder}`,background:T.card,color:T.text,fontSize:18,display:"flex",alignItems:"center",justifyContent:"center"}}>⏭</button>
          </div>

          {/* Speed */}
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <span style={{fontSize:10,color:T.textMuted}}>Vitesse</span>
            {[0.7,0.85,1,1.25,1.5].map(r=>(
              <button key={r} onClick={()=>setPlaybackRate(r)} style={{
                padding:"4px 8px",borderRadius:6,fontSize:10,fontWeight:600,cursor:"pointer",
                background:playbackRate===r?T.accent:"transparent",color:playbackRate===r?"#F5E6B8":T.textMuted,
                border:`1px solid ${playbackRate===r?T.accent:T.cardBorder}`,fontFamily:"'Outfit'"
              }}>{r}×</button>
            ))}
          </div>

          {/* Reciter info */}
          <div style={{fontSize:10,color:T.textMuted}}>🎙 {reciter.ar}</div>
        </div>
      </div>
    );
  };

  return (
    <div style={{minHeight:"100vh",fontFamily:"'Outfit',sans-serif"}}>
      <style>{`
        @import url('${import.meta.env.VITE_GOOGLE_FONTS_URL || "https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Outfit:wght@300;400;500;600;700&display=swap"}');
        @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideOut{from{opacity:1}to{opacity:0;transform:translateX(-12px)}}
        @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.2);opacity:.7}}
        @keyframes wave{0%,100%{height:5px}50%{height:18px}}
        @keyframes glow{0%,100%{box-shadow:0 0 8px #1E8C5230}50%{box-shadow:0 0 20px #1E8C5250}}
        *{box-sizing:border-box;margin:0;padding:0}
        body{overflow-x:hidden;background:${dark?"#1A1A2E":"#F5ECD0"}}
        button{cursor:pointer;font-family:'Outfit',sans-serif}
        button:active{transform:scale(.97)}
        button:disabled{opacity:.5;cursor:default}
        button:disabled:active{transform:none}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-thumb{background:${dark?"#2A3A5C":"#C5A02830"};border-radius:3px}
        ::-webkit-scrollbar-track{background:transparent}
        div::-webkit-scrollbar{height:0;width:0}
        input:focus{border-color:#1E8C52!important}
      `}</style>
      {screen==="home"&&renderHome()}
      {screen==="learn-list"&&renderLearnList()}
      {screen==="mushaf"&&renderMushaf()}
      {screen==="study"&&renderStudy()}
      {screen==="complete"&&renderComplete()}
      {screen==="review-pick"&&renderReviewPick()}
      {screen==="review"&&renderReview()}
      {screen==="review-done"&&renderReviewDone()}
      {screen==="stats"&&renderStats()}
      {screen==="listen-pick"&&renderListenPick()}
      {screen==="listen"&&renderListen()}
    </div>
  );
}

const S={
  bk:{background:"#FFFDF0",border:"1.5px solid #D4C080",borderRadius:10,width:36,height:36,fontSize:18,color:"#4A3D1A",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0},
  btnG:{padding:"18px",borderRadius:16,border:"none",background:"linear-gradient(135deg,#1E8C52,#145533)",color:"#F5E6B8",fontWeight:700,fontSize:15,boxShadow:"0 6px 24px #14553320",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:10,fontFamily:"'Outfit'"},
  btnM:{padding:"18px",borderRadius:16,border:"2.5px solid #C5A028",background:"#FFFDF0",fontWeight:700,fontSize:15,boxShadow:"0 4px 16px #C5A02815",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:10,fontFamily:"'Outfit'",color:"#4A3D1A"},
  gBtn:{background:"linear-gradient(135deg,#1E8C52,#145533)",color:"#F5E6B8",border:"none",borderRadius:14,padding:"14px 28px",fontSize:14,fontWeight:700,display:"flex",alignItems:"center",gap:7,boxShadow:"0 5px 18px #14553320",fontFamily:"'Outfit'"},
  rBtn:{background:"#FDF2F2",border:"2.5px solid #C0392B30",borderRadius:16,padding:"14px 20px",color:"#4A3D1A",fontWeight:600,display:"flex",alignItems:"center",gap:9,userSelect:"none",WebkitUserSelect:"none",fontFamily:"'Outfit'"},
  rOn:{background:"#FDECEC",borderColor:"#E74C3C",boxShadow:"0 0 20px #E74C3C20"},
  card:{display:"flex",alignItems:"center",gap:10,background:"#FFFDF0",border:"1.5px solid #E0D5BF",borderRadius:12,padding:"12px 14px",marginBottom:7,cursor:"pointer",transition:"all 0.2s"},
  cardNum:{width:40,height:40,borderRadius:10,background:"linear-gradient(135deg,#1E8C52,#145533)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0},
};
