import { test as base, expect } from "@playwright/test";

/**
 * Authenticated page fixture.
 *
 * Signs in via the Supabase Auth REST API and injects the session tokens
 * into the browser context so every subsequent navigation is authenticated.
 */
export const test = base.extend<{ page: import("@playwright/test").Page }>({
  page: async ({ page, context }, use) => {
    const supabaseUrl = process.env.TEST_SUPABASE_URL;
    const email = process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_USER_PASSWORD;

    if (!supabaseUrl || !email || !password) {
      throw new Error(
        "Missing required env vars: TEST_SUPABASE_URL, TEST_USER_EMAIL, TEST_USER_PASSWORD",
      );
    }

    // Sign in via Supabase GoTrueAuth REST endpoint
    const res = await page.request.post(
      `${supabaseUrl}/auth/v1/token?grant_type=password`,
      {
        headers: {
          apikey: process.env.TEST_SUPABASE_ANON_KEY ?? "",
          "Content-Type": "application/json",
        },
        data: { email, password },
      },
    );

    if (!res.ok()) {
      throw new Error(`Supabase auth failed: ${res.status()} ${await res.text()}`);
    }

    const session = await res.json();

    // Inject tokens into browser storage so the app picks them up
    const baseURL = process.env.BASE_URL || "http://localhost:3000";

    await context.addCookies([
      {
        name: "sb-access-token",
        value: session.access_token,
        domain: new URL(baseURL).hostname,
        path: "/",
      },
      {
        name: "sb-refresh-token",
        value: session.refresh_token,
        domain: new URL(baseURL).hostname,
        path: "/",
      },
    ]);

    // Also set in localStorage for client-side Supabase SDK
    await page.goto(baseURL);
    await page.evaluate(
      ({ accessToken, refreshToken, supabaseUrl: sbUrl }) => {
        const storageKey = `sb-${new URL(sbUrl).hostname.split(".")[0]}-auth-token`;
        localStorage.setItem(
          storageKey,
          JSON.stringify({
            access_token: accessToken,
            refresh_token: refreshToken,
            token_type: "bearer",
          }),
        );
      },
      {
        accessToken: session.access_token,
        refreshToken: session.refresh_token,
        supabaseUrl,
      },
    );

    await use(page);
  },
});

export { expect };
