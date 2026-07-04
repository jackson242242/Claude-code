import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { TIER_ORDER, type TierEntry } from "../api/types";
import { AsyncState } from "../components/AsyncState";
import { Disclaimer } from "../components/Disclaimer";
import { TierGroup } from "../components/TierGroup";
import { useThesisTiers } from "../hooks/useThesisTiers";
import type { RootStackParamList } from "../navigation/types";
import { colors } from "../theme/colors";

type Props = NativeStackScreenProps<RootStackParamList, "ThesisResults">;

export const ThesisResultsScreen = ({ route, navigation }: Props) => {
  const { thesis, horizon, trendName } = route.params;
  const { data, loading, error, reload } = useThesisTiers(thesis, horizon);

  const openEntry = (entry: TierEntry) =>
    navigation.navigate("TickerDetail", {
      ticker: entry.ticker,
      name: entry.name,
      rationale: entry.rationale,
      tierJustification: entry.tierJustification,
      tier: entry.tier,
      // Context for "add to portfolio": the pick expresses this thesis/trend.
      thesis,
      trendName,
    });

  return (
    <View style={styles.container}>
      <AsyncState loading={loading} error={error} onRetry={reload}>
        <ScrollView>
          <View style={styles.head}>
            <Text style={styles.label}>YOUR THESIS · {horizon.toUpperCase()}</Text>
            <Text style={styles.thesisIn}>{thesis}</Text>
            {data?.thesis ? <Text style={styles.thesisOut}>{data.thesis}</Text> : null}
          </View>
          {data
            ? TIER_ORDER.map((tier) => (
                <TierGroup
                  key={tier}
                  tier={tier}
                  entries={data.tiers[tier] ?? []}
                  onPressEntry={openEntry}
                />
              ))
            : null}
          <Disclaimer text={data?.disclaimer} />
        </ScrollView>
      </AsyncState>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  head: { padding: 16 },
  label: { color: colors.accent, fontSize: 12, fontWeight: "700", letterSpacing: 1 },
  thesisIn: { color: colors.text, fontSize: 16, fontWeight: "600", marginTop: 6 },
  thesisOut: { color: colors.textMuted, fontSize: 14, lineHeight: 20, marginTop: 10 },
});
