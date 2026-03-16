import { setToken, setRefreshToken, clearToken, getApiBaseUrl } from './auth';

// Supabase project config — these should match your hosted Supabase project
// They can be overridden via chrome.storage.local for different environments
const SUPABASE_CONFIG_KEY = 'dv_supabase_config';

interface SupabaseConfig {
  url: string;
  anonKey: string;
}

async function getSupabaseConfig(): Promise<SupabaseConfig> {
  const result = await chrome.storage.local.get(SUPABASE_CONFIG_KEY);
  if (result[SUPABASE_CONFIG_KEY]) {
    return result[SUPABASE_CONFIG_KEY];
  }

  // Fetch config from the web app
  const baseUrl = await getApiBaseUrl();
  try {
    const response = await fetch(`${baseUrl}/api/extension/config`);
    if (response.ok) {
      const config = await response.json();
      return { url: config.supabaseUrl, anonKey: config.supabaseAnonKey };
    }
  } catch {
    // Fall through to error
  }

  throw new Error(
    'Supabase configuration not found. Please configure the extension or ensure the web app is accessible.',
  );
}

export async function signIn(
  email: string,
  password: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const config = await getSupabaseConfig();
    const response = await fetch(`${config.url}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: config.anonKey,
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error_description: 'Login failed' }));
      return {
        success: false,
        error: error.error_description || error.msg || 'Invalid email or password',
      };
    }

    const data = await response.json();
    await setToken(data.access_token);
    if (data.refresh_token) {
      await setRefreshToken(data.refresh_token);
    }

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Connection failed. Check your network.',
    };
  }
}

export async function signOut(): Promise<void> {
  await clearToken();
}
