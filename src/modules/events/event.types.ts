import type { Event } from "../../db/schema/index.js";

export type EventResponse = Pick<
  Event,
  "id" | "code" | "name" | "venueName" | "isActive" | "createdBy" | "createdAt"
>;

export type CreateEventInput = {
  name: string;
  venueName: string;
  password: string;
};

export type EventLoginInput = {
  code: string;
  password: string;
};

export type UpdateEventCodeStatusInput = {
  isActive: boolean;
};

export function toEventResponse(event: Event): EventResponse {
  return {
    id: event.id,
    code: event.code,
    name: event.name,
    venueName: event.venueName,
    isActive: event.isActive,
    createdBy: event.createdBy,
    createdAt: event.createdAt,
  };
}
