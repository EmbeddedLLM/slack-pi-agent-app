// Starts index.js against a fake Slack client and a fake pi (fake-pi.mjs).
// Every Slack API call is recorded in `calls`; handlers are called directly.
import cp from 'node:child_process';
import { syncBuiltinESMExports } from 'node:module';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const NAMES = { UADMIN: 'Ada Admin', UMEM: 'Mo Member' };

export async function startBot(extraEnv = {}) {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'slack-pi-e2e-'));
  mkdirSync(path.join(dir, 'ws'));
  writeFileSync(path.join(dir, 'access.json'), JSON.stringify({ defaultRole: 'none', users: { UADMIN: 'admin', UMEM: 'member' } }));

  Object.assign(process.env, {
    SLACK_BOT_TOKEN: 'xoxb-test',
    SLACK_APP_TOKEN: 'xapp-test',
    PI_BIN: '/fake/pi',
    PI_WORKDIR: path.join(dir, 'ws'),
    ACCESS_FILE: path.join(dir, 'access.json'),
    RESEARCH_DIR: path.join(dir, 'research'),
    PI_SESSION_DIR: path.join(dir, 'sessions'),
    HINTS_FILE: path.join(dir, 'hints.json'),
    PI_PROMPT_VIA: 'argv',
    SLACK_REACTIONS: 'false',
    FAKE_PI_DIR: dir,
    PI_TOOLS: 'read,grep,find,ls,web_search_exa,web_fetch_exa',
    PI_TOOLS_TRUSTED: 'read,grep,web_search_exa,bash,edit,write,deep_research',
    ...extraEnv,
  });

  // Every pi launch runs fake-pi.mjs instead.
  const realSpawn = cp.spawn;
  cp.spawn = (bin, args, opts) => realSpawn(process.execPath, [path.join(here, 'fake-pi.mjs'), ...args], { ...opts, detached: false });
  syncBuiltinESMExports();

  let ts = 1000;
  const calls = [];
  const record = (m) => async (a) => {
    calls.push({ m, a });
    if (m === 'chat.postMessage') return { ok: true, ts: `${++ts}.000100` };
    if (m === 'users.info') return { user: { id: a.user, real_name: NAMES[a.user] || 'Nora Nobody', tz: 'UTC' } };
    if (m === 'conversations.replies' || m === 'conversations.history') return { messages: [] };
    if (m === 'conversations.info') return { channel: { name: 'general', is_channel: true } };
    if (m === 'auth.test') return { user_id: 'UBOT', bot_id: 'B1', user: 'test-bot' };
    return { ok: true };
  };
  const client = new Proxy({}, { get: (_, ns) => new Proxy({}, { get: (_, fn) => record(`${ns}.${fn}`) }) });
  globalThis.__client = client;

  await import('../../index.js');
  const app = globalThis.__app;
  await sleep(200); // startup (auth.test etc.)

  let n = 0;
  const bot = {
    dir,
    app,
    client,
    calls,
    lastTs: '',
    setMode: (mode) => writeFileSync(path.join(dir, 'mode.txt'), mode),
    piCalls: () =>
      readFileSync(path.join(dir, 'calls.log'), 'utf8')
        .trim()
        .split('\n')
        .map((l) => JSON.parse(l)),
    mention(user, text, thread) {
      const event = { type: 'app_mention', user, text: `<@UBOT>${text ? ` ${text}` : ''}`, channel: 'C0TEST', ts: `${2000 + ++n}.000200`, ...(thread ? { thread_ts: thread } : {}) };
      bot.lastTs = event.ts;
      return app.h.event.app_mention({ event, client });
    },
    dm(user, text) {
      const event = { type: 'message', channel_type: 'im', user, text, channel: 'D0DM', ts: `${2000 + ++n}.000200` };
      return app.h.event.message({ event, client });
    },
    click(id, value, user = 'UADMIN', messageTs) {
      return app.h.action[id]({
        ack: async () => {},
        body: { user: { id: user }, channel: { id: 'C0TEST' }, trigger_id: 'T1', message: { ts: messageTs } },
        action: { value },
        client,
      });
    },
    ephemerals: () => calls.filter((c) => c.m === 'chat.postEphemeral').map((c) => c.a.text),
    lastUpdate: (pred) => [...calls].reverse().find((c) => c.m === 'chat.update' && pred(c.a)),
  };
  return bot;
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const J = (x) => JSON.stringify(x ?? []);

export async function until(fn, ms = 20_000) {
  const start = Date.now();
  while (Date.now() - start < ms) {
    const v = fn();
    if (v) return v;
    await sleep(50);
  }
  throw new Error('timed out waiting for a condition');
}

let failures = 0;
export function ok(cond, label) {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}`);
  if (!cond) failures++;
}
export function finish() {
  console.log(failures ? `\n${failures} check(s) failed` : '\nall checks passed');
  process.exit(failures ? 1 : 0);
}
