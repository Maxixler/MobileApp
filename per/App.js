import React, { useEffect, useMemo, useState } from "react";
import { StatusBar } from "expo-status-bar";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Slider from "@react-native-community/slider";

import {
  buildMotorCommand,
  buildPinMapCommand,
  buildSensorReadCommand,
  buildStopCommand,
  parseIncomingPayload,
} from "./src/protocol/deneyapProtocol";
import { bleService } from "./src/services/bleService";

const SENSOR_KEYS = ["distance", "temperature", "light", "battery"];
const MOTOR_PIN_FIELDS = [
  { key: "leftEnablePin", label: "Sol PWM (ENA)" },
  { key: "leftIn1Pin", label: "Sol IN1" },
  { key: "leftIn2Pin", label: "Sol IN2" },
  { key: "rightEnablePin", label: "Sag PWM (ENB)" },
  { key: "rightIn1Pin", label: "Sag IN1" },
  { key: "rightIn2Pin", label: "Sag IN2" },
];

const DIRECTION_ICONS = {
  forward: require("./assets/up.png"),
  left: require("./assets/left.png"),
  right: require("./assets/right.png"),
  backward: require("./assets/down.png"),
};

const toMotorConfig = (mode, speed) => {
  switch (mode) {
    case "forward":
      return {
        leftPwm: speed,
        rightPwm: speed,
        leftDirection: "forward",
        rightDirection: "forward",
      };
    case "backward":
      return {
        leftPwm: speed,
        rightPwm: speed,
        leftDirection: "backward",
        rightDirection: "backward",
      };
    case "left":
      return {
        leftPwm: Math.round(speed * 0.45),
        rightPwm: speed,
        leftDirection: "forward",
        rightDirection: "forward",
      };
    case "right":
      return {
        leftPwm: speed,
        rightPwm: Math.round(speed * 0.45),
        leftDirection: "forward",
        rightDirection: "forward",
      };
    default:
      return {
        leftPwm: 0,
        rightPwm: 0,
        leftDirection: "stop",
        rightDirection: "stop",
      };
  }
};

