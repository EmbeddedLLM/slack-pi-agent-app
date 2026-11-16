# `access.json`

The access list. Its path is `ACCESS_FILE`. It is re-read whenever it changes, and keys starting with `_` are ignored, so you can leave notes.

```json
{
  "_readme": "Roles: none < viewer < member < admin.",
  "defaultRole": "none",
  "allowGuests": false,

  "roles": {
    "viewer": { "tools": "read,grep,find,ls", "readUploads": false, "createFiles": false, "maxJobs": 1 },
    "member": { "tools": "read,grep,find,ls,web_search_exa,deep_search_exa,web_fetch_exa" },
    "admin":  { "tools": "read,grep,find,ls,web_search_exa,deep_search_exa,web_fetch_exa,bash", "deepResearch": true }
  },

  "users": {
    "U01AAAAAAAA": { "role": "admin", "name": "Ada" },
    "U02BBBBBBBB": "member"
  },

  "channels": {
    "C04DDDDDDDD": { "maxRole": "member", "name": "#general" }
  }
}
```

## Top level

| Key | Type | Default | Meaning |
|---|---|---|---|
| `defaultRole` | role name | `"none"` | Role for people not listed in `users` |
| `allowGuests` | boolean | `false` | Whether unlisted guest accounts get `defaultRole`. Listed guests always get their listed role. |
| `roles` | object | — | Per-role overrides (below) |
| `users` | object | — | Member ID → role |
| `channels` | object | — | Channel ID → highest role allowed there |

## `roles`

Keys: `viewer`, `member`, `admin`. `none` can't be changed. Only the fields you give are changed; the rest keep their defaults.

| Field | Type | Default (viewer / member / admin) | Meaning |
|---|---|---|---|
| `tools` | comma-separated tool names | `read,grep,find,ls` / `PI_TOOLS` / `PI_TOOLS_TRUSTED` | Passed to pi as its `--tools` allowlist |
| `readUploads` | boolean | false / true / true | May share files with the bot |
| `createFiles` | boolean | false / true / true | May receive generated files |
| `deepResearch` | boolean | false / false / true | May use `research <topic>` |
| `cancelAny` | boolean | false / false / true | May cancel other people's requests |
| `maxJobs` | number | 1 / `MAX_JOBS_PER_USER` / `MAX_JOBS_PER_USER` | Requests running or queued at once |

## `users`

Either a role name, or an object with `role` and an optional `name`, which is only a note for you:

```json
"U02BBBBBBBB": "member",
"U03CCCCCCCC": { "role": "viewer", "name": "Chris (contractor)" }
```

Find member IDs with `node list-users.js`, in a profile under **⋮ → Copy member ID**, or with `@assistant whoami`.

## `channels`

A cap per channel, as `maxRole` (or `role`). Anyone above the cap acts with the capped role in that channel. Channel IDs start with `C` (public) or `G` (private); in Slack, open the channel details, and the ID is at the bottom.

## Validation

An unknown role name anywhere is an error. The whole file is then rejected, the last good version stays in use, and `access_file_error` is logged with the reason.
