/**
 * Core Business Domain Types & Data Contracts
 * 
 * Defines the canonical data structures for business websites and
 * management systems. Reusable across client public sites, owner
 * management dashboards, and agency backend APIs.
 */

// ============================================================================
// 1. Primitive Action & Link Contracts
// ============================================================================

export interface ContactActionContract {
  enabled: boolean;
  display: string;
  raw: string;
  href: string;
}

export interface SocialChannelContract {
  enabled: boolean;
  handle: string;
  href: string;
}

export interface ExternalActionContract {
  enabled: boolean;
  href: string;
}

export interface FeatureLinkContract {
  enabled: boolean;
  label: string;
  href: string;
}

export interface NavigationLinkContract {
  enabled: boolean;
  href: string;
  embedSrc: string;
}

export interface GeoCoordinatesContract {
  lat: number;
  lng: number;
}

export interface ImageAssetContract {
  src: string;
  alt: string;
}

export interface ImageBadgeAssetContract extends ImageAssetContract {
  badge?: string;
}

export interface BusinessAddressContract {
  street: string;
  locality: string;
  cityRegion: string;
  statePostal: string;
  full: string;
}

// ============================================================================
// 2. Operating Hours & Schedule Contracts
// ============================================================================

export interface DayHoursContract {
  day: string;
  hours: string;
  isClosed: boolean;
  dayIndex: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  openMinutes?: number;
  closeMinutes?: number;
  openDisplay?: string;
  closeDisplay?: string;
}

export type WeeklyScheduleContract = DayHoursContract[];

export interface HoursSummaryContract {
  summary: string;
  daysOpenSummary: string;
  timeOpenSummary: string;
  closedDaySummary: string;
  weekly: WeeklyScheduleContract;
}

// ============================================================================
// 3. Menu Domain Contracts
// ============================================================================

export interface MenuItemContract {
  id?: string;
  name: string;
  price: string;
  veg: boolean;
  description?: string;
  note?: string;
  available?: boolean; // In-stock status (default: true)
  imageUrl?: string; // Optional direct or uploaded image URL
  imageAlt?: string;
}

export interface MenuGroupContract {
  id?: string;
  title: string;
  note?: string;
  items: MenuItemContract[];
}

export interface MenuCategoryContract {
  id: string;
  label: string;
  description?: string;
  groups: MenuGroupContract[];
}

export interface MenuMetaContract {
  title: string;
  eyebrow: string;
  subtitle: string;
  footerNote: string;
}

// ============================================================================
// 4. Gallery & Media Domain Contracts
// ============================================================================

export interface MediaAssetContract {
  id: string;
  tenantId: string;
  filename: string;
  contentType: string; // e.g. "image/webp", "image/jpeg", "image/png"
  byteSize: number;
  width?: number;
  height?: number;
  publicUrl: string;
  storagePath?: string; // e.g. "tenants/a0000000-0000-0000-0000-000000000001/gallery/photo-1.webp"
  category?: "gallery" | "menu" | "branding";
  altText?: string;
  caption?: string;
  createdAt?: string;
}

export interface GalleryItemContract {
  id: string;
  src: string;
  alt: string;
  caption: string;
  category?: string;
  tall?: boolean;
  aspectClass?: string;
}

export interface MediaValidationResult {
  valid: boolean;
  error?: string;
  details?: {
    sanitizedFilename?: string;
    detectedExtension?: string;
    byteSize?: number;
    mimeType?: string;
  };
}

// ============================================================================
// 5. Review & Social Proof Contracts
// ============================================================================

export interface ReviewItemContract {
  id: string;
  author: string;
  text: string;
  date?: string;
  rating?: number;
}

// ============================================================================
// 6. Atmosphere & Storytelling Contracts
// ============================================================================

export interface AtmosphereBlockContract {
  eyebrow: string;
  title: string;
  description: string;
  image: ImageBadgeAssetContract;
}

// ============================================================================
// 7. Full Business Profile Contract
// ============================================================================

