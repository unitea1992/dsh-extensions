import { lstatSync, writeFileSync, renameSync, unlinkSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';

export const name = 'route-guard';

function record(dir, name, value) {
  if (!dir) return;
  const stat = lstatSync(dir);
  if (!stat.isDirectory() || stat.uid !== process.getuid() || (stat.mode & 0o077) !== 0) {
    throw new Error('route-guard: status directory must be private and owned by the current user');
  }
  const target = join(dir, name);
  const temporary = join(dir, `.${name}.${randomUUID()}`);
  try {
    writeFileSync(temporary, JSON.stringify(value), { mode: 0o600, flag: 'wx' });
    renameSync(temporary, target);
  } finally {
    try { unlinkSync(temporary); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
}

export function apply(ctx, config) {
  const { provider, model, effort, statusDir } = config ?? {};
  if (![provider, model, effort].every(value => typeof value === 'string' && value.length > 0)) {
    throw new Error('route-guard requires provider, model, and effort');
  }
  ctx.on('agent/request', async (_payload, next) => {
    const call = await next();
    const actual = { provider: call.provider, model: call.model, effort: call.reasoningEffort };
    record(statusDir, 'route-observed.json', actual);
    if (actual.provider !== provider || actual.model !== model || actual.effort !== effort) {
      throw new Error('route-guard: request route or effort does not match the configured values');
    }
    return call;
  }, { prepend: true });
  record(statusDir, 'guard-ready.json', { provider, model, effort });
}
