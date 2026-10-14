import { useState, useEffect } from "react";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Edit2,
  FolderEdit,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  X,
  Eye,
  EyeOff,
} from "lucide-react";
import type { MenuCategoryContract, MenuItemContract } from "@core/types/business";
import { validateMenuItemUpdate } from "@core/services/menuValidation";
import type { DashboardMode } from "../types";

interface MenuManagementViewProps {
  mode: DashboardMode;
  categories: MenuCategoryContract[];
  onUpdateItem: (
    categoryId: string,
    groupTitle: string,
    oldName: string,
    updatedItem: MenuItemContract,
    targetCategoryId?: string,
    targetGroupTitle?: string
  ) => Promise<{ success: boolean; error?: string }>;
  onAddItem: (
    categoryId: string,
    groupTitle: string,
    newItem: MenuItemContract
  ) => Promise<{ success: boolean; error?: string }>;
  onDeleteItem: (
    categoryId: string,
    groupTitle: string,
    itemName: string
  ) => Promise<{ success: boolean; error?: string }>;
  onToggleAvailability: (
    categoryId: string,
    groupTitle: string,
    itemName: string
  ) => Promise<{ success: boolean; error?: string }>;
  onAddCategory: (label: string, description?: string) => Promise<{ success: boolean; error?: string }>;
  onEditCategory: (categoryId: string, newLabel: string, newDescription?: string) => Promise<{ success: boolean; error?: string }>;
  onDeleteCategory: (categoryId: string, forceDeleteItems: boolean) => Promise<{ success: boolean; error?: string }>;
  onRestoreCategory?: (category: MenuCategoryContract, index?: number) => Promise<{ success: boolean; error?: string }>;
}

