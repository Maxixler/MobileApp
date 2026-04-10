import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { DrawerContentScrollView } from "@react-navigation/drawer";
import { useBle } from "../context/BleContext";

const MENU_ITEMS = [
  { route: "Control", icon: "🎮", label: "Kontrol Paneli" },
  { route: "Connection", icon: "📡", label: "Bağlantı & Ayarlar" },
];

export default function DrawerContent(props) {
  const { connectedDevice, selectedBoard } = useBle();
  const currentRoute = props.state.routes[props.state.index]?.name;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <Text style={styles.logoIcon}>⚡</Text>
          <View>
            <Text style={styles.appTitle}>Deneyap</Text>
            <Text style={styles.appSubtitle}>
              {selectedBoard?.icon} {selectedBoard?.name || "Bluetooth Kontrol"}
            </Text>
          </View>
        </View>

        <View style={styles.statusCard}>
          <View style={[styles.statusDot, connectedDevice ? styles.dotOnline : styles.dotOffline]} />
          <View style={styles.statusTextWrap}>
            <Text style={styles.statusLabel}>
              {connectedDevice ? "Bağlı" : "Bağlantı Yok"}
            </Text>
            <Text style={styles.statusDevice} numberOfLines={1}>
              {connectedDevice?.name || connectedDevice?.id || "Cihaz bulunamadı"}
            </Text>
          </View>
        </View>
      </View>

      {/* Menu Items */}
      <DrawerContentScrollView {...props} contentContainerStyle={styles.scrollContent}>
        {MENU_ITEMS.map((item) => {
          const active = currentRoute === item.route;
          return (
            <TouchableOpacity
              key={item.route}
              style={[styles.menuItem, active && styles.menuItemActive]}
              onPress={() => props.navigation.navigate(item.route)}
              activeOpacity={0.7}
            >
              <Text style={styles.menuIcon}>{item.icon}</Text>
              <Text style={[styles.menuLabel, active && styles.menuLabelActive]}>
                {item.label}
              </Text>
              {active && <View style={styles.activeIndicator} />}
            </TouchableOpacity>
          );
        })}
      </DrawerContentScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Deneyap RC v2.0</Text>
        <Text style={styles.footerSub}>Expo SDK 51 • React Native 0.74</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0e1a",
  },
  header: {
    paddingTop: 52,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 18,
  },
  logoIcon: {
    fontSize: 32,
  },
  appTitle: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  appSubtitle: {
    color: "#64748b",
    fontSize: 12,
    fontWeight: "500",
    marginTop: 1,
  },
  statusCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 12,
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dotOnline: {
    backgroundColor: "#22c55e",
    shadowColor: "#22c55e",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
  },
  dotOffline: {
    backgroundColor: "#475569",
  },
  statusTextWrap: {
    flex: 1,
  },
  statusLabel: {
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  statusDevice: {
    color: "#e2e8f0",
    fontSize: 13,
    fontWeight: "500",
    marginTop: 1,
  },
  scrollContent: {
    paddingTop: 12,
    paddingHorizontal: 12,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 4,
    gap: 14,
    position: "relative",
  },
  menuItemActive: {
    backgroundColor: "rgba(14,165,233,0.12)",
  },
  menuIcon: {
    fontSize: 20,
  },
  menuLabel: {
    color: "#94a3b8",
    fontSize: 15,
    fontWeight: "600",
  },
  menuLabelActive: {
    color: "#38bdf8",
  },
  activeIndicator: {
    position: "absolute",
    left: 0,
    top: 10,
    bottom: 10,
    width: 3,
    borderRadius: 2,
    backgroundColor: "#0ea5e9",
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  footerText: {
    color: "#475569",
    fontSize: 12,
    fontWeight: "600",
  },
  footerSub: {
    color: "#334155",
    fontSize: 10,
    marginTop: 2,
  },
});
