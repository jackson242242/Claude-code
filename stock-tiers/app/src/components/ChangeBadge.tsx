import { StyleSheet, Text, View } from "react-native";

import { colors } from "../theme/colors";

export const formatChange = (pct: number): string => {
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${(pct * 100).toFixed(0)}%`;
};

export const ChangeBadge = ({ pct }: { pct: number }) => (
  <View style={[styles.badge, { backgroundColor: pct >= 0 ? colors.positive : colors.negative }]}>
    <Text style={styles.text}>{formatChange(pct)}</Text>
  </View>
);

const styles = StyleSheet.create({
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  text: { color: "#0E1116", fontWeight: "700", fontSize: 13 },
});
