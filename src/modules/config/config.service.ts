import { HttpError } from "../../lib/http-error.js";
import { ConfigRepository } from "./config.repository.js";
import type { ThresholdConfigResponse, UpdateThresholdConfigInput } from "./config.types.js";
import { toThresholdConfigResponse } from "./config.types.js";

export class ConfigService {
  constructor(private readonly configRepository: ConfigRepository) {}

  async getActiveThresholdConfig(eventId: string): Promise<ThresholdConfigResponse> {
    const config = await this.configRepository.findActive(eventId);

    if (!config) {
      throw new HttpError(404, "Active threshold config not found");
    }

    return toThresholdConfigResponse(config);
  }

  async createActiveThresholdConfig(
    input: UpdateThresholdConfigInput,
    createdBy: string,
    eventId: string,
  ): Promise<ThresholdConfigResponse> {
    if (input.hrMin <= 0 || input.hrMax <= 0 || input.hrMin >= input.hrMax) {
      throw new HttpError(400, "HR threshold range is invalid");
    }

    if (input.densityThreshold <= 0) {
      throw new HttpError(400, "Density threshold must be greater than 0");
    }

    const latest = await this.configRepository.findLatest(eventId);
    const version = (latest?.version ?? 0) + 1;

    await this.configRepository.deactivateAll(eventId);

    const config = await this.configRepository.create({
      eventId,
      version,
      hrMin: input.hrMin,
      hrMax: input.hrMax,
      densityThreshold: input.densityThreshold,
      isActive: true,
      createdBy,
    });

    return toThresholdConfigResponse(config);
  }
}
