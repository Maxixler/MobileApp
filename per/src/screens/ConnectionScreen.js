import React, { useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useBle, MOTOR_PIN_FIELDS } from "../context/BleContext";
import { BOARD_LIST } from "../config/bleConfig";

export default function ConnectionScreen({ navigation }) {
  const {
    selectedBoardId,
    selectedBoard,
    selectBoard,
    permissionGranted,
    devices,
    isScanning,
    isConnecting,
    connectedDevice,
    canControl,
    logs,
    motorPins,
    pinConfigApplied,
    scan,
    stopScan,
    connect,
    disconnect,
    applyPinMapping,
    updateMotorPin,
  } = useBle();

  const deviceCountLabel = useMemo(
    () => `${devices.length} cihaz bulundu`,
    [devices.length]
  );

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* ── Board Selection Card ── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>🛠️</Text>
            <View>
              <Text style={styles.cardTitle}>Kart Seçimi</Text>
              <Text style={styles.cardMeta}>
                Aktif: {selectedBoard?.icon} {selectedBoard?.name}
              </Text>
            </View>
          </View>

          <View style={styles.boardGrid}>
            {BOARD_LIST.map((board) => {
              const active = board.id === selectedBoardId;
              return (
                <TouchableOpacity
                  key={board.id}
                  style={[styles.boardCard, active && styles.boardCardActive]}
                  onPress={() => selectBoard(board.id)}
                  activeOpacity={0.7}
                  disabled={!!connectedDevice}
                >
                  <Text style={styles.boardIcon}>{board.icon}</Text>
                  <Text style={[styles.boardName, active && styles.boardNameActive]}>
                    {board.name}
                  </Text>
                  <Text style={styles.boardDesc} numberOfLines={1}>
                    {board.description}
                  </Text>
                  {active && <View style={styles.boardActiveDot} />}
                </TouchableOpacity>
              );
            })}
          </View>

          {connectedDevice && (
            <Text style={styles.boardWarning}>
              ⚠️ Bağlı iken kart değiştirilemez. Önce bağlantıyı kesin.
            </Text>
          )}
        </View>

        {/* ── BLE Connection Card ── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>📡</Text>
            <View>
              <Text style={styles.cardTitle}>Bluetooth Bağlantısı</Text>
              <Text style={styles.cardMeta}>
                İzin: {permissionGranted ? "✅ Hazır" : "❌ Eksik"} • {deviceCountLabel}
              </Text>
            </View>
          </View>

          {/* Scan Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.btnPrimary, (isScanning || isConnecting) && styles.btnDisabled]}
              onPress={scan}
              disabled={isScanning || isConnecting}
              activeOpacity={0.7}
            >
              <Text style={styles.btnPrimaryText}>
                {isScanning ? "Taranıyor..." : "🔍 Cihaz Tara"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btnSecondary, !isScanning && styles.btnDisabled]}
              onPress={stopScan}
              disabled={!isScanning}
              activeOpacity={0.7}
            >
              <Text style={styles.btnSecondaryText}>Durdur</Text>
            </TouchableOpacity>
          </View>

          {isConnecting && (
            <ActivityIndicator style={styles.loader} size="small" color="#0ea5e9" />
          )}

          {/* Device List */}
          <FlatList
            data={devices}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <View style={styles.deviceRow}>
                <View style={styles.deviceMeta}>
                  <Text style={styles.deviceName}>{item.name || "Adsız Cihaz"}</Text>
                  <Text style={styles.deviceId}>{item.id}</Text>
                </View>
                <TouchableOpacity
                  style={styles.connectBtn}
                  onPress={() => connect(item.id, item.name)}
                  disabled={isConnecting}
                  activeOpacity={0.7}
                >
                  <Text style={styles.connectBtnText}>Bağlan</Text>
                </TouchableOpacity>
              </View>
            )}
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                {isScanning ? "⏳ Tarama devam ediyor..." : "Eşleşen cihazlar burada görünecek"}
              </Text>
            }
          />

          {/* Connected Device */}
          <View style={styles.connectedRow}>
            <View style={styles.connectedInfo}>
              <View style={[styles.connDot, connectedDevice ? styles.dotOn : styles.dotOff]} />
              <Text style={styles.connectedText} numberOfLines={1}>
                {connectedDevice?.name || connectedDevice?.id || "Bağlı değil"}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.btnDanger, !connectedDevice && styles.btnDisabled]}
              onPress={disconnect}
              disabled={!connectedDevice}
              activeOpacity={0.7}
            >
              <Text style={styles.btnDangerText}>Bağlantıyı Kes</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Motor Pin Mapping Card ── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>🔧</Text>
            <View>
              <Text style={styles.cardTitle}>Motor Pin Eşleme</Text>
              <Text style={styles.cardMeta}>
                Durum: {pinConfigApplied ? "✅ Uygulandı" : "⏳ Beklemede"}
              </Text>
            </View>
          </View>

          {MOTOR_PIN_FIELDS.map((field) => (
            <View style={styles.pinRow} key={field.key}>
              <Text style={styles.pinLabel}>{field.label}</Text>
              <TextInput
                style={styles.pinInput}
                value={motorPins[field.key]}
                onChangeText={(text) => updateMotorPin(field.key, text)}
                autoCapitalize="characters"
                autoCorrect={false}
                placeholder="Ör. D5"
                placeholderTextColor="#475569"
                selectionColor="#0ea5e9"
              />
            </View>
          ))}

          <TouchableOpacity
            style={[styles.btnPrimary, !canControl && styles.btnDisabled]}
            onPress={applyPinMapping}
            disabled={!canControl}
            activeOpacity={0.7}
          >
            <Text style={styles.btnPrimaryText}>Pin Eşlemeyi Uygula</Text>
          </TouchableOpacity>
        </View>

        {/* ── Live Log Card ── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>📋</Text>
            <Text style={styles.cardTitle}>Canlı Log</Text>
          </View>

          {logs.length === 0 ? (
            <Text style={styles.emptyText}>Henüz log yok</Text>
          ) : (
            logs.map((entry, idx) => (
              <Text key={`${entry}-${idx}`} style={styles.logLine}>
                {entry}
              </Text>
            ))
          )}
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
  // ── Card ──
  card: {
    backgroundColor: "#111827",
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 4,
  },
  cardIcon: {
    fontSize: 22,
  },
  cardTitle: {
    color: "#f1f5f9",
    fontSize: 17,
    fontWeight: "700",
  },
  cardMeta: {
    color: "#64748b",
    fontSize: 12,
    marginTop: 2,
  },
  // ── Buttons ──
  buttonRow: {
    flexDirection: "row",
    gap: 10,
  },
  btnPrimary: {
    flex: 1,
    backgroundColor: "#0ea5e9",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  btnPrimaryText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 14,
  },
  btnSecondary: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  btnSecondaryText: {
    color: "#94a3b8",
    fontWeight: "700",
    fontSize: 14,
  },
  btnDanger: {
    backgroundColor: "rgba(239,68,68,0.15)",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  btnDangerText: {
    color: "#f87171",
    fontWeight: "700",
    fontSize: 12,
  },
  btnDisabled: {
    opacity: 0.4,
  },
  loader: {
    marginVertical: 4,
  },
  // ── Devices ──
  deviceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.04)",
    gap: 10,
  },
  deviceMeta: {
    flex: 1,
  },
  deviceName: {
    color: "#e2e8f0",
    fontWeight: "600",
    fontSize: 14,
  },
  deviceId: {
    color: "#475569",
    fontSize: 10,
    marginTop: 2,
  },
  connectBtn: {
    backgroundColor: "#0ea5e9",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
  },
  connectBtnText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 13,
  },
  emptyText: {
    color: "#475569",
    fontSize: 12,
    textAlign: "center",
    paddingVertical: 8,
  },
  connectedRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
    gap: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.04)",
  },
  connectedInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  connDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotOn: {
    backgroundColor: "#22c55e",
  },
  dotOff: {
    backgroundColor: "#475569",
  },
  connectedText: {
    color: "#94a3b8",
    fontSize: 12,
    flex: 1,
  },
  // ── Pin Mapping ──
  pinRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  pinLabel: {
    flex: 1,
    color: "#cbd5e1",
    fontWeight: "600",
    fontSize: 13,
  },
  pinInput: {
    width: 100,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "rgba(255,255,255,0.04)",
    color: "#f1f5f9",
    fontWeight: "600",
    fontSize: 14,
    textAlign: "center",
  },
  // ── Log ──
  logLine: {
    color: "#94a3b8",
    fontSize: 10,
    fontFamily: "monospace",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.03)",
    paddingVertical: 3,
  },
  // ── Board Selection ──
  boardGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  boardCard: {
    width: "47%",
    flexGrow: 1,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.06)",
    gap: 3,
    position: "relative",
    overflow: "hidden",
  },
  boardCardActive: {
    borderColor: "#0ea5e9",
    backgroundColor: "rgba(14,165,233,0.08)",
  },
  boardIcon: {
    fontSize: 22,
    marginBottom: 2,
  },
  boardName: {
    color: "#94a3b8",
    fontSize: 13,
    fontWeight: "700",
  },
  boardNameActive: {
    color: "#38bdf8",
  },
  boardDesc: {
    color: "#475569",
    fontSize: 10,
  },
  boardActiveDot: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#0ea5e9",
  },
  boardWarning: {
    color: "#f59e0b",
    fontSize: 11,
    textAlign: "center",
    paddingTop: 4,
  },
});
