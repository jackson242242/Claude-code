import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { removeFromPortfolio, runResearch } from "../api/endpoints";
import type { PortfolioHolding, ThesisStatus } from "../api/types";
import { ApiError } from "../api/client";
import { AsyncState } from "../components/AsyncState";
import { Disclaimer } from "../components/Disclaimer";
import { usePortfolio } from "../hooks/usePortfolio";
import { useResearch } from "../hooks/useResearch";
import type { RootStackParamList } from "../navigation/types";
import { colors } from "../theme/colors";

type Props = NativeStackScreenProps<RootStackParamList, "Portfolio">;

const STATUS_LABEL: Record<ThesisStatus, { label: string; color: string }> = {
  strengthening: { label: "增强", color: colors.positive },
  intact: { label: "稳定", color: colors.accent },
  weakening: { label: "减弱", color: "#FFA657" },
  broken: { label: "失效", color: colors.negative },
};

const pct = (v: number | null): string => (v === null ? "—" : `${(v * 100).toFixed(1)}%`);

const HoldingRow = ({
  holding,
  onRemove,
}: {
  holding: PortfolioHolding;
  onRemove: (ticker: string) => void;
}) => {
  const up = (holding.sinceEntryPct ?? 0) >= 0;
  return (
    <View style={styles.holding} testID={`holding-${holding.ticker}`}>
      <View style={styles.holdingTop}>
        <Text style={styles.holdingTicker}>
          {holding.ticker} <Text style={styles.holdingName}>· {holding.name}</Text>
        </Text>
        <TouchableOpacity
          onPress={() => onRemove(holding.ticker)}
          testID={`remove-${holding.ticker}`}
        >
          <Text style={styles.remove}>移除</Text>
        </TouchableOpacity>
      </View>
      {holding.trend ? <Text style={styles.trendTag}>{holding.trend}</Text> : null}
      <View style={styles.holdingRow}>
        <Text style={styles.holdingMeta}>
          入场 ${holding.entryPrice.toFixed(2)} ({holding.entryDate}) → 现价{" "}
          {holding.currentPrice === null ? "—" : `$${holding.currentPrice.toFixed(2)}`}
        </Text>
        <Text style={[styles.sinceEntry, { color: up ? colors.positive : colors.negative }]}>
          {holding.sinceEntryPct === null ? "—" : `${up ? "+" : ""}${pct(holding.sinceEntryPct)}`}
        </Text>
      </View>
    </View>
  );
};

