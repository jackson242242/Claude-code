import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { removeFromPortfolio, runResearch, updatePosition } from "../api/endpoints";
import type { PortfolioHolding, ThesisStatus, UpdatePositionFields } from "../api/types";
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

const money = (v: number): string =>
  `$${v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const HoldingRow = ({
  holding,
  onRemove,
  onSave,
}: {
  holding: PortfolioHolding;
  onRemove: (ticker: string) => void;
  onSave: (ticker: string, fields: UpdatePositionFields) => Promise<boolean>;
}) => {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sharesText, setSharesText] = useState("");
  const [priceText, setPriceText] = useState("");
  const [dateText, setDateText] = useState("");
  const [trendText, setTrendText] = useState("");

  const startEdit = () => {
    setSharesText(String(holding.shares));
    setPriceText(String(holding.entryPrice));
    setDateText(holding.entryDate);
    setTrendText(holding.trend ?? "");
    setEditing(true);
  };

  const save = async () => {
    const fields: UpdatePositionFields = {};
    const shares = Number(sharesText);
    const price = Number(priceText);
    if (sharesText.trim() && Number.isFinite(shares) && shares > 0) fields.shares = shares;
    if (priceText.trim() && Number.isFinite(price) && price > 0) fields.entryPrice = price;
    if (dateText.trim()) fields.entryDate = dateText.trim();
    fields.trend = trendText.trim(); // empty string clears the tag
    setSaving(true);
    const ok = await onSave(holding.ticker, fields);
    setSaving(false);
    if (ok) setEditing(false);
  };

  const pnlUp = (holding.pnl ?? 0) >= 0;
  return (
    <View style={styles.holding} testID={`holding-${holding.ticker}`}>
      <View style={styles.holdingTop}>
        <Text style={styles.holdingTicker}>
          {holding.ticker} <Text style={styles.holdingName}>· {holding.name}</Text>
        </Text>
        <View style={styles.rowActions}>
          <TouchableOpacity onPress={startEdit} testID={`edit-${holding.ticker}`}>
            <Text style={styles.action}>编辑</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onRemove(holding.ticker)}
            testID={`remove-${holding.ticker}`}
          >
            <Text style={styles.action}>移除</Text>
          </TouchableOpacity>
        </View>
      </View>
      {holding.trend ? <Text style={styles.trendTag}>{holding.trend}</Text> : null}

      {editing ? (
        <View testID={`edit-form-${holding.ticker}`}>
          <View style={styles.editRow}>
            <View style={styles.editField}>
              <Text style={styles.editLabel}>股数</Text>
              <TextInput
                style={styles.editInput}
                value={sharesText}
                onChangeText={setSharesText}
                keyboardType="decimal-pad"
                testID={`edit-shares-${holding.ticker}`}
              />
            </View>
            <View style={styles.editField}>
              <Text style={styles.editLabel}>买入价 $</Text>
              <TextInput
                style={styles.editInput}
                value={priceText}
                onChangeText={setPriceText}
                keyboardType="decimal-pad"
                testID={`edit-price-${holding.ticker}`}
              />
            </View>
            <View style={styles.editField}>
              <Text style={styles.editLabel}>买入日期</Text>
              <TextInput
                style={styles.editInput}
                value={dateText}
                onChangeText={setDateText}
                testID={`edit-date-${holding.ticker}`}
              />
            </View>
          </View>
          <View style={styles.editRow}>
            <View style={styles.editFieldWide}>
              <Text style={styles.editLabel}>方向标签(留空 = 未分类)</Text>
              <TextInput
                style={styles.editInput}
                value={trendText}
                onChangeText={setTrendText}
                testID={`edit-trend-${holding.ticker}`}
              />
            </View>
          </View>
          <View style={styles.editActions}>
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={save}
              disabled={saving}
              testID={`save-${holding.ticker}`}
            >
              <Text style={styles.saveText}>{saving ? "保存中…" : "保存"}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setEditing(false)} disabled={saving}>
              <Text style={styles.cancelText}>取消</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <>
          <View style={styles.holdingRow}>
            <Text style={styles.holdingMeta}>
              {holding.shares.toLocaleString()} 股 × 入场 ${holding.entryPrice.toFixed(2)} (
              {holding.entryDate}) → 现价{" "}
              {holding.currentPrice === null ? "—" : `$${holding.currentPrice.toFixed(2)}`}
            </Text>
          </View>
          <View style={styles.holdingRow}>
            <Text style={styles.holdingMeta}>
              市值 {holding.marketValue === null ? "—" : money(holding.marketValue)}
              {holding.weightPct !== null ? ` · 占比 ${(holding.weightPct * 100).toFixed(0)}%` : ""}
            </Text>
            <Text style={[styles.pnl, { color: pnlUp ? colors.positive : colors.negative }]}>
              {holding.pnl === null
                ? "—"
                : `${pnlUp ? "+" : ""}${money(holding.pnl)}${
                    holding.sinceEntryPct !== null
                      ? ` (${pnlUp ? "+" : ""}${(holding.sinceEntryPct * 100).toFixed(1)}%)`
                      : ""
                  }`}
            </Text>
          </View>
        </>
      )}
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
      portfolio.reload(); // alerts depend on the latest report
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

  const handleSave = async (ticker: string, fields: UpdatePositionFields): Promise<boolean> => {
    setActionError(null);
    try {
      await updatePosition(ticker, fields);
      portfolio.reload();
      return true;
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "保存失败");
      return false;
    }
  };

  const view = portfolio.data;
  const holdings = view?.holdings ?? [];
  const slices = view?.trendSlices ?? [];
  const alerts = view?.alerts ?? [];
  const totalUp = (view?.totalPnl ?? 0) >= 0;

  return (
    <View style={styles.container}>
      <AsyncState loading={portfolio.loading} error={portfolio.error} onRetry={portfolio.reload}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>我的长期组合</Text>
          <Text style={styles.sub}>
            按真实股数与买入价计算;每日研究像基金经理一样复查每个持仓的原始逻辑与组合集中度。
          </Text>

          {actionError ? <Text style={styles.actionError}>{actionError}</Text> : null}

          {view && holdings.length > 0 ? (
            <View style={styles.statsCard} testID="portfolio-stats">
              <View style={styles.statCol}>
                <Text style={styles.statLabel}>总市值</Text>
                <Text style={styles.statValue}>{money(view.totalValue)}</Text>
              </View>
              <View style={styles.statCol}>
                <Text style={styles.statLabel}>总成本</Text>
                <Text style={styles.statValue}>{money(view.totalCost)}</Text>
              </View>
              <View style={styles.statCol}>
                <Text style={styles.statLabel}>总盈亏</Text>
                <Text
                  style={[styles.statValue, { color: totalUp ? colors.positive : colors.negative }]}
                >
                  {totalUp ? "+" : ""}
                  {money(view.totalPnl)}
                  {view.totalPnlPct !== null
                    ? ` (${totalUp ? "+" : ""}${(view.totalPnlPct * 100).toFixed(1)}%)`
                    : ""}
                </Text>
              </View>
            </View>
          ) : null}

          {alerts.length > 0 ? (
            <View style={styles.alertsCard} testID="alerts">
              <Text style={styles.alertsTitle}>经理提示</Text>
              {alerts.map((a, i) => (
                <Text
                  key={i}
                  style={[styles.alert, a.level === "warning" ? styles.alertWarn : styles.alertInfo]}
                >
                  {a.level === "warning" ? "⚠ " : "ⓘ "}
                  {a.message}
                </Text>
              ))}
            </View>
          ) : null}

          {holdings.length === 0 ? (
            <View style={styles.card}>
              <Text style={styles.emptyText}>
                还没有持仓。在任意股票详情页点「加入长期组合」(可填真实股数与成交价),或先去「趋势方向」找一个方向。
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.section}>方向分布(按市值加权)</Text>
              <View style={styles.card} testID="trend-slices">
                {slices.map((s) => (
                  <View key={s.trend} style={styles.slice}>
                    <Text style={styles.sliceTrend}>{s.trend}</Text>
                    <Text style={styles.sliceMeta}>
                      {s.tickers.join(" · ")} — {(s.weightPct * 100).toFixed(0)}%
                    </Text>
                  </View>
                ))}
              </View>

              <Text style={styles.section}>持仓 ({holdings.length})</Text>
              {holdings.map((h) => (
                <HoldingRow key={h.ticker} holding={h} onRemove={handleRemove} onSave={handleSave} />
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
  statsCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statCol: { flex: 1 },
  statLabel: { color: colors.textMuted, fontSize: 11, textTransform: "uppercase" },
  statValue: { color: colors.text, fontSize: 15, fontWeight: "800", marginTop: 4 },
  alertsCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginTop: 10,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
  },
  alertsTitle: { color: colors.text, fontSize: 13, fontWeight: "700", marginBottom: 6 },
  alert: { fontSize: 13, lineHeight: 19, marginTop: 4 },
  alertWarn: { color: "#FFA657" },
  alertInfo: { color: colors.textMuted },
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
  holding: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  holdingTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  holdingTicker: { color: colors.text, fontSize: 16, fontWeight: "800" },
  holdingName: { color: colors.textMuted, fontSize: 13, fontWeight: "400" },
  rowActions: { flexDirection: "row", gap: 14 },
  action: { color: colors.accent, fontSize: 13 },
  trendTag: { color: colors.accent, fontSize: 12, marginTop: 4 },
  holdingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
  },
  holdingMeta: { color: colors.textMuted, fontSize: 13, flex: 1, paddingRight: 8 },
  pnl: { fontSize: 14, fontWeight: "700" },
  editRow: { flexDirection: "row", gap: 8, marginTop: 10 },
  editField: { flex: 1 },
  editFieldWide: { flex: 1 },
  editLabel: { color: colors.textMuted, fontSize: 11, marginBottom: 4 },
  editInput: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    color: colors.text,
    fontSize: 14,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  editActions: { flexDirection: "row", alignItems: "center", gap: 16, marginTop: 10 },
  saveBtn: {
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  saveText: { color: colors.text, fontSize: 13, fontWeight: "700" },
  cancelText: { color: colors.textMuted, fontSize: 13 },
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
