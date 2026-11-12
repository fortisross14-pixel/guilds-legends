const { chromium, devices } = require('playwright');
// Usage: npm run build, npx vite preview --port 4179, then: node scripts/ui/menu-audit.cjs <out-dir>
// Opens every orb menu on a phone (iPhone 13), reports what opened, whether its list scrolls inside
// its frame (not the page), and what pokes out of the frame; saves a screenshot of each.
const S = process.argv[2] || '.';
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ ...devices['iPhone 13'], deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', (e) => errs.push('pageerror ' + e.message));
  p.on('dialog', (d) => d.accept());
  await p.goto(process.env.URL || 'http://localhost:4179/');
  await p.waitForTimeout(1500);
  const clickText = async (t) => { const el = p.locator('button').filter({ hasText: t }).first(); if (await el.count()) await el.evaluate((e) => e.click()); };
  await clickText('New'); await p.waitForTimeout(800);
  await p.locator('input[type=checkbox]').first().evaluate((e) => e.click());
  await clickText('Begin'); await p.waitForTimeout(2500);
  await p.locator("input[placeholder='The Ember Company']").fill('Ember Company');
  await clickText('Free Company'); await clickText('Raise the banner'); await p.waitForTimeout(4500);
  const results = [];
  for (const side of ['left', 'right']) {
    const orbXY = side === 'left' ? [40, 620] : [350, 620];
    await p.touchscreen.tap(...orbXY); await p.waitForTimeout(700);
    const names = await p.locator('.orb__fan button, .orb__fan a').allInnerTexts();
    await p.touchscreen.tap(...orbXY); await p.waitForTimeout(400);
    for (let i = 0; i < names.length; i += 1) {
      for (let k = 0; k < 3 && (await p.locator('.orb__fan button, .orb__fan a').count()) <= i; k += 1) { await p.keyboard.press('Escape'); await p.waitForTimeout(300); await p.touchscreen.tap(...orbXY); await p.waitForTimeout(700); }
      const item = p.locator('.orb__fan button, .orb__fan a').nth(i);
      const box = (await item.count()) ? await item.boundingBox({ timeout: 2000 }) : null;
      if (!box) { results.push({ side, i, label: names[i], error: 'fan did not open' }); continue; }
      if (box) await p.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
      await p.waitForTimeout(1300);
      const info = await p.evaluate(() => {
        const sec = document.querySelector('.section');
        const list = document.querySelector('.section__list');
        const modal = document.querySelector('.modal');
        const se = document.scrollingElement;
        return { section: sec?.getAttribute('aria-label') || null, modal: modal?.getAttribute('aria-label') || null, list: list ? [list.scrollHeight, list.clientHeight] : null, body: [se.scrollHeight, se.clientHeight], overflowing: [...document.querySelectorAll('.section *')].filter((el) => { const r = el.getBoundingClientRect(); const s = sec?.getBoundingClientRect(); return s && r.width > 2 && (r.right > s.right + 2 || r.left < s.left - 2); }).length };
      });
      const label = names[i].replace(/\s+/g, ' ').trim();
      await p.screenshot({ path: `${S}/m-${side}-${i}.png` });
      if (info.list && info.list[0] > info.list[1]) {
        await p.mouse.move(195, 400); await p.mouse.wheel(0, 600); await p.waitForTimeout(400);
        info.afterScroll = await p.evaluate(() => ({ list: document.querySelector('.section__list')?.scrollTop, body: document.scrollingElement.scrollTop }));
      }
      results.push({ side, i, label, ...info });
      const close = p.locator('.close-button').first();
      if (await close.count()) await close.evaluate((e) => e.click()); else await p.keyboard.press('Escape');
      await p.waitForTimeout(600);
    }
  }
  console.log(JSON.stringify(results, null, 0).replace(/\},\{/g, '}\n{'));
  console.log(errs.join('\n') || 'no errors');
  await b.close();
})();
