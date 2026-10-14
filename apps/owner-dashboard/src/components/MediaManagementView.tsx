import React, { useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon,
  Trash2,
  Upload,
  Utensils,
  Info,
} from "lucide-react";
import type {
  GalleryItemContract,
  MediaAssetContract,
  MenuCategoryContract,
} from "@core/types/business";
import {
  uploadMediaAsset,
  deleteMediaAsset,
  mediaAssetToGalleryItem,
} from "@core/services/mediaService";

interface MediaManagementViewProps {
  mode: "simulation" | "live";
  tenantSlug: string;
  galleryItems: GalleryItemContract[];
  categories: MenuCategoryContract[];
  onUpdateGallery: (updated: GalleryItemContract[]) => void;
  onAttachMenuItemImage: (
    categoryId: string,
    groupTitle: string,
    itemName: string,
    imageUrl: string
  ) => void;
}

export function MediaManagementView({
  mode,
  tenantSlug,
  galleryItems,
  categories,
  onUpdateGallery,
  onAttachMenuItemImage,
}: MediaManagementViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<"gallery" | "menu">("gallery");
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form inputs for upload
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [captionInput, setCaptionInput] = useState("");
  const [altTextInput, setAltTextInput] = useState("");

  // Menu item attachment state
  const [selectedMenuItem, setSelectedMenuItem] = useState<{
    catId: string;
    grpTitle: string;
    itemName: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setAltTextInput(file.name.replace(/\.[^/.]+$/, ""));
  };

  const handleClearSelected = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setCaptionInput("");
    setAltTextInput("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleUploadGalleryPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMsg("Please select an image file to upload.");
      return;
    }

    setUploading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const res = await uploadMediaAsset({
      file: selectedFile,
      tenantId: "a0000000-0000-0000-0000-000000000001",
      category: "gallery",
      caption: captionInput.trim() || "Aromica Café Moment",
      altText: altTextInput.trim() || "Café photography",
      isSimulation: mode === "simulation",
    });

    setUploading(false);

    if (!res.success || !res.asset) {
      setErrorMsg(res.error || "Failed to process image upload.");
      return;
    }

    const newGalleryItem = mediaAssetToGalleryItem(res.asset);
    onUpdateGallery([newGalleryItem, ...galleryItems]);

    setSuccessMsg(
      mode === "simulation"
        ? "Image added to in-memory gallery preview! (Changes reset on page reload)."
        : "Image uploaded and published to Supabase Storage!"
    );
    handleClearSelected();
  };

  const handleDeleteGalleryPhoto = async (photo: GalleryItemContract) => {
    const assetShim: MediaAssetContract = {
      id: photo.id,
      tenantId: "a0000000-0000-0000-0000-000000000001",
      filename: photo.id,
      contentType: "image/webp",
      byteSize: 0,
      publicUrl: photo.src,
    };

    await deleteMediaAsset(assetShim, mode === "simulation");
    onUpdateGallery(galleryItems.filter((p) => p.id !== photo.id));
    setSuccessMsg("Gallery photo removed.");
  };

  const handleUploadAndAttachToMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !selectedMenuItem) {
      setErrorMsg("Please choose both an image file and a menu item.");
      return;
    }

    setUploading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const res = await uploadMediaAsset({
      file: selectedFile,
      tenantId: "a0000000-0000-0000-0000-000000000001",
      category: "menu",
      caption: selectedMenuItem.itemName,
      altText: selectedMenuItem.itemName,
      isSimulation: mode === "simulation",
    });

    setUploading(false);

    if (!res.success || !res.asset) {
      setErrorMsg(res.error || "Failed to upload menu item image.");
      return;
    }

    onAttachMenuItemImage(
      selectedMenuItem.catId,
      selectedMenuItem.grpTitle,
      selectedMenuItem.itemName,
      res.asset.publicUrl
    );

    setSuccessMsg(
      `Attached photo to ${selectedMenuItem.itemName}! (Visible on public menu).`
    );
    handleClearSelected();
    setSelectedMenuItem(null);
  };

  return (
    <div className="space-y-8">
      {/* 1. Header & Sub-Tabs */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#3B2417] pb-5">
        <div>
          <h2 className="text-2xl font-serif text-[#F6EAD9] flex items-center gap-2.5">
            <ImageIcon className="size-6 text-[#D9A45B]" />
            Media &amp; Visual Asset Management
          </h2>
          <p className="mt-1 text-xs text-[#C5A880]">
            Manage high-resolution gallery photography and dish visuals for {tenantSlug}.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setActiveSubTab("gallery")}
            className={`px-4 py-2 text-xs font-semibold rounded-lg border transition-all ${
              activeSubTab === "gallery"
                ? "bg-[#D9A45B] text-[#170D08] border-[#D9A45B]"
                : "bg-[#241611] text-[#C5A880] border-[#3B2417] hover:border-[#D9A45B]/50"
            }`}
          >
            Gallery Images ({galleryItems.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab("menu")}
            className={`px-4 py-2 text-xs font-semibold rounded-lg border transition-all ${
              activeSubTab === "menu"
                ? "bg-[#D9A45B] text-[#170D08] border-[#D9A45B]"
                : "bg-[#241611] text-[#C5A880] border-[#3B2417] hover:border-[#D9A45B]/50"
            }`}
          >
            Menu Item Visuals
          </button>
        </div>
      </div>

      {/* 2. Notification Alerts */}
      {errorMsg && (
        <div className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-950/40 p-4 text-xs text-red-300">
          <AlertCircle className="size-5 shrink-0 text-red-400" />
          <p>{errorMsg}</p>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-950/40 p-4 text-xs text-emerald-300">
          <CheckCircle2 className="size-5 shrink-0 text-emerald-400" />
          <p>{successMsg}</p>
        </div>
      )}

      {/* 3. Upload Drawer / Card */}
      <div className="rounded-2xl border border-[#3B2417] bg-[#241611] p-5 sm:p-6 shadow-xl">
        <div className="flex items-center gap-2 mb-4">
          <Upload className="size-4 text-[#D9A45B]" />
          <h3 className="text-sm font-semibold text-[#F6EAD9] uppercase tracking-wider">
            {activeSubTab === "gallery"
              ? "Upload New Gallery Photo"
              : "Upload & Attach Photo to Menu Item"}
          </h3>
        </div>

        <form
          onSubmit={
            activeSubTab === "gallery"
              ? handleUploadGalleryPhoto
              : handleUploadAndAttachToMenuItem
          }
          className="grid gap-6 md:grid-cols-12"
        >
          {/* File Picker & Drop Zone */}
          <div className="md:col-span-5">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="cursor-pointer group flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#3B2417] hover:border-[#D9A45B] bg-[#170D08]/60 p-6 text-center transition-all min-h-[160px]"
            >
              {previewUrl ? (
                <div className="relative aspect-video w-full overflow-hidden rounded-lg">
                  <img
                    src={previewUrl}
                    alt="Upload Preview"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[11px] font-semibold text-white bg-black/60 px-2 py-1 rounded">
                      Change File
                    </span>
                  </div>
                </div>
              ) : (
                <>
                  <Upload className="size-8 text-[#8D755F] group-hover:text-[#D9A45B] transition-colors mb-2" />
                  <p className="text-xs font-semibold text-[#F6EAD9]">
                    Click to select an image
                  </p>
                  <p className="mt-1 text-[11px] text-[#8D755F]">
                    WebP, JPEG, PNG, or AVIF (Max 5 MB)
                  </p>
                </>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".webp,.jpg,.jpeg,.png,.avif"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Metadata & Target Selection */}
          <div className="space-y-4 md:col-span-7">
            {activeSubTab === "gallery" ? (
              <>
                <div>
                  <label className="block text-xs font-medium text-[#C5A880] mb-1">
                    Caption / Display Title
                  </label>
                  <input
                    type="text"
                    value={captionInput}
                    onChange={(e) => setCaptionInput(e.target.value)}
                    placeholder="e.g. Evening Coffee Corner"
                    className="w-full rounded-lg border border-[#3B2417] bg-[#170D08] px-3.5 py-2 text-xs text-[#F6EAD9] placeholder:text-[#8D755F] focus:border-[#D9A45B] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#C5A880] mb-1">
                    Accessibility Alt Text
                  </label>
                  <input
                    type="text"
                    value={altTextInput}
                    onChange={(e) => setAltTextInput(e.target.value)}
                    placeholder="e.g. Freshly poured cappuccino on wooden tabletop"
                    className="w-full rounded-lg border border-[#3B2417] bg-[#170D08] px-3.5 py-2 text-xs text-[#F6EAD9] placeholder:text-[#8D755F] focus:border-[#D9A45B] focus:outline-none"
                  />
                </div>
              </>
            ) : (
              <div>
                <label className="block text-xs font-medium text-[#C5A880] mb-1">
                  Select Menu Item to Attach Image
                </label>
                <select
                  value={
                    selectedMenuItem
                      ? `${selectedMenuItem.catId}:::${selectedMenuItem.grpTitle}:::${selectedMenuItem.itemName}`
                      : ""
                  }
                  onChange={(e) => {
                    const [catId, grpTitle, itemName] = e.target.value.split(":::");
                    if (catId && grpTitle && itemName) {
                      setSelectedMenuItem({ catId, grpTitle, itemName });
                    } else {
                      setSelectedMenuItem(null);
                    }
                  }}
                  className="w-full rounded-lg border border-[#3B2417] bg-[#170D08] px-3.5 py-2 text-xs text-[#F6EAD9] focus:border-[#D9A45B] focus:outline-none"
                >
                  <option value="">-- Choose a menu item --</option>
                  {categories.flatMap((cat) =>
                    cat.groups.flatMap((grp) =>
                      grp.items.map((item) => (
                        <option
                          key={`${cat.id}-${grp.title}-${item.name}`}
                          value={`${cat.id}:::${grp.title}:::${item.name}`}
                        >
                          {cat.label} &gt; {grp.title} &gt; {item.name} (₹{item.price})
                        </option>
                      ))
                    )
                  )}
                </select>
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={uploading || !selectedFile}
                className="inline-flex items-center gap-2 rounded-lg bg-[#D9A45B] px-4 py-2 text-xs font-semibold text-[#170D08] shadow-sm transition-all hover:bg-[#c4924c] disabled:opacity-50"
              >
                {uploading ? (
                  <span>Processing...</span>
                ) : (
                  <>
                    <Upload className="size-3.5" />
                    <span>
                      {activeSubTab === "gallery" ? "Add to Gallery" : "Attach Dish Photo"}
                    </span>
                  </>
                )}
              </button>
              {selectedFile && (
                <button
                  type="button"
                  onClick={handleClearSelected}
                  className="rounded-lg border border-[#3B2417] px-3.5 py-2 text-xs text-[#8D755F] hover:text-[#F6EAD9]"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* 4. Active Assets Grid */}
      {activeSubTab === "gallery" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#F6EAD9] uppercase tracking-wider">
              Current Gallery Images ({galleryItems.length})
            </h3>
            <span className="text-xs text-[#8D755F]">
              Click image to inspect or click trash to remove
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {galleryItems.map((photo) => (
              <div
                key={photo.id}
                className="group relative overflow-hidden rounded-xl border border-[#3B2417] bg-[#241611] shadow-md transition-all hover:border-[#D9A45B]/50"
              >
                <div className="aspect-square w-full overflow-hidden bg-black/30">
                  <img
                    src={photo.src}
                    alt={photo.alt}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="p-3">
                  <p className="text-xs font-semibold text-[#F6EAD9] truncate">
                    {photo.caption}
                  </p>
                  <p className="mt-0.5 text-[10px] text-[#8D755F] truncate">
                    {photo.alt}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteGalleryPhoto(photo)}
                  title="Remove from gallery"
                  className="absolute right-2 top-2 size-8 flex items-center justify-center rounded-full bg-red-950/80 text-red-300 border border-red-500/30 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-900"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Menu Items with Attached Visuals */}
      {activeSubTab === "menu" && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-[#F6EAD9] uppercase tracking-wider">
            Menu Items Visual Inventory
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {categories.flatMap((cat) =>
              cat.groups.flatMap((grp) =>
                grp.items.map((item) => (
                  <div
                    key={`${cat.id}-${grp.title}-${item.name}`}
                    className="flex items-center gap-3 rounded-xl border border-[#3B2417] bg-[#241611] p-3"
                  >
                    {item.imageUrl ? (
                      <div className="relative size-14 shrink-0 overflow-hidden rounded-lg border border-[#3B2417]">
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex size-14 shrink-0 items-center justify-center rounded-lg border border-dashed border-[#3B2417] bg-[#170D08] text-[#8D755F]">
                        <Utensils className="size-5" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-[#F6EAD9] truncate">
                        {item.name}
                      </p>
                      <p className="text-[10px] text-[#8D755F]">
                        ₹{item.price} · {grp.title}
                      </p>
                      {item.imageUrl ? (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-emerald-400">
                            Custom photo
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              onAttachMenuItemImage(cat.id, grp.title, item.name, "")
                            }
                            className="text-[10px] text-red-400 hover:underline"
                          >
                            Detach
                          </button>
                        </div>
                      ) : (
                        <span className="inline-block mt-1 text-[10px] text-[#8D755F]">
                          No photo attached
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )
            )}
          </div>
        </div>
      )}

      {/* 6. Operational Hardening & Storage Notice */}
      <div className="rounded-xl border border-[#3B2417] bg-[#170D08] p-4 text-xs text-[#8D755F] space-y-2">
        <div className="flex items-center gap-2 text-[#D9A45B]">
          <Info className="size-4" />
          <span className="font-semibold uppercase tracking-wider">
            Storage &amp; Data Isolation Reference
          </span>
        </div>
        <p>
          Uploaded assets follow tenant-isolated storage paths:{" "}
          <code className="text-[#F6EAD9]">
            tenants/{tenantSlug}/[category]/[sanitized-filename]
          </code>
          . File payloads are validated for byte limits (5 MB max), allowed formats (WebP, JPEG, PNG, AVIF), and safe filename character sets.
        </p>
      </div>
    </div>
  );
}
