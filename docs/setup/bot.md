# 4. Bot and service

## Install

```bash
sudo -u pi-bot git clone https://github.com/EmbeddedLLM/slack-pi-agent-app.git /opt/pi-slack-bridge
```

```bash
cd /opt/pi-slack-bridge && sudo -u pi-bot npm ci --omit=dev
```

This installs the Slack SDK and two optional packages:

- **`officeparser`** reads PDF, Word, PowerPoint, Excel and OpenDocument uploads.
- **`md-to-pdf`** writes PDF replies. It downloads a headless Chromium on install. On a minimal server, Chromium may need extra system libraries; Puppeteer's [troubleshooting guide](https://pptr.dev/troubleshooting) lists them per distribution. If Chromium fails with a sandbox error (common in containers), set `PDF_NO_SANDBOX=true`.

If the optional packages fail to install, the bot still runs. It then says so when someone uploads an Office file or asks for a PDF.

::: warning No installs at runtime
The bot puts package managers in offline mode for the agent, and the path guard blocks install commands. Install everything the agent needs **before** starting the bot.
:::

## Configure `.env`

```bash
cd /opt/pi-slack-bridge && sudo -u pi-bot cp .env.example .env && sudo -u pi-bot chmod 600 .env
```

The minimum:

```ini
SLACK_BOT_TOKEN=xoxb-...
SLACK_APP_TOKEN=xapp-...
PI_BIN=/home/pi-bot/.pi/agent/bin/pi
PI_WORKDIR=/opt/pi-workspace
ACCESS_FILE=/opt/pi-slack-bridge/access.json
PI_TOOLS=read,grep,find,ls,web_search_exa,deep_search_exa,web_fetch_exa
PI_SECRET_FILES=/home/pi-bot/.pi/agent/auth.json,/home/pi-bot/.pi/agent/pi-exa.json
PI_SESSION_DIR=/home/pi-bot/slack-sessions
```

- **Every setting** is described in the [configuration reference](/reference/configuration).
- **`PI_SECRET_FILES`:** list every JSON file that holds a key the agent's tools use, so their values are scrubbed from replies.
- **`PI_TOOLS`:** don't add `bash`, `edit` or `write` here. Give them per role in `access.json`, and only to people you trust with a shell.

## Create the access list

The bot can list everyone in the workspace with their member IDs (needs `users:read`):

```bash
sudo -u pi-bot node list-users.js
```

Generate a starter file. Everyone gets the role `member`, guests and bots are left out, and anyone not listed gets `none`:

```bash
sudo -u pi-bot sh -c 'node list-users.js --init > access.json'
```

Then edit `access.json`: make yourself `admin`, and change roles as needed. See [Access control](/admin/access-control). Changes apply on the next request, with no restart.

## Run as a service

The unit file is in `deploy/pi-slack-bot.service`. Check its `PATH`: it must include every command-line tool the agent uses, for example `/home/pi-bot/.local/bin` for `drsh`.

```bash
sudo cp /opt/pi-slack-bridge/deploy/pi-slack-bot.service /etc/systemd/system/ && sudo systemctl daemon-reload
```

```bash
sudo systemctl enable --now pi-slack-bot
```

```bash
sudo journalctl -u pi-slack-bot -f
```

A healthy start logs, in order:

- `access_loaded`: the access file was read, with the number of listed people.
- `research_drsh` or `research_warning`: only relevant if you use deep research.
- `started`: the bot is connected.

## First test

1. Invite the bot to a channel: `/invite @assistant`.
2. `@assistant whoami` shows your member ID and role (only to you).
3. `@assistant help` shows what you can do.
4. `@assistant summarise this channel` runs the agent.

If something fails, see [Troubleshooting](/admin/troubleshooting).

## Updating

```bash
cd /opt/pi-slack-bridge && sudo -u pi-bot git pull && sudo -u pi-bot npm ci --omit=dev && sudo systemctl restart pi-slack-bot
```

On restart, running requests are cancelled and their messages say so. Running research shows a Resume button.
