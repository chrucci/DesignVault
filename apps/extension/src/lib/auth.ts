const TOKEN_KEY = 'dv_auth_token';
const REFRESH_TOKEN_KEY = 'dv_refresh_token';
const API_URL_KEY = 'dv_api_url';

// Default to local dev server; in production builds, override via chrome.storage.local
const DEFAULT_API_URL = 'http://localhost:3000';

export async function getToken(): Promise<string | null> {
  const result = await chrome.storage.local.get(TOKEN_KEY);
  return result[TOKEN_KEY] ?? null;
}

export async function setToken(token: string): Promise<void> {
  await chrome.storage.local.set({ [TOKEN_KEY]: token });
}

export async function getRefreshToken(): Promise<string | null> {
  const result = await chrome.storage.local.get(REFRESH_TOKEN_KEY);
  return result[REFRESH_TOKEN_KEY] ?? null;
}

export async function setRefreshToken(token: string): Promise<void> {
  await chrome.storage.local.set({ [REFRESH_TOKEN_KEY]: token });
}

export async function clearToken(): Promise<void> {
  await chrome.storage.local.remove([TOKEN_KEY, REFRESH_TOKEN_KEY]);
}

export async function isAuthenticated(): Promise<boolean> {
  const token = await getToken();
  if (!token) return false;

  try {
    // Decode JWT payload to check expiration
    const payload = JSON.parse(atob(token.split('.')[1]));
    const now = Math.floor(Date.now() / 1000);
    return payload.exp > now;
  } catch {
    return false;
  }
}

export async function getApiBaseUrl(): Promise<string> {
  const result = await chrome.storage.local.get(API_URL_KEY);
  return result[API_URL_KEY] ?? DEFAULT_API_URL;
}

export async function setApiBaseUrl(url: string): Promise<void> {
  await chrome.storage.local.set({ [API_URL_KEY]: url });
}
