import type { Device, ThresholdConfig } from "../../db/schema/index.js";

export type PairDeviceInput = {
  deviceId: string;
  deviceType: "APP" | "WATCH";
};

export type DeviceResponse = Pick<
  Device,
  "id" | "deviceId" | "deviceType" | "thresholdConfigVersion" | "thresholdSnapshot" | "createdAt"
>;

export function toDeviceResponse(device: Device): DeviceResponse {
  return {
    id: device.id,
    deviceId: device.deviceId,
    deviceType: device.deviceType,
    thresholdConfigVersion: device.thresholdConfigVersion,
    thresholdSnapshot: device.thresholdSnapshot,
    createdAt: device.createdAt,
  };
}

export function toThresholdSnapshot(config: ThresholdConfig) {
  return {
    version: config.version,
    hrMin: config.hrMin,
    hrMax: config.hrMax,
    densityThreshold: config.densityThreshold,
  };
}
