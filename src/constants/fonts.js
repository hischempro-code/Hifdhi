/**
 * HIFDHI — Font Configuration
 * 
 * Primary:  KFGQPC Uthman Taha Naskh (King Fahd Complex official font)
 * Fallback: Amiri (Google Fonts, open-source Naskh)
 * 
 * ─── Installation Instructions ───
 * 
 * 1. KFGQPC Uthman Taha Naskh:
 *    - Download from: https://fonts.qurancomplex.gov.sa/
 *      or search "KFGQPC Uthman Taha Naskh" on fontsquirrel/GitHub
 *    - Place the .ttf file in: assets/fonts/KFGQPCUthmanTahaNaskh.ttf
 * 
 * 2. For React Native (Expo):
 *    - Use expo-font to load:
 *      ```
 *      import { useFonts } from 'expo-font';
 *      const [loaded] = useFonts({
 *        KFGQPCUthmanTahaNaskh: require('../../assets/fonts/KFGQPCUthmanTahaNaskh.ttf'),
 *      });
 *      ```
 * 
 * 3. For React Native (bare):
 *    - Add to react-native.config.js:
 *      ```
 *      module.exports = {
 *        assets: ['./assets/fonts'],
 *      };
 *      ```
 *    - Run: npx react-native-asset
 * 
 * 4. For React Web:
 *    - @font-face in CSS or import in <style> tag (see WEB_FONT_FACE below)
 *    - Amiri fallback auto-loaded from Google Fonts
 */

// Detect platform safely
const isWeb = typeof window !== "undefined" && typeof document !== "undefined";
const isReactNative = typeof navigator !== "undefined" && navigator.product === "ReactNative";

// ─── Font Family Strings ───

export const FONT_QURAN = isReactNative
  ? "KFGQPCUthmanTahaNaskh"
  : isWeb
  ? "'KFGQPC Uthman Taha Naskh', 'Amiri', 'Scheherazade New', serif"
  : "'Amiri', serif";

export const FONT_UI_AR = isReactNative
  ? "KFGQPCUthmanTahaNaskh"
  : isWeb
  ? "'KFGQPC Uthman Taha Naskh', 'Amiri', serif"
  : "'Amiri', serif";

export const FONT_UI_LATIN = isWeb
  ? "'Outfit', sans-serif"
  : "System";

// ─── Web @font-face declarations ───
// Inject this into a <style> tag for web builds

// Only declare @font-face if the font files actually exist.
// For now, we rely on the Amiri Google Font fallback.
// To enable KFGQPC: place .ttf files in assets/fonts/ and uncomment below.
export const WEB_FONT_FACE = `
/* @font-face {
  font-family: 'KFGQPC Uthman Taha Naskh';
  src: url('/fonts/KFGQPCUthmanTahaNaskh.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
  font-display: swap;
} */
`;

// ─── Google Fonts import for Amiri fallback ───
export const GOOGLE_FONTS_URL =
  import.meta.env.VITE_GOOGLE_FONTS_URL || "https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Outfit:wght@300;400;500;600;700&display=swap";

// ─── Expo Font map for useFonts() ───
// Usage (React Native only):
//   import { useFonts } from 'expo-font';
//   const [loaded] = useFonts({
//     KFGQPCUthmanTahaNaskh: require('../../assets/fonts/KFGQPCUthmanTahaNaskh.ttf'),
//   });