export default function App() {
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [devices, setDevices] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectedDevice, setConnectedDevice] = useState(null);
  const [speed, setSpeed] = useState(45);
  const [autoPollSensors, setAutoPollSensors] = useState(true);
  const [sensorValues, setSensorValues] = useState({
    distance: "-",
    temperature: "-",
    light: "-",
    battery: "-",
  });
  const [logs, setLogs] = useState([]);
  const [motorPins, setMotorPins] = useState({
    leftEnablePin: "D5",
    leftIn1Pin: "D6",
    leftIn2Pin: "D7",
    rightEnablePin: "D9",
    rightIn1Pin: "D10",
    rightIn2Pin: "D11",
  });
  const [pinConfigApplied, setPinConfigApplied] = useState(false);

  const canControl = !!connectedDevice;

  const appendLog = (line) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [`${timestamp} | ${line}`, ...prev].slice(0, 40));
  };

  const validateMotorPins = (pins) => {
    const normalized = {};

    for (const field of MOTOR_PIN_FIELDS) {
      const raw = String(pins[field.key] || "").trim().toUpperCase();
      if (!raw) {
        return { ok: false, error: `${field.label} bos birakilamaz` };
      }

      if (!/^[A-Z]?\d+$/.test(raw)) {
        return { ok: false, error: `${field.label} gecersiz formatta` };
      }

      normalized[field.key] = raw;
    }

    const unique = new Set(Object.values(normalized));
    if (unique.size !== MOTOR_PIN_FIELDS.length) {
      return { ok: false, error: "Ayni pin birden fazla goreve atanmis" };
    }

    return { ok: true, value: normalized };
  };

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      const granted = await bleService.requestPermissions();
      if (!mounted) {
        return;
      }

      setPermissionGranted(granted);
      appendLog(granted ? "Bluetooth izinleri hazır" : "Bluetooth izinleri reddedildi");
    };

    bootstrap();

    return () => {
      mounted = false;
      bleService.disconnect().catch(() => null);
      bleService.destroy();
    };
  }, []);

  useEffect(() => {
    if (!connectedDevice || !autoPollSensors) {
      return undefined;
    }

    const timer = setInterval(() => {
      SENSOR_KEYS.forEach((key) => {
        sendCommand(buildSensorReadCommand(key)).catch(() => null);
      });
    }, 2500);

    return () => clearInterval(timer);
  }, [connectedDevice, autoPollSensors]);

  const scan = async () => {
    if (!permissionGranted) {
      Alert.alert("Bluetooth", "Tarama için gerekli izinler verilmedi.");
      return;
    }

    setDevices([]);
    setIsScanning(true);

    bleService.startScan(
      (device) => {
        setDevices((prev) => [...prev, device]);
      },
      (error) => {
        appendLog(`Tarama hatasi: ${error.message}`);
        setIsScanning(false);
      },
    );

    appendLog("Tarama baslatildi");

    setTimeout(() => {
      bleService.stopScan();
      setIsScanning(false);
      appendLog("Tarama durduruldu");
    }, 9000);
  };

  const stopScan = () => {
    bleService.stopScan();
    setIsScanning(false);
    appendLog("Tarama manuel durduruldu");
  };

  const connect = async (deviceId, name) => {
    setIsConnecting(true);

    try {
      const device = await bleService.connect(deviceId);
      setConnectedDevice(device);
      setPinConfigApplied(false);
      appendLog(`${name || "Bilinmeyen"} baglandi`);

      await bleService.startNotifications(
        (message) => {
          const parsed = parseIncomingPayload(message);

          if (parsed.type === "sensor") {
            setSensorValues((prev) => ({ ...prev, ...parsed.values }));
          }

          if (parsed.type === "sensor-value" && parsed.sensor) {
            setSensorValues((prev) => ({ ...prev, [parsed.sensor]: parsed.value }));
          }

          appendLog(`RX: ${message}`);
        },
        (error) => appendLog(`Bildirim hatasi: ${error.message}`),
      );

      Alert.alert(
        "Baglanti",
        "Eslesme gerekiyorsa Android sistem eslesme penceresi otomatik acilacaktir.",
      );
    } catch (error) {
      appendLog(`Baglanti hatasi: ${error.message}`);
      Alert.alert("Baglanti hatasi", error.message);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = async () => {
    try {
      await bleService.disconnect();
      setConnectedDevice(null);
      setPinConfigApplied(false);
      appendLog("Baglanti kesildi");
    } catch (error) {
      appendLog(`Baglanti kesme hatasi: ${error.message}`);
    }
  };

  const applyPinMapping = async () => {
    if (!connectedDevice) {
      Alert.alert("Pin esleme", "Pinleri gondermek icin once cihaza baglanin.");
      return false;
    }

    const check = validateMotorPins(motorPins);
    if (!check.ok) {
      Alert.alert("Pin dogrulama", check.error);
      appendLog(`Pin dogrulama hatasi: ${check.error}`);
      return false;
    }

    try {
      await sendCommand(buildPinMapCommand(check.value));
      setPinConfigApplied(true);
      appendLog("Motor pin esleme cihaza gonderildi");
      return true;
    } catch (error) {
      appendLog(`Pin map gonderme hatasi: ${error.message}`);
      Alert.alert("Pin gonderim hatasi", error.message);
      return false;
    }
  };

  const updateMotorPin = (key, value) => {
    setMotorPins((prev) => ({ ...prev, [key]: value }));
    setPinConfigApplied(false);
  };

  const sendCommand = async (command) => {
    if (!connectedDevice) {
      throw new Error("Bagli cihaz yok");
    }

    await bleService.sendTextMessage(command);
    appendLog(`TX: ${command}`);
  };

  const runMotion = async (mode) => {
    if (!canControl) {
      Alert.alert("Motor", "Once cihaza baglanin.");
      return;
    }

    const command = mode === "stop"
      ? buildStopCommand()
      : buildMotorCommand(toMotorConfig(mode, Math.round(speed)));

    try {
      if (!pinConfigApplied) {
        const applied = await applyPinMapping();
        if (!applied) {
          return;
        }
      }

      await sendCommand(command);
    } catch (error) {
      appendLog(`Motor komutu hatasi: ${error.message}`);
    }
  };

  const requestSensor = async (sensorKey) => {
    if (!canControl) {
      return;
    }

    try {
      await sendCommand(buildSensorReadCommand(sensorKey));
    } catch (error) {
      appendLog(`Sensor komutu hatasi: ${error.message}`);
    }
  };

  const deviceCountLabel = useMemo(() => `${devices.length} cihaz bulundu`, [devices.length]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Deneyap Bluetooth Kontrol Paneli</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Baglanti</Text>
          <Text style={styles.metaText}>
            Izin durumu: {permissionGranted ? "Hazir" : "Eksik"}
          </Text>
          <Text style={styles.metaText}>{deviceCountLabel}</Text>

          <View style={styles.row}>
            <TouchableOpacity style={styles.actionButton} onPress={scan} disabled={isScanning || isConnecting}>
              <Text style={styles.actionButtonText}>Cihaz Tara</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} onPress={stopScan} disabled={!isScanning}>
              <Text style={styles.secondaryButtonText}>Taramayi Durdur</Text>
            </TouchableOpacity>
          </View>

          {isConnecting && <ActivityIndicator style={styles.loader} size="small" color="#0f766e" />}

          <FlatList
            data={devices}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <View style={styles.deviceRow}>
                <View style={styles.deviceMeta}>
                  <Text style={styles.deviceName}>{item.name || "Adsiz Cihaz"}</Text>
                  <Text style={styles.deviceId}>{item.id}</Text>
                </View>

                <TouchableOpacity
                  style={styles.connectButton}
                  onPress={() => connect(item.id, item.name)}
                  disabled={isConnecting}
                >
                  <Text style={styles.connectButtonText}>Baglan</Text>
                </TouchableOpacity>
              </View>
            )}
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                {isScanning ? "Tarama devam ediyor..." : "Eslesen cihazlar burada listelenecek"}
              </Text>
            }
          />

          <View style={styles.connectedRow}>
            <Text style={styles.connectedText}>
              Aktif cihaz: {connectedDevice?.name || connectedDevice?.id || "Yok"}
            </Text>
            <TouchableOpacity style={styles.dangerButton} onPress={disconnect} disabled={!connectedDevice}>
              <Text style={styles.dangerButtonText}>Baglantiyi Kes</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Motor Pin Esleme</Text>
          <Text style={styles.metaText}>
            Pinleri uygulamadan sec, degisiklikte yeniden uygula.
          </Text>

          {MOTOR_PIN_FIELDS.map((field) => (
            <View style={styles.pinRow} key={field.key}>
              <Text style={styles.pinLabel}>{field.label}</Text>
              <TextInput
                style={styles.pinInput}
                value={motorPins[field.key]}
                onChangeText={(text) => updateMotorPin(field.key, text)}
                autoCapitalize="characters"
                autoCorrect={false}
                placeholder="Orn. D5"
                placeholderTextColor="#94a3b8"
              />
            </View>
          ))}

          <View style={styles.row}>
            <TouchableOpacity style={styles.actionButton} onPress={applyPinMapping} disabled={!canControl}>
              <Text style={styles.actionButtonText}>Pinleri Uygula</Text>
            </TouchableOpacity>
            <Text style={styles.metaText}>{pinConfigApplied ? "Durum: Uygulandi" : "Durum: Beklemede"}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Motor Surucu Kontrolu</Text>
          <Text style={styles.metaText}>Hiz: {Math.round(speed)}</Text>

          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={100}
            step={1}
            value={speed}
            onValueChange={setSpeed}
            minimumTrackTintColor="#0f766e"
            maximumTrackTintColor="#99f6e4"
            thumbTintColor="#115e59"
          />

          <View style={styles.pad}>
            <DirectionButton icon={DIRECTION_ICONS.forward} onPress={() => runMotion("forward")} style={styles.up} />
            <DirectionButton icon={DIRECTION_ICONS.left} onPress={() => runMotion("left")} style={styles.left} />
            <DirectionButton icon={DIRECTION_ICONS.right} onPress={() => runMotion("right")} style={styles.right} />
            <DirectionButton icon={DIRECTION_ICONS.backward} onPress={() => runMotion("backward")} style={styles.down} />
            <TouchableOpacity style={styles.stopButton} onPress={() => runMotion("stop")}>
              <Text style={styles.stopButtonText}>ACIL DUR</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.sensorHeader}>
            <Text style={styles.cardTitle}>Sensorler</Text>
            <View style={styles.switchRow}>
              <Text style={styles.metaText}>Oto Oku</Text>
              <Switch value={autoPollSensors} onValueChange={setAutoPollSensors} />
            </View>
          </View>

          {SENSOR_KEYS.map((key) => (
            <View style={styles.sensorRow} key={key}>
              <Text style={styles.sensorName}>{key}</Text>
              <Text style={styles.sensorValue}>{String(sensorValues[key])}</Text>
              <TouchableOpacity style={styles.smallButton} onPress={() => requestSensor(key)}>
                <Text style={styles.smallButtonText}>Oku</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Canli Log</Text>
          {logs.length === 0 ? <Text style={styles.emptyText}>Henuz log yok</Text> : null}
          {logs.map((entry) => (
            <Text key={entry} style={styles.logLine}>
              {entry}
            </Text>
          ))}
        </View>
      </ScrollView>
      <StatusBar style="dark" />
    </SafeAreaView>
  );
}

function DirectionButton({ icon, onPress, style }) {
  return (
    <TouchableOpacity style={[styles.arrowButton, style]} onPress={onPress}>
      <Image source={icon} style={styles.buttonImage} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#ecfeff",
  },
  container: {
    padding: 16,
    gap: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0f172a",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#dbeafe",
    gap: 8,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0f172a",
  },
  metaText: {
    color: "#475569",
    fontSize: 13,
  },
  row: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  actionButton: {
    backgroundColor: "#0f766e",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  actionButtonText: {
    color: "#f8fafc",
    fontWeight: "700",
  },
  secondaryButton: {
    backgroundColor: "#cffafe",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  secondaryButtonText: {
    color: "#155e75",
    fontWeight: "700",
  },
  loader: {
    marginVertical: 6,
  },
  deviceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingVertical: 8,
    gap: 8,
  },
  deviceMeta: {
    flex: 1,
  },
  deviceName: {
    color: "#0f172a",
    fontWeight: "600",
  },
  deviceId: {
    color: "#64748b",
    fontSize: 11,
  },
  connectButton: {
    backgroundColor: "#14b8a6",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },
  connectButtonText: {
    color: "white",
    fontWeight: "700",
  },
  emptyText: {
    color: "#64748b",
    fontSize: 12,
  },
  connectedRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
    gap: 8,
  },
  connectedText: {
    flex: 1,
    color: "#0f172a",
    fontSize: 12,
  },
  dangerButton: {
    backgroundColor: "#fee2e2",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  dangerButtonText: {
    color: "#b91c1c",
    fontWeight: "700",
    fontSize: 12,
  },
  slider: {
    width: "100%",
    height: 40,
  },
  pad: {
    position: "relative",
    height: 210,
    alignItems: "center",
    justifyContent: "center",
  },
  arrowButton: {
    position: "absolute",
    backgroundColor: "#f0fdfa",
    borderWidth: 1,
    borderColor: "#99f6e4",
    borderRadius: 14,
    width: 62,
    height: 62,
    alignItems: "center",
    justifyContent: "center",
  },
  up: {
    top: 8,
  },
  down: {
    bottom: 8,
  },
  left: {
    left: 28,
  },
  right: {
    right: 28,
  },
  stopButton: {
    position: "absolute",
    backgroundColor: "#ef4444",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 22,
  },
  stopButtonText: {
    color: "white",
    fontWeight: "800",
    fontSize: 12,
  },
  buttonImage: {
    width: 32,
    height: 32,
    resizeMode: "contain",
  },
  sensorHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sensorRow: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingVertical: 8,
  },
  sensorName: {
    flex: 1,
    textTransform: "capitalize",
    color: "#0f172a",
    fontWeight: "600",
  },
  sensorValue: {
    width: 70,
    color: "#0f172a",
    textAlign: "right",
    marginRight: 10,
  },
  smallButton: {
    backgroundColor: "#e0f2fe",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  smallButtonText: {
    color: "#075985",
    fontWeight: "700",
  },
  logLine: {
    color: "#1e293b",
    fontSize: 11,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    paddingVertical: 3,
  },
  pinRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pinLabel: {
    flex: 1,
    color: "#0f172a",
    fontWeight: "600",
    fontSize: 13,
  },
  pinInput: {
    width: 110,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#f8fafc",
    color: "#0f172a",
    fontWeight: "600",
  },
});

