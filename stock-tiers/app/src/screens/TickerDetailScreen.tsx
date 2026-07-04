import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

import { ApiError } from "../api/client";
import { addToPortfolio } from "../api/endpoints";
import { ChangeBadge } from "../components/ChangeBadge";
import { AsyncState } from "../components/AsyncState";
import { Disclaimer } from "../components/Disclaimer";
import { useQuote } from "../hooks/useQuote";
import type { RootStackParamList } from "../navigation/types";
import { colors } from "../theme/colors";

type Props = NativeStackScreenProps<RootStackParamList, "TickerDetail">;

type AddState = "idle" | "adding" | "added" | "held";

const Field = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.field}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value}</Text>
  </View>
);

export const TickerDetailScreen = ({ route }: Props) => {
  const { ticker, name, rationale, tierJustification, tier, thesis, trendName } = route.params;
  const { data, loading, error, reload } = useQuote(ticker);
  const [addState, setAddState] = useState<AddState>("idle");
  const [addError, setAddError] = useState<string | null>(null);
  // Optional real-fill fields; blank = server defaults (1 share, live price, today).
  const [sharesText, setSharesText] = useState("");
  const [entryPriceText, setEntryPriceText] = useState("");
  const [entryDateText, setEntryDateText] = useState("");

  const parsePositive = (raw: string): number | undefined | null => {
    const trimmed = raw.trim();
    if (!trimmed) return undefined; // not provided
    const value = Number(trimmed);
    return Number.isFinite(value) && value > 0 ? value : null; // null = invalid
  };

  const handleAdd = async () => {
    const shares = parsePositive(sharesText);
    const entryPrice = parsePositive(entryPriceText);
    if (shares === null || entryPrice === null) {
      setAddError("股数和买入价必须是大于 0 的数字");
      return;
    }
    setAddState("adding");
    setAddError(null);
    try {
      await addToPortfolio(ticker, {
        trend: trendName ?? null,
        thesis: thesis ?? null,
        shares,
        entryPrice,
        entryDate: entryDateText.trim() || undefined,
      });
      setAddState("added");
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setAddState("held"); // already in the portfolio
      } else {
        setAddState("idle");
        setAddError(err instanceof ApiError ? err.message : "加入组合失败");
      }
    }
  };

  const addLabel =
    addState === "added" ? "已加入组合 ✓" : addState === "held" ? "已在组合里" : "加入长期组合";

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

          {addState === "idle" || addState === "adding" ? (
            <View style={styles.fillRow}>
              <View style={styles.fillField}>
                <Text style={styles.fillLabel}>股数</Text>
                <TextInput
                  style={styles.fillInput}
                  value={sharesText}
                  onChangeText={setSharesText}
                  placeholder="1"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="decimal-pad"
                  testID="shares-input"
                />
              </View>
              <View style={styles.fillField}>
                <Text style={styles.fillLabel}>买入价 $</Text>
                <TextInput
                  style={styles.fillInput}
                  value={entryPriceText}
                  onChangeText={setEntryPriceText}
                  placeholder="现价"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="decimal-pad"
                  testID="entry-price-input"
                />
              </View>
              <View style={styles.fillField}>
                <Text style={styles.fillLabel}>买入日期</Text>
                <TextInput
                  style={styles.fillInput}
                  value={entryDateText}
                  onChangeText={setEntryDateText}
                  placeholder="今天"
                  placeholderTextColor={colors.textMuted}
                  testID="entry-date-input"
                />
              </View>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.addBtn, addState !== "idle" && styles.addBtnDone]}
            onPress={handleAdd}
            disabled={addState !== "idle"}
            testID="add-to-portfolio"
          >
            <Text style={styles.addBtnText}>
              {addState === "adding" ? "加入中…" : addLabel}
            </Text>
          </TouchableOpacity>
          {addState === "idle" ? (
            <Text style={styles.addHint}>
              按真实成交填股数/买入价/日期(留空则按 1 股、当前价、今天记录)
              {trendName ? `,归入「${trendName}」方向` : ""}
            </Text>
          ) : null}
          {addError ? <Text style={styles.addError}>{addError}</Text> : null}

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
  fillRow: { flexDirection: "row", gap: 8, marginBottom: 10 },
  fillField: { flex: 1 },
  fillLabel: { color: colors.textMuted, fontSize: 11, marginBottom: 4 },
  fillInput: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    color: colors.text,
    fontSize: 14,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  addBtn: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
    marginTop: 4,
  },
  addBtnDone: { opacity: 0.6 },
  addBtnText: { color: colors.text, fontSize: 15, fontWeight: "700" },
  addHint: { color: colors.textMuted, fontSize: 12, textAlign: "center", marginTop: 8 },
  addError: { color: colors.negative, fontSize: 13, textAlign: "center", marginTop: 8 },
});
