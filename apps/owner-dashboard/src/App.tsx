import { useState, useEffect } from "react";
import {
  Clock,
  Coffee,
  History,
  LogOut,
  Menu,
  Store,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { DemoAttributionBanner } from "./components/DemoAttributionBanner";
import { ModeIndicatorBanner } from "./components/ModeIndicatorBanner";
import { AuthModal } from "./components/AuthModal";
import { MenuManagementView } from "./components/MenuManagementView";
import { HoursManagementView } from "./components/HoursManagementView";
import { ProfileManagementView } from "./components/ProfileManagementView";
import { MediaManagementView } from "./components/MediaManagementView";
import { RecentActivityView } from "./components/RecentActivityView";

import { cafe, menuCategories, weeklySchedule, galleryItems as initialGalleryItems } from "@core/data/cafe";
import type {
  BusinessProfileContract,
  DayHoursContract,
  GalleryItemContract,
  MenuCategoryContract,
  MenuItemContract,
} from "@core/types/business";
import { supabase, isSupabaseConfigured } from "@core/lib/supabase";
import {
  getDemoSnapshot,
  saveDemoSnapshot,
  resetDemoSnapshotRemote,
  subscribeToDemoSync,
} from "@core/services/demoSyncService";
import type { ActiveTab, ActivityEvent, DashboardMode } from "./types";

export function App() {
  const [mode, setMode] = useState<DashboardMode>("simulation");
  const [userEmail, setUserEmail] = useState<string | undefined>();
  const [activeTab, setActiveTab] = useState<ActiveTab>("menu");
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Synchronized state for simulation mode (persisted and shared via demoSyncService)
  const [categories, setCategories] = useState<MenuCategoryContract[]>(() => {
    return getDemoSnapshot().menuCategories || menuCategories;
  });
  const [schedule, setSchedule] = useState<DayHoursContract[]>(() => {
    return getDemoSnapshot().schedule || weeklySchedule;
  });
  const [profile, setProfile] = useState<BusinessProfileContract>(() => {
    return getDemoSnapshot().profile || cafe;
  });
  const [gallery, setGallery] = useState<GalleryItemContract[]>(() => {
    return getDemoSnapshot().galleryItems || initialGalleryItems;
  });
  const [simulatedActivities, setSimulatedActivities] = useState<ActivityEvent[]>([]);

  // Keep state synchronized with cross-tab updates
  useEffect(() => {
    const unsubscribe = subscribeToDemoSync((snapshot) => {
      setCategories(snapshot.menuCategories);
      setSchedule(snapshot.schedule);
      setProfile(snapshot.profile);
      setGallery(snapshot.galleryItems);
    });
    return () => unsubscribe();
  }, []);

  const logSimulatedActivity = (
    action: ActivityEvent["action"],
    entityType: ActivityEvent["entityType"],
    description: string,
    details?: string
  ) => {
    const event: ActivityEvent = {
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      action,
      entityType,
      description,
      details,
      timestamp: new Date().toISOString(),
      userEmail: userEmail || "Simulated Owner",
      isSimulated: true,
    };
    setSimulatedActivities((prev) => [event, ...prev]);
  };

  // Synchronize changes to demoSyncService whenever state updates in simulation mode
  const persistSimulationChange = (
    updatedCategories: MenuCategoryContract[],
    updatedSchedule: DayHoursContract[],
    updatedProfile: BusinessProfileContract,
    updatedGallery: GalleryItemContract[]
  ) => {
    saveDemoSnapshot({
      version: 1,
      updatedAt: Date.now(),
      menuCategories: updatedCategories,
      schedule: updatedSchedule,
      profile: updatedProfile,
      galleryItems: updatedGallery,
      reviews: getDemoSnapshot().reviews,
    });
  };

  // Reset in-memory & stored changes back to initial contracts
  const handleResetSimulationData = async () => {
    const reset = await resetDemoSnapshotRemote();
    setCategories(reset.menuCategories);
    setSchedule(reset.schedule);
    setProfile(reset.profile);
    setGallery(reset.galleryItems);
    setSimulatedActivities([]);
  };

  const handleSuccessfulLiveLogin = (email: string, _userId: string) => {
    setUserEmail(email);
    setMode("live");
    setIsAuthModalOpen(false);
  };

  const handleEnterSimulation = () => {
    setMode("simulation");
    setUserEmail(undefined);
    setIsAuthModalOpen(false);
  };

  const handleLogout = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setMode("simulation");
    setUserEmail(undefined);
  };

  // --------------------------------------------------------------------------
  // Data Mutation Handlers (Dual Mode: Live Supabase vs. In-Memory Simulation)
  // --------------------------------------------------------------------------

  // 1. Update Menu Item (with optional Category/Group move)
  const handleUpdateItem = async (
    categoryId: string,
    groupTitle: string,
    oldName: string,
    updatedItem: MenuItemContract,
    targetCategoryId?: string,
    targetGroupTitle?: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (mode === "live") {
      if (!isSupabaseConfigured) {
        return { success: false, error: "Supabase client is not configured with valid environment variables." };
      }
      try {
        const { error } = await supabase
          .from("menu_items")
          .update({
            name: updatedItem.name,
            price: updatedItem.price,
            veg: updatedItem.veg,
            available: updatedItem.available,
            description: updatedItem.description || null,
            note: updatedItem.note || null,
          })
          .eq("name", oldName);

        if (error) {
          return { success: false, error: error.message };
        }
      } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : "Live save failed" };
      }
    }

    // Check if moving item to another category or group
    const isMoving =
      (targetCategoryId && targetCategoryId !== categoryId) ||
      (targetGroupTitle && targetGroupTitle !== groupTitle);

    let nextCategories: MenuCategoryContract[];

    if (!isMoving) {
      // In-place update
      nextCategories = categories.map((cat) => {
        if (cat.id !== categoryId) return cat;
        return {
          ...cat,
          groups: cat.groups.map((group) => {
            if (group.title !== groupTitle) return group;
            return {
              ...group,
              items: group.items.map((item) => (item.name === oldName ? updatedItem : item)),
            };
          }),
        };
      });
    } else {
      // Remove from source and add to destination
      const destCatId = targetCategoryId || categoryId;
      const destGrpTitle = targetGroupTitle || groupTitle;

      nextCategories = categories.map((cat) => {
        // Step A: Remove from original group
        if (cat.id === categoryId) {
          cat = {
            ...cat,
            groups: cat.groups.map((g) => {
              if (g.title !== groupTitle) return g;
              return {
                ...g,
                items: g.items.filter((i) => i.name !== oldName),
              };
            }),
          };
        }

        // Step B: Add to target group
        if (cat.id === destCatId) {
          const groupExists = cat.groups.some((g) => g.title === destGrpTitle);
          if (groupExists) {
            cat = {
              ...cat,
              groups: cat.groups.map((g) => {
                if (g.title !== destGrpTitle) return g;
                return {
                  ...g,
                  items: [...g.items, updatedItem],
                };
              }),
            };
          } else {
            cat = {
              ...cat,
              groups: [...cat.groups, { title: destGrpTitle, items: [updatedItem] }],
            };
          }
        }

        return cat;
      });
    }

    setCategories(nextCategories);
    persistSimulationChange(nextCategories, schedule, profile, gallery);

    if (mode === "simulation") {
      logSimulatedActivity(
        "UPDATE",
        "menu_item",
        `Updated item "${updatedItem.name}" (₹${updatedItem.price})`,
        isMoving ? `Moved to category "${targetCategoryId}"` : `Group: ${groupTitle}`
      );
    }

    return { success: true };
  };

  // 2. Add New Menu Item
  const handleAddItem = async (
    categoryId: string,
    groupTitle: string,
    newItem: MenuItemContract
  ): Promise<{ success: boolean; error?: string }> => {
    // Check for duplicate name
    const existing = categories.some((c) =>
      c.groups.some((g) => g.items.some((i) => i.name.toLowerCase() === newItem.name.toLowerCase()))
    );
    if (existing) {
      return { success: false, error: `An item with the name "${newItem.name}" already exists on the menu.` };
    }

    if (mode === "live") {
      if (!isSupabaseConfigured) {
        return { success: false, error: "Supabase client is not configured." };
      }
      // Note: Live insert requires relational IDs; safely reported if unprovisioned
    }

    const nextCategories = categories.map((cat) => {
      if (cat.id !== categoryId) return cat;
      const groupExists = cat.groups.some((grp) => grp.title === groupTitle);
      if (!groupExists) {
        return {
          ...cat,
          groups: [...cat.groups, { title: groupTitle, items: [newItem] }],
        };
      }
      return {
        ...cat,
        groups: cat.groups.map((grp) => {
          if (grp.title !== groupTitle) return grp;
          return {
            ...grp,
            items: [...grp.items, newItem],
          };
        }),
      };
    });

    setCategories(nextCategories);
    persistSimulationChange(nextCategories, schedule, profile, gallery);

    if (mode === "simulation") {
      logSimulatedActivity(
        "INSERT",
        "menu_item",
        `Added new item "${newItem.name}" (₹${newItem.price}) to ${groupTitle}`
      );
    }

    return { success: true };
  };

  // 3. Delete Menu Item
  const handleDeleteItem = async (
    categoryId: string,
    groupTitle: string,
    itemName: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (mode === "live") {
      if (!isSupabaseConfigured) {
        return { success: false, error: "Supabase client is not configured." };
      }
      try {
        const { error } = await supabase.from("menu_items").delete().eq("name", itemName);
        if (error) return { success: false, error: error.message };
      } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : "Delete failed" };
      }
    }

    const nextCategories = categories.map((cat) => {
      if (cat.id !== categoryId) return cat;
      return {
        ...cat,
        groups: cat.groups.map((grp) => {
          if (grp.title !== groupTitle) return grp;
          return {
            ...grp,
            items: grp.items.filter((i) => i.name !== itemName),
          };
        }),
      };
    });

    setCategories(nextCategories);
    persistSimulationChange(nextCategories, schedule, profile, gallery);

    if (mode === "simulation") {
      logSimulatedActivity(
        "DELETE",
        "menu_item",
        `Deleted menu item "${itemName}" from ${groupTitle}`
      );
    }

    return { success: true };
  };

  // 4. Toggle Availability
  const handleToggleAvailability = async (
    categoryId: string,
    groupTitle: string,
    itemName: string
  ): Promise<{ success: boolean; error?: string }> => {
    let newStatus = true;
    const cat = categories.find((c) => c.id === categoryId);
    const grp = cat?.groups.find((g) => g.title === groupTitle);
    const itm = grp?.items.find((i) => i.name === itemName);
    if (itm) {
      newStatus = !(itm.available ?? true);
    }

    if (mode === "live") {
      if (!isSupabaseConfigured) {
        return { success: false, error: "Supabase client is not configured." };
      }
      try {
        const { error } = await supabase
          .from("menu_items")
          .update({ available: newStatus })
          .eq("name", itemName);

        if (error) {
          return { success: false, error: error.message };
        }
      } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : "Failed to toggle status" };
      }
    }

    const nextCategories = categories.map((c) => {
      if (c.id !== categoryId) return c;
      return {
        ...c,
        groups: c.groups.map((g) => {
          if (g.title !== groupTitle) return g;
          return {
            ...g,
            items: g.items.map((i) =>
              i.name === itemName ? { ...i, available: newStatus } : i
            ),
          };
        }),
      };
    });

    setCategories(nextCategories);
    persistSimulationChange(nextCategories, schedule, profile, gallery);

    if (mode === "simulation") {
      logSimulatedActivity(
        "TOGGLE",
        "menu_item",
        `Toggled availability of "${itemName}" to ${newStatus ? "In Stock" : "Unavailable (86'd)"}`
      );
    }

    return { success: true };
  };

  // 5. Add Category
  const handleAddCategory = async (
    label: string,
    description?: string
  ): Promise<{ success: boolean; error?: string }> => {
    const slugId = label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    if (!slugId) {
      return { success: false, error: "Invalid category label" };
    }

    if (categories.some((c) => c.id === slugId || c.label.toLowerCase() === label.toLowerCase())) {
      return { success: false, error: `A category named "${label}" already exists.` };
    }

    if (mode === "live") {
      if (!isSupabaseConfigured) {
        return { success: false, error: "Supabase client is not configured." };
      }
      try {
        const { error } = await supabase.from("menu_categories").insert({
          tenant_id: "a0000000-0000-0000-0000-000000000001",
          slug_id: slugId,
          label,
          display_order: categories.length + 1,
          is_published: true,
        });
        if (error) return { success: false, error: error.message };
      } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : "Failed to add category" };
      }
    }

    const newCategory: MenuCategoryContract = {
      id: slugId,
      label,
      description,
      groups: [{ title: label, items: [] }],
    };

    const nextCategories = [...categories, newCategory];
    setCategories(nextCategories);
    persistSimulationChange(nextCategories, schedule, profile, gallery);

    if (mode === "simulation") {
      logSimulatedActivity(
        "INSERT",
        "category",
        `Created new menu category: "${label}"`
      );
    }

    return { success: true };
  };

  // 6. Edit Category
  const handleEditCategory = async (
    categoryId: string,
    newLabel: string,
    newDescription?: string
  ): Promise<{ success: boolean; error?: string }> => {
    const exists = categories.some(
      (c) => c.id !== categoryId && c.label.toLowerCase() === newLabel.toLowerCase()
    );
    if (exists) {
      return { success: false, error: `Another category named "${newLabel}" already exists.` };
    }

    if (mode === "live") {
      if (!isSupabaseConfigured) {
        return { success: false, error: "Supabase client is not configured." };
      }
      try {
        const { error } = await supabase
          .from("menu_categories")
          .update({ label: newLabel, description: newDescription || null })
          .eq("slug_id", categoryId);
        if (error) return { success: false, error: error.message };
      } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : "Failed to edit category" };
      }
    }

    const nextCategories = categories.map((cat) => {
      if (cat.id !== categoryId) return cat;
      return {
        ...cat,
        label: newLabel,
        description: newDescription,
        groups: cat.groups.map((g) => (g.title === cat.label ? { ...g, title: newLabel } : g)),
      };
    });

    setCategories(nextCategories);
    persistSimulationChange(nextCategories, schedule, profile, gallery);

    if (mode === "simulation") {
      logSimulatedActivity(
        "UPDATE",
        "category",
        `Renamed category to "${newLabel}"`
      );
    }

    return { success: true };
  };

  // 7. Delete Category
  const handleDeleteCategory = async (
    categoryId: string,
    _forceDeleteItems: boolean
  ): Promise<{ success: boolean; error?: string }> => {
    if (categories.length <= 1) {
      return { success: false, error: "Cannot delete the only remaining menu category." };
    }

    if (mode === "live") {
      if (!isSupabaseConfigured) {
        return { success: false, error: "Supabase client is not configured." };
      }
      try {
        const { error } = await supabase
          .from("menu_categories")
          .delete()
          .eq("slug_id", categoryId);
        if (error) return { success: false, error: error.message };
      } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : "Failed to delete category" };
      }
    }

    const targetCategory = categories.find((c) => c.id === categoryId);
    const nextCategories = categories.filter((c) => c.id !== categoryId);

    setCategories(nextCategories);
    persistSimulationChange(nextCategories, schedule, profile, gallery);

    if (mode === "simulation") {
      logSimulatedActivity(
        "DELETE",
        "category",
        `Deleted menu category: "${targetCategory?.label || categoryId}"`
      );
    }

    return { success: true };
  };

  // 7b. Restore Category (Undo Delete)
  const handleRestoreCategory = async (
    restoredCategory: MenuCategoryContract,
    index?: number
  ): Promise<{ success: boolean; error?: string }> => {
    if (categories.some((c) => c.id === restoredCategory.id)) {
      return { success: false, error: `Category "${restoredCategory.label}" already exists.` };
    }
    const nextCategories = [...categories];
    if (typeof index === "number" && index >= 0 && index <= nextCategories.length) {
      nextCategories.splice(index, 0, restoredCategory);
    } else {
      nextCategories.push(restoredCategory);
    }
    setCategories(nextCategories);
    persistSimulationChange(nextCategories, schedule, profile, gallery);

    if (mode === "simulation") {
      logSimulatedActivity(
        "INSERT",
        "category",
        `Restored deleted menu category: "${restoredCategory.label}"`
      );
    }

    return { success: true };
  };

  // 8. Update Operating Hours
  const handleUpdateSchedule = async (
    updatedSchedule: DayHoursContract[]
  ): Promise<{ success: boolean; error?: string }> => {
    if (mode === "live") {
      if (!isSupabaseConfigured) {
        return { success: false, error: "Supabase client is not configured." };
      }
      try {
        for (const day of updatedSchedule) {
          const { error } = await supabase
            .from("operating_schedules")
            .update({
              hours: day.hours,
              is_closed: day.isClosed,
              open_display: day.openDisplay || null,
              close_display: day.closeDisplay || null,
            })
            .eq("day_index", day.dayIndex);
          if (error) return { success: false, error: error.message };
        }
      } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : "Failed to save schedule" };
      }
    }

    setSchedule(updatedSchedule);
    persistSimulationChange(categories, updatedSchedule, profile, gallery);

    if (mode === "simulation") {
      logSimulatedActivity(
        "UPDATE",
        "operating_schedule",
        "Updated business opening hours schedule"
      );
    }

    return { success: true };
  };

  // 9. Update Business Profile
  const handleUpdateProfile = async (
    updatedProfile: BusinessProfileContract
  ): Promise<{ success: boolean; error?: string }> => {
    if (mode === "live") {
      if (!isSupabaseConfigured) {
        return { success: false, error: "Supabase client is not configured." };
      }
      try {
        const { error } = await supabase
          .from("business_profiles")
          .update({
            tagline: updatedProfile.tagline,
            slogan: updatedProfile.slogan,
            description: updatedProfile.description,
            visit_description: updatedProfile.visitDescription,
            phone: updatedProfile.phone as unknown as Record<string, unknown>,
            whatsapp: updatedProfile.whatsapp as unknown as Record<string, unknown>,
          })
          .eq("tenant_id", "a0000000-0000-0000-0000-000000000001");
        if (error) return { success: false, error: error.message };
      } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : "Failed to save profile" };
      }
    }

    setProfile(updatedProfile);
    persistSimulationChange(categories, schedule, updatedProfile, gallery);

    if (mode === "simulation") {
      logSimulatedActivity(
        "UPDATE",
        "business_profile",
        `Updated business profile: "${updatedProfile.name}"`,
        `Tagline: ${updatedProfile.tagline}`
      );
    }

    return { success: true };
  };

  // 10. Attach / Detach Item Image
  const handleAttachMenuItemImage = (
    categoryId: string,
    groupTitle: string,
    itemName: string,
    imageUrl: string
  ) => {
    const nextCategories = categories.map((cat) => {
      if (cat.id !== categoryId) return cat;
      return {
        ...cat,
        groups: cat.groups.map((group) => {
          if (group.title !== groupTitle) return group;
          return {
            ...group,
            items: group.items.map((item) =>
              item.name === itemName ? { ...item, imageUrl } : item
            ),
          };
        }),
      };
    });

    setCategories(nextCategories);
    persistSimulationChange(nextCategories, schedule, profile, gallery);

    if (mode === "simulation") {
      logSimulatedActivity(
        imageUrl ? "ATTACH" : "DETACH",
        "media_asset",
        imageUrl
          ? `Attached photo to "${itemName}"`
          : `Detached photo from "${itemName}"`
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#170D08] text-[#FBF4E8] flex flex-col font-sans pb-16 md:pb-0">
      {/* 1. Global Portfolio Demo Attribution Banner */}
      <DemoAttributionBanner />

      {/* 2. Mode Indicator Banner (Live vs. Simulation) */}
      <ModeIndicatorBanner
        mode={mode}
        userEmail={userEmail}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onSwitchToSimulation={() => setMode("simulation")}
        onResetSimulationData={handleResetSimulationData}
      />

      {/* 3. Main Header & Navigation */}
      <header className="sticky top-0 z-30 border-b border-[#3B2417] bg-[#241611]/90 backdrop-blur-md px-4 sm:px-6 py-3.5">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-[#D9A45B]/20 text-[#D9A45B] border border-[#D9A45B]/30">
              <Coffee className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif text-base sm:text-lg font-bold text-[#F6EAD9]">
                  {profile.name}
                </h1>
                <span className="hidden sm:inline rounded bg-[#D9A45B]/15 px-2 py-0.5 text-[10px] font-semibold text-[#D9A45B]">
                  Owner Portal
                </span>
              </div>
              <p className="text-[11px] text-[#8D755F]">
                {profile.neighborhood} · {profile.city}
              </p>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 rounded-xl border border-[#3B2417] bg-[#170D08]/60 p-1">
            <button
              onClick={() => setActiveTab("menu")}
              className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-medium transition-colors ${
                activeTab === "menu"
                  ? "bg-[#D9A45B] text-[#170D08] font-semibold"
                  : "text-[#F6EAD9]/80 hover:text-[#FBF4E8]"
              }`}
            >
              <UtensilsCrossed className="size-3.5" />
              <span>Menu</span>
            </button>

            <button
              onClick={() => setActiveTab("hours")}
              className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-medium transition-colors ${
                activeTab === "hours"
                  ? "bg-[#D9A45B] text-[#170D08] font-semibold"
                  : "text-[#F6EAD9]/80 hover:text-[#FBF4E8]"
              }`}
            >
              <Clock className="size-3.5" />
              <span>Hours</span>
            </button>

            <button
              onClick={() => setActiveTab("profile")}
              className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-medium transition-colors ${
                activeTab === "profile"
                  ? "bg-[#D9A45B] text-[#170D08] font-semibold"
                  : "text-[#F6EAD9]/80 hover:text-[#FBF4E8]"
              }`}
            >
              <Store className="size-3.5" />
              <span>Profile</span>
            </button>

            <button
              onClick={() => setActiveTab("media")}
              className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-medium transition-colors ${
                activeTab === "media"
                  ? "bg-[#D9A45B] text-[#170D08] font-semibold"
                  : "text-[#F6EAD9]/80 hover:text-[#FBF4E8]"
              }`}
            >
              <Coffee className="size-3.5" />
              <span>Media</span>
            </button>

            <button
              onClick={() => setActiveTab("activity")}
              className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-medium transition-colors ${
                activeTab === "activity"
                  ? "bg-[#D9A45B] text-[#170D08] font-semibold"
                  : "text-[#F6EAD9]/80 hover:text-[#FBF4E8]"
              }`}
            >
              <History className="size-3.5" />
              <span>Activity</span>
            </button>
          </nav>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2">
            {mode === "live" ? (
              <button
                onClick={handleLogout}
                title="Sign out of live session"
                className="inline-flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/20 transition-colors"
              >
                <LogOut className="size-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#D9A45B]/40 bg-[#D9A45B]/15 px-3 py-1.5 text-xs font-semibold text-[#D9A45B] hover:bg-[#D9A45B]/25 transition-colors"
              >
                <span>Sign In</span>
              </button>
            )}

            {/* Mobile Hamburger Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden rounded-xl border border-[#3B2417] p-2 text-[#8D755F] hover:text-[#FBF4E8]"
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-3 pt-3 border-t border-[#3B2417] space-y-1">
            <button
              onClick={() => {
                setActiveTab("menu");
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium ${
                activeTab === "menu" ? "bg-[#D9A45B] text-[#170D08]" : "text-[#F6EAD9]"
              }`}
            >
              <UtensilsCrossed className="size-4" />
              <span>Menu Items & Pricing</span>
            </button>
            <button
              onClick={() => {
                setActiveTab("hours");
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium ${
                activeTab === "hours" ? "bg-[#D9A45B] text-[#170D08]" : "text-[#F6EAD9]"
              }`}
            >
              <Clock className="size-4" />
              <span>Operating Hours</span>
            </button>
            <button
              onClick={() => {
                setActiveTab("profile");
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium ${
                activeTab === "profile" ? "bg-[#D9A45B] text-[#170D08]" : "text-[#F6EAD9]"
              }`}
            >
              <Store className="size-4" />
              <span>Business Profile</span>
            </button>
            <button
              onClick={() => {
                setActiveTab("media");
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium ${
                activeTab === "media" ? "bg-[#D9A45B] text-[#170D08]" : "text-[#F6EAD9]"
              }`}
            >
              <Coffee className="size-4" />
              <span>Media Management</span>
            </button>
            <button
              onClick={() => {
                setActiveTab("activity");
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium ${
                activeTab === "activity" ? "bg-[#D9A45B] text-[#170D08]" : "text-[#F6EAD9]"
              }`}
            >
              <History className="size-4" />
              <span>Recent Activity</span>
            </button>
          </div>
        )}
      </header>

      {/* 4. Active Content Tab Workspace */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8">
        {activeTab === "menu" && (
          <MenuManagementView
            mode={mode}
            categories={categories}
            onUpdateItem={handleUpdateItem}
            onAddItem={handleAddItem}
            onDeleteItem={handleDeleteItem}
            onToggleAvailability={handleToggleAvailability}
            onAddCategory={handleAddCategory}
            onEditCategory={handleEditCategory}
            onDeleteCategory={handleDeleteCategory}
            onRestoreCategory={handleRestoreCategory}
          />
        )}

        {activeTab === "hours" && (
          <HoursManagementView
            mode={mode}
            schedule={schedule}
            onUpdateSchedule={handleUpdateSchedule}
          />
        )}

        {activeTab === "profile" && (
          <ProfileManagementView
            mode={mode}
            profile={profile}
            onUpdateProfile={handleUpdateProfile}
          />
        )}

        {activeTab === "media" && (
          <MediaManagementView
            mode={mode}
            tenantSlug="aromica-cafe"
            galleryItems={gallery}
            categories={categories}
            onUpdateGallery={(updated) => {
              setGallery(updated);
              persistSimulationChange(categories, schedule, profile, updated);
            }}
            onAttachMenuItemImage={handleAttachMenuItemImage}
          />
        )}

        {activeTab === "activity" && (
          <RecentActivityView
            mode={mode}
            tenantSlug="aromica-cafe"
            simulatedActivities={simulatedActivities}
            onClearSimulatedHistory={() => setSimulatedActivities([])}
          />
        )}
      </main>

      {/* 5. Mobile Fixed Bottom Navigation Bar (Viewports < 768px) */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-[#3B2417] bg-[#241611]/95 backdrop-blur-md px-3 py-2 flex items-center justify-between">
        <button
          onClick={() => setActiveTab("menu")}
          className={`flex flex-col items-center gap-1 text-[10px] font-medium min-h-[44px] justify-center px-1 ${
            activeTab === "menu" ? "text-[#D9A45B]" : "text-[#8D755F]"
          }`}
        >
          <UtensilsCrossed className="size-4" />
          <span>Menu</span>
        </button>

        <button
          onClick={() => setActiveTab("hours")}
          className={`flex flex-col items-center gap-1 text-[10px] font-medium min-h-[44px] justify-center px-1 ${
            activeTab === "hours" ? "text-[#D9A45B]" : "text-[#8D755F]"
          }`}
        >
          <Clock className="size-4" />
          <span>Hours</span>
        </button>

        <button
          onClick={() => setActiveTab("profile")}
          className={`flex flex-col items-center gap-1 text-[10px] font-medium min-h-[44px] justify-center px-1 ${
            activeTab === "profile" ? "text-[#D9A45B]" : "text-[#8D755F]"
          }`}
        >
          <Store className="size-4" />
          <span>Profile</span>
        </button>

        <button
          onClick={() => setActiveTab("media")}
          className={`flex flex-col items-center gap-1 text-[10px] font-medium min-h-[44px] justify-center px-1 ${
            activeTab === "media" ? "text-[#D9A45B]" : "text-[#8D755F]"
          }`}
        >
          <Coffee className="size-4" />
          <span>Media</span>
        </button>

        <button
          onClick={() => setActiveTab("activity")}
          className={`flex flex-col items-center gap-1 text-[10px] font-medium min-h-[44px] justify-center px-1 ${
            activeTab === "activity" ? "text-[#D9A45B]" : "text-[#8D755F]"
          }`}
        >
          <History className="size-4" />
          <span>Activity</span>
        </button>
      </nav>

      {/* 6. Dashboard Footer with Attribution */}
      <footer className="border-t border-[#3B2417] bg-[#170D08] px-6 py-6 text-center text-xs text-[#8D755F] space-y-2">
        <p>
          <strong className="text-[#F6EAD9]">Business Management System — Concept Demo</strong> · A portfolio project by{" "}
          <strong className="text-[#F6EAD9]">Susmit Dey</strong> (+91 9007801474 / susmitdey047@gmail.com)
        </p>
        <p className="text-[11px] text-[#8D755F]/80">
          Independent Owner Management Architecture · Built with React 19, TypeScript, and Supabase PostgreSQL RLS.
        </p>
      </footer>

      {/* 7. Authentication & Mode Switch Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccessfulLogin={handleSuccessfulLiveLogin}
        onEnterSimulation={handleEnterSimulation}
      />
    </div>
  );
}

export default App;
