import type { AlertResponse } from "../alerts/alert.types.js";

export type AlertEventName = "alert:new" | "alert:updated";

export type AlertEvent = {
  event: AlertEventName;
  alert: AlertResponse;
};

type AlertEventListener = (event: AlertEvent) => void;

class AlertEventBus {
  private readonly listeners = new Set<AlertEventListener>();

  subscribe(listener: AlertEventListener): () => void {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }

  publish(event: AlertEvent): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }
}

export const alertEventBus = new AlertEventBus();
