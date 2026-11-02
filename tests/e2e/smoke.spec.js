import { expect, test } from '@playwright/test';

async function closeModals(page) {
  for (let i = 0; i < 12; i += 1) {
    const close = page.locator('.modal [aria-label="Close"]').first();
    if (!(await close.isVisible().catch(() => false))) return;
    await close.click();
  }
}

test('create a campaign, visit every screen, advance a year', async ({ page }) => {
  const errors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto('/');
  await page.getByRole('button', { name: 'Create campaign' }).first().click();
  await page.getByRole('button', { name: 'Raise the banner' }).click();
  await expect(page.locator('.game-shell')).toBeVisible();
  await closeModals(page);

  const navButtons = page.locator('.sidebar nav button');
  const count = await navButtons.count();
  expect(count).toBeGreaterThan(5);
  for (let i = 0; i < count; i += 1) {
    await navButtons.nth(i).click();
    await expect(page.locator('.screen-container')).toBeVisible();
    await closeModals(page);
  }

  const yearBefore = await page.locator('.topbar__date strong').innerText();
  await page.getByRole('button', { name: '+1 year' }).click();
  await closeModals(page);
  await expect(page.locator('.topbar__date strong')).not.toHaveText(yearBefore);

  await expect(page.locator('.fatal-screen')).toHaveCount(0);
  expect(errors).toEqual([]);
});
