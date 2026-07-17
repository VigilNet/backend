import { randomUUID } from "node:crypto";
import { HttpError } from "../../lib/http-error.js";
import type { AlertStatus } from "../../types/alert.js";
import { alertStatuses, alertTypes } from "../../types/alert.js";
import { EventRepository } from "../events/event.repository.js";
import { AlertRepository } from "./alert.repository.js";
import type {
  AlertResponse,
  IngestAlertInput,
  ListAlertsQuery,
  StreamAlertInput,
  UpdateAlertStatusInput,
} from "./alert.types.js";
import { toAlertResponse } from "./alert.types.js";

export class AlertService {
  constructor(
    private readonly alertRepository: AlertRepository,
    private readonly eventRepository: EventRepository,
  ) {}

  async ingestAlert(input: IngestAlertInput): Promise<{ alert: AlertResponse; created: boolean }> {
    this.validateIngestInput(input);

    const eventId = await this.resolveEventId(input);
    const device = await this.alertRepository.findDeviceOwner(eventId, input.device_id.trim());

    if (!device) {
      throw new HttpError(404, "Device is not paired");
    }

    if (input.type === "MANUAL_SOS") {
      const existing = await this.alertRepository.findActiveByUser({
        eventId,
        userId: device.userId,
        type: "MANUAL_SOS",
      });

      if (existing) {
        // Same person, still unresolved — refresh in place (same pattern as
        // density anomaly's periodic stream update) instead of stacking a
        // new alert per press.
        await this.alertRepository.refreshTrigger({
          id: existing.id,
          lat: input.lat,
          lng: input.lng,
          triggeredAt: new Date(input.ts * 1000),
          payload: input.payload,
        });

        const refreshed = await this.alertRepository.findById(existing.id);

        if (!refreshed) {
          throw new Error("Refreshed alert could not be reloaded");
        }

        return { alert: toAlertResponse(refreshed), created: false };
      }
    }

    const alert = await this.alertRepository.create({
      eventId,
      alertCode: this.createAlertCode(),
      type: input.type,
      deviceId: device.deviceId,
      userId: device.userId,
      status: "NEW",
      lat: input.lat,
      lng: input.lng,
      triggeredAt: new Date(input.ts * 1000),
      payload: input.payload,
    });

    const alertWithUser = await this.alertRepository.findById(alert.id);

    if (!alertWithUser) {
      throw new Error("Created alert could not be loaded");
    }

    return { alert: toAlertResponse(alertWithUser), created: true };
  }

  async listAlerts(query: ListAlertsQuery): Promise<AlertResponse[]> {
    const limit = this.parseLimit(query.limit);

    if (query.type && !alertTypes.includes(query.type)) {
      throw new HttpError(400, "Alert type is invalid");
    }

    if (query.status && !alertStatuses.includes(query.status)) {
      throw new HttpError(400, "Alert status is invalid");
    }

    const alerts = await this.alertRepository.list({
      type: query.type,
      status: query.status,
      eventId: query.eventId,
      limit,
    });

    return alerts.map(toAlertResponse);
  }

  async getAlert(id: string, allowedEventId?: string): Promise<AlertResponse> {
    const alert = await this.alertRepository.findById(id);

    if (!alert) {
      throw new HttpError(404, "Alert not found");
    }

    if (allowedEventId && alert.eventId !== allowedEventId) {
      throw new HttpError(403, "Event access denied");
    }

    return toAlertResponse(alert);
  }

  async updateStatus(
    id: string,
    input: UpdateAlertStatusInput,
    operatorId: string,
    allowedEventId?: string,
  ): Promise<AlertResponse> {
    if (!["ACKNOWLEDGED", "RESOLVED", "CANCELLED"].includes(input.status)) {
      throw new HttpError(400, "Alert status update is invalid");
    }

    const updatedAlert = await this.alertRepository.updateStatus({
      id,
      status: input.status,
      operatorId,
      allowedEventId,
    });

    if (!updatedAlert) {
      throw new HttpError(404, "Alert not found");
    }

    return this.getAlert(updatedAlert.id, allowedEventId);
  }

