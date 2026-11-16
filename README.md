# Slack Pi Agent

A self-hosted, multi-user AI assistant for Slack, powered by the [pi](https://pi.dev) coding agent.

Mention it in any channel or thread, or message it directly. It reads the conversation and any attached files, can search the web, sends back PDFs and other files, and, for admins, runs cited deep research with a plan you approve first. Who can do what is set in one access list.

**Documentation: https://embeddedllm.github.io/slack-pi-agent-app/**

## Features

- **Works in channels, threads and DMs.** It reads the thread or the recent channel messages, and remembers each thread (optional).
- **Role-based access.** Roles are `none`, `viewer`, `member` and `admin`, set per person and capped per channel. Access is checked on every request and click, and edits apply without a restart.
- **Files in:** PDF, Word, PowerPoint, Excel, OpenDocument, HTML, text and images (for multimodal models).
- **Files out:** PDF, Markdown, CSV and JSON.
- **Deep research:** a plan card, live progress, cancel and resume, the report as PDF and Markdown, and follow-up questions answered from the pages it read.
- **Secrets stay secret:** Slack tokens never reach the agent, file tools are confined to one workspace, keys and internal paths are scrubbed from replies, and runtime package installs are blocked.
- **Self-hosted over Socket Mode.** No public URL or open port. Use a hosted model API or your own vLLM server.
- **Guidance built in:** a help card, a Home tab guide, and one-time tips, each showing only what that person can do.

## Quick start

```bash
git clone https://github.com/EmbeddedLLM/slack-pi-agent-app.git /opt/pi-slack-bridge
```

```bash
cd /opt/pi-slack-bridge && npm ci --omit=dev && cp .env.example .env
```

Then follow the [Quick start](https://embeddedllm.github.io/slack-pi-agent-app/guide/quick-start): create the Slack app, install pi, connect a model, write `access.json`, and install the systemd service.

## What it costs

The code is free. A small team using a hosted model API typically spends **about $25 – $210 a month**: server, model tokens and web search. Self-hosting the model on a rented GPU costs **about $1,750 – $1,950 a month**. See [Costs](https://embeddedllm.github.io/slack-pi-agent-app/costs) for the breakdown, sources and assumptions.

## Repository

| Path | What |
|---|---|
| `index.js` | The bot |
| `list-users.js`, `check-files.js` | Admin helpers |
| `pi-extensions/path-guard.ts` | pi extension that confines file tools and blocks installs |
| `deploy/` | systemd unit, pi settings examples |
| `.env.example`, `access.example.json` | Configuration templates |
| `test/e2e/` | End-to-end tests (`npm test`) |
| `docs/` | Documentation site (`npm run docs:dev`) |

## Requirements

- Linux with Node.js 22.15 or newer
- pi (`@earendil-works/pi-coding-agent`)
- A model with tool calling (reference: `Qwen/Qwen3.6-35B-A3B`)
- A Slack workspace where you can install apps
