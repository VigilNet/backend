import { HttpError } from "../../lib/http-error.js";
import { ConfigRepository } from "../config/config.repository.js";
import { DeviceRepository } from "./device.repository.js";
import type { DeviceResponse, PairDeviceInput } from "./device.types.js";
import { toDeviceResponse, toThresholdSnapshot } from "./device.types.js";

export class DeviceService {
  constructor(
    private readonly deviceRepository: DeviceRepository,
    private readonly configRepository: ConfigRepository,
  ) {}

  async pairDevice(input: PairDeviceInput, userId: string): Promise<DeviceResponse> {
    const deviceId = input.deviceId.trim();

    if (deviceId.length === 0) {
      throw new HttpError(400, "Device ID is required");
    }

    const activeConfig = await this.configRepository.findActive();

    if (!activeConfig) {
      throw new HttpError(404, "Active threshold config not found");
    }

    const thresholdSnapshot = toThresholdSnapshot(activeConfig);
    const existingDevice = await this.deviceRepository.findByDeviceId(deviceId);

    if (existingDevice && existingDevice.userId !== userId) {
      throw new HttpError(409, "Device is already paired to another user");
    }

    if (existingDevice) {
      const updatedDevice = await this.deviceRepository.updatePairing(existingDevice.id, {
        deviceType: input.deviceType,
        thresholdConfigVersion: activeConfig.version,
        thresholdSnapshot,
      });

      return toDeviceResponse(updatedDevice);
    }

    const device = await this.deviceRepository.create({
      deviceId,
      userId,
      deviceType: input.deviceType,
      thresholdConfigVersion: activeConfig.version,
      thresholdSnapshot,
    });

    return toDeviceResponse(device);
  }

  async listDevicesForUser(userId: string): Promise<DeviceResponse[]> {
    const devices = await this.deviceRepository.findByUserId(userId);

    return devices.map(toDeviceResponse);
  }
}
