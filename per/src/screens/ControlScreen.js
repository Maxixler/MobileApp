import React, { useCallback, useRef } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Slider from "@react-native-community/slider";
import { useBle, SENSOR_KEYS } from "../context/BleContext";

const DIRECTION_ICONS = {
  forward: require("../../assets/up.png"),
  left: require("../../assets/left.png"),
  right: require("../../assets/right.png"),
  backward: require("../../assets/down.png"),
};

const SENSOR_META = {
  distance: { icon: "📏", unit: "cm", color: "#0ea5e9", label: "Mesafe" },
  temperature: { icon: "🌡️", unit: "°C", color: "#f59e0b", label: "Sıcaklık" },
  light: { icon: "💡", unit: "lux", color: "#a78bfa", label: "Işık" },
  battery: { icon: "🔋", unit: "V", color: "#22c55e", label: "Batarya" },
};

export default function ControlScreen({ navigation }) {
  const {
    connectedDevice,
    canControl,
    speed,
    setSpeed,
    autoPollSensors,
    setAutoPollSensors,
    sensorValues,
    runMotion,
    requestSensor,
  } = useBle();

  const handleDirection = useCallback(
    (dir) => {
      runMotion(dir);
    },
    [runMotion]
  );

  // ── No connection overlay ──
  if (!canControl) {
    return (
      <View style={styles.screen}>
        <View style={styles.noConnOverlay}>
          <Text style={styles.noConnIcon}>📡</Text>
          <Text style={styles.noConnTitle}>Bağlantı Yok</Text>
          <Text style={styles.noConnDesc}>
            Kontrol panelini kullanmak için önce bir Deneyap cihazına bağlanın.
          </Text>
          <TouchableOpacity
            style={styles.noConnBtn}
            onPress={() => navigation.navigate("Connection")}
            activeOpacity={0.7}
          >
            <Text style={styles.noConnBtnText}>Bağlantı Sayfasına Git</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* ── HUD Top Bar ── */}
        <View style={styles.hudBar}>
          <View style={styles.hudItem}>
            <View style={[styles.hudDot, styles.hudDotOn]} />
            <Text style={styles.hudLabel}>{connectedDevice?.name || "Bağlı"}</Text>
          </View>
          <View style={styles.hudCenter}>
            <Text style={styles.hudSpeedNum}>{Math.round(speed)}</Text>
            <Text style={styles.hudSpeedUnit}>%</Text>
          </View>
          <View style={styles.hudItem}>
            <Text style={styles.hudBatteryIcon}>🔋</Text>
            <Text style={styles.hudLabel}>
              {sensorValues.battery !== "-" ? `${sensorValues.battery}V` : "--"}
            </Text>
          </View>
        </View>

        {/* ── Sensor HUD Cards ── */}
        <View style={styles.sensorGrid}>
          {SENSOR_KEYS.map((key) => {
            const meta = SENSOR_META[key];
            const val = sensorValues[key];
            return (
              <TouchableOpacity
                key={key}
                style={styles.sensorCard}
                onPress={() => requestSensor(key)}
                activeOpacity={0.7}
              >
                <Text style={styles.sensorIcon}>{meta.icon}</Text>
                <Text style={styles.sensorLabel}>{meta.label}</Text>
                <View style={styles.sensorValueRow}>
                  <Text style={[styles.sensorValue, { color: meta.color }]}>
                    {String(val)}
                  </Text>
                  <Text style={styles.sensorUnit}>{meta.unit}</Text>
                </View>
                {/* Bar indicator */}
                <View style={styles.sensorBarBg}>
                  <View
                    style={[
                      styles.sensorBarFill,
                      {
                        backgroundColor: meta.color,
                        width: val !== "-" ? `${Math.min(Number(val) || 0, 100)}%` : "0%",
                      },
                    ]}
                  />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.autoPollRow}>
          <Text style={styles.autoPollLabel}>Otomatik Sensör Okuma</Text>
          <Switch
            value={autoPollSensors}
            onValueChange={setAutoPollSensors}
            trackColor={{ false: "#1e293b", true: "rgba(14,165,233,0.3)" }}
            thumbColor={autoPollSensors ? "#0ea5e9" : "#475569"}
          />
        </View>

        {/* ── Speed Slider ── */}
        <View style={styles.speedCard}>
          <View style={styles.speedHeader}>
            <Text style={styles.speedTitle}>⚡ Hız Kontrolü</Text>
            <Text style={styles.speedValue}>{Math.round(speed)}%</Text>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={100}
            step={1}
            value={speed}
            onValueChange={setSpeed}
            minimumTrackTintColor="#0ea5e9"
            maximumTrackTintColor="#1e293b"
            thumbTintColor="#38bdf8"
          />
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabel}>0</Text>
            <Text style={styles.sliderLabel}>50</Text>
            <Text style={styles.sliderLabel}>100</Text>
          </View>
        </View>

        {/* ── D-Pad ── */}
        <View style={styles.dpadCard}>
          <Text style={styles.dpadTitle}>🕹️ Yön Kontrolü</Text>
          <View style={styles.pad}>
            {/* Forward */}
            <TouchableOpacity
              style={[styles.arrowBtn, styles.arrowUp]}
              onPress={() => handleDirection("forward")}
              activeOpacity={0.6}
            >
              <Image source={DIRECTION_ICONS.forward} style={styles.arrowImg} />
              <Text style={styles.arrowLabel}>İLERİ</Text>
            </TouchableOpacity>

            {/* Left */}
            <TouchableOpacity
              style={[styles.arrowBtn, styles.arrowLeft]}
              onPress={() => handleDirection("left")}
              activeOpacity={0.6}
            >
              <Image source={DIRECTION_ICONS.left} style={styles.arrowImg} />
              <Text style={styles.arrowLabel}>SOL</Text>
            </TouchableOpacity>

            {/* Stop */}
            <TouchableOpacity
              style={styles.stopBtn}
              onPress={() => handleDirection("stop")}
              activeOpacity={0.6}
            >
              <Text style={styles.stopText}>ACİL{"\n"}DUR</Text>
            </TouchableOpacity>

            {/* Right */}
            <TouchableOpacity
              style={[styles.arrowBtn, styles.arrowRight]}
              onPress={() => handleDirection("right")}
              activeOpacity={0.6}
            >
              <Image source={DIRECTION_ICONS.right} style={styles.arrowImg} />
              <Text style={styles.arrowLabel}>SAĞ</Text>
            </TouchableOpacity>

            {/* Backward */}
            <TouchableOpacity
              style={[styles.arrowBtn, styles.arrowDown]}
              onPress={() => handleDirection("backward")}
              activeOpacity={0.6}
            >
              <Image source={DIRECTION_ICONS.backward} style={styles.arrowImg} />
              <Text style={styles.arrowLabel}>GERİ</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#0a0e1a",
  },
  container: {
    padding: 16,
    gap: 14,
  },
  // ── No Connection ──
  noConnOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  noConnIcon: {
    fontSize: 56,
    marginBottom: 16,
  },
  noConnTitle: {
    color: "#f1f5f9",
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 8,
  },
  noConnDesc: {
    color: "#64748b",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 28,
  },
  noConnBtn: {
    backgroundColor: "#0ea5e9",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 14,
  },
  noConnBtnText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 15,
  },
  // ── HUD Bar ──
  hudBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#111827",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  hudItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  hudDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  hudDotOn: {
    backgroundColor: "#22c55e",
  },
  hudLabel: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "600",
  },
  hudCenter: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 2,
  },
  hudSpeedNum: {
    color: "#0ea5e9",
    fontSize: 28,
    fontWeight: "900",
  },
  hudSpeedUnit: {
    color: "#475569",
    fontSize: 14,
    fontWeight: "700",
  },
  hudBatteryIcon: {
    fontSize: 14,
  },
  // ── Sensor Grid ──
  sensorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  sensorCard: {
    width: "48%",
    flexGrow: 1,
    backgroundColor: "#111827",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    gap: 4,
  },
  sensorIcon: {
    fontSize: 18,
  },
  sensorLabel: {
    color: "#64748b",
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  sensorValueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  sensorValue: {
    fontSize: 22,
    fontWeight: "800",
  },
  sensorUnit: {
    color: "#475569",
    fontSize: 12,
    fontWeight: "500",
  },
  sensorBarBg: {
    height: 3,
    backgroundColor: "#1e293b",
    borderRadius: 2,
    marginTop: 4,
    overflow: "hidden",
  },
  sensorBarFill: {
    height: "100%",
    borderRadius: 2,
  },
  autoPollRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#111827",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  autoPollLabel: {
    color: "#94a3b8",
    fontSize: 13,
    fontWeight: "600",
  },
  // ── Speed Slider ──
  speedCard: {
    backgroundColor: "#111827",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  speedHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  speedTitle: {
    color: "#f1f5f9",
    fontSize: 15,
    fontWeight: "700",
  },
  speedValue: {
    color: "#0ea5e9",
    fontSize: 18,
    fontWeight: "900",
  },
  slider: {
    width: "100%",
    height: 40,
  },
  sliderLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  sliderLabel: {
    color: "#334155",
    fontSize: 10,
    fontWeight: "600",
  },
  // ── D-Pad ──
  dpadCard: {
    backgroundColor: "#111827",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
  },
  dpadTitle: {
    color: "#f1f5f9",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 12,
    alignSelf: "flex-start",
  },
  pad: {
    position: "relative",
    width: 260,
    height: 260,
    alignItems: "center",
    justifyContent: "center",
  },
  arrowBtn: {
    position: "absolute",
    width: 74,
    height: 74,
    borderRadius: 18,
    backgroundColor: "rgba(14,165,233,0.08)",
    borderWidth: 1.5,
    borderColor: "rgba(14,165,233,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  arrowUp: {
    top: 0,
    left: 93,
  },
  arrowDown: {
    bottom: 0,
    left: 93,
  },
  arrowLeft: {
    left: 0,
    top: 93,
  },
  arrowRight: {
    right: 0,
    top: 93,
  },
  arrowImg: {
    width: 28,
    height: 28,
    resizeMode: "contain",
    tintColor: "#38bdf8",
  },
  arrowLabel: {
    color: "#475569",
    fontSize: 8,
    fontWeight: "700",
    marginTop: 2,
    letterSpacing: 0.5,
  },
  stopBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#ef4444",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#ef4444",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  stopText: {
    color: "#ffffff",
    fontWeight: "900",
    fontSize: 11,
    textAlign: "center",
    lineHeight: 14,
  },
});
