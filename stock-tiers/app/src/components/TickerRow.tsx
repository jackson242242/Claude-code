import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { colors } from "../theme/colors";
import { ChangeBadge } from "./ChangeBadge";

interface TickerRowProps {
  ticker: string;
  name: string;
  sector?: string;
  price?: number;
  oneYearChangePct: number;
  onPress?: () => void;
}

export const TickerRow = ({
  ticker,
  name,
  sector,
  price,
  oneYearChangePct,
  onPress,
}: TickerRowProps) => (
  <TouchableOpacity style={styles.row} onPress={onPress} disabled={!onPress} testID={`row-${ticker}`}>
    <View style={styles.left}>
      <Text style={styles.ticker}>{ticker}</Text>
      <Text style={styles.name} numberOfLines={1}>
        {name}
      </Text>
      {sector ? <Text style={styles.sector}>{sector}</Text> : null}
    </View>
    <View style={styles.right}>
      {price !== undefined ? <Text style={styles.price}>${price.toFixed(2)}</Text> : null}
      <ChangeBadge pct={oneYearChangePct} />
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 14,
    marginHorizontal: 12,
    marginVertical: 5,
  },
  left: { flex: 1, paddingRight: 12 },
  right: { alignItems: "flex-end", gap: 6 },
  ticker: { color: colors.text, fontSize: 16, fontWeight: "700" },
  name: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
  sector: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  price: { color: colors.text, fontSize: 14 },
});
