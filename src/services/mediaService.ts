import type {
  MediaAssetContract,
  MediaValidationResult,
  GalleryItemContract,
} from "../types/business.ts";
import { validateMediaFile, buildTenantStoragePath } from "./mediaValidation.ts";
import { supabase, isSupabaseConfigured } from "../lib/supabase.ts";

export interface UploadMediaOptions {
  file: File;
  tenantId: string;
  category: "gallery" | "menu" | "branding";
  altText?: string;
  caption?: string;
  isSimulation?: boolean;
}

export interface UploadMediaResult {
  success: boolean;
  asset?: MediaAssetContract;
  error?: string;
}

/**
 * Registry of active in-memory object URLs to safely clean up and prevent memory leaks.
 */
const activeObjectUrls = new Set<string>();

export function createRevocableObjectUrl(file: Blob | File): string {
  const url = URL.createObjectURL(file);
  activeObjectUrls.add(url);
  return url;
}

export function revokeManagedObjectUrl(url: string): void {
  if (activeObjectUrls.has(url)) {
    try {
      URL.revokeObjectURL(url);
    } catch {
      // Ignore URL revocation error
    }
    activeObjectUrls.delete(url);
  }
}

export function cleanupAllManagedObjectUrls(): void {
  for (const url of activeObjectUrls) {
    try {
      URL.revokeObjectURL(url);
    } catch {
      // Ignore
    }
  }
  activeObjectUrls.clear();
}

/**
 * Universal Media Upload Service:
 * Handles dual execution:
 * 1. Simulation Mode: validates payload, creates revocable object URL, and maintains isolated in-memory reference.
 * 2. Live Supabase Mode: uploads to `business-media` bucket and registers metadata row in `media_assets` table.
 */
export async function uploadMediaAsset(options: UploadMediaOptions): Promise<UploadMediaResult> {
  const { file, tenantId, category, altText, caption, isSimulation } = options;

  // 1. Client-side security and schema validation
  const validation: MediaValidationResult = validateMediaFile({
    name: file.name,
    size: file.size,
    type: file.type,
  });

  if (!validation.valid || !validation.details) {
    return {
      success: false,
      error: validation.error || "Media validation failed",
    };
  }

  const { sanitizedFilename, byteSize, mimeType } = validation.details;
  const storagePath = buildTenantStoragePath(tenantId, category, sanitizedFilename!);

  // 2. Simulation Execution
  if (isSimulation || !isSupabaseConfigured) {
    const objectUrl = createRevocableObjectUrl(file);
    const simulatedAsset: MediaAssetContract = {
      id: `sim-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      tenantId,
      filename: sanitizedFilename!,
      contentType: mimeType!,
      byteSize: byteSize!,
      publicUrl: objectUrl,
      storagePath,
      category,
      altText: altText || file.name.replace(/\.[^/.]+$/, ""),
      caption: caption || "",
      createdAt: new Date().toISOString(),
    };

    return {
      success: true,
      asset: simulatedAsset,
    };
  }

  // 3. Live Supabase Storage Execution
  try {
    const { data: storageData, error: storageError } = await supabase.storage
      .from("business-media")
      .upload(storagePath, file, {
        contentType: mimeType,
        cacheControl: "3600",
        upsert: false,
      });

    if (storageError || !storageData) {
      return {
        success: false,
        error: storageError ? storageError.message : "Failed to upload to Supabase Storage",
      };
    }

    // Retrieve public URL from bucket
    const { data: publicUrlData } = supabase.storage
      .from("business-media")
      .getPublicUrl(storagePath);

    const publicUrl = publicUrlData.publicUrl;

    // Register metadata row in media_assets table
    const { data: dbData, error: dbError } = await (supabase
      .from("media_assets" as unknown as "tenants") as any)
      .insert({
        tenant_id: tenantId,
        filename: sanitizedFilename,
        storage_path: storagePath,
        public_url: publicUrl,
        content_type: mimeType,
        byte_size: byteSize,
        category,
        alt_text: altText || null,
        caption: caption || null,
        is_published: true,
      })
      .select("id")
      .single();

    const assetId = dbData && typeof dbData === "object" && "id" in dbData
      ? String((dbData as { id: string }).id)
      : `media-${Date.now()}`;

    if (dbError) {
      // Orphan risk note: Storage upload succeeded, but database metadata insert failed
      console.warn("Storage upload succeeded but metadata registration returned:", dbError.message);
    }

    const liveAsset: MediaAssetContract = {
      id: assetId,
      tenantId,
      filename: sanitizedFilename!,
      contentType: mimeType!,
      byteSize: byteSize!,
      publicUrl,
      storagePath,
      category,
      altText,
      caption,
      createdAt: new Date().toISOString(),
    };

    return {
      success: true,
      asset: liveAsset,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unexpected upload network error",
    };
  }
}

/**
 * Media Asset Deletion:
 * Revokes object URL in simulation, or removes from Storage bucket and marks record in DB.
 */
export async function deleteMediaAsset(
  asset: MediaAssetContract,
  isSimulation: boolean = true
): Promise<{ success: boolean; error?: string }> {
  if (isSimulation || !isSupabaseConfigured) {
    revokeManagedObjectUrl(asset.publicUrl);
    return { success: true };
  }

  try {
    if (asset.storagePath) {
      await supabase.storage.from("business-media").remove([asset.storagePath]);
    }
    await supabase.from("media_assets" as unknown as "tenants").delete().eq("id", asset.id);
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to delete media asset",
    };
  }
}

/**
 * Transforms MediaAssetContract into public GalleryItemContract
 */
export function mediaAssetToGalleryItem(asset: MediaAssetContract): GalleryItemContract {
  return {
    id: asset.id,
    src: asset.publicUrl,
    alt: asset.altText || "Aromica Café Visual Moment",
    caption: asset.caption || "Café Moment",
    category: asset.category || "Gallery",
    aspectClass: "aspect-square",
  };
}
