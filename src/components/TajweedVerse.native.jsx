/**
 * TajweedVerse — React Native version
 * 
 * Uses nested <Text> components to preserve Arabic cursive ligatures.
 * React Native's <Text> nesting keeps all runs in the same text layout,
 * which is critical for connected Arabic script.
 * 
 * Props:
 *   segments: [{ text, color, rule }]  — from quran-tajweed.json
 *   isMem:    boolean                  — if true, entire verse is green (memorized)
 *   fontSize: number                   — optional override (default 26)
 */
import React from "react";
import { Text, StyleSheet } from "react-native";

const FONT_FAMILY = "KFGQPCUthmanTahaNaskh";

export default function TajweedVerse({ segments, isMem = false, fontSize = 26 }) {
  if (!segments || segments.length === 0) return null;

  return (
    <Text
      style={[
        styles.base,
        { fontSize, fontFamily: FONT_FAMILY },
      ]}
    >
      {segments.map((seg, i) => {
        // Memorized mode: uniform green
        if (isMem) {
          return (
            <Text key={i} style={{ color: "#1B9E5A" }}>
              {seg.text}
            </Text>
          );
        }

        // Normal Tajweed coloring — nested <Text> preserves cursive
        if (seg.color) {
          return (
            <Text key={i} style={{ color: seg.color, fontWeight: "700" }}>
              {seg.text}
            </Text>
          );
        }

        // Default (no rule)
        return (
          <Text key={i}>
            {seg.text}
          </Text>
        );
      })}
    </Text>
  );
}

/**
 * TajweedVersePlain — Renders plain text without tajweed colors.
 * Used for hidden/blurred mode in study screen.
 */
export function TajweedVersePlain({ text, fontSize = 26 }) {
  return (
    <Text
      style={[
        styles.base,
        { fontSize, fontFamily: FONT_FAMILY },
      ]}
    >
      {text}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    color: "#2C2416",
    lineHeight: 72, // ~2.8× for fontSize 26
    writingDirection: "rtl",
    textAlign: "right",
  },
});
