# Quick start

The shortest path to a working bot on one Linux server. Each step links to the full setup page if you need more detail.

**You need:** a Linux server (Ubuntu 22.04 or newer works) with Node.js 22.15 or newer, permission to create apps in your Slack workspace, and access to a model: a TokenVisor account, another provider pi supports, or your own vLLM server.

**Time:** about an hour, most of it in the Slack app settings.

## 1. Create the Slack app

At [api.slack.com/apps](https://api.slack.com/apps) → **Create New App** → **From scratch**, then:

1. **Socket Mode**: turn on, and create an app-level token with `connections:write` (`xapp-…`).
2. **OAuth & Permissions → Bot Token Scopes**: add the scopes in the [scopes table](/reference/slack#bot-token-scopes).
3. **Event Subscriptions**: turn on and add the bot events `app_mention`, `message.im`, `message.channels`, `message.groups`, `message.mpim`, `app_home_opened`.
4. **Interactivity & Shortcuts**: turn on. With Socket Mode, no request URL is needed.
5. **App Home**: turn on the **Home Tab** and the **Messages Tab**, and allow messages from the Messages tab.
6. **Install App**: install to the workspace and copy the **Bot User OAuth Token** (`xoxb-…`).

Details: [Slack app](/setup/slack-app).

## 2. Prepare the server

```bash
sudo useradd -r -m -s /bin/bash pi-bot
sudo mkdir -p /opt/pi-slack-bridge /opt/pi-workspace
sudo chown -R pi-bot:pi-bot /opt/pi-slack-bridge /opt/pi-workspace
```

```bash
sudo -u pi-bot HOME=/home/pi-bot npm install -g @earendil-works/pi-coding-agent --prefix /home/pi-bot/.pi/agent
```

```bash
sudo -u pi-bot -i /home/pi-bot/.pi/agent/bin/pi install npm:pi-exa
```

Then sign pi in to your model provider (`/login` inside `pi`), or install the TokenVisor provider. Details: [Server and pi](/setup/server) and [Model](/setup/model).

## 3. Install the bot

```bash
sudo -u pi-bot git clone https://github.com/EmbeddedLLM/slack-pi-agent-app.git /opt/pi-slack-bridge
```

```bash
cd /opt/pi-slack-bridge && sudo -u pi-bot npm ci --omit=dev
```

```bash
sudo -u pi-bot mkdir -p /home/pi-bot/.pi/agent/extensions && sudo -u pi-bot cp pi-extensions/path-guard.ts /home/pi-bot/.pi/agent/extensions/
```

## 4. Configure

```bash
sudo -u pi-bot cp .env.example .env && sudo -u pi-bot chmod 600 .env
```

Edit `.env`: set `SLACK_BOT_TOKEN`, `SLACK_APP_TOKEN` and `PI_TOOLS`. Then create the access list. This command prints every workspace member with their member ID:

```bash
sudo -u pi-bot node list-users.js
```

Generate a starter list, then edit the roles in it:

```bash
sudo -u pi-bot sh -c 'node list-users.js --init > access.json'
```

Details: [Configuration](/reference/configuration) and [Access control](/admin/access-control).

## 5. Run it as a service

```bash
sudo cp deploy/pi-slack-bot.service /etc/systemd/system/ && sudo systemctl daemon-reload && sudo systemctl enable --now pi-slack-bot
```

```bash
sudo journalctl -u pi-slack-bot -f
```

A healthy start logs a `started` line. Invite the bot to a channel (`/invite @your-bot`) and try:

```
@your-bot help
```

```
@your-bot summarise this channel
```

## Next

- Turn on thread memory with `PI_SESSION_DIR`: see [How it behaves](/guide/behavior#memory-per-thread).
- Add [deep research](/setup/deep-research) for admins.
- Read the [security model](/admin/security) before giving anyone `bash`, `edit` or `write`.
