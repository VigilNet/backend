import type { Device, ThresholdConfig } from "../../db/schema/index.js";

export type PairDeviceInput = {
  deviceId: string;
  deviceType: "APP" | "WATCH";
  eventCode?: string;
  eventId?: string;
};

export type DeviceResponse = Pick<
  Device,
  | "id"
  | "eventId"
  | "deviceId"
  | "deviceType"
  | "thresholdConfigVersion"
  | "thresholdSnapshot"
  | "createdAt"
>;

export function toDeviceResponse(device: Device): DeviceResponse {
  return {
    id: device.id,
    eventId: device.eventId,
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
