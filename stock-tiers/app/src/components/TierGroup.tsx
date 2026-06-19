import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import type { Tier, TierEntry } from "../api/types";
import { colors, tierColors } from "../theme/colors";
import { ChangeBadge } from "./ChangeBadge";

interface TierGroupProps {
  tier: Tier;
  entries: TierEntry[];
  onPressEntry: (entry: TierEntry) => void;
}

export const TierGroup = ({ tier, entries, onPressEntry }: TierGroupProps) => (
  <View style={styles.group} testID={`tier-${tier}`}>
    <View style={styles.header}>
      <View style={[styles.badge, { backgroundColor: tierColors[tier] }]}>
        <Text style={styles.badgeText}>{tier}</Text>
      </View>
      <Text style={styles.count}>
        {entries.length} {entries.length === 1 ? "stock" : "stocks"}
      </Text>
    </View>
    {entries.length === 0 ? (
      <Text style={styles.empty}>—</Text>
    ) : (
      entries.map((e) => (
        <TouchableOpacity
          key={e.ticker}
          style={styles.entry}
          onPress={() => onPressEntry(e)}
          testID={`entry-${e.ticker}`}
        >
          <View style={styles.entryTop}>
            <Text style={styles.entryTicker}>
              {e.ticker} <Text style={styles.entryRel}>· {e.relationship}</Text>
            </Text>
            <ChangeBadge pct={e.oneYearChangePct} />
          </View>
          <Text style={styles.rationale} numberOfLines={2}>
            {e.rationale}
          </Text>
        </TouchableOpacity>
      ))
    )}
  </View>
);

const styles = StyleSheet.create({
  group: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 12,
    marginHorizontal: 12,
    marginVertical: 5,
  },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  badge: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  badgeText: { color: "#0E1116", fontWeight: "800", fontSize: 16 },
  count: { color: colors.textMuted, marginLeft: 10, fontSize: 13 },
  empty: { color: colors.textMuted, fontSize: 14 },
  entry: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 8,
    padding: 10,
    marginTop: 6,
  },
  entryTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  entryTicker: { color: colors.text, fontSize: 15, fontWeight: "700", flex: 1, paddingRight: 8 },
  entryRel: { color: colors.textMuted, fontStyle: "italic", fontWeight: "400" },
  rationale: { color: colors.textMuted, fontSize: 13, lineHeight: 18, marginTop: 4 },
});
