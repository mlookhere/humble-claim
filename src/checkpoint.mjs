import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

export async function loadCheckpoint(path) {
  try {
    const data = JSON.parse(await readFile(path, 'utf8'));
    if (data.version !== 1 || typeof data.entries !== 'object' || !data.entries || Array.isArray(data.entries)) {
      throw new Error('Invalid checkpoint format');
    }
    return data;
  } catch (error) {
    if (error.code === 'ENOENT') return { version: 1, entries: {} };
    throw error;
  }
}

export async function saveCheckpoint(path, data) {
  const dir = dirname(path);
  await mkdir(dir, { recursive: true, mode: 0o700 });
  const temp = path + '.tmp';
  await writeFile(temp, JSON.stringify(data, null, 2) + '\n', { mode: 0o600 });
  await rename(temp, path);
}
