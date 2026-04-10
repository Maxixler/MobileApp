import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { Alert } from "react-native";

import {
  buildMotorCommand,
  buildPinMapCommand,
  buildSensorReadCommand,
  buildStopCommand,
  parseIncomingPayload,
} from "../protocol/deneyapProtocol";
import { bleService } from "../services/bleService";
import { BOARD_PROFILES, applyBoardProfile } from "../config/bleConfig";

const SENSOR_KEYS = ["distance", "temperature", "light", "battery"];

const MOTOR_PIN_FIELDS = [
  { key: "leftEnablePin", label: "Sol PWM (ENA)" },
  { key: "leftIn1Pin", label: "Sol IN1" },
  { key: "leftIn2Pin", label: "Sol IN2" },
  { key: "rightEnablePin", label: "Sağ PWM (ENB)" },
  { key: "rightIn1Pin", label: "Sağ IN1" },
  { key: "rightIn2Pin", label: "Sağ IN2" },
];

const toMotorConfig = (mode, speed) => {
  switch (mode) {
    case "forward":
      return { leftPwm: speed, rightPwm: speed, leftDirection: "forward", rightDirection: "forward" };
    case "backward":
      return { leftPwm: speed, rightPwm: speed, leftDirection: "backward", rightDirection: "backward" };
    case "left":
      return { leftPwm: Math.round(speed * 0.45), rightPwm: speed, leftDirection: "forward", rightDirection: "forward" };
    case "right":
      return { leftPwm: speed, rightPwm: Math.round(speed * 0.45), leftDirection: "forward", rightDirection: "forward" };
    default:
      return { leftPwm: 0, rightPwm: 0, leftDirection: "stop", rightDirection: "stop" };
  }
};

const BleContext = createContext(null);

export { SENSOR_KEYS, MOTOR_PIN_FIELDS };

