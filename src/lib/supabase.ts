import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../types/database.ts";

/**
 * Supabase Client Configuration
 * 
 * Enforces client-safe environment variables and prevents exposure of privileged keys.
 */
const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || "";

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes("your-project-id")
);

// Fallback dummy client for build-time safety when env is unconfigured
export const supabase: SupabaseClient<Database> = isSupabaseConfigured
  ? createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : (createClient<Database>(
      "https://placeholder-project.supabase.co",
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder",
      { auth: { persistSession: false } }
    ));

export interface TenantRecord {
  id: string;
  slug: string;
  name: string;
  is_demo: boolean;
  is_published: boolean;
}

/**
 * Public Data Access: Safely fetches published content for a given tenant slug.
 * Subject to PostgreSQL RLS policies ensuring only published data is readable.
 */
export async function fetchPublishedTenant(slug: string) {
  if (!isSupabaseConfigured) {
    return { data: null, error: new Error("Supabase is not configured in this environment.") };
  }

  const { data, error: tenantErr } = await supabase
    .from("tenants")
    .select("id, slug, name, is_demo, is_published")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  const tenant = data as unknown as TenantRecord | null;
  if (tenantErr || !tenant) {
    return { data: null, error: tenantErr || new Error("Tenant not found or unpublished") };
  }

  const [profileRes, scheduleRes, categoriesRes, mediaRes] = await Promise.all([
    supabase.from("business_profiles").select("*").eq("tenant_id", tenant.id).single(),
    supabase.from("operating_schedules").select("*").eq("tenant_id", tenant.id).order("day_index"),
    supabase.from("menu_categories").select("*, menu_groups(*, menu_items(*))").eq("tenant_id", tenant.id).eq("is_published", true).order("display_order"),
    supabase.from("media_assets" as unknown as "tenants").select("*").eq("tenant_id", tenant.id).eq("is_published", true).order("created_at", { ascending: false }),
  ]);

  return {
    data: {
      tenant,
      profile: profileRes.data,
      schedules: scheduleRes.data || [],
      categories: categoriesRes.data || [],
      mediaAssets: mediaRes.data || [],
    },
    error: profileRes.error || scheduleRes.error || categoriesRes.error,
  };
}
