import { StyleSheet, Text, View } from "react-native";

import { colors } from "../theme/colors";

const DEFAULT_TEXT =
  "Not financial advice. Tiers are AI-generated for informational purposes only.";

export const Disclaimer = ({ text = DEFAULT_TEXT }: { text?: string }) => (
  <View style={styles.box} testID="disclaimer">
    <Text style={styles.text}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  box: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    padding: 10,
    margin: 12,
  },
  text: { color: colors.textMuted, fontSize: 12, lineHeight: 16 },
});
