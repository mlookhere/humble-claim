import test from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { revealKey, scanKeys } from '../src/humble.mjs';
import { activateOnSteam, STEAM_URL } from '../src/steam.mjs';

test('Humble and Steam browser adapters work on synthetic fixtures', async (t) => {
  const browser = await chromium.launch({ headless: true });
  try {
    await t.test('dry-run scan does not reveal a key; explicit reveal extracts it', async () => {
      const page = await browser.newPage();
      try {
        await page.setContent([
          '<article class="js-key-item">',
          '<h3 class="keyfield-title">Example Game</h3>',
          '<span>Steam</span>',
          '<button type="button" id="reveal">Reveal Steam Key</button>',
          '<output id="code"></output>',
          '</article>',
          '<script>document.querySelector("#reveal").addEventListener("click", () => {',
          'document.querySelector("#code").textContent = "ABCDE-12345-Z9Y8X";',
          '});</script>'
        ].join(''));
        const [before] = await scanKeys(page);
        assert.equal(before.title, 'Example Game');
        assert.equal(before.steam, true);
        assert.equal(before.reveal, true);
        assert.deepEqual(before.keys, []);
        assert.equal(await page.locator('#code').innerText(), '');
        assert.equal(await revealKey(page, before.index), 'ABCDE-12345-Z9Y8X');
        assert.deepEqual((await scanKeys(page))[0].keys, ['ABCDE-12345-Z9Y8X']);
      } finally {
        await page.close();
      }
    });

    for (const [label, resultText, expected] of [
      ['success', 'Product Activation Successful!', 'activated'],
      ['rate limit', 'Too many activation attempts. Try again later.', 'blocked'],
      ['duplicate', 'This product code has already been activated.', 'already-used'],
    ]) {
      await t.test('Steam mock handles ' + label + ' without contacting Steam', async () => {
        const page = await browser.newPage();
        try {
          await page.route('**/*', async (route) => {
            if (route.request().url() !== STEAM_URL) {
              await route.abort();
              return;
            }
            await route.fulfill({
              status: 200,
              contentType: 'text/html',
              body: [
                '<form>',
                '<input id="product_key" name="product_key">',
                '<input id="accept_ssa" type="checkbox">',
                '<button id="register_btn" type="submit">Continue</button>',
                '<output id="response"></output>',
                '</form>',
                '<script>document.querySelector("form").onsubmit = (event) => {',
                'event.preventDefault();',
                'document.querySelector("#response").textContent = ',
                JSON.stringify(resultText),
                ';};</script>'
              ].join(''),
            });
          });
          const status = await activateOnSteam(page, 'ABCDE-12345-Z9Y8X');
          assert.equal(status, expected);
          assert.equal(await page.locator('#accept_ssa').isChecked(), true);
          assert.equal(await page.locator('#product_key').inputValue(), 'ABCDE-12345-Z9Y8X');
        } finally {
          await page.close();
        }
      });
    }
  } finally {
    await browser.close();
  }
});
