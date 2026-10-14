/**
 * Shared Demo Data Synchronization Service
 * 
 * Provides a unified, versioned, synchronized storage layer for Interactive Portfolio Simulation Mode.
 * Communicates with either:
 *  1. Local demo sync HTTP server (http://127.0.0.1:5176) for local development.
 *  2. Cloud serverless sync endpoint (/api/demo-sync or https://aromica-cafe.vercel.app/api/demo-sync)
 *     backed by Upstash Redis REST for deployed portfolio demonstrations.
 * 
 * Falls back gracefully to localStorage and in-memory storage if the remote sync is unreachable.
 * Never overwrites local cache with baseline data upon remote failure.
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

export interface SyncConfig {
  isCloud: boolean;
  url: string;
  authPasskey?: string;
}

/**
 * Resolves the appropriate sync endpoint and authorization token depending on environment.
 */
export function getSyncConfig(): SyncConfig {
  const envUrl = typeof import.meta !== "undefined" && import.meta.env?.VITE_DEMO_SYNC_URL;
  const envPasskey = typeof import.meta !== "undefined" && import.meta.env?.VITE_DEMO_SYNC_PASSKEY;

  if (envUrl) {
    const isCloud = envUrl.includes("/api/demo-sync") || !envUrl.includes(":5176");
    return { isCloud, url: envUrl, authPasskey: envPasskey || "" };
  }

  if (typeof window !== "undefined" && window.location) {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") {
      return { isCloud: false, url: "http://127.0.0.1:5176" };
    }
    if (host.includes("aromica-cafe.vercel.app")) {
      return { isCloud: true, url: "/api/demo-sync", authPasskey: envPasskey || "" };
    }
    return {
      isCloud: true,
      url: "https://aromica-cafe.vercel.app/api/demo-sync",
      authPasskey: envPasskey || "",
    };
  }

  return { isCloud: false, url: "http://127.0.0.1:5176" };
}

/**
 * Checks if the background sync service is reachable.
 */
export async function checkSyncServerHealth(): Promise<boolean> {
  try {
    if (typeof fetch === "undefined") return false;
    const { isCloud, url } = getSyncConfig();
    const endpoint = isCloud ? url : `${url}/health`;
    const res = await fetch(endpoint, { method: "GET" });
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
 * Asynchronous getter: Pulls latest snapshot from the active synchronization service.
 * In-flight requests are deduplicated to prevent redundant network traffic under high concurrency.
 * If the remote service fails (e.g. 503 or network issue), preserves existing local cache.
 */
export async function fetchRemoteDemoSnapshot(): Promise<DemoSnapshot> {
  if (inFlightSnapshotFetch) {
    return inFlightSnapshotFetch;
  }

  inFlightSnapshotFetch = (async (): Promise<DemoSnapshot> => {
    try {
      const { isCloud, url } = getSyncConfig();
      const endpoint = isCloud ? url : `${url}/api/snapshot`;
      const res = await fetch(endpoint, {
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
      // If server is not reachable, do NOT overwrite cache with baseline. Fall back to local snapshot.
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
 * 2. Asynchronously POSTs to the active sync endpoint with authorization if required.
 * 3. Broadcasts via BroadcastChannel and window CustomEvent.
 * 4. Invalidates cached public content to ensure instant propagation.
 * Enforces Requirement 5: Public website cannot write or reset through frontend.
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

  // Post to sync endpoint in background
  try {
    if (typeof fetch !== "undefined") {
      const { isCloud, url, authPasskey } = getSyncConfig();

      // Enforce Requirement 5: In cloud environment without authorization passkey,
      // mutations from frontend are completely disabled.
      if (isCloud && !authPasskey) {
        return;
      }

      const endpoint = isCloud ? url : `${url}/api/snapshot`;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (isCloud && authPasskey) {
        headers["x-demo-auth"] = authPasskey;
      }

      void fetch(endpoint, {
        method: "POST",
        headers,
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
      const { isCloud, url, authPasskey } = getSyncConfig();

      if (!isCloud) {
        await fetch(`${url}/api/reset`, { method: "POST" });
      } else if (authPasskey) {
        await fetch(`${url}?action=reset`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-demo-auth": authPasskey,
          },
          body: JSON.stringify({ reset: true }),
        });
      }
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
 * Uses Server-Sent Events (SSE) when connected to local server, supplemented
 * by BroadcastChannel, storage events, window CustomEvents, and focus/visibility revalidation.
 */
export function subscribeToDemoSync(callback: (snapshot: DemoSnapshot) => void): () => void {
  if (typeof window === "undefined") return () => {};

  let eventSource: EventSource | null = null;
  let broadcastChannel: BroadcastChannel | null = null;
  let pollInterval: ReturnType<typeof setInterval> | null = null;

  const { isCloud, url } = getSyncConfig();

  // 1. Initial fetch from remote sync server
  void fetchRemoteDemoSnapshot().then((fresh) => {
    callback(fresh);
  });

  // 2. Local SSE connection if running on local sync server
  if (!isCloud) {
    try {
      if (typeof EventSource !== "undefined") {
        eventSource = new EventSource(`${url}/api/events`);
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
  }

  // 3. Polling interval (2s for local, 3s for cloud) to guarantee sync
  pollInterval = setInterval(() => {
    void fetchRemoteDemoSnapshot().then((remote) => {
      if (remote.updatedAt > latestCachedSnapshot.updatedAt) {
        callback(remote);
      }
    });
  }, isCloud ? 3000 : 2000);

  // 4. Instant revalidation on tab focus or visibility change (crucial for cross-tab cloud sync)
  const handleVisibilityOrFocus = () => {
    if (typeof document !== "undefined" && document.visibilityState === "visible") {
      void fetchRemoteDemoSnapshot().then((remote) => {
        if (remote.updatedAt > latestCachedSnapshot.updatedAt) {
          callback(remote);
        }
      });
    }
  };

  window.addEventListener("focus", handleVisibilityOrFocus);
  window.addEventListener("visibilitychange", handleVisibilityOrFocus);

  // 5. Local Window and Tab Listeners
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
    window.removeEventListener("focus", handleVisibilityOrFocus);
    window.removeEventListener("visibilitychange", handleVisibilityOrFocus);
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
