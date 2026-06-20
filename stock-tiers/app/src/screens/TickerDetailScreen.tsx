import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { ChangeBadge } from "../components/ChangeBadge";
import { AsyncState } from "../components/AsyncState";
import { Disclaimer } from "../components/Disclaimer";
import { useQuote } from "../hooks/useQuote";
import type { RootStackParamList } from "../navigation/types";
import { colors } from "../theme/colors";

type Props = NativeStackScreenProps<RootStackParamList, "TickerDetail">;

const Field = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.field}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value}</Text>
  </View>
);

export const TickerDetailScreen = ({ route }: Props) => {
  const { ticker, name, rationale, tierJustification, tier } = route.params;
  const { data, loading, error, reload } = useQuote(ticker);

  return (
    <View style={styles.container}>
      <AsyncState loading={loading} error={error} onRetry={reload}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.ticker}>{ticker}</Text>
          <Text style={styles.name}>{name}</Text>

          {data ? (
            <View style={styles.card}>
              <View style={styles.priceRow}>
                <Text style={styles.price}>
                  ${data.price.toFixed(2)} {data.currency}
                </Text>
                <ChangeBadge pct={data.oneYearChangePct} />
              </View>
              <Field label="Sector" value={data.sector} />
              <Field label="1-Year Change" value={`${(data.oneYearChangePct * 100).toFixed(0)}%`} />
            </View>
          ) : null}

          {tier ? (
            <View style={styles.card}>
              <Field label="Tier" value={tier} />
              {rationale ? <Field label="How it's connected" value={rationale} /> : null}
              {tierJustification ? (
                <Field label="Why this tier" value={tierJustification} />
              ) : null}
            </View>
          ) : null}

          <Disclaimer />
        </ScrollView>
      </AsyncState>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16 },
  ticker: { color: colors.text, fontSize: 28, fontWeight: "800" },
  name: { color: colors.textMuted, fontSize: 16, marginTop: 4, marginBottom: 16 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  price: { color: colors.text, fontSize: 22, fontWeight: "700" },
  field: { marginTop: 10 },
  label: { color: colors.textMuted, fontSize: 12, textTransform: "uppercase" },
  value: { color: colors.text, fontSize: 15, lineHeight: 21, marginTop: 2 },
});
