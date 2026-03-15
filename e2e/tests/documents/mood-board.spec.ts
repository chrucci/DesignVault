import { test, expect } from "../../fixtures/auth.fixture";
import { seedProject, seedRoom, seedProduct, seedRoomProduct, clearAll } from "../../fixtures/seed";

test.describe("Mood Board Generation", () => {
  test.afterEach(async () => {
    await clearAll();
  });

  test("can generate a mood board PDF", async ({ page }) => {
    const project = await seedProject({ name: "Mood Board Project" });
    const room = await seedRoom(project.id as string, { name: "Master Suite" });
    const product = await seedProduct({ name: "Accent Chair" });
    await seedRoomProduct(room.id as string, product.id as string);

    await page.goto(`/projects/${project.id}/documents`);

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Generate Mood Board" }).click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain("mood-board");
    expect(download.suggestedFilename()).toMatch(/\.pdf$/);
  });
});
