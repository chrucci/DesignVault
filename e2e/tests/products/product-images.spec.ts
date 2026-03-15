import { test, expect } from "../../fixtures/auth.fixture";
import { seedProduct, clearAll } from "../../fixtures/seed";
import path from "path";

test.describe("Product Images", () => {
  test.afterEach(async () => {
    await clearAll();
  });

  test("can upload an image to a product", async ({ page }) => {
    const product = await seedProduct({ name: "Image Test Product" });

    await page.goto(`/products/${product.id}`);

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(path.join(__dirname, "../../fixtures/test-image.png"));

    await expect(page.getByRole("img", { name: "Image Test Product" })).toBeVisible();
  });

  test("can set primary image", async ({ page }) => {
    const product = await seedProduct({ name: "Multi Image Product" });

    await page.goto(`/products/${product.id}`);

    const fileInput = page.locator('input[type="file"]');

    // Upload first image
    await fileInput.setInputFiles(path.join(__dirname, "../../fixtures/test-image.png"));
    // Upload second image
    await fileInput.setInputFiles(path.join(__dirname, "../../fixtures/test-image-2.png"));

    // Set the second image as primary
    const secondImage = page.getByRole("img").nth(1);
    await secondImage.click();
    await page.getByRole("button", { name: "Set as Primary" }).click();

    await expect(page.getByText("Primary").first()).toBeVisible();
  });
});