export function MenuManagementView({
  mode,
  categories,
  onUpdateItem,
  onAddItem,
  onDeleteItem,
  onToggleAvailability,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
  onRestoreCategory,
}: MenuManagementViewProps) {
  const [activeCategoryId, setActiveCategoryId] = useState<string>(
    categories[0]?.id || "beverages"
  );
  const [searchQuery, setSearchQuery] = useState("");

  // Edit Item Modal State
  const [editingItem, setEditingItem] = useState<{
    categoryId: string;
    groupTitle: string;
    item: MenuItemContract;
    originalName: string;
  } | null>(null);

  // Add Item Modal State
  const [addingItemTo, setAddingItemTo] = useState<{
    categoryId: string;
    groupTitle: string;
  } | null>(null);

  // Delete Item Confirmation State & Error Feedback
  const [deletingItem, setDeletingItem] = useState<{
    categoryId: string;
    groupTitle: string;
    itemName: string;
  } | null>(null);
  const [deleteItemError, setDeleteItemError] = useState<string | null>(null);

  // Undo Delete Notification State
  const [undoToast, setUndoToast] = useState<{
    id: string;
    message: string;
    onUndo: () => Promise<void>;
  } | null>(null);

  // Auto-sync active category if the current selection is removed or list updates
  useEffect(() => {
    if (categories.length > 0 && !categories.some((c) => c.id === activeCategoryId)) {
      setActiveCategoryId(categories[0].id);
    }
  }, [categories, activeCategoryId]);

  // Form Fields for Item Add/Edit
  const [formName, setFormName] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formVeg, setFormVeg] = useState(true);
  const [formAvailable, setFormAvailable] = useState(true);
  const [formDesc, setFormDesc] = useState("");
  const [formNote, setFormNote] = useState("");
  const [formTargetCategory, setFormTargetCategory] = useState("");
  const [formTargetGroup, setFormTargetGroup] = useState("");
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Category Modal States
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryLabel, setNewCategoryLabel] = useState("");
  const [newCategoryDesc, setNewCategoryDesc] = useState("");
  const [categoryError, setCategoryError] = useState<string | null>(null);

  const [editingCategory, setEditingCategory] = useState<MenuCategoryContract | null>(null);
  const [editCategoryLabel, setEditCategoryLabel] = useState("");
  const [editCategoryDesc, setEditCategoryDesc] = useState("");

  const [deletingCategory, setDeletingCategory] = useState<MenuCategoryContract | null>(null);

  const activeCategory = categories.find((c) => c.id === activeCategoryId) || categories[0];

  // Helper for opening edit item
  const handleOpenEdit = (categoryId: string, groupTitle: string, item: MenuItemContract) => {
    setEditingItem({
      categoryId,
      groupTitle,
      item,
      originalName: item.name,
    });
    setFormName(item.name);
    setFormPrice(item.price);
    setFormVeg(item.veg);
    setFormAvailable(item.available ?? true);
    setFormDesc(item.description || "");
    setFormNote(item.note || "");
    setFormTargetCategory(categoryId);
    setFormTargetGroup(groupTitle);
    setFormErrors([]);
    setSaveSuccessMsg(null);
  };

  // Helper for opening add item
  const handleOpenAdd = (categoryId: string, groupTitle: string) => {
    setAddingItemTo({ categoryId, groupTitle });
    setFormName("");
    setFormPrice("");
    setFormVeg(true);
    setFormAvailable(true);
    setFormDesc("");
    setFormNote("");
    setFormTargetCategory(categoryId);
    setFormTargetGroup(groupTitle);
    setFormErrors([]);
    setSaveSuccessMsg(null);
  };

  // Save Item (Edit or Move)
  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    setFormErrors([]);
    setSaveSuccessMsg(null);

    const validation = validateMenuItemUpdate({
      name: formName,
      price: formPrice,
      veg: formVeg,
      available: formAvailable,
      description: formDesc || null,
      note: formNote || null,
    });

    if (!validation.success) {
      setFormErrors(validation.errors);
      return;
    }

    const updatedItem: MenuItemContract = {
      name: validation.data?.name || formName,
      price: validation.data?.price || formPrice,
      veg: validation.data?.veg ?? formVeg,
      available: validation.data?.available ?? formAvailable,
      description: validation.data?.description || undefined,
      note: validation.data?.note || undefined,
      imageUrl: editingItem.item.imageUrl,
    };

    setIsSaving(true);
    try {
      const isMoved =
        formTargetCategory !== editingItem.categoryId ||
        formTargetGroup !== editingItem.groupTitle;

      const result = await onUpdateItem(
        editingItem.categoryId,
        editingItem.groupTitle,
        editingItem.originalName,
        updatedItem,
        isMoved ? formTargetCategory : undefined,
        isMoved ? formTargetGroup : undefined
      );

      if (result.success) {
        setSaveSuccessMsg(
          mode === "live"
            ? "Saved to PostgreSQL database successfully!"
            : "Updated in simulation memory (temporary demo update)."
        );
        setTimeout(() => {
          setEditingItem(null);
          setSaveSuccessMsg(null);
        }, 1000);
      } else {
        setFormErrors([result.error || "Failed to persist menu item modification."]);
      }
    } catch (err) {
      setFormErrors([err instanceof Error ? err.message : "Unexpected save error."]);
    } finally {
      setIsSaving(false);
    }
  };

  // Create New Item
  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addingItemTo) return;

    setFormErrors([]);
    setSaveSuccessMsg(null);

    const validation = validateMenuItemUpdate({
      name: formName,
      price: formPrice,
      veg: formVeg,
      available: formAvailable,
      description: formDesc || null,
      note: formNote || null,
    });

    if (!validation.success) {
      setFormErrors(validation.errors);
      return;
    }

    const newItem: MenuItemContract = {
      name: validation.data?.name || formName,
      price: validation.data?.price || formPrice,
      veg: validation.data?.veg ?? formVeg,
      available: validation.data?.available ?? formAvailable,
      description: validation.data?.description || undefined,
      note: validation.data?.note || undefined,
    };

    setIsSaving(true);
    try {
      const result = await onAddItem(
        addingItemTo.categoryId,
        addingItemTo.groupTitle,
        newItem
      );

      if (result.success) {
        setSaveSuccessMsg("Menu item added successfully!");
        setTimeout(() => {
          setAddingItemTo(null);
          setSaveSuccessMsg(null);
        }, 1000);
      } else {
        setFormErrors([result.error || "Failed to add menu item."]);
      }
    } catch (err) {
      setFormErrors([err instanceof Error ? err.message : "Unexpected add error."]);
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Item Execution with Undo Support and Inline Error Handling
  const handleConfirmDeleteItem = async () => {
    if (!deletingItem) return;
    setIsSaving(true);
    setDeleteItemError(null);

    // Capture item details before deletion for undo
    const targetCat = categories.find((c) => c.id === deletingItem.categoryId);
    const targetGrp = targetCat?.groups.find((g) => g.title === deletingItem.groupTitle);
    const itemToRestore = targetGrp?.items.find((i) => i.name === deletingItem.itemName);

    try {
      const res = await onDeleteItem(
        deletingItem.categoryId,
        deletingItem.groupTitle,
        deletingItem.itemName
      );
      if (res.success) {
        const catId = deletingItem.categoryId;
        const grpTitle = deletingItem.groupTitle;
        const restoredName = deletingItem.itemName;
        setDeletingItem(null);
        setDeleteItemError(null);

        if (itemToRestore) {
          const undoId = `undo-item-${Date.now()}`;
          setUndoToast({
            id: undoId,
            message: `Removed "${restoredName}" from ${grpTitle}`,
            onUndo: async () => {
              await onAddItem(catId, grpTitle, itemToRestore);
              setActiveCategoryId(catId);
            },
          });
          setTimeout(() => {
            setUndoToast((current) => (current?.id === undoId ? null : current));
          }, 8000);
        }
      } else {
        setDeleteItemError(res.error || "Failed to delete item.");
      }
    } catch (err) {
      setDeleteItemError(err instanceof Error ? err.message : "Failed to delete item.");
    } finally {
      setIsSaving(false);
    }
  };

  // Create Category
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setCategoryError(null);
    if (!newCategoryLabel.trim()) {
      setCategoryError("Category label cannot be empty");
      return;
    }
    const result = await onAddCategory(newCategoryLabel.trim(), newCategoryDesc.trim() || undefined);
    if (result.success) {
      setNewCategoryLabel("");
      setNewCategoryDesc("");
      setIsAddingCategory(false);
    } else {
      setCategoryError(result.error || "Failed to create category");
    }
  };

  // Edit Category
  const handleSaveEditCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    setCategoryError(null);
    if (!editCategoryLabel.trim()) {
      setCategoryError("Category label cannot be empty");
      return;
    }
    const res = await onEditCategory(
      editingCategory.id,
      editCategoryLabel.trim(),
      editCategoryDesc.trim() || undefined
    );
    if (res.success) {
      setEditingCategory(null);
    } else {
      setCategoryError(res.error || "Failed to edit category");
    }
  };

  // Confirm Delete Category with Undo Support
  const handleConfirmDeleteCategory = async (force: boolean) => {
    if (!deletingCategory) return;
    setIsSaving(true);
    setCategoryError(null);

    const catToRestore = deletingCategory;
    const catIndex = categories.findIndex((c) => c.id === deletingCategory.id);

    try {
      const res = await onDeleteCategory(deletingCategory.id, force);
      if (res.success) {
        setDeletingCategory(null);
        setCategoryError(null);
        if (activeCategoryId === catToRestore.id) {
          const remaining = categories.filter((c) => c.id !== catToRestore.id);
          if (remaining.length > 0) {
            setActiveCategoryId(remaining[0].id);
          }
        }

        if (onRestoreCategory && catToRestore) {
          const undoId = `undo-cat-${Date.now()}`;
          setUndoToast({
            id: undoId,
            message: `Removed category "${catToRestore.label}"`,
            onUndo: async () => {
              await onRestoreCategory(catToRestore, catIndex);
              setActiveCategoryId(catToRestore.id);
            },
          });
          setTimeout(() => {
            setUndoToast((current) => (current?.id === undoId ? null : current));
          }, 8000);
        }
      } else {
        setCategoryError(res.error || "Failed to delete category");
      }
    } catch (err) {
      setCategoryError(err instanceof Error ? err.message : "Failed to delete category");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar: Search & Category Navigation */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-serif text-2xl font-bold text-[#F6EAD9]">
            Menu Management
          </h2>
          <p className="text-xs text-[#8D755F] mt-0.5">
            Create, edit, organize categories and menu items with real-time public site sync.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-2.5 size-4 text-[#8D755F]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search items..."
              className="w-full rounded-xl border border-[#3B2417] bg-[#170D08] pl-9 pr-4 py-2 text-xs text-[#FBF4E8] placeholder:text-[#8D755F] focus:border-[#D9A45B] focus:outline-none"
            />
          </div>

          <button
            onClick={() => {
              setNewCategoryLabel("");
              setNewCategoryDesc("");
              setCategoryError(null);
              setIsAddingCategory(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#D9A45B]/40 bg-[#D9A45B]/10 px-3 py-2 text-xs font-semibold text-[#D9A45B] hover:bg-[#D9A45B]/20 transition-colors"
          >
            <Plus className="size-3.5" />
            <span className="hidden sm:inline">Add Category</span>
          </button>
        </div>
      </div>

      {/* Category Pills Navigation & Active Category Toolbar */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => {
            const totalItems = cat.groups.reduce((acc, g) => acc + g.items.length, 0);
            const isActive = cat.id === activeCategory?.id;

            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategoryId(cat.id)}
                className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-xs font-medium transition-all ${
                  isActive
                    ? "bg-[#D9A45B] text-[#170D08] shadow-md font-semibold"
                    : "bg-[#241611] text-[#F6EAD9]/80 border border-[#3B2417] hover:border-[#D9A45B]/40"
                }`}
              >
                <span>{cat.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                    isActive ? "bg-[#170D08]/20 text-[#170D08]" : "bg-[#170D08] text-[#8D755F]"
                  }`}
                >
                  {totalItems}
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected Category Header Actions */}
        {activeCategory && (
          <div className="flex items-center justify-between rounded-xl border border-[#3B2417] bg-[#170D08]/40 px-4 py-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-[#8D755F]">Active:</span>
              <strong className="text-[#F6EAD9] font-medium">{activeCategory.label}</strong>
              {activeCategory.description && (
                <span className="hidden md:inline text-[11px] text-[#8D755F]/80">
                  ({activeCategory.description})
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setEditingCategory(activeCategory);
                  setEditCategoryLabel(activeCategory.label);
                  setEditCategoryDesc(activeCategory.description || "");
                  setCategoryError(null);
                }}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-[#D9A45B] hover:underline"
              >
                <FolderEdit className="size-3.5" />
                <span>Edit Category</span>
              </button>
              <span className="text-[#3B2417]">|</span>
              <button
                onClick={() => {
                  setDeletingCategory(activeCategory);
                  setCategoryError(null);
                }}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-red-400 hover:underline"
              >
                <Trash2 className="size-3.5" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Menu Groups & Items List */}
      {activeCategory ? (
        <div className="space-y-6">
          {activeCategory.groups.map((group) => {
            const filteredItems = group.items.filter((item) => {
              if (!searchQuery.trim()) return true;
              const q = searchQuery.toLowerCase();
              return (
                item.name.toLowerCase().includes(q) ||
                item.description?.toLowerCase().includes(q) ||
                item.note?.toLowerCase().includes(q)
              );
            });

            return (
              <div
                key={group.title}
                className="overflow-hidden rounded-2xl border border-[#3B2417] bg-[#241611]/60 shadow-lg"
              >
                <div className="border-b border-[#3B2417] bg-[#170D08]/50 px-4 sm:px-5 py-3 flex items-center justify-between">
                  <div>
                    <h3 className="font-serif text-sm font-semibold text-[#F6EAD9]">
                      {group.title}
                    </h3>
                    {group.note && (
                      <p className="text-[11px] text-[#8D755F]">{group.note}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-[#8D755F]">
                      {filteredItems.length} items
                    </span>
                    <button
                      onClick={() => handleOpenAdd(activeCategory.id, group.title)}
                      className="inline-flex items-center gap-1 rounded-lg border border-[#D9A45B]/30 bg-[#D9A45B]/10 px-2.5 py-1 text-[11px] font-semibold text-[#D9A45B] hover:bg-[#D9A45B]/20 transition-colors"
                    >
                      <Plus className="size-3" />
                      <span>Add Item</span>
                    </button>
                  </div>
                </div>

                <div className="divide-y divide-[#3B2417]/60">
                  {filteredItems.length === 0 ? (
                    <div className="p-6 text-center text-xs text-[#8D755F]">
                      No items found in this section. Click &ldquo;Add Item&rdquo; above to create one.
                    </div>
                  ) : (
                    filteredItems.map((item) => {
                      const isAvailable = item.available ?? true;

                      return (
                        <div
                          key={item.name}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:px-5 hover:bg-[#170D08]/30 transition-colors"
                        >
                          <div className="flex-1 space-y-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              {/* Veg / Non-Veg Indicator */}
                              <span
                                className={`size-2.5 rounded-full shrink-0 ${
                                  item.veg ? "bg-emerald-500" : "bg-red-500"
                                }`}
                                title={item.veg ? "Vegetarian" : "Non-Vegetarian"}
                              />
                              <h4 className="text-sm font-medium text-[#FBF4E8] break-words">
                                {item.name}
                              </h4>
                              <span className="font-mono text-xs font-semibold text-[#D9A45B]">
                                ₹{item.price}
                              </span>
                              {!isAvailable && (
                                <span className="rounded bg-red-500/20 px-2 py-0.5 text-[10px] font-semibold text-red-400 border border-red-500/30">
                                  86&apos;d Out of Stock
                                </span>
                              )}
                            </div>

                            {item.description && (
                              <p className="text-xs text-[#8D755F] line-clamp-2 break-words">
                                {item.description}
                              </p>
                            )}
                          </div>

                          {/* Quick Owner Actions */}
                          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                            {/* One-Tap Availability Toggle */}
                            <button
                              type="button"
                              onClick={() =>
                                onToggleAvailability(
                                  activeCategory.id,
                                  group.title,
                                  item.name
                                )
                              }
                              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors ${
                                isAvailable
                                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                                  : "border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                              }`}
                              title={isAvailable ? "Click to 86 / Mark unavailable" : "Click to mark Available"}
                            >
                              {isAvailable ? (
                                <>
                                  <Eye className="size-3.5" />
                                  <span className="hidden md:inline">In Stock</span>
                                </>
                              ) : (
                                <>
                                  <EyeOff className="size-3.5" />
                                  <span className="hidden md:inline">86&apos;d</span>
                                </>
                              )}
                            </button>

                            {/* Edit Item Button */}
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(activeCategory.id, group.title, item)}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-[#3B2417] bg-[#170D08] px-3 py-1.5 text-xs font-medium text-[#F6EAD9] hover:border-[#D9A45B]/50 transition-colors"
                            >
                              <Edit2 className="size-3.5 text-[#D9A45B]" />
                              <span>Edit</span>
                            </button>

                            {/* Delete Item Button */}
                            <button
                              type="button"
                              onClick={() =>
                                setDeletingItem({
                                  categoryId: activeCategory.id,
                                  groupTitle: group.title,
                                  itemName: item.name,
                                })
                              }
                              className="inline-flex items-center rounded-xl border border-red-500/20 bg-red-500/10 p-2 text-xs text-red-400 hover:bg-red-500/20 transition-colors"
                              title="Delete Item"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-[#3B2417] bg-[#241611] p-8 text-center text-[#8D755F]">
          No menu categories found. Click &ldquo;Add Category&rdquo; to create your first category.
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* Edit Item Modal with Category Reassignment */}
      {/* ---------------------------------------------------------------------- */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-[#D9A45B]/30 bg-[#241611] p-5 sm:p-6 shadow-2xl text-[#FBF4E8]">
            <button
              onClick={() => setEditingItem(null)}
              className="absolute right-4 top-4 rounded-lg p-1 text-[#8D755F] hover:bg-[#170D08]"
            >
              <X className="size-5" />
            </button>

            <h3 className="font-serif text-lg font-bold text-[#F6EAD9] mb-1">
              Edit Menu Item
            </h3>
            <p className="text-xs text-[#8D755F] mb-4">
              Update pricing, ingredients, description, availability, or category placement.
            </p>

            <form onSubmit={handleSaveItem} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#F6EAD9]/80 mb-1">
                  Item Name
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full rounded-xl border border-[#3B2417] bg-[#170D08] px-3.5 py-2 text-xs text-[#FBF4E8] focus:border-[#D9A45B] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#F6EAD9]/80 mb-1">
                    Price (₹ or Range e.g. 35 / 55)
                  </label>
                  <input
                    type="text"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    className="w-full rounded-xl border border-[#3B2417] bg-[#170D08] px-3.5 py-2 text-xs text-[#FBF4E8] focus:border-[#D9A45B] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#F6EAD9]/80 mb-1">
                    Dietary Classification
                  </label>
                  <div className="flex items-center gap-4 pt-2">
                    <label className="inline-flex items-center gap-1.5 text-xs text-[#F6EAD9]/80 cursor-pointer">
                      <input
                        type="radio"
                        name="editVeg"
                        checked={formVeg}
                        onChange={() => setFormVeg(true)}
                        className="accent-[#D9A45B]"
                      />
                      <span>Veg</span>
                    </label>
                    <label className="inline-flex items-center gap-1.5 text-xs text-[#F6EAD9]/80 cursor-pointer">
                      <input
                        type="radio"
                        name="editVeg"
                        checked={!formVeg}
                        onChange={() => setFormVeg(false)}
                        className="accent-[#D9A45B]"
                      />
                      <span>Non-Veg</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Move / Category Reassignment */}
              <div>
                <label className="block text-xs font-medium text-[#F6EAD9]/80 mb-1">
                  Assign Category &amp; Group
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <select
                    value={formTargetCategory}
                    onChange={(e) => {
                      const newCatId = e.target.value;
                      setFormTargetCategory(newCatId);
                      const targetCat = categories.find((c) => c.id === newCatId);
                      if (targetCat && targetCat.groups[0]) {
                        setFormTargetGroup(targetCat.groups[0].title);
                      }
                    }}
                    className="w-full rounded-xl border border-[#3B2417] bg-[#170D08] px-3 py-2 text-xs text-[#FBF4E8] focus:border-[#D9A45B] focus:outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>

                  <select
                    value={formTargetGroup}
                    onChange={(e) => setFormTargetGroup(e.target.value)}
                    className="w-full rounded-xl border border-[#3B2417] bg-[#170D08] px-3 py-2 text-xs text-[#FBF4E8] focus:border-[#D9A45B] focus:outline-none"
                  >
                    {categories
                      .find((c) => c.id === formTargetCategory)
                      ?.groups.map((g) => (
                        <option key={g.title} value={g.title}>
                          {g.title}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#F6EAD9]/80 mb-1">
                  Description (Max 500 chars)
                </label>
                <textarea
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  maxLength={500}
                  rows={2}
                  className="w-full rounded-xl border border-[#3B2417] bg-[#170D08] px-3.5 py-2 text-xs text-[#FBF4E8] focus:border-[#D9A45B] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#F6EAD9]/80 mb-1">
                  Availability Status
                </label>
                <button
                  type="button"
                  onClick={() => setFormAvailable(!formAvailable)}
                  className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-medium transition-colors ${
                    formAvailable
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                      : "border-red-500/30 bg-red-500/10 text-red-400"
                  }`}
                >
                  {formAvailable ? "In Stock (Visible for order)" : "86'd Out of Stock"}
                </button>
              </div>

              {formErrors.length > 0 && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400 space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <AlertCircle className="size-4" />
                    <span>Validation Failed:</span>
                  </div>
                  {formErrors.map((err, i) => (
                    <p key={i} className="pl-5">• {err}</p>
                  ))}
                </div>
              )}

              {saveSuccessMsg && (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="size-4" />
                  <span>{saveSuccessMsg}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="rounded-xl border border-[#3B2417] px-4 py-2 text-xs font-medium text-[#8D755F] hover:text-[#FBF4E8]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-xl bg-[#B0793F] px-5 py-2 text-xs font-semibold uppercase tracking-wider text-[#FBF4E8] hover:bg-[#B0793F]/90 transition-colors disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* Add New Menu Item Modal */}
      {/* ---------------------------------------------------------------------- */}
      {addingItemTo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-[#D9A45B]/30 bg-[#241611] p-5 sm:p-6 shadow-2xl text-[#FBF4E8]">
            <button
              onClick={() => setAddingItemTo(null)}
              className="absolute right-4 top-4 rounded-lg p-1 text-[#8D755F] hover:bg-[#170D08]"
            >
              <X className="size-5" />
            </button>

            <h3 className="font-serif text-lg font-bold text-[#F6EAD9] mb-1">
              Add Item to &ldquo;{addingItemTo.groupTitle}&rdquo;
            </h3>
            <p className="text-xs text-[#8D755F] mb-4">
              Enter the food or beverage details to display on the menu.
            </p>

            <form onSubmit={handleCreateItem} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#F6EAD9]/80 mb-1">
                  Item Name
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Masala Chai, Chicken Momo"
                  className="w-full rounded-xl border border-[#3B2417] bg-[#170D08] px-3.5 py-2 text-xs text-[#FBF4E8] focus:border-[#D9A45B] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#F6EAD9]/80 mb-1">
                    Price (₹ or Range e.g. 45 or 35 / 55)
                  </label>
                  <input
                    type="text"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    placeholder="e.g. 89"
                    className="w-full rounded-xl border border-[#3B2417] bg-[#170D08] px-3.5 py-2 text-xs text-[#FBF4E8] focus:border-[#D9A45B] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#F6EAD9]/80 mb-1">
                    Dietary Classification
                  </label>
                  <div className="flex items-center gap-4 pt-2">
                    <label className="inline-flex items-center gap-1.5 text-xs text-[#F6EAD9]/80 cursor-pointer">
                      <input
                        type="radio"
                        name="newVeg"
                        checked={formVeg}
                        onChange={() => setFormVeg(true)}
                        className="accent-[#D9A45B]"
                      />
                      <span>Veg</span>
                    </label>
                    <label className="inline-flex items-center gap-1.5 text-xs text-[#F6EAD9]/80 cursor-pointer">
                      <input
                        type="radio"
                        name="newVeg"
                        checked={!formVeg}
                        onChange={() => setFormVeg(false)}
                        className="accent-[#D9A45B]"
                      />
                      <span>Non-Veg</span>
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#F6EAD9]/80 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  maxLength={500}
                  rows={2}
                  placeholder="Short description of ingredients or preparation..."
                  className="w-full rounded-xl border border-[#3B2417] bg-[#170D08] px-3.5 py-2 text-xs text-[#FBF4E8] focus:border-[#D9A45B] focus:outline-none"
                />
              </div>

              {formErrors.length > 0 && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400 space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <AlertCircle className="size-4" />
                    <span>Validation Failed:</span>
                  </div>
                  {formErrors.map((err, i) => (
                    <p key={i} className="pl-5">• {err}</p>
                  ))}
                </div>
              )}

              {saveSuccessMsg && (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="size-4" />
                  <span>{saveSuccessMsg}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setAddingItemTo(null)}
                  className="rounded-xl border border-[#3B2417] px-4 py-2 text-xs font-medium text-[#8D755F] hover:text-[#FBF4E8]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-xl bg-[#B0793F] px-5 py-2 text-xs font-semibold uppercase tracking-wider text-[#FBF4E8] hover:bg-[#B0793F]/90 transition-colors disabled:opacity-50"
                >
                  {isSaving ? "Adding..." : "Add to Menu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* Delete Item Confirmation Modal */}
      {/* ---------------------------------------------------------------------- */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-sm rounded-2xl border border-red-500/30 bg-[#241611] p-6 shadow-2xl text-[#FBF4E8]">
            <h3 className="font-serif text-lg font-bold text-red-400 mb-2">
              Delete Menu Item?
            </h3>
            <p className="text-xs text-[#F6EAD9]/80 mb-4">
              Are you sure you want to remove &ldquo;<strong className="text-white">{deletingItem.itemName}</strong>&rdquo; from the menu? You can undo this immediately after deleting.
            </p>
            {deleteItemError && (
              <p className="text-xs text-red-400 mb-4">{deleteItemError}</p>
            )}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setDeletingItem(null);
                  setDeleteItemError(null);
                }}
                className="rounded-xl border border-[#3B2417] px-4 py-2 text-xs text-[#8D755F] hover:text-[#FBF4E8]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteItem}
                disabled={isSaving}
                className="rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 transition-colors"
              >
                {isSaving ? "Deleting..." : "Delete Item"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* Add Category Modal */}
      {/* ---------------------------------------------------------------------- */}
      {isAddingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-sm rounded-2xl border border-[#D9A45B]/30 bg-[#241611] p-6 shadow-2xl text-[#FBF4E8]">
            <button
              onClick={() => setIsAddingCategory(false)}
              className="absolute right-4 top-4 rounded-lg p-1 text-[#8D755F] hover:bg-[#170D08]"
            >
              <X className="size-5" />
            </button>
            <h3 className="font-serif text-lg font-semibold text-[#F6EAD9] mb-4">
              Add Menu Category
            </h3>
            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#F6EAD9]/80 mb-1">
                  Category Name (e.g. Burgers, Artisan Pasta)
                </label>
                <input
                  type="text"
                  value={newCategoryLabel}
                  onChange={(e) => setNewCategoryLabel(e.target.value)}
                  className="w-full rounded-xl border border-[#3B2417] bg-[#170D08] px-3.5 py-2 text-xs text-[#FBF4E8] focus:border-[#D9A45B] focus:outline-none"
                  placeholder="e.g. Burgers"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#F6EAD9]/80 mb-1">
                  Description / Subtitle (Optional)
                </label>
                <input
                  type="text"
                  value={newCategoryDesc}
                  onChange={(e) => setNewCategoryDesc(e.target.value)}
                  className="w-full rounded-xl border border-[#3B2417] bg-[#170D08] px-3.5 py-2 text-xs text-[#FBF4E8] focus:border-[#D9A45B] focus:outline-none"
                  placeholder="e.g. Freshly ground patties"
                />
              </div>

              {categoryError && (
                <p className="text-xs text-red-400">{categoryError}</p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingCategory(false)}
                  className="rounded-xl border border-[#3B2417] px-3 py-1.5 text-xs text-[#8D755F]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#B0793F] px-4 py-1.5 text-xs font-semibold text-[#FBF4E8]"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* Edit Category Modal */}
      {/* ---------------------------------------------------------------------- */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-sm rounded-2xl border border-[#D9A45B]/30 bg-[#241611] p-6 shadow-2xl text-[#FBF4E8]">
            <button
              onClick={() => setEditingCategory(null)}
              className="absolute right-4 top-4 rounded-lg p-1 text-[#8D755F] hover:bg-[#170D08]"
            >
              <X className="size-5" />
            </button>
            <h3 className="font-serif text-lg font-semibold text-[#F6EAD9] mb-4">
              Edit Category
            </h3>
            <form onSubmit={handleSaveEditCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#F6EAD9]/80 mb-1">
                  Category Name
                </label>
                <input
                  type="text"
                  value={editCategoryLabel}
                  onChange={(e) => setEditCategoryLabel(e.target.value)}
                  className="w-full rounded-xl border border-[#3B2417] bg-[#170D08] px-3.5 py-2 text-xs text-[#FBF4E8] focus:border-[#D9A45B] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#F6EAD9]/80 mb-1">
                  Description / Subtitle
                </label>
                <input
                  type="text"
                  value={editCategoryDesc}
                  onChange={(e) => setEditCategoryDesc(e.target.value)}
                  className="w-full rounded-xl border border-[#3B2417] bg-[#170D08] px-3.5 py-2 text-xs text-[#FBF4E8] focus:border-[#D9A45B] focus:outline-none"
                />
              </div>

              {categoryError && (
                <p className="text-xs text-red-400">{categoryError}</p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="rounded-xl border border-[#3B2417] px-3 py-1.5 text-xs text-[#8D755F]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#B0793F] px-4 py-1.5 text-xs font-semibold text-[#FBF4E8]"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* Delete Category Confirmation Modal */}
      {/* ---------------------------------------------------------------------- */}
      {deletingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-2xl border border-red-500/30 bg-[#241611] p-6 shadow-2xl text-[#FBF4E8]">
            <div className="flex items-center gap-2 text-red-400 mb-2">
              <AlertTriangle className="size-5 shrink-0" />
              <h3 className="font-serif text-lg font-bold">
                Delete &ldquo;{deletingCategory.label}&rdquo;?
              </h3>
            </div>

            {(() => {
              const totalItems = deletingCategory.groups.reduce((acc, g) => acc + g.items.length, 0);
              if (totalItems > 0) {
                return (
                  <div className="space-y-4">
                    <p className="text-xs text-[#F6EAD9]/80">
                      This category currently contains <strong className="text-white">{totalItems} menu item{totalItems > 1 ? "s" : ""}</strong>.
                    </p>
                    <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-[11px] text-red-300">
                      Deleting this category will permanently remove all {totalItems} items inside it. You can cancel and move the items to another category first.
                    </div>
                    {categoryError && <p className="text-xs text-red-400">{categoryError}</p>}
                    <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setDeletingCategory(null)}
                        className="rounded-xl border border-[#3B2417] px-4 py-2 text-xs text-[#8D755F] hover:text-[#FBF4E8]"
                      >
                        Cancel &amp; Keep Category
                      </button>
                      <button
                        type="button"
                        onClick={() => handleConfirmDeleteCategory(true)}
                        disabled={isSaving}
                        className="rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 transition-colors"
                      >
                        {isSaving ? "Deleting..." : `Delete Category & ${totalItems} Items`}
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div className="space-y-4">
                  <p className="text-xs text-[#F6EAD9]/80">
                    Are you sure you want to delete this empty category?
                  </p>
                  {categoryError && <p className="text-xs text-red-400">{categoryError}</p>}
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setDeletingCategory(null)}
                      className="rounded-xl border border-[#3B2417] px-4 py-2 text-xs text-[#8D755F]"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleConfirmDeleteCategory(false)}
                      disabled={isSaving}
                      className="rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white"
                    >
                      {isSaving ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* Floating Undo Notification Toast */}
      {/* ---------------------------------------------------------------------- */}
      {undoToast && (
        <div className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-50 flex items-center gap-3 rounded-2xl border border-[#D9A45B]/40 bg-[#241611] px-4 py-3 shadow-2xl text-xs text-[#FBF4E8] animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-[#D9A45B] shrink-0" />
            <span className="font-medium">{undoToast.message}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={async () => {
                const action = undoToast.onUndo;
                setUndoToast(null);
                await action();
              }}
              className="inline-flex items-center gap-1 rounded-lg bg-[#D9A45B] px-3 py-1 text-xs font-semibold text-[#170D08] hover:bg-[#D9A45B]/90 transition-colors"
            >
              <RotateCcw className="size-3" />
              <span>Undo</span>
            </button>
            <button
              onClick={() => setUndoToast(null)}
              className="rounded-lg p-1 text-[#8D755F] hover:text-[#FBF4E8] transition-colors"
              aria-label="Dismiss undo notification"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
