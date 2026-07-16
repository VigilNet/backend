import { HttpError } from "../../lib/http-error.js";
import { hashPassword, verifyPassword } from "../../lib/password.js";
import { ConfigRepository } from "../config/config.repository.js";
import { EventRepository } from "./event.repository.js";
import type { CreateEventInput, EventLoginInput, EventResponse } from "./event.types.js";
import { toEventResponse } from "./event.types.js";

const eventCodePattern = /^\d{6}$/;

export class EventService {
  constructor(
    private readonly eventRepository: EventRepository,
    private readonly configRepository: ConfigRepository,
  ) {}

  async resolveByCode(code: string): Promise<EventResponse> {
    const event = await this.eventRepository.findByCode(this.normalizeCode(code));

    if (!event) {
      throw new HttpError(404, "Event code not found");
    }

    if (!event.isActive) {
      throw new HttpError(403, "Event code has been revoked");
    }

    return toEventResponse(event);
  }

  async createEvent(input: CreateEventInput, createdBy: string): Promise<EventResponse> {
    const name = input.name.trim();
    const venueName = input.venueName.trim();

    if (name.length === 0 || venueName.length === 0) {
      throw new HttpError(400, "Event name and venue are required");
    }

    if (input.password.length < 8) {
      throw new HttpError(400, "Event password must be at least 8 characters");
    }

    const event = await this.eventRepository.create({
      code: await this.createUniqueCode(),
      name,
      venueName,
      operatorPasswordHash: await hashPassword(input.password),
      isActive: true,
      createdBy,
    });

    await this.configRepository.create({
      eventId: event.id,
      version: 1,
      hrMin: 50,
      hrMax: 130,
      densityThreshold: 30,
      isActive: true,
      createdBy,
    });

    return toEventResponse(event);
  }

  async listEventsForOwner(ownerId: string): Promise<EventResponse[]> {
    const events = await this.eventRepository.listByOwner(ownerId);

    return events.map(toEventResponse);
  }

  async getEventById(id: string): Promise<EventResponse> {
    const event = await this.eventRepository.findById(id);

    if (!event) {
      throw new HttpError(404, "Event not found");
    }

    return toEventResponse(event);
  }

  async loginOperator(input: EventLoginInput): Promise<EventResponse> {
    const event = await this.eventRepository.findByCode(this.normalizeCode(input.code));

    if (!event) {
      throw new HttpError(401, "Invalid event code or password");
    }

    if (!event.isActive) {
      throw new HttpError(403, "Event code has been revoked");
    }

    if (!(await verifyPassword(event.operatorPasswordHash, input.password))) {
      throw new HttpError(401, "Invalid event code or password");
    }

    return toEventResponse(event);
  }

  async updateOwnedCodeStatus(
    ownerId: string,
    eventId: string,
    isActive: boolean,
  ): Promise<EventResponse> {
    const event = await this.eventRepository.findById(eventId);

    if (!event) {
      throw new HttpError(404, "Event not found");
    }

    if (event.createdBy !== ownerId) {
      throw new HttpError(403, "Event owner access required");
    }

    const updatedEvent = await this.eventRepository.updateCodeStatus(event.id, isActive);

    return toEventResponse(updatedEvent);
  }

  private normalizeCode(code: string): string {
    return code.trim();
  }

  private async createUniqueCode(): Promise<string> {
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const code = String(Math.floor(100000 + Math.random() * 900000));

      if (eventCodePattern.test(code) && !(await this.eventRepository.findByCode(code))) {
        return code;
      }
    }

    throw new Error("Failed to allocate event code");
  }
}
