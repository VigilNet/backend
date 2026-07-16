import { HttpError } from "../../lib/http-error.js";
import { EventRepository } from "../events/event.repository.js";
import { DeviceRepository } from "./device.repository.js";
import type { DeviceResponse, PairDeviceInput } from "./device.types.js";
import { toDeviceResponse } from "./device.types.js";

export class DeviceService {
  constructor(
    private readonly deviceRepository: DeviceRepository,
    private readonly eventRepository: EventRepository,
  ) {}

  async pairDevice(input: PairDeviceInput, userId: string): Promise<DeviceResponse> {
    const deviceId = input.deviceId.trim();

    if (deviceId.length === 0) {
      throw new HttpError(400, "Device ID is required");
    }

    const eventId = await this.resolveEventId(input);
    const existingDevice = await this.deviceRepository.findByEventAndDeviceId(eventId, deviceId);

    if (existingDevice && existingDevice.userId !== userId) {
      throw new HttpError(409, "Device is already paired to another user");
    }

    if (existingDevice) {
      const updatedDevice = await this.deviceRepository.updatePairing(existingDevice.id, {
        deviceType: input.deviceType,
      });

      return toDeviceResponse(updatedDevice);
    }

    const device = await this.deviceRepository.create({
      eventId,
      deviceId,
      userId,
      deviceType: input.deviceType,
    });

    return toDeviceResponse(device);
  }

  async listDevicesForUser(userId: string): Promise<DeviceResponse[]> {
    const devices = await this.deviceRepository.findByUserId(userId);

    return devices.map(toDeviceResponse);
  }

  async listDevicesForUserAndEvent(userId: string, eventId: string): Promise<DeviceResponse[]> {
    const devices = await this.deviceRepository.findByUserId(userId, eventId);

    return devices.map(toDeviceResponse);
  }

  private async resolveEventId(input: PairDeviceInput): Promise<string> {
    if (input.eventId) {
      const event = await this.eventRepository.findById(input.eventId);

      if (!event || !event.isActive) {
        throw new HttpError(404, "Event not found");
      }

      return event.id;
    }

    if (!input.eventCode) {
      throw new HttpError(400, "Event code is required");
    }

    const eventCode = input.eventCode;
    const event = await this.eventRepository.findByCode(eventCode);

    if (!event) {
      throw new HttpError(404, "Event code not found");
    }

    if (!event.isActive) {
      throw new HttpError(403, "Event code has been revoked");
    }

    return event.id;
  }
}
