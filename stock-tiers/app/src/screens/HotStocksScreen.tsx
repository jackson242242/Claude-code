import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { FlatList, StyleSheet, View } from "react-native";

import type { HotStock } from "../api/types";
import { AsyncState } from "../components/AsyncState";
import { Disclaimer } from "../components/Disclaimer";
import { TickerRow } from "../components/TickerRow";
import { useHotStocks } from "../hooks/useHotStocks";
import type { RootStackParamList } from "../navigation/types";
import { colors } from "../theme/colors";

type Props = NativeStackScreenProps<RootStackParamList, "HotStocks">;

export const HotStocksScreen = ({ navigation }: Props) => {
  const { data, loading, error, reload } = useHotStocks();

  return (
    <View style={styles.container}>
      <AsyncState
        loading={loading}
        error={error}
        isEmpty={data?.length === 0}
        emptyText="No stocks are up 50–100% right now."
        onRetry={reload}
      >
        <FlatList<HotStock>
          data={data ?? []}
          keyExtractor={(item) => item.ticker}
          ListHeaderComponent={<Disclaimer />}
          renderItem={({ item }) => (
            <TickerRow
              ticker={item.ticker}
              name={item.name}
              sector={item.sector}
              price={item.price}
              oneYearChangePct={item.oneYearChangePct}
              onPress={() =>
                navigation.navigate("TierList", {
                  hotStockTicker: item.ticker,
                  hotStockName: item.name,
                })
              }
            />
          )}
        />
      </AsyncState>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
});
