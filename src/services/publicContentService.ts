import type {
  BusinessProfileContract,
  DayHoursContract,
  GalleryItemContract,
  MenuCategoryContract,
  ReviewItemContract,
} from "../types/business.ts";
import { cafe, menuCategories, weeklySchedule, galleryItems, verifiedReviews } from "../data/cafe.ts";
import { fetchPublishedTenant } from "../lib/supabase.ts";
import { getDemoSnapshot } from "./demoSyncService.ts";

export interface PublicContentPayload {
  profile: BusinessProfileContract;
  menuCategories: MenuCategoryContract[];
  schedule: DayHoursContract[];
  galleryItems: GalleryItemContract[];
  reviews: ReviewItemContract[];
  isLive: boolean;
  source: "live" | "cached" | "fallback";
  error: string | null;
  fetchedAt: number;
}

const CACHE_KEY_PREFIX = "aromica_public_content_";
const CACHE_TTL_MS = 60 * 1000; // 60-second SWR revalidation window

// ----------------------------------------------------------------------------
// 1. Data Mappers (Transform raw PostgreSQL rows into strict domain contracts)
// ----------------------------------------------------------------------------

export function mapDatabaseToMenuCategories(dbCategories: unknown[]): MenuCategoryContract[] {
  if (!Array.isArray(dbCategories) || dbCategories.length === 0) return [];

  return (dbCategories as Record<string, unknown>[])
    .filter((cat) => cat.is_published !== false)
    .sort((a, b) => (Number(a.display_order) || 0) - (Number(b.display_order) || 0))
    .map((cat) => {
      const rawGroups = Array.isArray(cat.menu_groups)
        ? (cat.menu_groups as Record<string, unknown>[])
        : [];

      const groups = rawGroups
        .sort((a, b) => (Number(a.display_order) || 0) - (Number(b.display_order) || 0))
        .map((grp) => {
          const rawItems = Array.isArray(grp.menu_items)
            ? (grp.menu_items as Record<string, unknown>[])
            : [];

          const items = rawItems
            .sort((a, b) => (Number(a.display_order) || 0) - (Number(b.display_order) || 0))
            .map((item) => ({
              id: typeof item.id === "string" ? item.id : undefined,
              name: String(item.name || ""),
              price: String(item.price || ""),
              veg: Boolean(item.veg),
              available: item.available !== false,
              description: item.description ? String(item.description) : undefined,
              note: item.note ? String(item.note) : undefined,
              imageUrl: item.image_url ? String(item.image_url) : (item.imageUrl ? String(item.imageUrl) : undefined),
              imageAlt: item.image_alt ? String(item.image_alt) : (item.imageAlt ? String(item.imageAlt) : undefined),
            }));

          return {
            id: typeof grp.id === "string" ? grp.id : undefined,
            title: String(grp.title || ""),
            note: grp.note ? String(grp.note) : undefined,
            items,
          };
        });

      return {
        id: String(cat.slug_id || cat.id || ""),
        label: String(cat.label || ""),
        description: cat.description ? String(cat.description) : undefined,
        groups,
      };
    });
}

export function mapDatabaseToSchedule(
  dbSchedules: unknown[],
  fallbackSchedule: DayHoursContract[] = weeklySchedule
): DayHoursContract[] {
  if (!Array.isArray(dbSchedules) || dbSchedules.length === 0) {
    return fallbackSchedule;
  }

  const list = dbSchedules as Record<string, unknown>[];

  return fallbackSchedule.map((fallbackDay) => {
    const matched = list.find(
      (s) =>
        Number(s.day_index) === fallbackDay.dayIndex ||
        Number(s.day_of_week) === fallbackDay.dayIndex
    );
    if (!matched) return fallbackDay;

    const isClosed = Boolean(matched.is_closed);
    let hours = fallbackDay.hours;
    let openMinutes = fallbackDay.openMinutes;
    let closeMinutes = fallbackDay.closeMinutes;

    if (isClosed) {
      hours = "Closed";
    } else if (typeof matched.hours === "string" && matched.hours) {
      hours = matched.hours;
    } else if (matched.open_time && matched.close_time) {
      const openStr = String(matched.open_time).slice(0, 5);
      const closeStr = String(matched.close_time).slice(0, 5);
      const [oH, oM] = openStr.split(":").map(Number);
      const [cH, cM] = closeStr.split(":").map(Number);
      openMinutes = oH * 60 + oM;
      closeMinutes = cH * 60 + cM;

      const formatTime = (h: number, m: number) => {
        const period = h >= 12 ? "PM" : "AM";
        const displayH = h % 12 === 0 ? 12 : h % 12;
        const displayM = m === 0 ? "00" : String(m).padStart(2, "0");
        return `${displayH}:${displayM} ${period}`;
      };

      hours = `${formatTime(oH, oM)} – ${formatTime(cH, cM)}`;
    }

    return {
      day: String(matched.day || fallbackDay.day),
      dayIndex: fallbackDay.dayIndex,
      hours,
      isClosed,
      openMinutes: typeof matched.open_minutes === "number" ? matched.open_minutes : openMinutes,
      closeMinutes: typeof matched.close_minutes === "number" ? matched.close_minutes : closeMinutes,
      openDisplay: matched.open_display ? String(matched.open_display) : fallbackDay.openDisplay,
      closeDisplay: matched.close_display ? String(matched.close_display) : fallbackDay.closeDisplay,
    };
  });
}

