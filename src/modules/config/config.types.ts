import type { ThresholdConfig } from "../../db/schema/index.js";

export type ThresholdConfigResponse = Pick<
  ThresholdConfig,
  "id" | "version" | "hrMin" | "hrMax" | "densityThreshold" | "isActive" | "createdAt"
>;

export type UpdateThresholdConfigInput = {
  hrMin: number;
  hrMax: number;
  densityThreshold: number;
};

export function toThresholdConfigResponse(
  config: ThresholdConfig,
): ThresholdConfigResponse {
  return {
    id: config.id,
    version: config.version,
    hrMin: config.hrMin,
    hrMax: config.hrMax,
    densityThreshold: config.densityThreshold,
    isActive: config.isActive,
    createdAt: config.createdAt,
  };
}
