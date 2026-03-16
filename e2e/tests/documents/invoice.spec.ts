import { test, expect } from '../../fixtures/auth.fixture';
import { seedProject, seedRoom, seedProduct, seedRoomProduct, clearAll } from '../../fixtures/seed';
import fs from 'fs';
import pdf from 'pdf-parse';

test.describe('Invoice Generation', () => {
  test.afterEach(async () => {
    await clearAll();
  });

  test('can generate an invoice PDF', async ({ page }) => {
    const project = await seedProject({ name: 'Invoice Project' });
    const room = await seedRoom(project.id as string, { name: 'Kitchen' });
    const product = await seedProduct({
      name: 'Pendant Light',
      wholesale_price: 200,
      markup_percent: 50,
    });
    await seedRoomProduct(room.id as string, product.id as string);

    await page.goto(`/projects/${project.id}/documents`);

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Generate Invoice' }).click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('invoice');
    expect(download.suggestedFilename()).toMatch(/\.pdf$/);
  });

  test('invoice shows retail prices not wholesale', async ({ page }) => {
    const project = await seedProject({ name: 'Price Check Project' });
    const room = await seedRoom(project.id as string, { name: 'Office' });
    const product = await seedProduct({
      name: 'Desk Lamp',
      wholesale_price: 80,
      markup_percent: 50,
    });
    await seedRoomProduct(room.id as string, product.id as string);

    await page.goto(`/projects/${project.id}/documents`);

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Generate Invoice' }).click();

    const download = await downloadPromise;
    const filePath = await download.path();
    expect(filePath).toBeTruthy();

    const buffer = fs.readFileSync(filePath!);
    const pdfData = await pdf(buffer);

    // Retail = 80 * 1.5 = $120.00 should be present
    expect(pdfData.text).toContain('$120.00');
    // Wholesale $80.00 should NOT be present
    expect(pdfData.text).not.toContain('$80.00');
  });
});