  async streamUpdate(id: string, input: StreamAlertInput): Promise<AlertResponse> {
    if (!Number.isFinite(input.lat) || input.lat < -90 || input.lat > 90) {
      throw new HttpError(400, "Latitude is invalid");
    }

    if (!Number.isFinite(input.lng) || input.lng < -180 || input.lng > 180) {
      throw new HttpError(400, "Longitude is invalid");
    }

    const existing = await this.alertRepository.findById(id);

    if (!existing) {
      throw new HttpError(404, "Alert not found");
    }

    if (existing.deviceId !== input.device_id.trim()) {
      throw new HttpError(403, "Device does not own this alert");
    }

    if (existing.status === "RESOLVED" || existing.status === "CANCELLED") {
      return toAlertResponse(existing);
    }

    await this.alertRepository.streamUpdate({
      id,
      deviceId: existing.deviceId,
      lat: input.lat,
      lng: input.lng,
      payloadPatch: input.payload ?? {},
      resolve: input.active === false,
    });

    const refreshed = await this.alertRepository.findById(id);

    if (!refreshed) {
      throw new Error("Streamed alert could not be reloaded");
    }

    return toAlertResponse(refreshed);
  }

  private validateIngestInput(input: IngestAlertInput): void {
    if (!alertTypes.includes(input.type)) {
      throw new HttpError(400, "Alert type is invalid");
    }

    if (input.device_id.trim().length === 0) {
      throw new HttpError(400, "Device ID is required");
    }

    if (!Number.isFinite(input.ts) || input.ts <= 0) {
      throw new HttpError(400, "Timestamp is invalid");
    }

    if (!Number.isFinite(input.lat) || input.lat < -90 || input.lat > 90) {
      throw new HttpError(400, "Latitude is invalid");
    }

    if (!Number.isFinite(input.lng) || input.lng < -180 || input.lng > 180) {
      throw new HttpError(400, "Longitude is invalid");
    }

    this.validatePayload(input);
  }

  private validatePayload(input: IngestAlertInput): void {
    const rawPayload = input.payload;

    if (!rawPayload || typeof rawPayload !== "object" || Array.isArray(rawPayload)) {
      throw new HttpError(400, "Alert payload is invalid");
    }

    const payload = rawPayload as Record<string, unknown>;

    if (input.type === "BIOMETRIC_ANOMALY") {
      if (
        typeof payload.hr !== "number" ||
        !Array.isArray(payload.hr_history) ||
        payload.hr_history.some((value: unknown) => typeof value !== "number") ||
        typeof payload.sample_interval_ms !== "number" ||
        typeof payload.trigger_reason !== "string"
      ) {
        throw new HttpError(400, "Biometric anomaly payload is invalid");
      }
    }

    if (input.type === "DENSITY_ANOMALY") {
      if (typeof payload.nearby_count !== "number" || payload.nearby_count < 0) {
        throw new HttpError(400, "Density anomaly payload is invalid");
      }
    }

    if (input.type === "MANUAL_SOS") {
      if (payload.source !== "APP" && payload.source !== "WATCH") {
        throw new HttpError(400, "Manual SOS payload is invalid");
      }
    }
  }

  private parseLimit(value: string | undefined): number {
    const limit = Number(value ?? "50");

    if (!Number.isInteger(limit) || limit <= 0 || limit > 100) {
      throw new HttpError(400, "Limit must be an integer between 1 and 100");
    }

    return limit;
  }

  private createAlertCode(): string {
    return `ALT-${Date.now().toString(36).toUpperCase()}-${randomUUID().slice(0, 8).toUpperCase()}`;
  }

  private async resolveEventId(input: IngestAlertInput): Promise<string> {
    if (input.event_id) {
      const event = await this.eventRepository.findById(input.event_id);

      if (!event || !event.isActive) {
        throw new HttpError(404, "Event not found");
      }

      return event.id;
    }

    if (!input.event_code) {
      throw new HttpError(400, "Event code is required");
    }

    const event = await this.eventRepository.findByCode(input.event_code);

    if (!event) {
      throw new HttpError(404, "Event code not found");
    }

    if (!event.isActive) {
      throw new HttpError(403, "Event code has been revoked");
    }

    return event.id;
  }
}
