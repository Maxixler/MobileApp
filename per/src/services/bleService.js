import { BleManager } from "react-native-ble-plx";
import { PermissionsAndroid, Platform } from "react-native";
import { decode as atob, encode as btoa } from "base-64";

import { BLE_CONFIG } from "../config/bleConfig";

class BleService {
  constructor() {
    this.manager = new BleManager();
    this.connectedDevice = null;
    this.deviceMap = new Map();
    this.notifySubscription = null;
    this.scanActive = false;
  }

  async requestPermissions() {
    if (Platform.OS !== "android") {
      return true;
    }

    if (Platform.Version < 31) {
      const fineLocation = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      );
      return fineLocation === PermissionsAndroid.RESULTS.GRANTED;
    }

    const results = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    ]);

    return (
      results[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] === PermissionsAndroid.RESULTS.GRANTED
      && results[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] === PermissionsAndroid.RESULTS.GRANTED
      && results[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED
    );
  }

  startScan(onDevice, onError) {
    this.scanActive = true;
    this.deviceMap.clear();

    this.manager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        this.scanActive = false;
        onError(error);
        return;
      }

      if (!device || !device.name) {
        return;
      }

      const name = device.name.toLowerCase();
      if (!name.includes(BLE_CONFIG.nameFilter.toLowerCase())) {
        return;
      }

      if (!this.deviceMap.has(device.id)) {
        this.deviceMap.set(device.id, device);
        onDevice(device);
      }
    });
  }

  stopScan() {
    if (!this.scanActive) {
      return;
    }

    this.manager.stopDeviceScan();
    this.scanActive = false;
  }

  async connect(deviceId) {
    this.stopScan();

    const device = await this.manager.connectToDevice(deviceId, { autoConnect: false });
    const discovered = await device.discoverAllServicesAndCharacteristics();
    this.connectedDevice = discovered;
    return discovered;
  }

  async disconnect() {
    if (this.notifySubscription) {
      this.notifySubscription.remove();
      this.notifySubscription = null;
    }

    if (this.connectedDevice) {
      await this.manager.cancelDeviceConnection(this.connectedDevice.id);
      this.connectedDevice = null;
    }
  }

  async startNotifications(onData, onError) {
    if (!this.connectedDevice) {
      throw new Error("No connected device");
    }

    this.notifySubscription = this.connectedDevice.monitorCharacteristicForService(
      BLE_CONFIG.serviceUUID,
      BLE_CONFIG.notifyCharacteristicUUID,
      (error, characteristic) => {
        if (error) {
          onError(error);
          return;
        }

        if (!characteristic?.value) {
          return;
        }

        const text = atob(characteristic.value);
        onData(text);
      },
    );
  }

  async sendTextMessage(message) {
    if (!this.connectedDevice) {
      throw new Error("No connected device");
    }

    const payload = `${message}\n`;
    const encoded = btoa(payload);

    await this.connectedDevice.writeCharacteristicWithoutResponseForService(
      BLE_CONFIG.serviceUUID,
      BLE_CONFIG.writeCharacteristicUUID,
      encoded,
    );
  }

  destroy() {
    this.stopScan();

    if (this.notifySubscription) {
      this.notifySubscription.remove();
      this.notifySubscription = null;
    }

    this.manager.destroy();
  }
}

export const bleService = new BleService();
