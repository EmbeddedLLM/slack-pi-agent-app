# Configuration (`.env`)

The bot reads its settings from environment variables, normally from `/opt/pi-slack-bridge/.env`. Copy `.env.example` to start. Changes need a restart (`sudo systemctl restart pi-slack-bot`), except `access.json`, which is re-read automatically.

The **Default** column is what the bot uses when a variable is not set.

## Slack

| Variable | Default | Description |
|---|---|---|
| `SLACK_BOT_TOKEN` | — (required) | Bot User OAuth Token, `xoxb-…`. Never passed to pi. |
| `SLACK_APP_TOKEN` | — (required) | App-level token with `connections:write`, `xapp-…`. Never passed to pi. |
| `BOT_DISPLAY_NAME` | the bot's Slack username | Name used in help examples (`@name …`). |

## pi

| Variable | Default | Description |
|---|---|---|
| `PI_BIN` | `/home/pi-bot/.pi/agent/bin/pi` | Path to the pi binary. |
| `PI_WORKDIR` | the bot's folder | The agent's working folder, and the only one its file tools may use. Use `/opt/pi-workspace`. |
| `PI_PROVIDER`, `PI_MODEL`, `PI_THINKING` | pi's defaults | Force a provider, model and thinking level on every run. |
| `PI_PROMPT_VIA` | `argv` | `stdin` sends the prompt on standard input. It keeps prompts out of the process list and avoids the 128 KB argument limit; **recommended**. Deep research runs always use arguments. |
| `PI_SESSION_DIR` | empty (no memory) | Folder for one pi session per Slack thread. See [memory per thread](/guide/behavior#memory-per-thread). |
| `PI_TIMEOUT_MS` | `90000` | Time limit per request, in milliseconds. `180000` suits reports and PDFs. |

## Tools and access

| Variable | Default | Description |
|---|---|---|
| `ACCESS_FILE` | empty (legacy mode) | Path to `access.json`. See [Access control](/admin/access-control). |
| `PI_TOOLS` | `read,grep,find,ls` | Tools for the `member` role, unless `access.json` overrides them. |
| `PI_TOOLS_TRUSTED` | `PI_TOOLS` | Tools for the `admin` role, unless overridden. |
| `TRUSTED_USER_IDS` | empty | Legacy, only without `ACCESS_FILE`: these member IDs are admins and everyone else is a member. |

Tool names: pi's `read`, `grep`, `find`, `ls`, `bash`, `edit`, `write`, plus package tools such as `web_search_exa`, `deep_search_exa`, `web_fetch_exa`. Don't list `deep_research` or `research_ask`: the bot adds them where they belong.

## Secrets

| Variable | Default | Description |
|---|---|---|
| `PI_ENV_DENY` | empty | Extra environment variables to hide from pi. `SLACK_*` is always hidden. |
| `PI_SECRET_FILES` | empty | JSON files whose `key`, `token`, `secret`, `password`, `credential` or `auth` fields are scrubbed from replies. Their file names are hidden too. List pi's `auth.json`, pi-exa's config and drsh's `auth.json`. |
| `PI_REDACT_PATHS` | empty | Extra folders to hide from replies. The bot's home, pi's folder and `RESEARCH_DIR` are always hidden. |

## Limits

| Variable | Default | Description |
|---|---|---|
| `MAX_CONCURRENT_JOBS` | `2` | pi processes running at once; the rest queue. |
| `MAX_JOBS_PER_USER` | `2` | Requests running or queued per person. Roles can override with `maxJobs`. |

## Context

| Variable | Default | Description |
|---|---|---|
| `HISTORY_LIMIT` | `50` | Top-level messages fetched when asked in the main channel. |
| `CONTEXT_CHAR_BUDGET` | `24000` | Characters of Slack history in the prompt. |
| `PER_MESSAGE_CHAR_LIMIT` | `3000` | Characters per message in the history. |
| `THREAD_FOLLOW` | `false` | `true`: after answering in a thread, answer every later message there without a mention. |
| `THREAD_FOLLOW_TTL_HOURS` | `72` | With `THREAD_FOLLOW`, how long after its last answer. |

## Output

| Variable | Default | Description |
|---|---|---|
| `SLACK_MARKDOWN_BLOCKS` | `false` | `true` uses Slack's markdown block instead of the bot's own conversion. |
| `SLACK_REACTIONS` | `true` | 👀 / ✅ / ❌ reactions. Needs `reactions:write`. |
| `REPLY_FILE_THRESHOLD` | `12000` | Answers longer than this many characters are also attached as `reply.md`. |
| `HINTS_FILE` | `~/.cache/slack-pi-bot/hints.json` | Which one-time tips each person has seen. |

## Files

| Variable | Default | Description |
|---|---|---|
| `MAX_FILES_PER_REPLY` | `3` | Files the bot may attach to one answer. |
| `MAX_FILE_BYTES` | `10000000` | Size limit per generated file. |
| `PDF_NO_SANDBOX` | `false` | Run Chromium without its sandbox. Only if it fails with a sandbox error, for example in containers. |
| `INPUT_FILES_DIR` | system temp `/slack-pi-inputs` | Where uploads are downloaded, one folder per request. |
| `MAX_INPUT_FILES` | `5` | Uploaded files read per request. |
| `MAX_INPUT_FILE_BYTES` | `20000000` | Size limit per uploaded file. |
| `MAX_INPUT_IMAGES` | `8` | Images sent to the model per request, including images inside documents. |
| `ATTACHMENT_CHAR_BUDGET` | `40000` | Characters of extracted document text placed in the prompt. |

## Deep research

| Variable | Default | Description |
|---|---|---|
| `RESEARCH_TIMEOUT_MS` | `3600000` | Time limit per research run (60 minutes). |
| `RESEARCH_MAX_CONCURRENT` | `1` | Research runs at once. Each uses one of `MAX_CONCURRENT_JOBS`. |
| `RESEARCH_DIR` | `~/.cache/slack-pi-research` | Reports and checkpoints, one folder per thread. |
| `RESEARCH_KEEP_DAYS` | `30` | Thread folders unused this long are deleted. |
| `DRSH_BIN` | `drsh` on `PATH` | Path to drsh, if it isn't on the service's `PATH`. Read by the research package. |

## Suggested values for a 256k-token model

```ini
PI_PROMPT_VIA=stdin
PI_SESSION_DIR=/home/pi-bot/slack-sessions
PI_TIMEOUT_MS=180000
HISTORY_LIMIT=100
CONTEXT_CHAR_BUDGET=60000
PER_MESSAGE_CHAR_LIMIT=6000
ATTACHMENT_CHAR_BUDGET=80000
```
