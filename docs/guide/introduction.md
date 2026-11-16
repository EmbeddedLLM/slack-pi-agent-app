# Introduction

Slack Pi Agent connects Slack to [pi](https://pi.dev), an open-source coding agent that runs as a command-line program. People talk to the bot in Slack; for each request, the bot starts pi on your server, gives it the conversation and any attached files, and posts pi's answer back to Slack.

It is built for a small or medium team that wants one shared assistant, running on infrastructure it controls, without giving every member their own AI tooling.

## What people can do with it

| Ask for | Example |
|---|---|
| Answers, writing, summaries | `@assistant summarise this thread and list the open decisions` |
| Web search with sources | `@assistant what changed in the latest vLLM release?` |
| Reading attached files | `@assistant what are the key risks in this deck?` (with a `.pptx` attached) |
| Files back | `@assistant turn this thread into a one-page PDF summary` |
| Deep research (admins) | `@assistant research open-source vector databases for RAG in 2026` |
| A guide to all of this | `@assistant help` |

What each person can do depends on their [role](/admin/access-control).

## What makes it safe to share

A shared agent is an attractive target: anyone in the workspace can type instructions into it, and those instructions arrive mixed with messages from other people. The bot is designed around that:

- **Least privilege.** Unlisted people get no access by default. Roles only add what they need, for example a viewer gets read-only tools.
- **Checked continuously.** Access is checked when a request arrives, again just before the agent runs, and on every button click. Removing someone from the access list takes effect on their next action.
- **Secrets never reach the agent.** Slack tokens are stripped from its environment. A pi extension keeps file tools inside one workspace folder. Every reply is scrubbed of key values and of paths that reveal where configuration lives.
- **Untrusted text stays untrusted.** Slack history and attached files are labelled as background material, and the model is told not to follow instructions inside them.

See the [security model](/admin/security) for the details and the remaining risks.

## Components

| Piece | What it is |
|---|---|
| **The bot** (`index.js`) | A Node.js process using Slack's Bolt SDK in Socket Mode. It owns access control, the job queue, context building, formatting, files and the deep-research workflow. |
| **pi** | The agent. The bot runs it once per request in non-interactive mode. |
| **pi packages** | Optional extras installed into pi: [pi-exa](https://www.npmjs.com/package/pi-exa) for web search, [tokenvisor-pi](https://github.com/EmbeddedLLM/tokenvisor-pi) for models served through TokenVisor, and [pi-deep-research](https://pi.dev/packages/@juanhuttemann/pi-deep-research) for deep research. |
| **path-guard** (`pi-extensions/path-guard.ts`) | A small pi extension shipped in this repo that confines file tools and blocks installs. |
| **A model** | Any model pi supports. The reference setup uses `Qwen/Qwen3.6-35B-A3B`, served through TokenVisor or a self-hosted vLLM, which can also read images. |

## Where to go next

- [Quick start](/guide/quick-start): the shortest path to a working bot.
- [Architecture](/guide/architecture): how a request flows through the system.
- [Costs](/costs): what it takes to run, in money and time.
