/**
 * Shared Demo Data Synchronization Service
 * 
 * Provides a unified, versioned, synchronized storage layer for Interactive Portfolio Simulation Mode.
 * Communicates with the local demo sync HTTP server (http://127.0.0.1:5176) to bridge
 * the separate origins of the Public Website (5173) and Owner Dashboard (5174).
 * 
 * Falls back gracefully to localStorage and in-memory storage if the server is unreachable.
 */

import type {
  BusinessProfileContract,
  DayHoursContract,
  GalleryItemContract,
  MenuCategoryContract,
  ReviewItemContract,
} from "../types/business.ts";
import {
  cafe as defaultProfile,
  menuCategories as defaultCategories,
  weeklySchedule as defaultSchedule,
  galleryItems as defaultGallery,
  verifiedReviews as defaultReviews,
} from "../data/cafe.ts";

export interface DemoSnapshot {
  version: number;
  updatedAt: number;
  profile: BusinessProfileContract;
  menuCategories: MenuCategoryContract[];
  schedule: DayHoursContract[];
  galleryItems: GalleryItemContract[];
  reviews: ReviewItemContract[];
}

export const DEMO_SYNC_SERVER_URL = "http://127.0.0.1:5176";
export const DEMO_STORAGE_KEY = "aromica_demo_snapshot_v1";
export const DEMO_SYNC_CHANNEL_NAME = "aromica_demo_sync_channel";

const CURRENT_VERSION = 1;

/**
 * Checks if the local background sync service (http://127.0.0.1:5176) is reachable.
 */
export async function checkSyncServerHealth(): Promise<boolean> {
  try {
    if (typeof fetch === "undefined") return false;
    const res = await fetch(`${DEMO_SYNC_SERVER_URL}/health`, { method: "GET" });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Returns the default pristine approved demo snapshot.
 */
export function getDefaultDemoSnapshot(): DemoSnapshot {
  return {
    version: CURRENT_VERSION,
    updatedAt: Date.now(),
    profile: JSON.parse(JSON.stringify(defaultProfile)),
    menuCategories: JSON.parse(JSON.stringify(defaultCategories)),
    schedule: JSON.parse(JSON.stringify(defaultSchedule)),
    galleryItems: JSON.parse(JSON.stringify(defaultGallery)),
    reviews: JSON.parse(JSON.stringify(defaultReviews)),
  };
}

let memoryStore: Record<string, string> = {};
let latestCachedSnapshot: DemoSnapshot = getDefaultDemoSnapshot();

function getStorageItem(key: string): string | null {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      return window.localStorage.getItem(key);
    } catch {
      // fallback
    }
  }
  return memoryStore[key] || null;
}

function setStorageItem(key: string, value: string): void {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // fallback
    }
  }
  memoryStore[key] = value;
}

/**
 * Synchronous getter: Retrieves latest snapshot from memory/localStorage.
 */
export function getDemoSnapshot(): DemoSnapshot {
  try {
    const raw = getStorageItem(DEMO_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DemoSnapshot;
      if (parsed && typeof parsed.version === "number" && Array.isArray(parsed.menuCategories)) {
        latestCachedSnapshot = parsed;
        return parsed;
      }
    }
  } catch {
    // Graceful recovery
  }

  return latestCachedSnapshot;
}

let inFlightSnapshotFetch: Promise<DemoSnapshot> | null = null;

/**
 * Asynchronous getter: Pulls latest snapshot from the local synchronization service.
 * In-flight requests are deduplicated to prevent redundant network traffic under high concurrency.
 */
export async function fetchRemoteDemoSnapshot(): Promise<DemoSnapshot> {
  if (inFlightSnapshotFetch) {
    return inFlightSnapshotFetch;
  }

  inFlightSnapshotFetch = (async (): Promise<DemoSnapshot> => {
    try {
      const res = await fetch(`${DEMO_SYNC_SERVER_URL}/api/snapshot`, {
        method: "GET",
        headers: { "Accept": "application/json" },
      });
      if (res.ok) {
        const data = (await res.json()) as DemoSnapshot;
        if (data && typeof data.version === "number" && Array.isArray(data.menuCategories)) {
          latestCachedSnapshot = data;
          setStorageItem(DEMO_STORAGE_KEY, JSON.stringify(data));
          return data;
        }
      }
    } catch {
      // If server is not running, fall back to local snapshot
    }
    return getDemoSnapshot();
  })().finally(() => {
    inFlightSnapshotFetch = null;
  });

  return inFlightSnapshotFetch;
}

/**
 * Persists the demo snapshot:
 * 1. Writes to memory / localStorage immediately.
 * 2. Asynchronously POSTs to the local synchronization server (http://127.0.0.1:5176).
 * 3. Broadcasts via BroadcastChannel and window CustomEvent.
 * 4. Invalidates cached public content to ensure instant propagation.
 */
