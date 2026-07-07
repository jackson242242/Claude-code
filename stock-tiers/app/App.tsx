import { DarkTheme, NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";

import type { RootStackParamList } from "./src/navigation/types";
import { BriefScreen } from "./src/screens/BriefScreen";
import { HotStocksScreen } from "./src/screens/HotStocksScreen";
import { PortfolioScreen } from "./src/screens/PortfolioScreen";
import { ThesisInputScreen } from "./src/screens/ThesisInputScreen";
import { ThesisResultsScreen } from "./src/screens/ThesisResultsScreen";
import { TickerDetailScreen } from "./src/screens/TickerDetailScreen";
import { TierListScreen } from "./src/screens/TierListScreen";
import { TrendsScreen } from "./src/screens/TrendsScreen";
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
      <Stack.Navigator initialRouteName="ThesisInput">
        <Stack.Screen
          name="ThesisInput"
          component={ThesisInputScreen}
          options={{ title: "Stock Tiers" }}
        />
        <Stack.Screen
          name="ThesisResults"
          component={ThesisResultsScreen}
          options={{ title: "投资清单" }}
        />
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
        <Stack.Screen
          name="Portfolio"
          component={PortfolioScreen}
          options={{ title: "我的组合" }}
        />
        <Stack.Screen name="Trends" component={TrendsScreen} options={{ title: "趋势方向" }} />
        <Stack.Screen name="Brief" component={BriefScreen} options={{ title: "每日简报" }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