export const PortfolioScreen = (_props: Props) => {
  const portfolio = usePortfolio();
  const research = useResearch();
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleRunResearch = async () => {
    setBusy(true);
    setActionError(null);
    try {
      await runResearch();
      research.reload();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "研究运行失败");
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async (ticker: string) => {
    setActionError(null);
    try {
      await removeFromPortfolio(ticker);
      portfolio.reload();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "移除失败");
    }
  };

  const holdings = portfolio.data?.holdings ?? [];
  const slices = portfolio.data?.trendSlices ?? [];

  return (
    <View style={styles.container}>
      <AsyncState loading={portfolio.loading} error={portfolio.error} onRetry={portfolio.reload}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>我的长期组合</Text>
          <Text style={styles.sub}>
            买入价在加入时冻结,现价来自实时行情;每日研究检查每个持仓的原始逻辑是否仍然成立。
          </Text>

          {actionError ? <Text style={styles.actionError}>{actionError}</Text> : null}

          {holdings.length === 0 ? (
            <View style={styles.card}>
              <Text style={styles.emptyText}>
                还没有持仓。在任意股票详情页点「加入长期组合」,或先去「趋势方向」找一个方向。
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.section}>方向分布(多元化)</Text>
              <View style={styles.card} testID="trend-slices">
                {slices.map((s) => (
                  <View key={s.trend} style={styles.slice}>
                    <Text style={styles.sliceTrend}>{s.trend}</Text>
                    <Text style={styles.sliceMeta}>
                      {s.tickers.join(" · ")} — {(s.weightPct * 100).toFixed(0)}%
                    </Text>
                  </View>
                ))}
                {slices.length <= 1 ? (
                  <Text style={styles.hint}>
                    组合集中在单一方向——去「趋势方向」发现新的 secular trend,让组合更分散。
                  </Text>
                ) : null}
              </View>

              <Text style={styles.section}>持仓 ({holdings.length})</Text>
              {holdings.map((h) => (
                <HoldingRow key={h.ticker} holding={h} onRemove={handleRemove} />
              ))}
            </>
          )}

          <View style={styles.researchHead}>
            <Text style={styles.section}>每日研究</Text>
            <TouchableOpacity
              style={[styles.runBtn, busy && styles.runBtnBusy]}
              onPress={handleRunResearch}
              disabled={busy}
              testID="run-research"
            >
              {busy ? (
                <ActivityIndicator size="small" color={colors.text} />
              ) : (
                <Text style={styles.runBtnText}>立即更新</Text>
              )}
            </TouchableOpacity>
          </View>

          {research.data ? (
            <View style={styles.card} testID="research-report">
              <Text style={styles.reportDate}>
                {new Date(research.data.generatedAt).toLocaleString()}
              </Text>
              <Text style={styles.reportSummary}>{research.data.summary}</Text>
              <Text style={styles.reportDiversification}>{research.data.diversification}</Text>
              {research.data.notes.map((n) => {
                const status = STATUS_LABEL[n.thesisStatus];
                return (
                  <View key={n.ticker} style={styles.note} testID={`note-${n.ticker}`}>
                    <View style={styles.noteTop}>
                      <Text style={styles.noteTicker}>{n.ticker}</Text>
                      <Text style={[styles.noteStatus, { color: status.color }]}>
                        {status.label}
                      </Text>
                    </View>
                    <Text style={styles.noteHeadline}>{n.headline}</Text>
                    <Text style={styles.noteBody}>{n.note}</Text>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.card}>
              <Text style={styles.emptyText} testID="no-research">
                还没有研究报告——点「立即更新」生成一份;部署好每日定时任务后会自动更新。
              </Text>
            </View>
          )}

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
  actionError: { color: colors.negative, fontSize: 13, marginTop: 10 },
  section: { color: colors.text, fontSize: 15, fontWeight: "700", marginTop: 20, marginBottom: 8 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginTop: 4,
  },
  emptyText: { color: colors.textMuted, fontSize: 14, lineHeight: 20 },
  slice: { marginBottom: 8 },
  sliceTrend: { color: colors.text, fontSize: 14, fontWeight: "700" },
  sliceMeta: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
  hint: { color: colors.accent, fontSize: 13, lineHeight: 18, marginTop: 6 },
  holding: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  holdingTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  holdingTicker: { color: colors.text, fontSize: 16, fontWeight: "800" },
  holdingName: { color: colors.textMuted, fontSize: 13, fontWeight: "400" },
  remove: { color: colors.textMuted, fontSize: 13 },
  trendTag: { color: colors.accent, fontSize: 12, marginTop: 4 },
  holdingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
  },
  holdingMeta: { color: colors.textMuted, fontSize: 13, flex: 1, paddingRight: 8 },
  sinceEntry: { fontSize: 14, fontWeight: "700" },
  researchHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  runBtn: {
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginTop: 12,
  },
  runBtnBusy: { opacity: 0.6 },
  runBtnText: { color: colors.text, fontSize: 13, fontWeight: "700" },
  reportDate: { color: colors.textMuted, fontSize: 12 },
  reportSummary: { color: colors.text, fontSize: 14, lineHeight: 20, marginTop: 8 },
  reportDiversification: { color: colors.accent, fontSize: 13, lineHeight: 19, marginTop: 8 },
  note: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
  },
  noteTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  noteTicker: { color: colors.text, fontSize: 14, fontWeight: "800" },
  noteStatus: { fontSize: 13, fontWeight: "700" },
  noteHeadline: { color: colors.text, fontSize: 13, fontWeight: "600", marginTop: 4 },
  noteBody: { color: colors.textMuted, fontSize: 13, lineHeight: 18, marginTop: 4 },
});
