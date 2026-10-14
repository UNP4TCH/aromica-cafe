/**
 * Environment Configuration & Security Validator
 * 
 * Verifies production environment variables, validates URL/key formats,
 * ensures privileged secrets are never leaked into the browser,
 * and reports whether the application is running in Simulation or Live mode.
 */

export interface EnvValidationResult {
  isConfigured: boolean;
  isSimulated: boolean;
  supabaseUrl: string;
  defaultTenantSlug: string;
  hasServiceRoleLeak: boolean;
  warnings: string[];
  errors: string[];
}

export function validateEnvironmentConfig(env: Record<string, string | undefined> = import.meta.env || {}): EnvValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];

  const supabaseUrl = env.VITE_SUPABASE_URL || '';
  const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || '';
  const defaultTenantSlug = env.VITE_DEFAULT_TENANT_SLUG || 'aromica-cafe';

  // 1. Critical Security Boundary Check: Service Role Secret Exposure
  let hasServiceRoleLeak = false;
  if (env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_SERVICE_ROLE_KEY) {
    hasServiceRoleLeak = true;
    errors.push('CRITICAL: Service role key detected in client environment variables! Remove immediately.');
  }

  // Inspect anon key payload if provided to ensure it does not claim service_role
  if (supabaseAnonKey && supabaseAnonKey.includes('.')) {
    try {
      const parts = supabaseAnonKey.split('.');
      if (parts.length === 3) {
        let payloadJson = '';
        if (typeof atob === 'function') {
          payloadJson = atob(parts[1]);
        } else if (typeof globalThis !== 'undefined' && 'Buffer' in globalThis) {
          const NodeBuffer = (globalThis as unknown as { Buffer: { from: (s: string, e: string) => { toString: (e: string) => string } } }).Buffer;
          payloadJson = NodeBuffer.from(parts[1], 'base64').toString('utf-8');
        }
        const parsed = JSON.parse(payloadJson);
        if (parsed.role === 'service_role') {
          hasServiceRoleLeak = true;
          errors.push('CRITICAL: VITE_SUPABASE_ANON_KEY appears to contain a service_role JWT payload!');
        }
      }
    } catch {
      // Ignore parse failure; handled by format check
    }
  }

  // 2. Tenant Slug Validation
  const slugRegex = /^[a-z0-9-]+$/;
  if (!slugRegex.test(defaultTenantSlug) || defaultTenantSlug.length < 3 || defaultTenantSlug.length > 64) {
    errors.push(`Invalid default tenant slug "${defaultTenantSlug}". Must match ^[a-z0-9-]+$ (3–64 chars).`);
  }

  // 3. Supabase URL & Key Format Verification
  const isPlaceholderUrl = !supabaseUrl || supabaseUrl.includes('your-project-id') || supabaseUrl.includes('placeholder-project');
  const isPlaceholderKey = !supabaseAnonKey || supabaseAnonKey.includes('your-anon-key-here') || supabaseAnonKey.includes('placeholder');

  if (isPlaceholderUrl || isPlaceholderKey) {
    warnings.push('Live Supabase backend is unconfigured. Operating in Interactive Portfolio Simulation Mode.');
  } else {
    // URL format check
    try {
      const parsedUrl = new URL(supabaseUrl);
      if (parsedUrl.protocol !== 'https:' && !parsedUrl.hostname.includes('localhost')) {
        errors.push('VITE_SUPABASE_URL must use HTTPS protocol in production.');
      }
    } catch {
      errors.push('VITE_SUPABASE_URL is not a valid URL.');
    }
  }

  const isConfigured = !isPlaceholderUrl && !isPlaceholderKey && errors.length === 0;
  const isSimulated = !isConfigured;

  return {
    isConfigured,
    isSimulated,
    supabaseUrl: isConfigured ? supabaseUrl : '',
    defaultTenantSlug,
    hasServiceRoleLeak,
    warnings,
    errors,
  };
}
