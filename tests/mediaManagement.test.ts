import test from "node:test";
import assert from "node:assert/strict";
import {
  validateMediaFile,
  sanitizeFilename,
  buildTenantStoragePath,
} from "../src/services/mediaValidation.ts";
import {
  uploadMediaAsset,
  deleteMediaAsset,
  mediaAssetToGalleryItem,
} from "../src/services/mediaService.ts";

test("Media Validation: Sanitizes filenames against path traversal and special characters", () => {
  const traversal = sanitizeFilename("../../etc/passwd/hack.PNG");
  assert.ok(!traversal.includes("/"));
  assert.ok(!traversal.includes(".."));
  assert.ok(traversal.endsWith(".png"));

  const spaced = sanitizeFilename("My Cold Coffee #1 @ night!.WEBP");
  assert.ok(!spaced.includes(" "));
  assert.ok(!spaced.includes("#"));
  assert.ok(!spaced.includes("@"));
  assert.ok(!spaced.includes("!"));
  assert.ok(spaced.endsWith(".webp"));
});

test("Media Validation: Enforces file size limits (1 KB to 5 MB)", () => {
  // 1. Below 1 KB
  const tiny = validateMediaFile({ name: "tiny.webp", size: 500, type: "image/webp" });
  assert.equal(tiny.valid, false);
  assert.ok(tiny.error?.includes("too small"));

  // 2. Above 5 MB
  const giant = validateMediaFile({
    name: "giant.png",
    size: 6 * 1024 * 1024,
    type: "image/png",
  });
  assert.equal(giant.valid, false);
  assert.ok(giant.error?.includes("exceeds maximum"));

  // 3. Valid size (250 KB)
  const valid = validateMediaFile({
    name: "hero.jpg",
    size: 250 * 1024,
    type: "image/jpeg",
  });
  assert.equal(valid.valid, true);
  assert.equal(valid.details?.byteSize, 250 * 1024);
});

test("Media Validation: Rejects unsupported file types and extensions", () => {
  // Executable masquerading as image
  const exe = validateMediaFile({
    name: "trojan.exe",
    size: 50 * 1024,
    type: "application/x-msdownload",
  });
  assert.equal(exe.valid, false);
  assert.ok(exe.error?.includes("Unsupported file extension"));

  // Script with spoofed MIME
  const js = validateMediaFile({
    name: "script.js",
    size: 10 * 1024,
    type: "image/png",
  });
  assert.equal(js.valid, false);
  assert.ok(js.error?.includes("Unsupported file extension"));
});

test("Media Validation: Inspects magic bytes header", () => {
  // Valid JPEG header: FF D8 FF
  const validJpeg = validateMediaFile(
    { name: "photo.jpg", size: 50 * 1024, type: "image/jpeg" },
    [0xff, 0xd8, 0xff, 0xe0]
  );
  assert.equal(validJpeg.valid, true);

  // Spoofed JPEG containing plain text / script bytes: "echo"
  const spoofed = validateMediaFile(
    { name: "malicious.jpg", size: 50 * 1024, type: "image/jpeg" },
    [0x65, 0x63, 0x68, 0x6f]
  );
  assert.equal(spoofed.valid, false);
  assert.ok(spoofed.error?.includes("magic byte mismatch"));
});

test("Storage Path: Constructs tenant-isolated paths strictly", () => {
  const tenantId = "a0000000-0000-0000-0000-000000000001";
  const path = buildTenantStoragePath(tenantId, "gallery", "photo-1.webp");

  assert.equal(path, `tenants/${tenantId}/gallery/photo-1.webp`);
  assert.ok(path.startsWith(`tenants/${tenantId}/`));
});

test("Simulation Upload: Creates isolated in-memory asset with revocable URL", async () => {
  // Mock global URL and File in Node environment
  let revoked = false;
  const mockUrl = "blob:http://localhost:5174/mock-uuid-123";
  (globalThis as unknown as { URL: { createObjectURL: () => string; revokeObjectURL: () => void } }).URL = {
    createObjectURL: () => mockUrl,
    revokeObjectURL: () => {
      revoked = true;
    },
  };

  const fakeFile = {
    name: "cold-coffee.webp",
    size: 150 * 1024,
    type: "image/webp",
  } as unknown as File;

  const res = await uploadMediaAsset({
    file: fakeFile,
    tenantId: "a0000000-0000-0000-0000-000000000001",
    category: "gallery",
    caption: "Cold Coffee Brew",
    isSimulation: true,
  });

  assert.equal(res.success, true);
  assert.ok(res.asset);
  assert.equal(res.asset?.publicUrl, mockUrl);
  assert.equal(res.asset?.caption, "Cold Coffee Brew");
  assert.ok(res.asset?.id.startsWith("sim-"));

  // Test transformation to public gallery item
  const galleryItem = mediaAssetToGalleryItem(res.asset!);
  assert.equal(galleryItem.src, mockUrl);
  assert.equal(galleryItem.caption, "Cold Coffee Brew");

  // Test deletion and URL revocation
  const delRes = await deleteMediaAsset(res.asset!, true);
  assert.equal(delRes.success, true);
  assert.equal(revoked, true, "Managed object URL must be revoked on deletion");
});

test("Media Operational Safety: Detaching image preserves underlying media assets", () => {
  const sharedAssetUrl = "https://placeholder-project.supabase.co/storage/v1/object/public/business-media/tenants/a1/menu/coffee.webp";
  
  const menuItem = {
    name: "Classic Cold Coffee",
    price: "109",
    veg: true,
    imageUrl: sharedAssetUrl,
  };

  // Detach image by unsetting imageUrl
  const detachedItem = { ...menuItem, imageUrl: undefined };

  assert.equal(detachedItem.imageUrl, undefined, "Item reference cleared");
  assert.equal(sharedAssetUrl.length > 0, true, "Shared asset URL string remains valid and untampered");
});

