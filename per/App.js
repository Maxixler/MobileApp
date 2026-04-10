import "react-native-gesture-handler";
import React from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createDrawerNavigator } from "@react-navigation/drawer";

import { BleProvider } from "./src/context/BleContext";
import DrawerContent from "./src/components/DrawerContent";
import ControlScreen from "./src/screens/ControlScreen";
import ConnectionScreen from "./src/screens/ConnectionScreen";

const Drawer = createDrawerNavigator();

const SCREEN_OPTIONS = {
  headerStyle: {
    backgroundColor: "#0f172a",
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  headerTintColor: "#e2e8f0",
  headerTitleStyle: {
    fontWeight: "700",
    fontSize: 17,
  },
  drawerStyle: {
    width: 280,
    backgroundColor: "#0a0e1a",
  },
  sceneContainerStyle: {
    backgroundColor: "#0a0e1a",
  },
};

export default function App() {
  return (
    <BleProvider>
      <NavigationContainer>
        <Drawer.Navigator
          initialRouteName="Control"
          drawerContent={(props) => <DrawerContent {...props} />}
          screenOptions={SCREEN_OPTIONS}
        >
          <Drawer.Screen
            name="Control"
            component={ControlScreen}
            options={{ title: "Kontrol Paneli" }}
          />
          <Drawer.Screen
            name="Connection"
            component={ConnectionScreen}
            options={{ title: "Bağlantı & Ayarlar" }}
          />
        </Drawer.Navigator>
      </NavigationContainer>
      <StatusBar style="light" />
    </BleProvider>
  );
}
