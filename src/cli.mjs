#!/usr/bin/env node
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { resolve } from 'node:path';
import { loadCheckpoint, saveCheckpoint } from './checkpoint.mjs';
import { fingerprint, isVerifiedActivation, maskKey } from './core.mjs';
import { expandList, HUMBLE_URL, revealKey, scanKeys } from './humble.mjs';
import { activateOnSteam, STEAM_URL } from './steam.mjs';

const args = process.argv.slice(2);
const valid = new Set(['--setup', '--execute']);
if (args.some((arg) => !valid.has(arg))) {
  console.error('Usage: npm start -- [--setup | --execute]');
  process.exitCode = 2;
} else {
  await main().catch((error) => {
    // Browser exceptions sometimes include field values; never print secrets.
    console.error('Stopped: ' + String(error?.message ?? error)
      .replace(/\b[A-Z0-9]{5}(?:-[A-Z0-9]{5}){2}\b/gi, '[REDACTED]'));
    process.exitCode = 1;
  });
}

async function main() {
  const { chromium } = await import('playwright');
  const execute = args.includes('--execute');
  const setup = args.includes('--setup');
  if (execute && setup) throw new Error('Choose either --setup or --execute');

  const context = await chromium.launchPersistentContext(resolve('data/browser'), {
    headless: false,
    viewport: { width: 1280, height: 900 },
  });

  try {
    const humble = await context.newPage();
    const steam = await context.newPage();
    await Promise.all([
      humble.goto(HUMBLE_URL, { waitUntil: 'domcontentloaded' }),
      steam.goto(STEAM_URL, { waitUntil: 'domcontentloaded' }),
    ]);

    if (setup) {
      const terminal = createInterface({ input: stdin, output: stdout });
      try {
        await terminal.question('Sign in to both websites in the open browser, then press Enter to save your sessions. ');
      } finally {
        terminal.close();
      }
      return;
    }

    await expandList(humble);
    const items = (await scanKeys(humble)).filter((item) => item.steam);
    if (!items.length) {
      throw new Error('No Steam key rows detected. Verify Humble login or update selectors using redacted page HTML.');
    }
    const checkpointPath = resolve('data/activation-checkpoint.json');
    const checkpoint = await loadCheckpoint(checkpointPath);
    console.log((execute ? 'EXECUTE' : 'DRY RUN') + ': ' + items.length + ' Steam-labeled rows detected');

    for (const item of items) {
      if (item.keys.length > 1) throw new Error('Multiple keys in a row; stop for manual review');
      if (!execute) {
        console.log('- ' + item.title + ': ' + (item.keys.length ? 'visible key' : item.reveal ? 'reveal available' : 'no detectable key'));
        continue;
      }
      let key = item.keys[0];
      if (!key && item.reveal) key = await revealKey(humble, item.index);
      if (!key) {
        console.log('- ' + item.title + ': skipped (no unambiguous key)');
        continue;
      }
      const id = fingerprint(key);
      if (isVerifiedActivation(checkpoint.entries[id])) {
        console.log('- ' + item.title + ': already activated in a prior run');
        continue;
      }

      const status = await activateOnSteam(steam, key);
      key = undefined;
      console.log('- ' + item.title + ': Steam reported ' + status);
      if (status !== 'activated') {
        throw new Error('Activation is not verified (' + status + '); stopped to avoid duplicate submissions or account limits');
      }
      checkpoint.entries[id] = { status: 'activated', at: new Date().toISOString() };
      await saveCheckpoint(checkpointPath, checkpoint);
      await steam.waitForTimeout(2000);
    }
    if (!execute) console.log('No keys were revealed or submitted. Run --execute only after reviewing the dry run.');
  } finally {
    await context.close();
  }
}
