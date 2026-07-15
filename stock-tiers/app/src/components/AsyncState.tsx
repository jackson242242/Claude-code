import type { ReactNode } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { colors } from "../theme/colors";

interface AsyncStateProps {
  loading: boolean;
  error: string | null;
  isEmpty?: boolean;
  emptyText?: string;
  onRetry?: () => void;
  children: ReactNode;
}

/**
 * Renders loading / error / empty states, or the children when data is ready.
 */
export const AsyncState = ({
  loading,
  error,
  isEmpty,
  emptyText = "Nothing to show.",
  onRetry,
  children,
}: AsyncStateProps) => {
  if (loading) {
    return (
      <View style={styles.center} testID="async-loading">
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.center} testID="async-error">
        <Text style={styles.errorText}>{error}</Text>
        {onRetry ? (
          <TouchableOpacity style={styles.retry} onPress={onRetry} testID="async-retry">
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  }
  if (isEmpty) {
    return (
      <View style={styles.center} testID="async-empty">
        <Text style={styles.emptyText}>{emptyText}</Text>
      </View>
    );
  }
  return <>{children}</>;
};

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  errorText: { color: colors.negative, textAlign: "center", marginBottom: 16, fontSize: 15 },
  emptyText: { color: colors.textMuted, textAlign: "center", fontSize: 15 },
  retry: {
    backgroundColor: colors.accent,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: { color: colors.text, fontWeight: "600" },
});
