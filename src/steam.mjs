import { classifyActivation } from './core.mjs';

export const STEAM_URL = 'https://store.steampowered.com/account/registerkey';

export async function activateOnSteam(page, key) {
  await page.goto(STEAM_URL, { waitUntil: 'domcontentloaded' });
  const input = page.locator('#product_key, input[name="product_key"]').first();
  if (!(await input.isVisible().catch(() => false))) {
    throw new Error('Steam activation form unavailable: sign in or review the page manually');
  }
  await input.fill(key);

  const agreement = page.locator('#accept_ssa, input[name="accept_ssa"]').first();
  if (await agreement.count()) {
    await agreement.check();
  }

  const submit = page.locator('#register_btn, button[type="submit"], input[type="submit"]').first();
  if (!(await submit.isVisible().catch(() => false))) {
    throw new Error('Steam activation button not found; selectors require review');
  }
  await submit.click();
  for (let i = 0; i < 25; i++) {
    const pageText = await page.locator('body').innerText();
    const status = classifyActivation(pageText);
    if (status !== 'unknown') return status;
    await page.waitForTimeout(600);
  }
  return 'unknown';
}
