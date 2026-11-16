// List every member of the Slack workspace with their member ID, and the role
// they currently get from access.json.
//
//   node list-users.js                      table of everyone
//   node list-users.js --init               print a starter access.json (everyone = member)
//   node list-users.js --init --role viewer  same, but everyone = viewer
//   node list-users.js --init --include-guests
//
// Uses SLACK_BOT_TOKEN and ACCESS_FILE from .env. Needs the users:read scope.

import 'dotenv/config';
import { readFileSync } from 'fs';

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const option = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

const token = process.env.SLACK_BOT_TOKEN;
if (!token) {
  console.error('SLACK_BOT_TOKEN is not set (put it in .env).');
  process.exit(1);
}

async function slack(method, params) {
  const res = await fetch(`https://slack.com/api/${method}?${new URLSearchParams(params)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json();
  if (!body.ok) throw new Error(`${method}: ${body.error}${body.needed ? ` (needs scope ${body.needed})` : ''}`);
  return body;
}

async function allMembers() {
  const members = [];
  let cursor = '';
  do {
    const page = await slack('users.list', { limit: '200', ...(cursor ? { cursor } : {}) });
    members.push(...page.members);
    cursor = page.response_metadata?.next_cursor || '';
  } while (cursor);
  return members;
}

function kind(u) {
  if (u.deleted) return 'deactivated';
  if (u.is_bot || u.id === 'USLACKBOT') return 'bot';
  if (u.is_ultra_restricted) return 'single-channel guest';
  if (u.is_restricted) return 'guest';
  if (u.is_primary_owner) return 'primary owner';
  if (u.is_owner) return 'owner';
  if (u.is_admin) return 'workspace admin';
  return 'member';
}

function loadAccess() {
  const file = process.env.ACCESS_FILE;
  if (!file) return null;
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch (err) {
    console.error(`(could not read ACCESS_FILE ${file}: ${err.message})`);
    return null;
  }
}

function botRole(u, access) {
  if (!access) return 'member (no ACCESS_FILE)';
  if (u.deleted || u.is_bot || u.id === 'USLACKBOT') return 'none';
  const v = access.users?.[u.id];
  const listed = typeof v === 'string' ? v : v?.role;
  if (listed) return listed;
  if ((u.is_restricted || u.is_ultra_restricted) && access.allowGuests !== true) return 'none (guest)';
  return `${access.defaultRole ?? 'none'} (default)`;
}

const members = await allMembers();
const name = (u) => u.profile?.display_name || u.real_name || u.name;

if (flag('--init')) {
  const role = option('--role', 'member');
  const includeGuests = flag('--include-guests');
  const users = {};
  for (const u of members) {
    const k = kind(u);
    if (k === 'deactivated' || k === 'bot') continue;
    if (k.includes('guest') && !includeGuests) continue;
    users[u.id] = { role, name: u.real_name || name(u) };
  }
  const starter = {
    _readme: 'Roles: none < viewer < member < admin. Unlisted people get defaultRole. Edits apply on the next request; no restart needed.',
    defaultRole: 'none',
    allowGuests: false,
    roles: {},
    users,
    channels: {},
  };
  console.log(JSON.stringify(starter, null, 2));
} else {
  const access = loadAccess();
  const rows = members
    .map((u) => ({ id: u.id, name: name(u), real: u.real_name || '', kind: kind(u), role: botRole(u, access) }))
    .sort((a, b) => a.kind.localeCompare(b.kind) || a.name.localeCompare(b.name));
  const cols = ['id', 'name', 'real', 'kind', 'role'];
  const heads = { id: 'MEMBER ID', name: 'DISPLAY NAME', real: 'FULL NAME', kind: 'ACCOUNT', role: 'BOT ROLE' };
  const width = Object.fromEntries(cols.map((c) => [c, Math.min(32, Math.max(heads[c].length, ...rows.map((r) => r[c].length)))]));
  const line = (r) => cols.map((c) => String(r[c]).slice(0, width[c]).padEnd(width[c])).join('  ').trimEnd();
  console.log(line(heads));
  console.log(cols.map((c) => '-'.repeat(width[c])).join('  '));
  rows.forEach((r) => console.log(line(r)));
  console.log(`\n${rows.length} accounts. ${access ? `Roles from ${process.env.ACCESS_FILE}.` : 'ACCESS_FILE not set: everyone is "member".'}`);
}