export function saveDemoSnapshot(snapshot: DemoSnapshot): void {
  const toSave: DemoSnapshot = {
    ...snapshot,
    updatedAt: Date.now(),
  };

  latestCachedSnapshot = toSave;
  setStorageItem(DEMO_STORAGE_KEY, JSON.stringify(toSave));

  // Invalidate any cached public content so live views re-evaluate immediately
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      window.localStorage.removeItem("aromica_public_content_aromica-cafe");
    } catch {
      // safe fallback
    }
  }

  // Post to local demo sync server in the background
  try {
    if (typeof fetch !== "undefined") {
      void fetch(`${DEMO_SYNC_SERVER_URL}/api/snapshot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toSave),
      }).catch(() => {
        // Safe silent catch if server is unreachable
      });
    }
  } catch {
    // Ignore fetch error
  }

  // Broadcast to other tabs on same origin
  try {
    if (typeof BroadcastChannel !== "undefined") {
      const channel = new BroadcastChannel(DEMO_SYNC_CHANNEL_NAME);
      channel.postMessage({ type: "SYNC_UPDATE", timestamp: toSave.updatedAt });
      channel.close();
    }
  } catch {
    // Ignore in non-browser envs
  }

  // Fire local event for components on current window
  try {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("aromica:demo-synced", {
          detail: { snapshot: toSave },
        })
      );
    }
  } catch {
    // Ignore in non-browser envs
  }
}

/**
 * Resets the demo snapshot back to approved pristine defaults across all systems.
 */
export async function resetDemoSnapshotRemote(): Promise<DemoSnapshot> {
  const pristine = getDefaultDemoSnapshot();
  latestCachedSnapshot = pristine;
  setStorageItem(DEMO_STORAGE_KEY, JSON.stringify(pristine));

  try {
    if (typeof fetch !== "undefined") {
      await fetch(`${DEMO_SYNC_SERVER_URL}/api/reset`, { method: "POST" });
    }
  } catch {
    // Server fallback
  }

  saveDemoSnapshot(pristine);
  return pristine;
}

export function resetDemoSnapshot(): DemoSnapshot {
  const pristine = getDefaultDemoSnapshot();
  saveDemoSnapshot(pristine);
  return pristine;
}

/**
 * Subscribes to live synchronization events across both applications.
 * Uses Server-Sent Events (SSE) from the local sync server, supplemented
 * by BroadcastChannel, storage events, and window CustomEvents.
 */
export function subscribeToDemoSync(callback: (snapshot: DemoSnapshot) => void): () => void {
  if (typeof window === "undefined") return () => {};

  let eventSource: EventSource | null = null;
  let broadcastChannel: BroadcastChannel | null = null;
  let pollInterval: ReturnType<typeof setInterval> | null = null;

  // 1. Initial fetch from remote sync server
  void fetchRemoteDemoSnapshot().then((fresh) => {
    callback(fresh);
  });

  // 2. Connect to Server-Sent Events (SSE) for instant cross-origin push
  try {
    if (typeof EventSource !== "undefined") {
      eventSource = new EventSource(`${DEMO_SYNC_SERVER_URL}/api/events`);
      eventSource.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed && parsed.type === "SYNC_UPDATE") {
            void fetchRemoteDemoSnapshot().then((updated) => {
              callback(updated);
            });
          }
        } catch {
          // Ignore parse errors
        }
      };
      eventSource.onerror = () => {
        // SSE reconnects automatically
      };
    }
  } catch {
    // EventSource not supported
  }

  // 3. Fallback polling every 2 seconds to guarantee sync even if SSE dropped
  pollInterval = setInterval(() => {
    void fetchRemoteDemoSnapshot().then((remote) => {
      if (remote.updatedAt > latestCachedSnapshot.updatedAt) {
        callback(remote);
      }
    });
  }, 2000);

  // 4. Local Window and Tab Listeners
  const handleCustomEvent = (e: Event) => {
    const custom = e as CustomEvent<{ snapshot: DemoSnapshot }>;
    if (custom.detail?.snapshot) {
      callback(custom.detail.snapshot);
    } else {
      callback(getDemoSnapshot());
    }
  };

  const handleStorageEvent = (e: StorageEvent) => {
    if (e.key === DEMO_STORAGE_KEY && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue) as DemoSnapshot;
        callback(parsed);
      } catch {
        callback(getDemoSnapshot());
      }
    }
  };

  window.addEventListener("aromica:demo-synced", handleCustomEvent);
  window.addEventListener("storage", handleStorageEvent);

  if (typeof BroadcastChannel !== "undefined") {
    try {
      broadcastChannel = new BroadcastChannel(DEMO_SYNC_CHANNEL_NAME);
      broadcastChannel.onmessage = () => {
        void fetchRemoteDemoSnapshot().then((snapshot) => {
          callback(snapshot);
        });
      };
    } catch {
      // BroadcastChannel unavailable
    }
  }

  return () => {
    window.removeEventListener("aromica:demo-synced", handleCustomEvent);
    window.removeEventListener("storage", handleStorageEvent);
    if (broadcastChannel) {
      broadcastChannel.close();
    }
    if (eventSource) {
      eventSource.close();
    }
    if (pollInterval) {
      clearInterval(pollInterval);
    }
  };
}
