import { io, Socket } from "socket.io-client";
import { Metric } from "../types";

type WebSocketEventMap = {
  'metric-update': Metric;
};

type WebSocketEvent = keyof WebSocketEventMap;

class WebSocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<(data: unknown) => void>> = new Map();

  connect() {
    if (this.socket?.connected) return;

    const serverUrl =
      import.meta.env.VITE_WS_URL || "http://localhost:5000";
    this.socket = io(serverUrl, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.socket.on("connect", () => {
      console.log("WebSocket connected");
    });

    this.socket.on("disconnect", () => {
      console.log("WebSocket disconnected");
    });

    this.socket.on("metric-update", (data: Metric) => {
      this.emit("metric-update", data);
    });

    this.socket.on("error", (error: Error) => {
      console.error("WebSocket error:", error);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.listeners.clear();
  }

  on<T extends WebSocketEvent>(
    event: T,
    callback: (data: WebSocketEventMap[T]) => void
  ) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback as (data: unknown) => void);

    // Return unsubscribe function
    return () => {
      const eventListeners = this.listeners.get(event);
      if (eventListeners) {
        eventListeners.delete(callback as (data: unknown) => void);
      }
    };
  }

  private emit<T extends WebSocketEvent>(event: T, data: WebSocketEventMap[T]) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach((callback) => callback(data));
    }
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

export const wsService = new WebSocketService();
