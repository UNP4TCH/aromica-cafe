/**
 * Supabase Database Schema Definitions
 * 
 * Auto-generated / strongly-typed interface mapping to PostgreSQL tables
 * created in supabase/migrations/20261014000001_initial_schema.sql.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string;
          slug: string;
          name: string;
          is_demo: boolean;
          is_published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          is_demo?: boolean;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          is_demo?: boolean;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      tenant_users: {
        Row: {
          id: string;
          tenant_id: string;
          user_id: string;
          role: 'owner' | 'manager' | 'staff';
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          user_id: string;
          role?: 'owner' | 'manager' | 'staff';
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          user_id?: string;
          role?: 'owner' | 'manager' | 'staff';
          created_at?: string;
        };
      };
      business_profiles: {
        Row: {
          id: string;
          tenant_id: string;
          brand_word1: string;
          brand_word2: string;
          tagline: string;
          slogan: string;
          description: string;
          neighborhood: string;
          city: string;
          address: Json;
          landmarks: Json;
          landmark_guidance: string;
          visit_description: string;
          phone: Json;
          whatsapp: Json;
          instagram: Json;
          reviews: Json;
          order_online: Json;
          menu_flipbook: Json;
          directions: Json;
          coordinates: Json;
          hero_image: Json;
          atmosphere: Json;
          menu_meta: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          brand_word1?: string;
          brand_word2?: string;
          tagline?: string;
          slogan?: string;
          description?: string;
          neighborhood?: string;
          city?: string;
          address?: Json;
          landmarks?: Json;
          landmark_guidance?: string;
          visit_description?: string;
          phone?: Json;
          whatsapp?: Json;
          instagram?: Json;
          reviews?: Json;
          order_online?: Json;
          menu_flipbook?: Json;
          directions?: Json;
          coordinates?: Json;
          hero_image?: Json;
          atmosphere?: Json;
          menu_meta?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          brand_word1?: string;
          brand_word2?: string;
          tagline?: string;
          slogan?: string;
          description?: string;
          neighborhood?: string;
          city?: string;
          address?: Json;
          landmarks?: Json;
          landmark_guidance?: string;
          visit_description?: string;
          phone?: Json;
          whatsapp?: Json;
          instagram?: Json;
          reviews?: Json;
          order_online?: Json;
          menu_flipbook?: Json;
          directions?: Json;
          coordinates?: Json;
          hero_image?: Json;
          atmosphere?: Json;
          menu_meta?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      operating_schedules: {
        Row: {
          id: string;
          tenant_id: string;
          day: string;
          day_index: number;
          hours: string;
          is_closed: boolean;
          open_minutes: number | null;
          close_minutes: number | null;
          open_display: string | null;
          close_display: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          day: string;
          day_index: number;
          hours: string;
          is_closed?: boolean;
          open_minutes?: number | null;
          close_minutes?: number | null;
          open_display?: string | null;
          close_display?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          day?: string;
          day_index?: number;
          hours?: string;
          is_closed?: boolean;
          open_minutes?: number | null;
          close_minutes?: number | null;
          open_display?: string | null;
          close_display?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      menu_categories: {
        Row: {
          id: string;
          tenant_id: string;
          slug_id: string;
          label: string;
          description: string | null;
          display_order: number;
          is_published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          slug_id: string;
          label: string;
          description?: string | null;
          display_order?: number;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          slug_id?: string;
          label?: string;
          description?: string | null;
          display_order?: number;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      menu_groups: {
        Row: {
          id: string;
          tenant_id: string;
          category_id: string;
          title: string;
          note: string | null;
          display_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          category_id: string;
          title: string;
          note?: string | null;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          category_id?: string;
          title?: string;
          note?: string | null;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      menu_items: {
        Row: {
          id: string;
          tenant_id: string;
          group_id: string;
          name: string;
          price: string;
          veg: boolean;
          description: string | null;
          note: string | null;
          available: boolean;
          display_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          group_id: string;
          name: string;
          price: string;
          veg?: boolean;
          description?: string | null;
          note?: string | null;
          available?: boolean;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          group_id?: string;
          name?: string;
          price?: string;
          veg?: boolean;
          description?: string | null;
          note?: string | null;
          available?: boolean;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          tenant_id: string;
          user_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          old_data: Json | null;
          new_data: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          user_id?: string | null;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          old_data?: Json | null;
          new_data?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          user_id?: string | null;
          action?: string;
          entity_type?: string;
          entity_id?: string | null;
          old_data?: Json | null;
          new_data?: Json | null;
          created_at?: string;
        };
      };
    };
  };
}
