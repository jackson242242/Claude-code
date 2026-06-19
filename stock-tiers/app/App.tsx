import { DarkTheme, NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";

import type { RootStackParamList } from "./src/navigation/types";
import { HotStocksScreen } from "./src/screens/HotStocksScreen";
import { TickerDetailScreen } from "./src/screens/TickerDetailScreen";
import { TierListScreen } from "./src/screens/TierListScreen";
import { colors } from "./src/theme/colors";

const Stack = createNativeStackNavigator<RootStackParamList>();

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
    primary: colors.accent,
  },
};

export default function App() {
  return (
    <NavigationContainer theme={navTheme}>
      <StatusBar style="light" />
      <Stack.Navigator>
        <Stack.Screen
          name="HotStocks"
          component={HotStocksScreen}
          options={{ title: "Hot Stocks (+50–100% / yr)" }}
        />
        <Stack.Screen
          name="TierList"
          component={TierListScreen}
          options={{ title: "Alternatives Tier List" }}
        />
        <Stack.Screen
          name="TickerDetail"
          component={TickerDetailScreen}
          options={{ title: "Stock Detail" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
