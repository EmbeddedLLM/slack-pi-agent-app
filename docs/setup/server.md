# 2. Server and pi

## A dedicated service user

Run everything as an unprivileged user, so the agent can't touch your own account, SSH keys or other people's files:

```bash
sudo useradd -r -m -s /bin/bash pi-bot
```

```bash
sudo mkdir -p /opt/pi-slack-bridge /opt/pi-workspace && sudo chown -R pi-bot:pi-bot /opt/pi-slack-bridge /opt/pi-workspace
```

`/opt/pi-workspace` is the only folder the agent's file tools may use. Put shared documents there if you want the agent to read them.

## Node.js

The bot needs Node.js 22.15 or newer. Check with `node --version`. Install it from your distribution or [nodejs.org](https://nodejs.org).

## pi

Install pi for `pi-bot` only:

```bash
sudo -u pi-bot HOME=/home/pi-bot npm install -g @earendil-works/pi-coding-agent --prefix /home/pi-bot/.pi/agent
```

The binary is now `/home/pi-bot/.pi/agent/bin/pi`, which is `PI_BIN` in `.env`. Check it:

```bash
sudo -u pi-bot -i /home/pi-bot/.pi/agent/bin/pi --version
```

## pi packages

Install the packages you want, **as `pi-bot`**, so they land in its settings:

| Package | Gives | Install |
|---|---|---|
| [pi-exa](https://www.npmjs.com/package/pi-exa) | `web_search_exa`, `deep_search_exa`, `web_fetch_exa` | `pi install npm:pi-exa` |
| [tokenvisor-pi](https://github.com/EmbeddedLLM/tokenvisor-pi) | The `TokenVisor` model provider | `pi install git:github.com/EmbeddedLLM/tokenvisor-pi` |
| [pi-token-speed](https://www.npmjs.com/package/pi-token-speed) | Token speed statistics (optional) | `pi install npm:pi-token-speed` |
| [pi-deep-research](https://pi.dev/packages/@juanhuttemann/pi-deep-research) | `deep_research`, `research_ask` | see [Deep research setup](/setup/deep-research) |

Run each as:

```bash
sudo -u pi-bot -i /home/pi-bot/.pi/agent/bin/pi install npm:pi-exa
```

Packages are loaded for every pi run, but the bot passes a `--tools` allowlist each time, so a person only gets the tools their role allows.

::: warning Review third-party packages
pi packages run code inside the agent. Read a package's source before installing it, and prefer pinned versions.
:::

## The path guard

This repository ships a pi extension that keeps file tools inside the workspace and blocks runtime installs. Install it once:

```bash
sudo -u pi-bot mkdir -p /home/pi-bot/.pi/agent/extensions
```

```bash
sudo -u pi-bot cp /opt/pi-slack-bridge/pi-extensions/path-guard.ts /home/pi-bot/.pi/agent/extensions/
```

pi discovers it automatically. What it does:

- `read`, `ls`, `grep`, `find`, `edit`, `write`: any path that resolves, after following symlinks, outside `/opt/pi-workspace` (and the current request's upload folder) is blocked. So are `.env*`, `auth.json`, `.pi/`, `.ssh/`, `.netrc`, `.npmrc` and `.pypirc` inside it.
- `bash`: blocked, unless the person's role includes `bash`. Even then, package installs (`npm install`, `npx`, `pip install`, `uv`, `apt`, `brew`, `cargo`, `go install`, `curl … | sh`, `pi install`, and more) are blocked.

A shell can read anything `pi-bot` can, so once a role has `bash`, the guard no longer protects secrets. Give `bash` only to people you would give a shell on the server. See the [security model](/admin/security).

## Lock down pi's configuration (recommended)

Make pi's settings readable but not writable by the agent:

```bash
sudo chown root:pi-bot /home/pi-bot/.pi/agent/settings.json && sudo chmod 640 /home/pi-bot/.pi/agent/settings.json
```

Keep `auth.json`, which holds provider keys, private to `pi-bot`:

```bash
sudo chmod 600 /home/pi-bot/.pi/agent/auth.json
```

If a provider refreshes its login tokens, pi must be able to write `auth.json`, so don't make that one read-only. After locking `settings.json`, installing a package needs `sudo` to edit it.