export interface BusinessProfileContract {
  name: string;
  brandWord1: string;
  brandWord2: string;
  tagline: string;
  slogan: string;
  description: string;
  neighborhood: string;
  city: string;
  address: BusinessAddressContract;
  landmarks: string[];
  landmarkGuidance: string;
  visitDescription: string;
  phone: ContactActionContract;
  whatsapp: ContactActionContract;
  instagram: SocialChannelContract;
  reviews: ExternalActionContract;
  orderOnline: FeatureLinkContract;
  menuFlipbook: FeatureLinkContract;
  directions: NavigationLinkContract;
  coordinates: GeoCoordinatesContract;
  heroImage: ImageAssetContract;
  atmosphere: AtmosphereBlockContract;
  menu: MenuMetaContract;
  hours: HoursSummaryContract;
}

// ============================================================================
// 8. Canonical Business Content Contract (Payload exchanged with API/CDN)
// ============================================================================

export interface BusinessContentContract {
  tenantId?: string;
  slug: string;
  version: string;
  updatedAt?: string;
  profile: BusinessProfileContract;
  menuCategories: MenuCategoryContract[];
  galleryItems: GalleryItemContract[];
  reviews?: ReviewItemContract[];
}

// ============================================================================
// 9. Owner Management System Sample & Attribution Contract
// ============================================================================

export interface ManagementDemoAttributionContract {
  creator: {
    name: string;
    phone: string;
    phoneRaw: string;
    phoneHref: string;
    email: string;
    emailHref: string;
  };
  sampleLabels: {
    badge: string;
    title: string;
    tagline: string;
    disclaimer: string;
    contactCta: string;
  };
}

export const MANAGEMENT_DEMO_ATTRIBUTION: ManagementDemoAttributionContract = {
  creator: {
    name: "Susmit Dey",
    phone: "+91 9007801474",
    phoneRaw: "919007801474",
    phoneHref: "tel:+919007801474",
    email: "susmitdey047@gmail.com",
    emailHref: "mailto:susmitdey047@gmail.com",
  },
  sampleLabels: {
    badge: "Concept Demo",
    title: "Business Management System — Concept Demo",
    tagline: "A portfolio project by Susmit Dey",
    disclaimer: "This is a demonstration system illustrating independent website management for business owners.",
    contactCta: "Interested in a system like this? Contact Susmit Dey",
  },
};

// ============================================================================
// 10. Lightweight Runtime Validation Helpers (Zero-dependency guardrails)
// ============================================================================

export function isMenuItem(value: unknown): value is MenuItemContract {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.name === "string" &&
    typeof item.price === "string" &&
    typeof item.veg === "boolean"
  );
}

export function isMenuGroup(value: unknown): value is MenuGroupContract {
  if (typeof value !== "object" || value === null) return false;
  const group = value as Record<string, unknown>;
  return (
    typeof group.title === "string" &&
    Array.isArray(group.items) &&
    group.items.every(isMenuItem)
  );
}

export function isMenuCategory(value: unknown): value is MenuCategoryContract {
  if (typeof value !== "object" || value === null) return false;
  const cat = value as Record<string, unknown>;
  return (
    typeof cat.id === "string" &&
    typeof cat.label === "string" &&
    Array.isArray(cat.groups) &&
    cat.groups.every(isMenuGroup)
  );
}

export function validateBusinessContent(data: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (typeof data !== "object" || data === null) {
    return { valid: false, errors: ["Data payload must be a non-null object"] };
  }

  const content = data as Record<string, unknown>;

  if (typeof content.slug !== "string" || !content.slug.trim()) {
    errors.push("Missing or invalid string field 'slug'");
  }

  if (typeof content.profile !== "object" || content.profile === null) {
    errors.push("Missing or invalid object field 'profile'");
  } else {
    const prof = content.profile as Record<string, unknown>;
    if (typeof prof.name !== "string") errors.push("profile.name must be a string");
    if (typeof prof.address !== "object") errors.push("profile.address must be an object");
    if (typeof prof.hours !== "object") errors.push("profile.hours must be an object");
  }

  if (!Array.isArray(content.menuCategories)) {
    errors.push("menuCategories must be an array");
  } else {
    content.menuCategories.forEach((cat, index) => {
      if (!isMenuCategory(cat)) {
        errors.push(`menuCategories[${index}] does not conform to MenuCategoryContract`);
      }
    });
  }

  if (!Array.isArray(content.galleryItems)) {
    errors.push("galleryItems must be an array");
  }

  return { valid: errors.length === 0, errors };
}
