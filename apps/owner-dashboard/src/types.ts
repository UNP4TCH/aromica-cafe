import type {
  BusinessProfileContract,
  DayHoursContract,
  MenuCategoryContract,
} from "@core/types/business";

export type DashboardMode = "simulation" | "live";

export type ActiveTab = "menu" | "hours" | "profile" | "media" | "activity" | "overview";

export interface ActivityEvent {
  id: string;
  action: "UPDATE" | "INSERT" | "DELETE" | "TOGGLE" | "UPLOAD" | "ATTACH" | "DETACH";
  entityType: "menu_item" | "category" | "operating_schedule" | "business_profile" | "media_asset";
  description: string;
  details?: string;
  timestamp: string;
  userEmail?: string;
  isSimulated: boolean;
}

export interface DashboardNotification {
  type: "success" | "error" | "info";
  message: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: "owner" | "manager";
  tenantSlug: string;
}

export interface DashboardState {
  mode: DashboardMode;
  user: AuthenticatedUser | null;
  tenantSlug: string;
  categories: MenuCategoryContract[];
  profile: BusinessProfileContract;
  schedule: DayHoursContract[];
  activeTab: ActiveTab;
  notification: DashboardNotification | null;
}
