/**
 * AyahMarker — Ornamental verse number marker (React Native version)
 * Uses react-native-svg for the octagonal gold marker.
 */
import React from "react";
import { View } from "react-native";
import Svg, { Polygon, Circle, Text as SvgText } from "react-native-svg";

export default function AyahMarker({ n, size = 32 }) {
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} viewBox="0 0 36 36">
        <Polygon
          points="18,1 26,5 32,11 32,25 26,31 18,35 10,31 4,25 4,11 10,5"
          fill="none"
          stroke="#C5A028"
          strokeWidth="1.8"
        />
        <Polygon
          points="18,5 24,8 28,13 28,23 24,28 18,31 12,28 8,23 8,13 12,8"
          fill="none"
          stroke="#C5A028"
          strokeWidth="0.5"
          opacity="0.4"
        />
        {[
          [18, 2], [32, 12], [32, 24],
          [18, 34], [4, 24], [4, 12],
        ].map(([x, y], i) => (
          <Circle key={i} cx={x} cy={y} r="1.5" fill="#C5A028" opacity="0.6" />
        ))}
        <SvgText
          x="18"
          y="22"
          textAnchor="middle"
          fill="#5C4A1E"
          fontSize="12"
          fontWeight="700"
        >
          {n}
        </SvgText>
      </Svg>
    </View>
  );
}
