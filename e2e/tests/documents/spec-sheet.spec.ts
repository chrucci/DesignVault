import { test, expect } from "../../fixtures/auth.fixture";
import { seedProject, seedRoom, seedProduct, seedRoomProduct, clearAll } from "../../fixtures/seed";
import fs from "fs";
import pdf from "pdf-parse";

test.describe("Spec Sheet Generation", () => {
  test.afterEach(async () => {
    await clearAll();
  });

  test("can generate a spec sheet PDF", async ({ page }) => {
    const project = await seedProject({ name: "Spec Sheet Project" });
    const room = await seedRoom(project.id as string, { name: "Bathroom" });
    const product = await seedProduct({ name: "Rain Shower Head" });
    await seedRoomProduct(room.id as string, product.id as string);

    await page.goto(`/projects/${project.id}/documents`);

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Generate Spec Sheet" }).click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain("spec-sheet");
    expect(download.suggestedFilename()).toMatch(/\.pdf$/);
  });

  test("spec sheet does not contain prices", async ({ page }) => {
    const project = await seedProject({ name: "Priceless Spec Project" });
    const room = await seedRoom(project.id as string, { name: "Hallway" });
    const product = await seedProduct({
      name: "Floor Tile",
      wholesale_price: 45,
      markup_percent: 60,
    });
    await seedRoomProduct(room.id as string, product.id as string);

    await page.goto(`/projects/${project.id}/documents`);

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Generate Spec Sheet" }).click();

    const download = await downloadPromise;
    const filePath = await download.path();
    expect(filePath).toBeTruthy();

    const buffer = fs.readFileSync(filePath!);
    const pdfData = await pdf(buffer);

    // Spec sheet should not contain any dollar amounts
    expect(pdfData.text).not.toMatch(/\$\d+/);
  });
});
