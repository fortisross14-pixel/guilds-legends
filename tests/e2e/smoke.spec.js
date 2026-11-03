import { expect, test } from '@playwright/test';

async function closeModals(page) {
  for (let i = 0; i < 12; i += 1) {
    const close = page.locator('.modal [aria-label="Close"]').first();
    if (!(await close.isVisible().catch(() => false))) return;
    await close.click();
  }
}

test('create a campaign, visit every place and building, rest for a year', async ({ page }) => {
  const errors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto('/');
  await page.getByRole('button', { name: 'Create campaign' }).first().click();
  await page.getByRole('button', { name: 'Raise the banner' }).click();
  await expect(page.locator('.game-shell')).toBeVisible();
  // The scripted opening starts with an intro card; skip it for the smoke run.
  page.on('dialog', (dialog) => dialog.accept());
  await page.locator('.intro-card').getByRole('button', { name: 'Skip tutorial' }).click();
  await closeModals(page);

  // World map is home.
  await expect(page.locator('.world-map')).toBeVisible();
  await expect(page.locator('.location-node__here')).toBeVisible();

  // Every building in town.
  await page.locator('.sidebar nav button', { hasText: 'Dunmere' }).click();
  const tiles = page.locator('.building-tile');
  const tileCount = await tiles.count();
  expect(tileCount).toBeGreaterThanOrEqual(3);
  for (let i = 0; i < tileCount; i += 1) {
    await page.locator('.building-tile').nth(i).click();
    await expect(page.locator('.building')).toBeVisible();
    await closeModals(page);
    await page.locator('.town-header__back').click();
  }

  // Every menu page.
  await page.locator('.sidebar nav button', { hasText: 'Chronicle' }).click();
  const pages = await page.locator('.building-tile').count();
  for (let i = 0; i < pages; i += 1) {
    await page.locator('.building-tile').nth(i).click();
    await expect(page.locator('.menu-page')).toBeVisible();
    await page.locator('.menu-page__back').click();
  }

  // Time: +1 month twelve times.
  const yearBefore = await page.locator('.topbar__date strong').innerText();
  for (let i = 0; i < 12; i += 1) {
    await page.getByRole('button', { name: '+1 month' }).click();
    await closeModals(page);
  }
  await expect(page.locator('.topbar__date strong')).not.toHaveText(yearBefore);

  await expect(page.locator('.fatal-screen')).toHaveCount(0);
  expect(errors).toEqual([]);
});
