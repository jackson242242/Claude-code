import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { runKolScan } from "../api/endpoints";
import { ApiError } from "../api/client";
import type { KolClaimedResult, KolPostType, KolReport } from "../api/types";
import { AsyncState } from "../components/AsyncState";
import { Disclaimer } from "../components/Disclaimer";
import { useKolReports } from "../hooks/useKolReports";
import type { RootStackParamList } from "../navigation/types";
import { colors } from "../theme/colors";

type Props = NativeStackScreenProps<RootStackParamList, "Kol">;

const TYPE_LABEL: Record<KolPostType, string> = {
  trade_call: "喊单",
  pnl_boast: "晒单",
  market_view: "观点",
  other: "其他",
};
const RESULT_LABEL: Record<KolClaimedResult, { label: string; color: string }> = {
  gain: { label: "自称赚", color: colors.positive },
  loss: { label: "自称亏", color: colors.negative },
  neutral: { label: "中性", color: colors.textMuted },
  unknown: { label: "未说明", color: colors.textMuted },
};

const pct = (v: number | null): string => (v === null ? "—" : `${(v * 100).toFixed(1)}%`);

const Stat = ({ label, value, color }: { label: string; value: string; color?: string }) => (
  <View style={styles.stat}>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={[styles.statValue, color ? { color } : null]}>{value}</Text>
  </View>
);

const ReportCard = ({ report }: { report: KolReport }) => {
  const board = report.scoreboard;
  const biased = board.boastGainRatio !== null && board.boastGainRatio > 0.85;
  return (
    <View testID={`kol-${report.handle}`}>
      <Text style={styles.handle}>@{report.handle}</Text>

      <View style={styles.boardCard}>
        <View style={styles.statsRow}>
          <Stat label="已分析帖子" value={String(board.postsAnalyzed)} />
          <Stat
            label="报喜率(他自己说)"
            value={pct(board.boastGainRatio)}
            color={biased ? colors.negative : colors.text}
          />
          <Stat label="晒赚/晒亏" value={`${board.gainPosts}/${board.lossPosts}`} />
        </View>
        <View style={styles.statsRow}>
          <Stat label="被跟踪喊单" value={String(board.callsTracked)} />
          <Stat
            label="实测胜率(真实行情)"
            value={pct(board.winRate)}
            color={
              board.winRate === null
                ? undefined
                : board.winRate >= 0.5
                  ? colors.positive
                  : colors.negative
            }
          />
          <Stat
            label="平均实测收益"
            value={pct(board.avgReturnPct)}
            color={
              board.avgReturnPct === null
                ? undefined
                : board.avgReturnPct >= 0
                  ? colors.positive
                  : colors.negative
            }
          />
        </View>
        {biased ? (
          <Text style={styles.biasFlag} testID={`bias-flag-${report.handle}`}>
            ⚠ 报喜率超过 85%——典型的只晒赚不晒亏,请以下方实测胜率为准。
          </Text>
        ) : null}
      </View>

      {report.summary ? <Text style={styles.summary}>{report.summary}</Text> : null}

      {report.calls.length > 0 ? (
        <>
          <Text style={styles.section}>喊单实测(入场价按发现当天真实行情冻结)</Text>
          {report.calls.map((c) => {
            const up = (c.returnPct ?? 0) >= 0;
            return (
              <View key={c.id} style={styles.call}>
                <View style={styles.callTop}>
                  <Text style={styles.callTicker}>
                    {c.ticker}{" "}
                    <Text style={styles.callDir}>{c.direction === "long" ? "做多" : "做空"}</Text>
                  </Text>
                  <Text
                    style={[
                      styles.callReturn,
                      { color: c.returnPct === null ? colors.textMuted : up ? colors.positive : colors.negative },
                    ]}
                  >
                    {c.returnPct === null ? "—" : `${up ? "+" : ""}${pct(c.returnPct)}`}
                  </Text>
                </View>
                <Text style={styles.callMeta}>
                  {c.date} 入场 ${c.entryPrice.toFixed(2)} → 现价{" "}
                  {c.currentPrice === null ? "—" : `$${c.currentPrice.toFixed(2)}`}
                </Text>
                {c.sourceExcerpt ? <Text style={styles.callSrc}>“{c.sourceExcerpt}”</Text> : null}
              </View>
            );
          })}
        </>
      ) : null}

      {report.recentPosts.length > 0 ? (
        <>
          <Text style={styles.section}>最近帖子</Text>
          {report.recentPosts.map((p) => {
            const result = RESULT_LABEL[p.claimedResult];
            return (
              <View key={p.id} style={styles.post}>
                <View style={styles.postTop}>
                  <Text style={styles.postType}>{TYPE_LABEL[p.postType]}</Text>
                  <Text style={[styles.postResult, { color: result.color }]}>{result.label}</Text>
                  <Text style={styles.postDate}>{p.date}</Text>
                </View>
                <Text style={styles.postExcerpt}>{p.excerpt}</Text>
              </View>
            );
          })}
        </>
      ) : null}
    </View>
  );
};