export function BleProvider({ children }) {
  const [selectedBoardId, setSelectedBoardId] = useState("deneyap");
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

  const selectedBoard = BOARD_PROFILES[selectedBoardId];

  const selectBoard = useCallback(
    (boardId) => {
      const profile = BOARD_PROFILES[boardId];
      if (!profile) return;
      setSelectedBoardId(boardId);
      applyBoardProfile(boardId);
      // Apply default pins for the selected board
      setMotorPins({ ...profile.defaultPins });
      setPinConfigApplied(false);
      appendLog(`Kart değiştirildi: ${profile.name}`);
    },
    [appendLog]
  );

  const mountedRef = useRef(true);
  const canControl = !!connectedDevice;

  const appendLog = useCallback((line) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [`${timestamp} | ${line}`, ...prev].slice(0, 80));
  }, []);

  const validateMotorPins = useCallback((pins) => {
    const normalized = {};
    for (const field of MOTOR_PIN_FIELDS) {
      const raw = String(pins[field.key] || "").trim().toUpperCase();
      if (!raw) return { ok: false, error: `${field.label} boş bırakılamaz` };
      if (!/^[A-Z]?\d+$/.test(raw)) return { ok: false, error: `${field.label} geçersiz formatta` };
      normalized[field.key] = raw;
    }
    const unique = new Set(Object.values(normalized));
    if (unique.size !== MOTOR_PIN_FIELDS.length) {
      return { ok: false, error: "Aynı pin birden fazla göreve atanmış" };
    }
    return { ok: true, value: normalized };
  }, []);

  // Bootstrap BLE permissions
  useEffect(() => {
    mountedRef.current = true;
    const bootstrap = async () => {
      const granted = await bleService.requestPermissions();
      if (!mountedRef.current) return;
      setPermissionGranted(granted);
      appendLog(granted ? "Bluetooth izinleri hazır" : "Bluetooth izinleri reddedildi");
    };
    bootstrap();
    return () => {
      mountedRef.current = false;
      bleService.disconnect().catch(() => null);
      bleService.destroy();
    };
  }, [appendLog]);

  // Auto-poll sensors
  useEffect(() => {
    if (!connectedDevice || !autoPollSensors) return undefined;
    const timer = setInterval(() => {
      SENSOR_KEYS.forEach((key) => {
        sendCommand(buildSensorReadCommand(key)).catch(() => null);
      });
    }, 2500);
    return () => clearInterval(timer);
  }, [connectedDevice, autoPollSensors]);

  const sendCommand = useCallback(
    async (command) => {
      if (!connectedDevice) throw new Error("Bağlı cihaz yok");
      await bleService.sendTextMessage(command);
      appendLog(`TX: ${command}`);
    },
    [connectedDevice, appendLog]
  );

  const scan = useCallback(async () => {
    if (!permissionGranted) {
      Alert.alert("Bluetooth", "Tarama için gerekli izinler verilmedi.");
      return;
    }
    setDevices([]);
    setIsScanning(true);
    bleService.startScan(
      (device) => setDevices((prev) => [...prev, device]),
      (error) => {
        appendLog(`Tarama hatası: ${error.message}`);
        setIsScanning(false);
      }
    );
    appendLog("Tarama başlatıldı");
    setTimeout(() => {
      bleService.stopScan();
      setIsScanning(false);
      appendLog("Tarama durduruldu");
    }, 9000);
  }, [permissionGranted, appendLog]);

  const stopScan = useCallback(() => {
    bleService.stopScan();
    setIsScanning(false);
    appendLog("Tarama manuel durduruldu");
  }, [appendLog]);

  const connect = useCallback(
    async (deviceId, name) => {
      setIsConnecting(true);
      try {
        const device = await bleService.connect(deviceId);
        setConnectedDevice(device);
        setPinConfigApplied(false);
        appendLog(`${name || "Bilinmeyen"} bağlandı`);
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
          (error) => appendLog(`Bildirim hatası: ${error.message}`)
        );
      } catch (error) {
        appendLog(`Bağlantı hatası: ${error.message}`);
        Alert.alert("Bağlantı hatası", error.message);
      } finally {
        setIsConnecting(false);
      }
    },
    [appendLog]
  );

  const disconnect = useCallback(async () => {
    try {
      await bleService.disconnect();
      setConnectedDevice(null);
      setPinConfigApplied(false);
      appendLog("Bağlantı kesildi");
    } catch (error) {
      appendLog(`Bağlantı kesme hatası: ${error.message}`);
    }
  }, [appendLog]);

  const applyPinMapping = useCallback(async () => {
    if (!connectedDevice) {
      Alert.alert("Pin eşleme", "Pinleri göndermek için önce cihaza bağlanın.");
      return false;
    }
    const check = validateMotorPins(motorPins);
    if (!check.ok) {
      Alert.alert("Pin doğrulama", check.error);
      appendLog(`Pin doğrulama hatası: ${check.error}`);
      return false;
    }
    try {
      await sendCommand(buildPinMapCommand(check.value));
      setPinConfigApplied(true);
      appendLog("Motor pin eşleme cihaza gönderildi");
      return true;
    } catch (error) {
      appendLog(`Pin map gönderme hatası: ${error.message}`);
      Alert.alert("Pin gönderim hatası", error.message);
      return false;
    }
  }, [connectedDevice, motorPins, validateMotorPins, sendCommand, appendLog]);

  const updateMotorPin = useCallback((key, value) => {
    setMotorPins((prev) => ({ ...prev, [key]: value }));
    setPinConfigApplied(false);
  }, []);

  const runMotion = useCallback(
    async (mode) => {
      if (!canControl) {
        Alert.alert("Motor", "Önce cihaza bağlanın.");
        return;
      }
      const command =
        mode === "stop" ? buildStopCommand() : buildMotorCommand(toMotorConfig(mode, Math.round(speed)));
      try {
        if (!pinConfigApplied) {
          const applied = await applyPinMapping();
          if (!applied) return;
        }
        await sendCommand(command);
      } catch (error) {
        appendLog(`Motor komutu hatası: ${error.message}`);
      }
    },
    [canControl, speed, pinConfigApplied, applyPinMapping, sendCommand, appendLog]
  );

  const requestSensor = useCallback(
    async (sensorKey) => {
      if (!canControl) return;
      try {
        await sendCommand(buildSensorReadCommand(sensorKey));
      } catch (error) {
        appendLog(`Sensör komutu hatası: ${error.message}`);
      }
    },
    [canControl, sendCommand, appendLog]
  );

  const value = {
    selectedBoardId,
    selectedBoard,
    selectBoard,
    permissionGranted,
    devices,
    isScanning,
    isConnecting,
    connectedDevice,
    canControl,
    speed,
    setSpeed,
    autoPollSensors,
    setAutoPollSensors,
    sensorValues,
    logs,
    motorPins,
    pinConfigApplied,
    scan,
    stopScan,
    connect,
    disconnect,
    applyPinMapping,
    updateMotorPin,
    runMotion,
    requestSensor,
    appendLog,
    sendCommand,
  };

  return <BleContext.Provider value={value}>{children}</BleContext.Provider>;
}

export function useBle() {
  const ctx = useContext(BleContext);
  if (!ctx) throw new Error("useBle must be used within BleProvider");
  return ctx;
}
