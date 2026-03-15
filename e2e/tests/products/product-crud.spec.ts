import { test, expect } from "../../fixtures/auth.fixture";
import { seedProduct, clearAll } from "../../fixtures/seed";

test.describe("Product CRUD", () => {
  test.afterEach(async () => {
    await clearAll();
  });

  test("shows products page with empty state", async ({ page }) => {
    await page.goto("/products");

    await expect(page.getByRole("heading", { name: "Products" })).toBeVisible();
    await expect(page.getByText("No products yet")).toBeVisible();
  });

  test("can create a new product", async ({ page }) => {
    await page.goto("/products");

    await page.getByRole("button", { name: "Add Product" }).click();

    await page.getByLabel("Name").fill("Test Shower Door");
    await page.getByLabel("Brand").fill("Kohler");
    await page.getByLabel("Wholesale Price").fill("1245");
    await page.getByLabel("Markup %").fill("55");

    await page.getByRole("button", { name: "Save" }).click();

    await expect(page.getByText("Test Shower Door")).toBeVisible();
    await expect(page.getByText("Kohler")).toBeVisible();
  });

  test("displays calculated retail price", async ({ page }) => {
    await page.goto("/products");

    await page.getByRole("button", { name: "Add Product" }).click();

    await page.getByLabel("Name").fill("Markup Test Product");
    await page.getByLabel("Wholesale Price").fill("100");
    await page.getByLabel("Markup %").fill("50");

    await page.getByRole("button", { name: "Save" }).click();

    // Retail = wholesale * (1 + markup/100) = 100 * 1.5 = $150.00
    await expect(page.getByText("$150.00")).toBeVisible();
  });

  test("can edit a product", async ({ page }) => {
    const product = await seedProduct({ name: "Old Name", brand: "Brand A" });

    await page.goto(`/products/${product.id}`);
    await page.getByRole("button", { name: "Edit" }).click();

    await page.getByLabel("Name").clear();
    await page.getByLabel("Name").fill("Updated Name");

    await page.getByRole("button", { name: "Save" }).click();

    await expect(page.getByText("Updated Name")).toBeVisible();
  });

  test("can delete a product", async ({ page }) => {
    const product = await seedProduct({ name: "To Be Deleted" });

    await page.goto("/products");
    await expect(page.getByText("To Be Deleted")).toBeVisible();

    await page.getByText("To Be Deleted").click();
    await page.getByRole("button", { name: "Delete" }).click();
    await page.getByRole("button", { name: "Confirm" }).click();

    await expect(page.getByText("To Be Deleted")).not.toBeVisible();
  });

  test("can search products by name", async ({ page }) => {
    await seedProduct({ name: "Blue Tile" });
    await seedProduct({ name: "Red Faucet" });
    await seedProduct({ name: "Blue Vanity" });

    await page.goto("/products");

    await page.getByPlaceholder("Search").fill("Blue");

    await expect(page.getByText("Blue Tile")).toBeVisible();
    await expect(page.getByText("Blue Vanity")).toBeVisible();
    await expect(page.getByText("Red Faucet")).not.toBeVisible();
  });

  test("shows product inbox for unassigned products", async ({ page }) => {
    await seedProduct({ name: "Unassigned Lamp" });

    await page.goto("/products");
    await page.getByRole("tab", { name: "Inbox" }).click();

    await expect(page.getByText("Unassigned Lamp")).toBeVisible();
  });
});