export function mapDatabaseToProfile(
  rawProfile: unknown,
  fallbackProfile: BusinessProfileContract = cafe
): BusinessProfileContract {
  if (!rawProfile || typeof rawProfile !== "object") {
    return fallbackProfile;
  }

  const p = rawProfile as Record<string, unknown>;

  // Handle both database format (business_name, brand_word1) and direct snapshot format (name, brandWord1)
  const name = typeof p.business_name === "string" && p.business_name
    ? p.business_name
    : typeof p.name === "string" && p.name
    ? p.name
    : fallbackProfile.name;

  const brandWord1 = typeof p.brand_word1 === "string" && p.brand_word1
    ? p.brand_word1
    : typeof p.brandWord1 === "string" && p.brandWord1
    ? p.brandWord1
    : fallbackProfile.brandWord1;

  const brandWord2 = typeof p.brand_word2 === "string" && p.brand_word2
    ? p.brand_word2
    : typeof p.brandWord2 === "string" && p.brandWord2
    ? p.brandWord2
    : fallbackProfile.brandWord2;

  const tagline = typeof p.tagline === "string" && p.tagline
    ? p.tagline
    : fallbackProfile.tagline;

  const slogan = typeof p.slogan === "string" && p.slogan
    ? p.slogan
    : fallbackProfile.slogan;

  const description = typeof p.description === "string" && p.description
    ? p.description
    : fallbackProfile.description;

  const neighborhood = typeof p.neighborhood === "string" && p.neighborhood
    ? p.neighborhood
    : fallbackProfile.neighborhood;

  const city = typeof p.city === "string" && p.city
    ? p.city
    : fallbackProfile.city;

  const visitDescription = typeof p.visit_description === "string" && p.visit_description
    ? p.visit_description
    : typeof p.visitDescription === "string" && p.visitDescription
    ? p.visitDescription
    : fallbackProfile.visitDescription;

  // Address
  const rawAddress = (p.address && typeof p.address === "object") ? (p.address as Record<string, unknown>) : {};
  const address = {
    ...fallbackProfile.address,
    ...rawAddress,
  };

  // Landmarks & guidance
  const landmarks = Array.isArray(p.landmarks) ? (p.landmarks as string[]) : fallbackProfile.landmarks;
  const landmarkGuidance = typeof p.landmarkGuidance === "string" && p.landmarkGuidance
    ? p.landmarkGuidance
    : typeof p.landmark_guidance === "string" && p.landmark_guidance
    ? p.landmark_guidance
    : fallbackProfile.landmarkGuidance;

  // Phone
  const rawPhone = (p.phone && typeof p.phone === "object") ? (p.phone as Record<string, unknown>) : {};
  const phone = {
    ...fallbackProfile.phone,
    ...(typeof p.phone_number === "string" ? { number: p.phone_number, href: `tel:${p.phone_number.replace(/\s+/g, "")}` } : {}),
    ...rawPhone,
  };

  // Whatsapp
  const rawWhatsapp = (p.whatsapp && typeof p.whatsapp === "object") ? (p.whatsapp as Record<string, unknown>) : {};
  const whatsapp = {
    ...fallbackProfile.whatsapp,
    ...(typeof p.whatsapp_number === "string" ? { number: p.whatsapp_number, href: `https://wa.me/${p.whatsapp_number.replace(/[^0-9]/g, "")}` } : {}),
    ...rawWhatsapp,
  };

  // Instagram
  const rawInstagram = (p.instagram && typeof p.instagram === "object") ? (p.instagram as Record<string, unknown>) : {};
  const instagram = {
    ...fallbackProfile.instagram,
    ...(typeof p.instagram_handle === "string" ? { handle: p.instagram_handle, href: `https://instagram.com/${p.instagram_handle.replace(/^@/, "")}` } : {}),
    ...rawInstagram,
  };

  // Reviews
  const rawReviews = (p.reviews && typeof p.reviews === "object") ? (p.reviews as Record<string, unknown>) : {};
  const reviews = {
    ...fallbackProfile.reviews,
    ...rawReviews,
  };

  // Order online
  const rawOrderOnline = (p.orderOnline && typeof p.orderOnline === "object") ? (p.orderOnline as Record<string, unknown>) : {};
  const orderOnline = {
    ...fallbackProfile.orderOnline,
    ...(typeof p.order_online_url === "string" ? { href: p.order_online_url } : {}),
    ...(typeof p.order_online_enabled === "boolean" ? { enabled: p.order_online_enabled } : {}),
    ...rawOrderOnline,
  };

  // Menu flipbook
  const rawMenuFlipbook = (p.menuFlipbook && typeof p.menuFlipbook === "object") ? (p.menuFlipbook as Record<string, unknown>) : {};
  const menuFlipbook = {
    ...fallbackProfile.menuFlipbook,
    ...rawMenuFlipbook,
  };

  // Directions & coordinates
  const rawDirections = (p.directions && typeof p.directions === "object") ? (p.directions as Record<string, unknown>) : {};
  const directions = {
    ...fallbackProfile.directions,
    ...rawDirections,
  };

  const rawCoordinates = (p.coordinates && typeof p.coordinates === "object") ? (p.coordinates as { lat: number; lng: number }) : null;
  const coordinates = rawCoordinates || fallbackProfile.coordinates;

  // Hero image
  const rawHeroImage = (p.heroImage && typeof p.heroImage === "object") ? (p.heroImage as Record<string, unknown>) : {};
  const heroImage = {
    ...fallbackProfile.heroImage,
    ...rawHeroImage,
  };

  // Atmosphere
  const rawAtmosphere = (p.atmosphere && typeof p.atmosphere === "object") ? (p.atmosphere as Record<string, unknown>) : {};
  const atmosphere = {
    ...fallbackProfile.atmosphere,
    ...rawAtmosphere,
    image: {
      ...fallbackProfile.atmosphere.image,
      ...((rawAtmosphere.image && typeof rawAtmosphere.image === "object") ? (rawAtmosphere.image as Record<string, unknown>) : {}),
    },
  };

  // Menu metadata: support both p.menu and p.menuMeta, fall back safely to fallbackProfile.menu
  const rawMenu = (p.menu && typeof p.menu === "object")
    ? (p.menu as Record<string, unknown>)
    : (p.menuMeta && typeof p.menuMeta === "object")
    ? (p.menuMeta as Record<string, unknown>)
    : {};
  const menu = {
    ...fallbackProfile.menu,
    ...rawMenu,
  };

  // Hours: ensure daysOpenSummary, timeOpenSummary, closedDaySummary, weekly are always defined
  const rawHours = (p.hours && typeof p.hours === "object") ? (p.hours as Record<string, unknown>) : {};
  const hours = {
    ...fallbackProfile.hours,
    ...rawHours,
  };

  return {
    ...fallbackProfile,
    name,
    brandWord1,
    brandWord2,
    tagline,
    slogan,
    description,
    neighborhood,
    city,
    address,
    landmarks,
    landmarkGuidance,
    visitDescription,
    phone,
    whatsapp,
    instagram,
    reviews,
    orderOnline,
    menuFlipbook,
    directions,
    coordinates,
    heroImage,
    atmosphere,
    menu,
    hours,
  };
}

