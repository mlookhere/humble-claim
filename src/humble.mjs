import { extractKeys, redactKeys } from './core.mjs';

export const HUMBLE_URL = 'https://www.humblebundle.com/home/keys';
export const CARD_SELECTOR = '.js-key-item, .key-redeemer, .key-item, [data-key-id]';
const REVEAL_PATTERN = /reveal|show(?:\s+\w+)*\s+key|get(?:\s+\w+)*\s+key|claim(?:\s+\w+)*\s+key/i;

export async function expandList(page, maxClicks = 30) {
  for (let attempt = 0; attempt < maxClicks; attempt++) {
    const button = page.getByRole('button', { name: /^(?:load|show|view|see) more(?: keys| items)?$/i }).first();
    if (!(await button.isVisible().catch(() => false))) break;
    await button.click();
    await page.waitForTimeout(450);
  }
}

export async function scanKeys(page) {
  const items = await page.locator(CARD_SELECTOR).evaluateAll((nodes, selector) =>
    nodes
      .map((element, index) => ({ element, index }))
      .filter(({ element }) => !element.querySelector(selector))
      .map(({ element, index }) => {
        const text = element.innerText ?? '';
        const title = element.querySelector('.keyfield-title, .key-title, .game-title, h3, h4')?.innerText?.trim()
          ?? text.split('\n').map((line) => line.trim()).find(Boolean)
          ?? '(untitled)';
        const buttons = [...element.querySelectorAll('button, a, [role="button"], input[type="button"]')];
        const reveal = buttons.some((button) => /reveal|show(?:\s+\w+)*\s+key|get(?:\s+\w+)*\s+key|claim(?:\s+\w+)*\s+key/i
          .test(button.innerText || button.value || button.getAttribute('aria-label') || ''));
        return {
          index,
          title: redactKeys(title).slice(0, 160),
          steam: /\bsteam\b/i.test(text),
          reveal,
          text,
        };
      }), CARD_SELECTOR);
  return items.map(({ text, ...item }) => ({
    ...item,
    keys: extractKeys(text),
  }));
}

export async function revealKey(page, index) {
  const card = page.locator(CARD_SELECTOR).nth(index);
  const buttons = card.locator('button, a, [role="button"], input[type="button"]');
  const count = await buttons.count();
  for (let i = 0; i < count; i++) {
    const button = buttons.nth(i);
    const label = await button.evaluate((element) =>
      element.innerText || element.value || element.getAttribute('aria-label') || '');
    if (!REVEAL_PATTERN.test(label) || !(await button.isVisible()) || !(await button.isEnabled())) continue;
    await button.click();
    await page.waitForTimeout(800);
    const text = await card.innerText().catch(() => '');
    const keys = extractKeys(text);
    if (keys.length === 1) return keys[0];
    if (keys.length > 1) throw new Error('Multiple keys appeared in one row; manual review required');
    return null;
  }
  return null;
}
