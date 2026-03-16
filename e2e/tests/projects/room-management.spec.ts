import { test, expect } from '../../fixtures/auth.fixture';
import { seedProject, seedRoom, seedProduct, seedRoomProduct, clearAll } from '../../fixtures/seed';

test.describe('Room Management', () => {
  test.afterEach(async () => {
    await clearAll();
  });

  test('can add a room to a project', async ({ page }) => {
    const project = await seedProject({ name: 'Room Test Project' });

    await page.goto(`/projects/${project.id}`);
    await page.getByRole('button', { name: 'Add Room' }).click();

    await page.getByLabel('Room Name').fill('Kitchen');
    await page.getByRole('button', { name: 'Save' }).click();

    await expect(page.getByText('Kitchen')).toBeVisible();
  });

  test('can assign a product to a room', async ({ page }) => {
    const project = await seedProject({ name: 'Assignment Project' });
    const room = await seedRoom(project.id as string, { name: 'Living Room' });
    const product = await seedProduct({ name: 'Leather Sofa' });

    await page.goto(`/projects/${project.id}`);
    await page.getByText('Living Room').click();

    await page.getByRole('button', { name: 'Assign Product' }).click();
    await page.getByPlaceholder('Search products').fill('Leather Sofa');
    await page.getByText('Leather Sofa').click();

    await expect(
      page.locator('[data-testid="room-products"]').getByText('Leather Sofa'),
    ).toBeVisible();
  });

  test('can set product quantity in a room', async ({ page }) => {
    const project = await seedProject({ name: 'Quantity Project' });
    const room = await seedRoom(project.id as string, { name: 'Bathroom' });
    const product = await seedProduct({ name: 'Wall Sconce' });
    await seedRoomProduct(room.id as string, product.id as string);

    await page.goto(`/projects/${project.id}`);
    await page.getByText('Bathroom').click();

    const quantityInput = page.getByLabel('Quantity');
    await quantityInput.clear();
    await quantityInput.fill('6');
    await quantityInput.press('Enter');

    await expect(page.getByText('\u00d7 6')).toBeVisible();
  });

  test('can remove a product from a room', async ({ page }) => {
    const project = await seedProject({ name: 'Removal Project' });
    const room = await seedRoom(project.id as string, { name: 'Bedroom' });
    const product = await seedProduct({ name: 'Nightstand' });
    await seedRoomProduct(room.id as string, product.id as string);

    await page.goto(`/projects/${project.id}`);
    await page.getByText('Bedroom').click();

    await expect(page.getByText('Nightstand')).toBeVisible();

    await page.getByText('Nightstand').hover();
    await page.getByRole('button', { name: 'Remove' }).click();

    await expect(page.getByText('Nightstand')).not.toBeVisible();
  });
});
