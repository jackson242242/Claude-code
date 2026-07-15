import { createElement } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";

import { colors } from "../theme/colors";

/**
 * Web-only HTML5 audio player (the deployed prototype is the Expo web build,
 * where React renders real DOM). Native shows a pointer to the web app.
 */
export const AudioPlayer = ({ src }: { src: string }) => {
  if (Platform.OS !== "web") {
    return (
      <View style={styles.fallback} testID="audio-fallback">
        <Text style={styles.fallbackText}>音频请在网页版播放,或订阅播客 RSS 收听。</Text>
      </View>
    );
  }
  return (
    <View style={styles.player} testID="audio-player">
      {createElement("audio", { src, controls: true, preload: "none", style: { width: "100%" } })}
    </View>
  );
};

const styles = StyleSheet.create({
  player: { marginTop: 12 },
  fallback: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
  },
  fallbackText: { color: colors.textMuted, fontSize: 13 },
});
