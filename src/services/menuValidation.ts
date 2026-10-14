/**
 * Menu Item Mutation Validation & Sanitization Service
 * 
 * Enforces business rules and validation constraints for owner modifications
 * before persisting to the database.
 */

export interface MenuItemUpdateInput {
  name?: string;
  price?: string;
  veg?: boolean;
  description?: string | null;
  note?: string | null;
  available?: boolean;
}

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors: string[];
}

/**
 * Strips script tags, HTML tags, and dangerous characters
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]*>?/gm, "")
    .trim();
}

/**
 * Validates price format (e.g. "35", "35 / 55", "109", "₹120")
 */
export function isValidPriceString(price: string): boolean {
  if (!price || price.trim().length === 0 || price.length > 50) return false;
  // Allows digits, slashes, dashes, spaces, and currency symbols
  const priceRegex = /^[₹$€£\s\d/–—.-]+$/;
  return priceRegex.test(price.trim());
}

/**
 * Validates and sanitizes a menu item update payload.
 * Rejects illegal fields (e.g. tenant_id tampering).
 */
export function validateMenuItemUpdate(
  input: unknown
): ValidationResult<MenuItemUpdateInput> {
  const errors: string[] = [];

  if (typeof input !== "object" || input === null) {
    return { success: false, errors: ["Input payload must be a non-null object"] };
  }

  const raw = input as Record<string, unknown>;

  // Security check: Reject forbidden privilege escalations
  if ("tenant_id" in raw) {
    errors.push("Forbidden: Changing 'tenant_id' is not permitted");
  }
  if ("id" in raw) {
    errors.push("Forbidden: Direct 'id' mutation is not permitted in update payload");
  }
  if ("created_at" in raw) {
    errors.push("Forbidden: Modifying 'created_at' timestamp is not permitted");
  }

  const sanitized: MenuItemUpdateInput = {};

  // Validate Name (if provided)
  if (raw.name !== undefined) {
    if (typeof raw.name !== "string") {
      errors.push("Item name must be a string");
    } else {
      const cleanName = sanitizeString(raw.name);
      if (cleanName.length < 1) {
        errors.push("Item name cannot be empty");
      } else if (cleanName.length > 120) {
        errors.push("Item name cannot exceed 120 characters");
      } else {
        sanitized.name = cleanName;
      }
    }
  }

  // Validate Price (if provided)
  if (raw.price !== undefined) {
    if (typeof raw.price !== "string") {
      errors.push("Price must be a string");
    } else {
      const cleanPrice = sanitizeString(raw.price);
      if (!isValidPriceString(cleanPrice)) {
        errors.push("Price format is invalid (must be numeric or range e.g., '35' or '35 / 55')");
      } else {
        sanitized.price = cleanPrice;
      }
    }
  }

  // Validate Veg flag (if provided)
  if (raw.veg !== undefined) {
    if (typeof raw.veg !== "boolean") {
      errors.push("Dietary flag 'veg' must be a boolean");
    } else {
      sanitized.veg = raw.veg;
    }
  }

  // Validate Description (if provided)
  if (raw.description !== undefined) {
    if (raw.description === null || raw.description === "") {
      sanitized.description = null;
    } else if (typeof raw.description !== "string") {
      errors.push("Description must be a string or null");
    } else {
      const cleanDesc = sanitizeString(raw.description);
      if (cleanDesc.length > 500) {
        errors.push("Description cannot exceed 500 characters");
      } else {
        sanitized.description = cleanDesc;
      }
    }
  }

  // Validate Note (if provided)
  if (raw.note !== undefined) {
    if (raw.note === null || raw.note === "") {
      sanitized.note = null;
    } else if (typeof raw.note !== "string") {
      errors.push("Note must be a string or null");
    } else {
      const cleanNote = sanitizeString(raw.note);
      if (cleanNote.length > 200) {
        errors.push("Note cannot exceed 200 characters");
      } else {
        sanitized.note = cleanNote;
      }
    }
  }

  // Validate Available flag (if provided)
  if (raw.available !== undefined) {
    if (typeof raw.available !== "boolean") {
      errors.push("Availability flag 'available' must be a boolean");
    } else {
      sanitized.available = raw.available;
    }
  }

  return {
    success: errors.length === 0,
    data: errors.length === 0 ? sanitized : undefined,
    errors,
  };
}
