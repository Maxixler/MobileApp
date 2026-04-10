// ── Board Profiles ──
// Each board has its own BLE UUIDs, scan name filter, and default motor pins.

export const BOARD_PROFILES = {
  deneyap: {
    id: "deneyap",
    name: "Deneyap Kart",
    icon: "⚡",
    description: "Deneyap Kart 1A / Deneyap Mini",
    serviceUUID: "0000FFE0-0000-1000-8000-00805F9B34FB",
    writeCharacteristicUUID: "0000FFE1-0000-1000-8000-00805F9B34FB",
    notifyCharacteristicUUID: "0000FFE1-0000-1000-8000-00805F9B34FB",
    nameFilter: "deneyap",
    defaultPins: {
      leftEnablePin: "D5",
      leftIn1Pin: "D6",
      leftIn2Pin: "D7",
      rightEnablePin: "D9",
      rightIn1Pin: "D10",
      rightIn2Pin: "D11",
    },
  },
  esp32: {
    id: "esp32",
    name: "ESP32",
    icon: "🔵",
    description: "ESP32 / ESP32-S3 / ESP32-C3",
    serviceUUID: "0000FFE0-0000-1000-8000-00805F9B34FB",
    writeCharacteristicUUID: "0000FFE1-0000-1000-8000-00805F9B34FB",
    notifyCharacteristicUUID: "0000FFE1-0000-1000-8000-00805F9B34FB",
    nameFilter: "esp32",
    defaultPins: {
      leftEnablePin: "25",
      leftIn1Pin: "26",
      leftIn2Pin: "27",
      rightEnablePin: "14",
      rightIn1Pin: "12",
      rightIn2Pin: "13",
    },
  },
  esp8266: {
    id: "esp8266",
    name: "ESP8266",
    icon: "🟢",
    description: "NodeMCU / Wemos D1 Mini",
    serviceUUID: "0000FFE0-0000-1000-8000-00805F9B34FB",
    writeCharacteristicUUID: "0000FFE1-0000-1000-8000-00805F9B34FB",
    notifyCharacteristicUUID: "0000FFE1-0000-1000-8000-00805F9B34FB",
    nameFilter: "esp",
    defaultPins: {
      leftEnablePin: "D1",
      leftIn1Pin: "D2",
      leftIn2Pin: "D3",
      rightEnablePin: "D5",
      rightIn1Pin: "D6",
      rightIn2Pin: "D7",
    },
  },
  arduino: {
    id: "arduino",
    name: "Arduino + HC-05/06",
    icon: "🟡",
    description: "Arduino Uno/Nano + Bluetooth modülü",
    serviceUUID: "00001101-0000-1000-8000-00805F9B34FB",
    writeCharacteristicUUID: "00001101-0000-1000-8000-00805F9B34FB",
    notifyCharacteristicUUID: "00001101-0000-1000-8000-00805F9B34FB",
    nameFilter: "hc",
    defaultPins: {
      leftEnablePin: "5",
      leftIn1Pin: "6",
      leftIn2Pin: "7",
      rightEnablePin: "9",
      rightIn1Pin: "10",
      rightIn2Pin: "11",
    },
  },
};

export const BOARD_LIST = Object.values(BOARD_PROFILES);

// Active config — initially set to Deneyap, updated at runtime by BleContext
export const BLE_CONFIG = {
  serviceUUID: BOARD_PROFILES.deneyap.serviceUUID,
  writeCharacteristicUUID: BOARD_PROFILES.deneyap.writeCharacteristicUUID,
  notifyCharacteristicUUID: BOARD_PROFILES.deneyap.notifyCharacteristicUUID,
  nameFilter: BOARD_PROFILES.deneyap.nameFilter,
};

// Helper to apply a board profile to the runtime config object
export function applyBoardProfile(boardId) {
  const profile = BOARD_PROFILES[boardId];
  if (!profile) return;
  BLE_CONFIG.serviceUUID = profile.serviceUUID;
  BLE_CONFIG.writeCharacteristicUUID = profile.writeCharacteristicUUID;
  BLE_CONFIG.notifyCharacteristicUUID = profile.notifyCharacteristicUUID;
  BLE_CONFIG.nameFilter = profile.nameFilter;
}