// ----------------------------------------------------------------------------
// 2. Default Fallback & Demo Snapshot Provider
// ----------------------------------------------------------------------------

export function getFallbackContent(error: string | null = null): PublicContentPayload {
  const demoSnapshot = getDemoSnapshot();

  return {
    profile: mapDatabaseToProfile(demoSnapshot.profile, cafe),
    menuCategories: demoSnapshot.menuCategories || menuCategories,
    schedule: demoSnapshot.schedule || weeklySchedule,
    galleryItems: demoSnapshot.galleryItems || galleryItems,
    reviews: demoSnapshot.reviews || verifiedReviews,
    isLive: false,
    source: "fallback",
    error,
    fetchedAt: demoSnapshot.updatedAt || Date.now(),
  };
}

// ----------------------------------------------------------------------------
// 3. Cache Storage & SWR Retrieval
// ----------------------------------------------------------------------------

function getStorage(): Storage | null {
  try {
    if (typeof globalThis !== "undefined" && globalThis.localStorage) {
      return globalThis.localStorage;
    }
  } catch {
    // Ignore storage detection failure
  }
  return null;
}

export function readCachedContent(tenantSlug: string): PublicContentPayload | null {
  const storage = getStorage();
  if (!storage) return null;
  try {
    const raw = storage.getItem(`${CACHE_KEY_PREFIX}${tenantSlug}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PublicContentPayload;
    if (parsed && typeof parsed.fetchedAt === "number") {
      // Check TTL (60s SWR window)
      if (Date.now() - parsed.fetchedAt > CACHE_TTL_MS) {
        return null;
      }
      return parsed;
    }
  } catch {
    // Ignore cache read failures gracefully
  }
  return null;
}

export function writeCachedContent(tenantSlug: string, payload: PublicContentPayload): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.setItem(`${CACHE_KEY_PREFIX}${tenantSlug}`, JSON.stringify(payload));
  } catch {
    // Ignore cache write quota errors gracefully
  }
}

export function invalidateCachedContent(tenantSlug: string = "aromica-cafe"): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.removeItem(`${CACHE_KEY_PREFIX}${tenantSlug}`);
  } catch {
    // Ignore storage errors gracefully
  }
}

// ----------------------------------------------------------------------------
// 4. Live Fetch & Revalidation Coordinator
// ----------------------------------------------------------------------------

const inFlightPublicRequests = new Map<string, Promise<PublicContentPayload>>();

export async function fetchLiveBusinessContent(
  tenantSlug: string = "aromica-cafe"
): Promise<PublicContentPayload> {
  const existingPromise = inFlightPublicRequests.get(tenantSlug);
  if (existingPromise) {
    return existingPromise;
  }

  const executeFetch = async (): Promise<PublicContentPayload> => {
    const fallback = getFallbackContent();

    try {
      const { data, error } = await fetchPublishedTenant(tenantSlug);

      if (error || !data) {
        return {
          ...fallback,
          error: error ? error.message : "Tenant not found or unpublished",
          source: "fallback",
        };
      }

      const liveMenu = mapDatabaseToMenuCategories(data.categories);
      const liveSchedule = mapDatabaseToSchedule(data.schedules, fallback.schedule);
      const liveProfile = mapDatabaseToProfile(data.profile, fallback.profile);

      // Map published media assets belonging to gallery category
      const liveGallery: GalleryItemContract[] = Array.isArray(data.mediaAssets) && data.mediaAssets.length > 0
        ? (data.mediaAssets as Record<string, unknown>[])
            .filter((m) => m.category === "gallery" || !m.category)
            .map((m) => ({
              id: String(m.id),
              src: String(m.public_url),
              alt: String(m.alt_text || "Aromica Café Visual Moment"),
              caption: String(m.caption || "Café Moment"),
              category: String(m.category || "Food"),
              aspectClass: "aspect-square",
            }))
        : fallback.galleryItems;

      const payload: PublicContentPayload = {
        profile: liveProfile,
        menuCategories: liveMenu.length > 0 ? liveMenu : fallback.menuCategories,
        schedule: liveSchedule,
        galleryItems: liveGallery.length > 0 ? liveGallery : fallback.galleryItems,
        reviews: fallback.reviews,
        isLive: true,
        source: "live",
        error: null,
        fetchedAt: Date.now(),
      };

      // Save fresh response to local cache
      writeCachedContent(tenantSlug, payload);

      return payload;
    } catch (err) {
      return {
        ...fallback,
        error: err instanceof Error ? err.message : "Unexpected network error",
        source: "fallback",
      };
    }
  };

  const promise = executeFetch().finally(() => {
    inFlightPublicRequests.delete(tenantSlug);
  });

  inFlightPublicRequests.set(tenantSlug, promise);
  return promise;
}

export { CACHE_TTL_MS };
