// Cross-tab real-time event broadcaster for instant multi-tab live sync

const CHANNEL_NAME = "flowvo_live_events";

export function broadcastLiveEvent(eventType: string, payload?: unknown) {
  if (typeof window === "undefined") return;

  try {
    if ("BroadcastChannel" in window) {
      const channel = new BroadcastChannel(CHANNEL_NAME);
      channel.postMessage({ type: eventType, payload, timestamp: Date.now() });
      channel.close();
    } else {
      // Fallback via localStorage event
      localStorage.setItem(
        "flowvo_last_event",
        JSON.stringify({ type: eventType, payload, timestamp: Date.now() })
      );
    }
  } catch (err) {
    console.warn("Could not broadcast live event:", err);
  }
}

export function subscribeToLiveEvents(callback: (event: { type: string; payload?: unknown }) => void) {
  if (typeof window === "undefined") return () => {};

  let channel: BroadcastChannel | null = null;

  if ("BroadcastChannel" in window) {
    channel = new BroadcastChannel(CHANNEL_NAME);
    channel.onmessage = (e) => {
      if (e.data) {
        callback(e.data);
      }
    };
  }

  const storageHandler = (e: StorageEvent) => {
    if (e.key === "flowvo_last_event" && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        callback(parsed);
      } catch {
        // ignore JSON parse errors
      }
    }
  };

  window.addEventListener("storage", storageHandler);

  return () => {
    if (channel) {
      channel.close();
    }
    window.removeEventListener("storage", storageHandler);
  };
}
