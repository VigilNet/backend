export const alertTypes = [
  "BIOMETRIC_ANOMALY",
  "DENSITY_ANOMALY",
  "MANUAL_SOS",
] as const;

export const alertStatuses = [
  "NEW",
  "ACKNOWLEDGED",
  "RESOLVED",
  "CANCELLED",
] as const;

export const deviceTypes = ["APP", "WATCH"] as const;

export const userRoles = ["ADMIN", "PARTICIPANT"] as const;

export type AlertType = (typeof alertTypes)[number];
export type AlertStatus = (typeof alertStatuses)[number];
export type DeviceType = (typeof deviceTypes)[number];
export type UserRole = (typeof userRoles)[number];

export type BiometricAnomalyPayload = {
  hr: number;
  hr_history: number[];
  sample_interval_ms: number;
  trigger_reason: string;
};

export type DensityAnomalyPayload = {
  nearby_count: number;
};

export type ManualSosPayload = {
  source: DeviceType;
};

export type AlertPayload =
  | BiometricAnomalyPayload
  | DensityAnomalyPayload
  | ManualSosPayload
  | Record<string, unknown>;