export const KolScreen = (_props: Props) => {
  const { data, loading, error, reload } = useKolReports();
  const [fresh, setFresh] = useState<KolReport[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const reports = fresh ?? data ?? [];

  const handleScan = async () => {
    setBusy(true);
    setActionError(null);
    try {
      setFresh(await runKolScan());
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "扫描失败");
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.container}>
      <AsyncState loading={loading} error={error} onRetry={reload}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>大V战绩审计</Text>
          <Text style={styles.sub}>
            每天扫描 X 上被跟踪账号的帖子:统计他"自称"的赚亏(报喜率),并把每次喊单按当天真实行情冻结入场价,算出经得起检验的实测胜率——他说了不算,行情说了算。
          </Text>

          <TouchableOpacity
            style={[styles.scanBtn, busy && styles.scanBtnBusy]}
            onPress={handleScan}
            disabled={busy}
            testID="run-kol-scan"
          >
            {busy ? (
              <ActivityIndicator size="small" color={colors.text} />
            ) : (
              <Text style={styles.scanBtnText}>立即扫描</Text>
            )}
          </TouchableOpacity>
          {busy ? (
            <Text style={styles.busyHint}>联网搜索该账号近几天的帖子,大约 1–2 分钟…</Text>
          ) : null}
          {actionError ? <Text style={styles.actionError}>{actionError}</Text> : null}
          <Text style={styles.coverageNote}>
            覆盖说明:X 屏蔽大部分抓取,帖子靠联网搜索尽力收集,不保证每帖必中;跟踪账号在服务端
            KOL_HANDLES 配置。
          </Text>

          {reports.map((r) => (
            <ReportCard key={r.handle} report={r} />
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
  scanBtn: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    padding: 13,
    alignItems: "center",
    marginTop: 14,
  },
  scanBtnBusy: { opacity: 0.6 },
  scanBtnText: { color: colors.text, fontSize: 15, fontWeight: "700" },
  busyHint: { color: colors.textMuted, fontSize: 12, textAlign: "center", marginTop: 8 },
  actionError: { color: colors.negative, fontSize: 13, marginTop: 10 },
  coverageNote: { color: colors.textMuted, fontSize: 11, lineHeight: 16, marginTop: 10 },
  handle: { color: colors.text, fontSize: 18, fontWeight: "800", marginTop: 18 },
  boardCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginTop: 10,
  },
  statsRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  stat: { flex: 1 },
  statLabel: { color: colors.textMuted, fontSize: 11 },
  statValue: { color: colors.text, fontSize: 15, fontWeight: "800", marginTop: 3 },
  biasFlag: { color: "#FFA657", fontSize: 13, lineHeight: 18 },
  summary: { color: colors.text, fontSize: 14, lineHeight: 21, marginTop: 12 },
  section: { color: colors.text, fontSize: 15, fontWeight: "700", marginTop: 16, marginBottom: 8 },
  call: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  callTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  callTicker: { color: colors.text, fontSize: 15, fontWeight: "800" },
  callDir: { color: colors.accent, fontSize: 12, fontWeight: "600" },
  callReturn: { fontSize: 14, fontWeight: "700" },
  callMeta: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
  callSrc: { color: colors.textMuted, fontSize: 12, fontStyle: "italic", marginTop: 4 },
  post: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 10,
    padding: 10,
    marginBottom: 6,
  },
  postTop: { flexDirection: "row", alignItems: "center", gap: 8 },
  postType: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: "700",
    backgroundColor: colors.surface,
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 2,
    overflow: "hidden",
  },
  postResult: { fontSize: 12, fontWeight: "700" },
  postDate: { color: colors.textMuted, fontSize: 11, marginLeft: "auto" },
  postExcerpt: { color: colors.text, fontSize: 13, lineHeight: 18, marginTop: 6 },
});
