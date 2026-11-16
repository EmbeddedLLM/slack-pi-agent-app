# 1. Slack app

Everything on this page happens at [api.slack.com/apps](https://api.slack.com/apps).

## Create the app

1. **Create New App** → **From scratch**. Name it (the name is how people mention it, for example `assistant`) and pick your workspace.
2. **Basic Information → Display Information**: add an icon and a short description. People see these in the app's profile.

## Socket Mode

**Settings → Socket Mode** → turn on. When asked, create an **app-level token** with the scope `connections:write`. Copy it (`xapp-…`): it is `SLACK_APP_TOKEN`.

Socket Mode means the bot connects out to Slack over a WebSocket, so no public URL or open port is needed.

## Bot token scopes

**Features → OAuth & Permissions → Scopes → Bot Token Scopes**. Add all of these:

| Scope | Why |
|---|---|
| `app_mentions:read` | Receive `@assistant` mentions |
| `chat:write` | Post and update replies |
| `channels:history`, `groups:history` | Read public and private channel messages for context |
| `im:history`, `mpim:history` | Read direct and group-DM messages |
| `channels:read`, `groups:read`, `im:read`, `mpim:read` | Look up channel names for the prompt |
| `users:read` | Show names instead of IDs, and check deactivated, guest and bot accounts |
| `files:read` | Download files people attach |
| `files:write` | Upload generated files and research reports |
| `reactions:write` | 👀 / ✅ / ❌ on requests (optional; set `SLACK_REACTIONS=false` without it) |

The Home tab, the plan dialog and buttons need no extra scopes.

## Events

**Features → Event Subscriptions** → turn on. Under **Subscribe to bot events** add:

| Event | Why |
|---|---|
| `app_mention` | Mentions in channels and threads |
| `message.im` | Direct messages |
| `message.channels`, `message.groups`, `message.mpim` | Only used with `THREAD_FOLLOW=true` (answering without a mention); harmless otherwise |
| `app_home_opened` | Show the guide in the app's Home tab |

Save. With Socket Mode, no request URL is needed.

## Interactivity

**Features → Interactivity & Shortcuts** → turn on. This makes the Cancel button, the research plan buttons and the Edit plan dialog work. With Socket Mode, no request URL is needed.

## App Home

**Features → App Home → Show Tabs**:

- **Home Tab**: on. The bot draws a guide there, adapted to each person's role.
- **Messages Tab**: on, and tick **Allow users to send Slash commands and messages from the messages tab**. Without this, people can't DM the bot.

## Install

**Settings → Install App → Install to Workspace**. Approve the permissions, then copy the **Bot User OAuth Token** (`xoxb-…`): it is `SLACK_BOT_TOKEN`.

Invite the bot to each channel where people should use it:

```
/invite @assistant
```

The bot can only read channels it is a member of.

## Changing scopes later: reinstall

Adding a scope does **not** change the token you already have. After adding scopes:

1. **OAuth & Permissions** (or **Install App**) shows a banner: *reinstall your app*. Click **Reinstall to Workspace** and approve.
2. If the **Bot User OAuth Token** changed, put the new value in `.env` and restart the bot.
3. Check what the token really has:

```bash
cd /opt/pi-slack-bridge && sudo -u pi-bot node check-files.js
```

It prints the token's scopes and marks missing ones. With a file link as argument, it also tries to download that file the way the bot does:

```bash
sudo -u pi-bot node check-files.js https://yourteam.slack.com/files/U0123/F0456ABCDEF/report.pdf
```

If your workspace requires admin approval for apps, the reinstall waits for a workspace admin to approve.
