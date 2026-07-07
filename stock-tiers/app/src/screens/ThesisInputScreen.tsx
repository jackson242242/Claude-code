import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import type { Horizon } from "../api/types";
import { Disclaimer } from "../components/Disclaimer";
import type { RootStackParamList } from "../navigation/types";
import { colors } from "../theme/colors";

const PARADIGMS: { label: string; template: string }[] = [
  { label: "行业趋势", template: "未来 [哪个行业] 会因为 [原因] 而增长" },
  { label: "政策", template: "[某项政策] 会利好 [哪些公司/板块]" },
  { label: "地缘政治", template: "[地缘事件] 会推动 [什么影响]" },
  { label: "税务政策", template: "[税改/关税] 会影响 [哪些公司]" },
  { label: "宏观经济", template: "[利率/通胀/美元] 的变化会带动 [哪个板块]" },
  { label: "个股信念", template: "我看好 [某公司],因为 [理由]" },
];

const HORIZONS: { key: Horizon; label: string; hint: string }[] = [
  { key: "short", label: "短线", hint: "数周–数月,看催化剂与动量" },
  { key: "medium", label: "中线", hint: "6–18 个月,均衡" },
  { key: "long", label: "长期", hint: "多年,看护城河与估值" },
];

type Props = NativeStackScreenProps<RootStackParamList, "ThesisInput">;

export const ThesisInputScreen = ({ navigation }: Props) => {
  const [thesis, setThesis] = useState("");
  const [horizon, setHorizon] = useState<Horizon>("long");
  const canSubmit = thesis.trim().length > 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>写下你的投资逻辑</Text>
      <Text style={styles.sub}>
        说出你押注的方向,AI 帮你找出能表达这个逻辑的股票,并按 S–F 排序。
      </Text>

      <Text style={styles.section}>选一个角度(点一下填模板)</Text>
      <View style={styles.chips}>
        {PARADIGMS.map((p) => (
          <TouchableOpacity
            key={p.label}
            style={styles.chip}
            onPress={() => setThesis(p.template)}
            testID={`paradigm-${p.label}`}
          >
            <Text style={styles.chipText}>{p.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput
        style={styles.input}
        value={thesis}
        onChangeText={setThesis}
        placeholder="例如:AI 算力需求会推动电力和电网建设"
        placeholderTextColor={colors.textMuted}
        multiline
        testID="thesis-input"
      />

      <Text style={styles.section}>时间维度</Text>
      <View style={styles.horizons}>
        {HORIZONS.map((h) => {
          const active = horizon === h.key;
          return (
            <TouchableOpacity
              key={h.key}
              style={[styles.horizon, active && styles.horizonActive]}
              onPress={() => setHorizon(h.key)}
              testID={`horizon-${h.key}`}
            >
              <Text style={[styles.horizonText, active && styles.horizonTextActive]}>
                {h.label}
              </Text>
              <Text style={styles.horizonHint}>{h.hint}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity
        style={[styles.cta, !canSubmit && styles.ctaDisabled]}
        onPress={() => navigation.navigate("ThesisResults", { thesis: thesis.trim(), horizon })}
        disabled={!canSubmit}
        testID="generate"
      >
        <Text style={styles.ctaText}>生成投资清单</Text>
      </TouchableOpacity>

      <View style={styles.linksRow}>
        <TouchableOpacity
          style={styles.linkCard}
          onPress={() => navigation.navigate("Portfolio")}
          testID="open-portfolio"
        >
          <Text style={styles.linkTitle}>我的组合</Text>
          <Text style={styles.linkHint}>持仓 · 每日研究</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.linkCard}
          onPress={() => navigation.navigate("Trends")}
          testID="open-trends"
        >
          <Text style={styles.linkTitle}>趋势方向</Text>
          <Text style={styles.linkHint}>发现新的 secular trend</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        style={styles.wideLinkCard}
        onPress={() => navigation.navigate("Brief")}
        testID="open-brief"
      >
        <Text style={styles.linkTitle}>每日简报 🎧</Text>
        <Text style={styles.linkHint}>股市 · 宏观 · 地缘政治 · 播客观点,开车也能听</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondary}
        onPress={() => navigation.navigate("HotStocks")}
        testID="browse-hot"
      >
        <Text style={styles.secondaryText}>或浏览过去一年大涨的股票 →</Text>
      </TouchableOpacity>

      <Disclaimer />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16 },
  title: { color: colors.text, fontSize: 22, fontWeight: "800" },
  sub: { color: colors.textMuted, fontSize: 14, lineHeight: 20, marginTop: 6 },
  section: { color: colors.text, fontSize: 14, fontWeight: "700", marginTop: 20, marginBottom: 8 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  chipText: { color: colors.text, fontSize: 13 },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    color: colors.text,
    fontSize: 15,
    padding: 12,
    marginTop: 12,
    minHeight: 90,
    textAlignVertical: "top",
  },
  horizons: { flexDirection: "row", gap: 8 },
  horizon: {
    flex: 1,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    padding: 10,
  },
  horizonActive: { borderColor: colors.accent, backgroundColor: colors.surfaceAlt },
  horizonText: { color: colors.text, fontSize: 15, fontWeight: "700" },
  horizonTextActive: { color: colors.accent },
  horizonHint: { color: colors.textMuted, fontSize: 11, marginTop: 3 },
  cta: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    padding: 15,
    alignItems: "center",
    marginTop: 24,
  },
  ctaDisabled: { opacity: 0.4 },
  ctaText: { color: colors.text, fontSize: 16, fontWeight: "700" },
  linksRow: { flexDirection: "row", gap: 8, marginTop: 12 },
  linkCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    padding: 12,
  },
  linkTitle: { color: colors.text, fontSize: 15, fontWeight: "700" },
  linkHint: { color: colors.textMuted, fontSize: 12, marginTop: 3 },
  wideLinkCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
  },
  secondary: { alignItems: "center", padding: 14 },
  secondaryText: { color: colors.textMuted, fontSize: 14 },
});
