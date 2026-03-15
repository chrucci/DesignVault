import { test, expect } from "../../fixtures/auth.fixture";
import { clearAll } from "../../fixtures/seed";

test.describe("Browser Extension — Clip Product", () => {
  test.afterEach(async () => {
    await clearAll();
  });

  test("POST /api/extension/clip creates a product", async ({ page, request }) => {
    const response = await request.post("/api/extension/clip", {
      data: {
        name: "Clipped Faucet",
        brand: "Delta",
        source_url: "https://example.com/faucet",
        image_url: "https://example.com/faucet.jpg",
        wholesale_price: 350,
      },
    });

    expect(response.status()).toBe(201);

    const body = await response.json();
    expect(body.name).toBe("Clipped Faucet");
    expect(body.brand).toBe("Delta");
    expect(body.id).toBeTruthy();

    // Verify it shows up in the products list
    await page.goto("/products");
    await expect(page.getByText("Clipped Faucet")).toBeVisible();
  });

  test("clip rejects unauthenticated requests", async ({ request }) => {
    // Create a separate unauthenticated context
    const response = await request.fetch("/api/extension/clip", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: {
        name: "Should Fail",
        brand: "NoBrand",
      },
    });

    expect(response.status()).toBe(401);
  });
});
