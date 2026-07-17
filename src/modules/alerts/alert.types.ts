import type { Alert, User } from "../../db/schema/index.js";
import type { AlertPayload, AlertStatus, AlertType } from "../../types/alert.js";

export type IngestAlertInput = {
  device_id: string;
  event_code?: string;
  event_id?: string;
  type: AlertType;
  ts: number;
  lat: number;
  lng: number;
  payload: AlertPayload;
};

export type ListAlertsQuery = {
  eventId?: string;
  type?: AlertType;
  status?: AlertStatus;
  limit?: string;
};

export type UpdateAlertStatusInput = {
  status: AlertStatus;
};

export type StreamAlertInput = {
  device_id: string;
  lat: number;
  lng: number;
  ts: number;
  payload?: Record<string, unknown>;
  active?: boolean;
};

export type AlertWithUser = Alert & {
  user: Pick<User, "id" | "fullName" | "email"> | null;
};

export type AlertResponse = {
  id: string;
  eventId: string;
  alertCode: string;
  type: AlertType;
  status: AlertStatus;
  deviceId: string;
  user: Pick<User, "id" | "fullName" | "email"> | null;
  lat: number;
  lng: number;
  triggeredAt: Date;
  payload: AlertPayload;
  acknowledgedBy: string | null;
  acknowledgedAt: Date | null;
  resolvedBy: string | null;
  resolvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export function toAlertResponse(alert: AlertWithUser): AlertResponse {
  return {
    id: alert.id,
    eventId: alert.eventId,
    alertCode: alert.alertCode,
    type: alert.type,
    status: alert.status,
    deviceId: alert.deviceId,
    user: alert.user,
    lat: alert.lat,
    lng: alert.lng,
    triggeredAt: alert.triggeredAt,
    payload: alert.payload,
    acknowledgedBy: alert.acknowledgedBy,
    acknowledgedAt: alert.acknowledgedAt,
    resolvedBy: alert.resolvedBy,
    resolvedAt: alert.resolvedAt,
    createdAt: alert.createdAt,
    updatedAt: alert.updatedAt,
  };
}
