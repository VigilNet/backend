import type { Device } from "../../db/schema/index.js";

export type PairDeviceInput = {
  deviceId: string;
  deviceType: "APP" | "WATCH";
  eventCode?: string;
  eventId?: string;
};

export type DeviceResponse = Pick<
  Device,
  "id" | "eventId" | "deviceId" | "deviceType" | "createdAt"
>;

export function toDeviceResponse(device: Device): DeviceResponse {
  return {
    id: device.id,
    eventId: device.eventId,
    deviceId: device.deviceId,
    deviceType: device.deviceType,
    createdAt: device.createdAt,
  };
}
