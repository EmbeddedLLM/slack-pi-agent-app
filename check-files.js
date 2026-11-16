// Diagnose why the bot can't read uploaded files.
//
//   node check-files.js                 show the scopes the bot token really has
//   node check-files.js <file link|ID>  also look the file up and try to download it
//
// Get a file link in Slack: hover the file → ⋮ (More actions) → Copy link.
// Uses SLACK_BOT_TOKEN from .env. Prints no secrets.

import 'dotenv/config';

const token = process.env.SLACK_BOT_TOKEN;
if (!token) {
  console.error('SLACK_BOT_TOKEN is not set (put it in .env).');
  process.exit(1);
}
const auth = { Authorization: `Bearer ${token}` };
const NEEDED = ['files:read', 'files:write', 'users:read', 'chat:write', 'app_mentions:read', 'channels:history', 'im:history'];

const ok = (m) => console.log(`  OK    ${m}`);
const bad = (m) => console.log(`  FAIL  ${m}`);

// 1. Which scopes does this token actually carry? (Slack returns them in a header.)
console.log('1. Bot token');
const authRes = await fetch('https://slack.com/api/auth.test', { headers: auth });
const who = await authRes.json();
if (!who.ok) {
  bad(`auth.test failed: ${who.error}`);
  process.exit(1);
}
ok(`token works: bot user ${who.user_id} in workspace "${who.team}"`);
const scopes = (authRes.headers.get('x-oauth-scopes') || '').split(',').map((s) => s.trim()).filter(Boolean);
console.log(`  Scopes on this token: ${scopes.join(', ') || '(none reported)'}`);
for (const s of NEEDED) (scopes.includes(s) ? ok : bad)(`${s}${scopes.includes(s) ? '' : ' missing: add it under OAuth & Permissions, then "Reinstall to Workspace"'}`);
if (!scopes.includes('files:read')) {
  console.log('\n  => The token has no files:read. Adding the scope is not enough: reinstall the app,');
  console.log('     and if the Bot User OAuth Token changed, put the new one in .env and restart the bot.');
}

// 2. Optional: look up one file and download it the way the bot does.
const arg = process.argv[2];
if (!arg) process.exit(0);
const fileId = (arg.match(/\b(F[A-Z0-9]{8,})\b/) || [])[1];
if (!fileId) {
  bad(`could not find a file ID (F...) in "${arg}"`);
  process.exit(1);
}

console.log(`\n2. File ${fileId}`);
const infoRes = await fetch(`https://slack.com/api/files.info?file=${fileId}`, { headers: auth });
const info = await infoRes.json();
if (!info.ok) {
  bad(`files.info failed: ${info.error}${info.needed ? ` (needs ${info.needed})` : ''}`);
  if (info.error === 'file_not_found') console.log('  => The bot cannot see this file. Is the bot a member of the channel it was posted in?');
  process.exit(1);
}
const f = info.file;
ok(`found "${f.name}" (${f.mimetype}, ${f.size} bytes)`);

const url = f.url_private_download || f.url_private;
const res = await fetch(url, { headers: auth });
const type = res.headers.get('content-type') || '';
const body = Buffer.from(await res.arrayBuffer());
if (!res.ok) bad(`download returned HTTP ${res.status}`);
else if (type.includes('text/html') && !/\.html?$/i.test(f.name)) bad('download returned a Slack sign-in page instead of the file (scope or token problem)');
else if (body.length !== f.size) bad(`downloaded ${body.length} bytes, expected ${f.size}`);
else ok(`downloaded ${body.length} bytes (${type}). The bot should be able to read this file.`);
