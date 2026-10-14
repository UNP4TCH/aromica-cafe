import type { MediaValidationResult } from "../types/business.ts";

/**
 * Media Validation & Storage Constraints
 */
export const MEDIA_LIMITS = {
  MAX_FILE_SIZE_BYTES: 5 * 1024 * 1024, // 5 MB maximum
  MIN_FILE_SIZE_BYTES: 1024, // 1 KB minimum (reject empty or corrupt files)
  ALLOWED_MIME_TYPES: [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/avif",
  ] as const,
  ALLOWED_EXTENSIONS: [".jpg", ".jpeg", ".png", ".webp", ".avif"] as const,
  MAGIC_NUMBERS: {
    // Magic byte signatures for client-side / buffer inspection
    JPEG: [0xff, 0xd8, 0xff],
    PNG: [0x89, 0x50, 0x4e, 0x47],
    WEBP: [0x52, 0x49, 0x46, 0x46], // "RIFF"
  },
};

/**
 * Sanitizes filename: removes dangerous path characters, scripts, control characters,
 * spaces, and enforces lowercase alphanumeric extensions.
 */
export function sanitizeFilename(filename: string): string {
  if (!filename) return `media-${Date.now()}.webp`;

  // Strip path traversal characters
  const base = filename.replace(/^.*[\\/]/, "");

  // Separate name and extension
  const lastDot = base.lastIndexOf(".");
  if (lastDot === -1) {
    const clean = base.replace(/[^a-zA-Z0-9_-]/g, "_").toLowerCase();
    return `${clean || "media"}.webp`;
  }

  const rawName = base.substring(0, lastDot);
  const rawExt = base.substring(lastDot).toLowerCase();

  const cleanName = rawName
    .replace(/[^a-zA-Z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();

  const cleanExt = rawExt.replace(/[^a-z0-9.]/g, "");

  return `${cleanName || "media"}-${Date.now().toString(36)}${cleanExt}`;
}

/**
 * Performs comprehensive media file validation on client or node buffers:
 * - Checks file size (1KB - 5MB)
 * - Checks file extension
 * - Checks reported MIME type
 * - Validates magic bytes if Uint8Array or Buffer is provided
 */
export function validateMediaFile(
  file: { name: string; size: number; type: string },
  bytesHeader?: Uint8Array | number[]
): MediaValidationResult {
  // 1. File size check
  if (!file || typeof file.size !== "number" || file.size <= 0) {
    return { valid: false, error: "Empty or invalid file payload provided." };
  }

  if (file.size < MEDIA_LIMITS.MIN_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File is too small (${(file.size / 1024).toFixed(1)} KB). Minimum allowed size is 1 KB.`,
    };
  }

  if (file.size > MEDIA_LIMITS.MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File exceeds maximum allowed size of 5 MB (${(file.size / (1024 * 1024)).toFixed(2)} MB).`,
    };
  }

  // 2. Extension validation
  const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
  const hasValidExt = (MEDIA_LIMITS.ALLOWED_EXTENSIONS as readonly string[]).includes(ext);
  if (!hasValidExt) {
    return {
      valid: false,
      error: `Unsupported file extension "${ext}". Allowed formats: .webp, .jpg, .jpeg, .png, .avif.`,
    };
  }

  // 3. MIME type validation
  const normalizedType = file.type.toLowerCase();
  const hasValidMime = (MEDIA_LIMITS.ALLOWED_MIME_TYPES as readonly string[]).includes(
    normalizedType as typeof MEDIA_LIMITS.ALLOWED_MIME_TYPES[number]
  );

  if (!hasValidMime && normalizedType !== "") {
    return {
      valid: false,
      error: `Unsupported media type "${file.type}". Allowed types: WebP, JPEG, PNG, AVIF.`,
    };
  }

  // 4. Magic byte signature verification if byte array is available
  if (bytesHeader && bytesHeader.length >= 4) {
    const isJpeg =
      bytesHeader[0] === 0xff &&
      bytesHeader[1] === 0xd8 &&
      bytesHeader[2] === 0xff;
    const isPng =
      bytesHeader[0] === 0x89 &&
      bytesHeader[1] === 0x50 &&
      bytesHeader[2] === 0x4e &&
      bytesHeader[3] === 0x47;
    const isRiffWebp =
      bytesHeader[0] === 0x52 &&
      bytesHeader[1] === 0x49 &&
      bytesHeader[2] === 0x46 &&
      bytesHeader[3] === 0x46; // "RIFF" header for WebP

    if (!isJpeg && !isPng && !isRiffWebp && ext !== ".avif") {
      return {
        valid: false,
        error: "File content does not match allowed image signatures (magic byte mismatch).",
      };
    }
  }

  const sanitized = sanitizeFilename(file.name);

  return {
    valid: true,
    details: {
      sanitizedFilename: sanitized,
      detectedExtension: ext,
      byteSize: file.size,
      mimeType: normalizedType || "image/webp",
    },
  };
}

/**
 * Builds tenant-isolated storage path following convention:
 * `tenants/{tenantId}/{category}/{sanitizedFilename}`
 */
export function buildTenantStoragePath(
  tenantId: string,
  category: "gallery" | "menu" | "branding",
  sanitizedFilename: string
): string {
  const cleanTenant = tenantId.replace(/[^a-zA-Z0-9-]/g, "");
  return `tenants/${cleanTenant}/${category}/${sanitizedFilename}`;
}
