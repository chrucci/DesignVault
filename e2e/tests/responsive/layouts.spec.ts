import { test, expect } from "../../fixtures/auth.fixture";

test.describe("Responsive Layouts", () => {
  test("desktop layout shows sidebar navigation", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");

    const sidebar = page.locator('[data-testid="sidebar"]');
    await expect(sidebar).toBeVisible();

    await expect(sidebar.getByRole("link", { name: "Products" })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "Projects" })).toBeVisible();
  });

  test("tablet layout collapses sidebar", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/");

    const sidebar = page.locator('[data-testid="sidebar"]');
    await expect(sidebar).not.toBeVisible();

    const hamburger = page.getByRole("button", { name: "Menu" });
    await expect(hamburger).toBeVisible();
  });

  test("phone layout shows bottom navigation", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");

    const bottomNav = page.locator('[data-testid="bottom-nav"]');
    await expect(bottomNav).toBeVisible();

    await expect(bottomNav.getByRole("link", { name: "Products" })).toBeVisible();
    await expect(bottomNav.getByRole("link", { name: "Projects" })).toBeVisible();
  });
});
