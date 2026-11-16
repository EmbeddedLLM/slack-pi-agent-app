# Setup overview

Setting up has five parts. Do them in order. The [Quick start](/guide/quick-start) covers the same ground in short form.

| Step | What you do | Where | Time |
|---|---|---|---|
| [1. Slack app](/setup/slack-app) | Create the app, scopes, events, tokens | api.slack.com | 20 min |
| [2. Server and pi](/setup/server) | Service user, folders, pi, pi packages, path guard | Linux server | 15 min |
| [3. Model](/setup/model) | Connect pi to a model that can call tools | TokenVisor, or your vLLM server | 10 min to hours |
| [4. Bot and service](/setup/bot) | Install this repo, `.env`, `access.json`, systemd | Linux server | 15 min |
| [5. Deep research](/setup/deep-research) | Optional: drsh, Exa, the research package | Linux server | 15 min |

## Before you start

You need:

- **Slack:** permission to create and install apps in the workspace. On Slack's free plan an app counts toward the 10-app limit; see [Costs](/costs#slack).
- **A Linux server** with outbound internet access, Node.js 22.15 or newer, and `git`. It needs no inbound access: Socket Mode connects out to Slack. 2 vCPU and 4 GB RAM is enough for the bot itself. PDF output starts a headless Chromium, which wants the extra memory.
- **A model** that supports tool calling, ideally one that can also read images. Running it yourself needs a GPU server; see [Model](/setup/model) and [Costs](/costs#the-model).
- **Optionally, an [Exa](https://exa.ai) API key** for web search and deep research.

## Conventions used in these pages

| Name | Value |
|---|---|
| Service user | `pi-bot` (home `/home/pi-bot`) |
| Bot code | `/opt/pi-slack-bridge` |
| Agent workspace | `/opt/pi-workspace` |
| pi binary | `/home/pi-bot/.pi/agent/bin/pi` |
| systemd unit | `pi-slack-bot` |

If you change any of these, change them in `.env` and `deploy/pi-slack-bot.service` too.
