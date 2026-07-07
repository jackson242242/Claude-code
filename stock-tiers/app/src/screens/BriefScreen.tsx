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

import { runBrief } from "../api/endpoints";
import { ApiError } from "../api/client";
import type { BriefTopic, DailyBrief } from "../api/types";
import { AsyncState } from "../components/AsyncState";
import { AudioPlayer } from "../components/AudioPlayer";
import { Disclaimer } from "../components/Disclaimer";
import { useLatestBrief } from "../hooks/useLatestBrief";
import type { RootStackParamList } from "../navigation/types";
import { colors } from "../theme/colors";

type Props = NativeStackScreenProps<RootStackParamList, "Brief">;

const TOPIC_ORDER: BriefTopic[] = ["股市", "金融宏观", "地缘政治", "播客观点"];
const HORIZON_LABEL: Record<string, string> = { short: "短线", medium: "中线", long: "长期" };

export const BriefScreen = ({ navigation }: Props) => {
  const { data, loading, error, reload } = useLatestBrief();
  const [fresh, setFresh] = useState<DailyBrief | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [showScript, setShowScript] = useState(false);

  const brief = fresh ?? data;

  const handleRun = async () => {
    setBusy(true);
    setActionError(null);
    try {
      setFresh(await runBrief());
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "简报生成失败");
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.container}>
      <AsyncState loading={loading} error={error} onRetry={reload}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>每日简报</Text>
          <Text style={styles.sub}>
            每天自动扫描股市、金融宏观、地缘政治和行业播客里的大佬观点,浓缩成一份可以开车收听的音频。
          </Text>

          <TouchableOpacity
            style={[styles.runBtn, busy && styles.runBtnBusy]}
            onPress={handleRun}
            disabled={busy}
            testID="run-brief"
          >
            {busy ? (
              <ActivityIndicator size="small" color={colors.text} />
            ) : (
              <Text style={styles.runBtnText}>生成今日简报</Text>
            )}
          </TouchableOpacity>
          {busy ? (
            <Text style={styles.busyHint}>联网搜索 + 撰稿 + 语音合成,大约需要 1–3 分钟…</Text>
          ) : null}
          {actionError ? <Text style={styles.actionError}>{actionError}</Text> : null}

          {brief ? (
            <>
              <View style={styles.headCard}>
                <Text style={styles.briefDate}>{brief.date}</Text>
                <Text style={styles.briefTitle}>{brief.title}</Text>
                {brief.audioUrl ? (
                  <AudioPlayer src={brief.audioUrl} />
                ) : (
                  <Text style={styles.noAudio}>本期语音合成失败,请阅读下方文字稿。</Text>
                )}
              </View>

              {TOPIC_ORDER.map((topic) => {
                const items = brief.highlights.filter((h) => h.topic === topic);
                if (items.length === 0) return null;
                return (
                  <View key={topic}>
                    <Text style={styles.section}>{topic}</Text>
                    {items.map((h, i) => (
                      <View key={i} style={styles.card}>
                        <Text style={styles.headline}>{h.headline}</Text>
                        <Text style={styles.detail}>{h.detail}</Text>
                      </View>
                    ))}
                  </View>
                );
              })}

              {brief.swingTheses.length > 0 ? (
                <>
                  <Text style={styles.section}>波段研究思路</Text>
                  {brief.swingTheses.map((t) => (
                    <TouchableOpacity
                      key={t.name}
                      style={styles.thesis}
                      testID={`swing-${t.name}`}
                      onPress={() =>
                        navigation.navigate("ThesisResults", {
                          thesis: t.thesis,
                          horizon: t.horizon,
                          trendName: t.name,
                        })
                      }
                    >
                      <View style={styles.thesisTop}>
                        <Text style={styles.thesisName}>{t.name}</Text>
                        <Text style={styles.thesisHorizon}>
                          {HORIZON_LABEL[t.horizon] ?? t.horizon}
                        </Text>
                      </View>
                      <Text style={styles.thesisBody}>{t.thesis}</Text>
                      {t.whyNow ? <Text style={styles.whyNow}>为什么是现在:{t.whyNow}</Text> : null}
                      <Text style={styles.thesisCta}>生成这个思路的投资清单 →</Text>
                    </TouchableOpacity>
                  ))}
                </>
              ) : null}

              <TouchableOpacity
                style={styles.scriptToggle}
                onPress={() => setShowScript((v) => !v)}
                testID="toggle-script"
              >
                <Text style={styles.scriptToggleText}>
                  {showScript ? "收起文字稿 ▲" : "查看文字稿 ▼"}
                </Text>
              </TouchableOpacity>
              {showScript ? <Text style={styles.script}>{brief.script}</Text> : null}

              <View style={styles.podcastHint}>
                <Text style={styles.podcastHintText}>
                  想在播客 App 里自动收到每期?订阅 RSS:本站地址 + /podcast.xml
                  (Spotify 需经 Spotify for Creators 提交;Apple Podcasts / Pocket Casts
                  可直接添加私有 RSS)。
                </Text>
              </View>
            </>
          ) : (
            <View style={styles.card}>
              <Text style={styles.emptyText} testID="no-brief">
                还没有简报——点「生成今日简报」出第一期;配好每日定时任务后,每天自动更新。
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
  runBtn: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    padding: 13,
    alignItems: "center",
    marginTop: 16,
  },
  runBtnBusy: { opacity: 0.6 },
  runBtnText: { color: colors.text, fontSize: 15, fontWeight: "700" },
  busyHint: { color: colors.textMuted, fontSize: 12, textAlign: "center", marginTop: 8 },
  actionError: { color: colors.negative, fontSize: 13, marginTop: 10 },
  headCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginTop: 14,
  },
  briefDate: { color: colors.accent, fontSize: 12, fontWeight: "700", letterSpacing: 1 },
  briefTitle: { color: colors.text, fontSize: 18, fontWeight: "800", marginTop: 4 },
  noAudio: { color: colors.textMuted, fontSize: 13, marginTop: 10 },
  section: { color: colors.text, fontSize: 15, fontWeight: "700", marginTop: 18, marginBottom: 8 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  headline: { color: colors.text, fontSize: 14, fontWeight: "700" },
  detail: { color: colors.textMuted, fontSize: 13, lineHeight: 19, marginTop: 4 },
  thesis: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderColor: colors.accent,
    borderWidth: StyleSheet.hairlineWidth,
  },
  thesisTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  thesisName: { color: colors.text, fontSize: 15, fontWeight: "800", flex: 1, paddingRight: 8 },
  thesisHorizon: {
    color: colors.accent,
    fontSize: 12,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    overflow: "hidden",
  },
  thesisBody: { color: colors.text, fontSize: 14, lineHeight: 20, marginTop: 6 },
  whyNow: { color: colors.textMuted, fontSize: 13, lineHeight: 18, marginTop: 4 },
  thesisCta: { color: colors.accent, fontSize: 13, fontWeight: "600", marginTop: 8 },
  scriptToggle: { alignItems: "center", padding: 12, marginTop: 6 },
  scriptToggleText: { color: colors.accent, fontSize: 13, fontWeight: "600" },
  script: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 22,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
  },
  podcastHint: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 10,
    padding: 12,
    marginTop: 14,
  },
  podcastHintText: { color: colors.textMuted, fontSize: 12, lineHeight: 18 },
  emptyText: { color: colors.textMuted, fontSize: 14, lineHeight: 20 },
});
