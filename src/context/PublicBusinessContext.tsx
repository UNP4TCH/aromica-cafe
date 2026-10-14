import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import type {
  BusinessProfileContract,
  DayHoursContract,
  GalleryItemContract,
  MenuCategoryContract,
  ReviewItemContract,
} from "@/types/business";
import {
  getFallbackContent,
  readCachedContent,
  fetchLiveBusinessContent,
  mapDatabaseToProfile,
  type PublicContentPayload,
  CACHE_TTL_MS,
} from "@/services/publicContentService";
import { cafe } from "@/data/cafe";
import { subscribeToDemoSync } from "@/services/demoSyncService";
import { isSupabaseConfigured } from "@/lib/supabase";

interface PublicBusinessContextValue {
  profile: BusinessProfileContract;
  cafe: BusinessProfileContract;
  menuCategories: MenuCategoryContract[];
  schedule: DayHoursContract[];
  galleryItems: GalleryItemContract[];
  reviews: ReviewItemContract[];
  isLive: boolean;
  source: "live" | "cached" | "fallback";
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refetch: () => Promise<void>;
}

const PublicBusinessContext = createContext<PublicBusinessContextValue | null>(null);

export function PublicBusinessProvider({
  children,
  tenantSlug = "aromica-cafe",
}: {
  children: React.ReactNode;
  tenantSlug?: string;
}) {
  const [content, setContent] = useState<PublicContentPayload>(() => {
    // 1. Initial State: Check local SWR cache, or default immediately to approved fallback
    const cached = readCachedContent(tenantSlug);
    if (cached) return cached;
    return getFallbackContent();
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const revalidate = useCallback(async () => {
    if (!isSupabaseConfigured) {
      // Graceful offline/unconfigured mode: maintain fallback
      return;
    }

    setIsLoading(true);
    try {
      const livePayload = await fetchLiveBusinessContent(tenantSlug);
      setContent(livePayload);
    } catch {
      // In case of unexpected error, keep current state intact
    } finally {
      setIsLoading(false);
    }
  }, [tenantSlug]);

  useEffect(() => {
    // 1. Subscribe to live demo simulation events (cross-tab and same-origin)
    const unsubscribe = subscribeToDemoSync((snapshot) => {
      setContent({
        profile: mapDatabaseToProfile(snapshot.profile, cafe),
        menuCategories: snapshot.menuCategories,
        schedule: snapshot.schedule,
        galleryItems: snapshot.galleryItems,
        reviews: snapshot.reviews,
        isLive: false,
        source: "fallback",
        error: null,
        fetchedAt: snapshot.updatedAt,
      });
    });

    // 2. Check if revalidation is needed for live Supabase mode
    if (isSupabaseConfigured) {
      const cached = readCachedContent(tenantSlug);
      const isStale = !cached || Date.now() - cached.fetchedAt > CACHE_TTL_MS;
      if (isStale) {
        void revalidate();
      }
    }

    return () => {
      unsubscribe();
    };
  }, [tenantSlug, revalidate]);

  const value: PublicBusinessContextValue = {
    profile: content.profile,
    cafe: content.profile,
    menuCategories: content.menuCategories,
    schedule: content.schedule,
    galleryItems: content.galleryItems,
    reviews: content.reviews,
    isLive: content.isLive,
    source: content.source,
    isLoading,
    error: content.error,
    lastUpdated: content.fetchedAt ? new Date(content.fetchedAt) : null,
    refetch: revalidate,
  };

  return (
    <PublicBusinessContext.Provider value={value}>
      {children}
    </PublicBusinessContext.Provider>
  );
}

export function useBusinessContent(): PublicBusinessContextValue {
  const ctx = useContext(PublicBusinessContext);
  if (!ctx) {
    // Return fallback context value if component is rendered outside provider
    const fallback = getFallbackContent();
    return {
      profile: fallback.profile,
      cafe: fallback.profile,
      menuCategories: fallback.menuCategories,
      schedule: fallback.schedule,
      galleryItems: fallback.galleryItems,
      reviews: fallback.reviews,
      isLive: false,
      source: "fallback",
      isLoading: false,
      error: null,
      lastUpdated: null,
      refetch: async () => {},
    };
  }
  return ctx;
}
