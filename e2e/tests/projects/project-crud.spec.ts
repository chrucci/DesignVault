import { test, expect } from "../../fixtures/auth.fixture";
import { seedProject, clearAll } from "../../fixtures/seed";

test.describe("Project CRUD", () => {
  test.afterEach(async () => {
    await clearAll();
  });

  test("shows projects page", async ({ page }) => {
    await page.goto("/projects");

    await expect(page.getByRole("heading", { name: "Projects" })).toBeVisible();
  });

  test("can create a project", async ({ page }) => {
    await page.goto("/projects");

    await page.getByRole("button", { name: "New Project" }).click();

    await page.getByLabel("Name").fill("Modern Beach House");
    await page.getByLabel("Client").fill("Jane Smith");

    await page.getByRole("button", { name: "Save" }).click();

    await expect(page.getByText("Modern Beach House")).toBeVisible();
    await expect(page.getByText("Jane Smith")).toBeVisible();
  });

  test("can edit a project", async ({ page }) => {
    const project = await seedProject({ name: "Old Project Name" });

    await page.goto(`/projects/${project.id}`);
    await page.getByRole("button", { name: "Edit" }).click();

    await page.getByLabel("Name").clear();
    await page.getByLabel("Name").fill("Renamed Project");

    await page.getByRole("button", { name: "Save" }).click();

    await expect(page.getByText("Renamed Project")).toBeVisible();
  });

  test("can archive a project", async ({ page }) => {
    const project = await seedProject({ name: "Archivable Project", status: "active" });

    await page.goto(`/projects/${project.id}`);
    await page.getByRole("button", { name: "Edit" }).click();

    await page.getByLabel("Status").selectOption("archived");

    await page.getByRole("button", { name: "Save" }).click();

    await expect(page.getByText("Archived")).toBeVisible();
  });

  test("shows project status badges", async ({ page }) => {
    await seedProject({ name: "Active One", status: "active" });
    await seedProject({ name: "Completed One", status: "completed" });
    await seedProject({ name: "Archived One", status: "archived" });

    await page.goto("/projects");

    await expect(page.getByText("Active").first()).toBeVisible();
    await expect(page.getByText("Completed").first()).toBeVisible();
    await expect(page.getByText("Archived").first()).toBeVisible();
  });
});
