import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { discoverTrends } from "../api/endpoints";
import { ApiError } from "../api/client";
import type { SecularTrend } from "../api/types";
import { AsyncState } from "../components/AsyncState";
import { Disclaimer } from "../components/Disclaimer";
import { useTrends } from "../hooks/useTrends";
import type { RootStackParamList } from "../navigation/types";
import { colors } from "../theme/colors";

type Props = NativeStackScreenProps<RootStackParamList, "Trends">;

const HORIZON_LABEL: Record<SecularTrend["horizon"], string> = {
  short: "短线",
  medium: "中线",
  long: "长期",
};

export const TrendsScreen = ({ navigation }: Props) => {
  const { data, loading, error, reload } = useTrends();
  const [extra, setExtra] = useState<SecularTrend[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Freshly discovered list supersedes the initially loaded one.
  const trends = extra ?? data ?? [];

  const handleDiscover = async () => {
    setBusy(true);
    setActionError(null);
    try {
      setExtra(await discoverTrends());
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "趋势发现失败");
    } finally {
      setBusy(false);
    }
  };

  const openTrend = (t: SecularTrend) =>
    navigation.navigate("ThesisResults", {
      thesis: t.thesis,
      horizon: t.horizon,
      trendName: t.name,
    });

  return (
    <View style={styles.container}>
      <AsyncState loading={loading} error={error} onRetry={reload}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>趋势方向</Text>
          <Text style={styles.sub}>
            组合不该只押一个故事。每次「发现新趋势」都会避开已跟踪的方向,从不同驱动力
            (能源、政策、地缘、人口、医疗…)找出新的多年期趋势;点进任意趋势即可生成投资清单。
          </Text>

          <TouchableOpacity
            style={[styles.discoverBtn, busy && styles.discoverBtnBusy]}
            onPress={handleDiscover}
            disabled={busy}
            testID="discover-trends"
          >
            {busy ? (
              <ActivityIndicator size="small" color={colors.text} />
            ) : (
              <Text style={styles.discoverText}>发现新趋势</Text>
            )}
          </TouchableOpacity>
          {actionError ? <Text style={styles.actionError}>{actionError}</Text> : null}

          {trends.map((t) => (
            <TouchableOpacity
              key={t.id}
              style={styles.trend}
              onPress={() => openTrend(t)}
              testID={`trend-${t.id}`}
            >
              <View style={styles.trendTop}>
                <Text style={styles.trendName}>{t.name}</Text>
                <View style={styles.badges}>
                  <Text style={styles.category}>{t.category}</Text>
                  <Text style={styles.horizon}>{HORIZON_LABEL[t.horizon]}</Text>
                </View>
              </View>
              <Text style={styles.thesis}>{t.thesis}</Text>
              {t.whyNow ? <Text style={styles.whyNow}>为什么是现在:{t.whyNow}</Text> : null}
              <Text style={styles.cta}>生成这个方向的投资清单 →</Text>
            </TouchableOpacity>
          ))}

          <Disclaimer />
        </ScrollView>
      </AsyncState>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16 },
  title: { color: colors.text, fontSize: 22, fontWeight: "800" },
  sub: { color: colors.textMuted, fontSize: 13, lineHeight: 19, marginTop: 6 },
  discoverBtn: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    padding: 13,
    alignItems: "center",
    marginTop: 16,
    marginBottom: 12,
  },
  discoverBtnBusy: { opacity: 0.6 },
  discoverText: { color: colors.text, fontSize: 15, fontWeight: "700" },
  actionError: { color: colors.negative, fontSize: 13, marginBottom: 8 },
  trend: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  trendTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  trendName: { color: colors.text, fontSize: 16, fontWeight: "800", flex: 1, paddingRight: 8 },
  badges: { flexDirection: "row", gap: 6 },
  category: {
    color: colors.accent,
    fontSize: 12,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    overflow: "hidden",
  },
  horizon: {
    color: colors.textMuted,
    fontSize: 12,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    overflow: "hidden",
  },
  thesis: { color: colors.text, fontSize: 14, lineHeight: 20, marginTop: 8 },
  whyNow: { color: colors.textMuted, fontSize: 13, lineHeight: 18, marginTop: 6 },
  cta: { color: colors.accent, fontSize: 13, fontWeight: "600", marginTop: 10 },
});
