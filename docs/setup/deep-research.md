# 5. Deep research (optional)

Deep research uses the [pi-deep-research](https://pi.dev/packages/@juanhuttemann/pi-deep-research) package, which runs the `drsh` research program on pi's own model. Only roles with `deepResearch: true` can use it (admin by default). How it looks in Slack: [Deep research](/features/deep-research).

Do every step **as `pi-bot`**: drsh keeps its settings and keys in the home folder of whoever runs it.

## 1. Install drsh

The project's installer downloads and runs a script. Read it before running it:

```bash
sudo -u pi-bot -i sh -c 'curl -fsSL https://raw.githubusercontent.com/juanhuttemann/deep-research/main/scripts/install.sh -o ~/drsh-install.sh'
```

```bash
sudo -u pi-bot -i less ~/drsh-install.sh
```

```bash
sudo -u pi-bot -i bash ~/drsh-install.sh
```

drsh 0.30 or newer is required. Note where it was installed:

```bash
sudo -u pi-bot -i sh -c 'command -v drsh; drsh --version'
```

The bot's systemd service must find it. Either the folder (often `/home/pi-bot/.local/bin`) is on the `PATH` in `deploy/pi-slack-bot.service`, or set `DRSH_BIN` in `.env` to the full path.

## 2. Choose a search provider

drsh works with a SearXNG server without a key, or with hosted providers. We recommend [Exa](https://exa.ai), which returns each result's page text:

```bash
sudo -u pi-bot -i drsh setup search
```

Optionally use Exa to read pages too:

```bash
sudo -u pi-bot -i drsh setup scraper
```

drsh stores keys in `/home/pi-bot/.config/deep-research/auth.json`. Add that file to `PI_SECRET_FILES` in `.env`, so its values are scrubbed from replies.

## 3. Install the pi package

```bash
sudo -u pi-bot -i /home/pi-bot/.pi/agent/bin/pi install npm:@juanhuttemann/pi-deep-research
```

## 4. Check it

`drsh doctor` sends one cheap request each to the model, search and scraper:

```bash
sudo -u pi-bot -i drsh doctor
```

When run through pi, drsh uses pi's model instead of its own, so a failing model check here is fine. To test the whole chain, start `pi` as `pi-bot` in `/opt/pi-workspace` and run `/research-doctor`.

## 5. Bot settings

In `.env`:

```ini
RESEARCH_TIMEOUT_MS=3600000
RESEARCH_MAX_CONCURRENT=1
RESEARCH_KEEP_DAYS=30
# DRSH_BIN=/home/pi-bot/.local/bin/drsh
PI_SECRET_FILES=...,/home/pi-bot/.config/deep-research/auth.json
```

Don't add `deep_research` or `research_ask` to `PI_TOOLS` or to roles' tools. The bot adds them only where they belong: `deep_research` for an approved plan, `research_ask` for follow-ups in a thread that has a report.

Restart the bot. On start it logs `research_drsh` with the path it found, or `research_warning` if drsh can't be found.

## 6. Give more roles access (optional)

In `access.json`:

```json
{
  "roles": {
    "member": { "deepResearch": true }
  }
}
```
