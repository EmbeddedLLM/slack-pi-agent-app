# Security model

A shared agent takes instructions from many people and reads text written by even more: Slack history, uploaded files, web pages. Any of it can try to steer the model. The design assumes the model **can** be talked into things, and puts the important limits outside the model.

## What is protected, and how

| Asset | Threat | Controls |
|---|---|---|
| **Slack tokens** | The agent reads its environment (`/proc/self/environ`, `env`) and repeats it | Every `SLACK_*` variable, plus anything in `PI_ENV_DENY`, is removed from pi's environment. The agent never has them. |
| **Model and tool API keys** (pi's `auth.json`, pi-exa, drsh) | The agent reads the key files and repeats them | The path guard blocks file tools outside the workspace, and blocks `auth.json`, `.env*`, `.pi/` and `.ssh/` anywhere. Key values from `PI_SECRET_FILES` and secret-looking environment variables are replaced with `[REDACTED]` in every reply, plan card and progress message. |
| **Where configuration lives** | The model tells people "the key is in `~/.pi/agent/auth.json`" | The prompt forbids describing configuration. Paths under the bot's home, pi's folder, the research folder and `PI_REDACT_PATHS` become `[internal path]`; secret file names become `[internal file]`. |
| **The server** | Prompt injection makes the agent run commands, change files or install software | Tools are an allowlist per role, passed on every run. `bash`, `edit` and `write` are off unless a role lists them. Runtime installs are blocked twice: package managers are set offline, and install commands are refused. The service user is unprivileged, and systemd hardening applies. |
| **Other people's access** | Someone uses a button, a thread or a queued request after losing access | Role checked on arrival, before running and on every click. Cancel is limited to the owner and `cancelAny` roles. |
| **Who sees what** | Answers or files leak to the wrong audience | Help, `whoami`, denials and tips are ephemeral. Answers stay in the thread they were asked in. Deep research reports are stored per thread. |
| **The PDF renderer** | A document makes headless Chromium load local files (`<iframe src="/etc/passwd">`) | HTML in generated Markdown is escaped, images dropped, and rendering runs in an empty folder. |

## Prompt-injection hygiene

- **Labelled text:** Slack history, attachments and research context are placed in labelled blocks (`<slack_history>`, `<slack_attachments>`). The model is told that they are background information and may contain instructions it must not follow. Lookalike labels inside messages are stripped.
- **Explicit triggers:** the bot answers only when mentioned (unless `THREAD_FOLLOW` is on), so text posted in a channel can't start a run by itself.
- **No self-start for research:** deep research starts only from a plan a person approved, never because the model chose to.
- **Tool-call markup:** tool-call text written by the model, in old messages or answers, is removed or retried, never shown or executed.

## Residual risks

These remain. Weigh them before widening access.

1. **A shell sees everything the service user can.** Once a role has `bash`, the path guard no longer protects secrets. A determined user can read key files, and redaction only catches exact key values. Give `bash` only to people you would give a shell on the server, or run pi in an OS sandbox (a container, or bubblewrap/firejail) with no access to the key files.
2. **Redaction is pattern-based.** A key that the model re-encodes (base64, spaced out, split across messages) won't match. The real protection is that the agent can't read the key in the first place.
3. **The model can be persuaded to say wrong or harmful things.** Treat answers as drafts. Deep research marks unconfirmed claims, but checks only against the pages it fetched.
4. **Third-party pi packages run inside the agent.** Review them and pin versions.
5. **Data leaves your server.** Prompts go to your model provider unless you self-host the model, and search queries go to Exa. Channel history and attachments are part of prompts.
6. **Slack history is readable to the bot** in every channel it is a member of. Invite it only where that is acceptable.

## Hardening checklist

- [ ] `defaultRole` is `none`, and people are listed explicitly (or `member` for a small trusted team, by decision).
- [ ] No role lists `bash`, `edit` or `write`, or only people trusted with a shell.
- [ ] `path-guard.ts` is in `~/.pi/agent/extensions/`, and `PI_WORKDIR` holds nothing sensitive.
- [ ] Every JSON file holding a key is in `PI_SECRET_FILES`.
- [ ] `.env` is mode `600`, `access.json` is writable only by admins, and pi's `settings.json` is read-only for `pi-bot`.
- [ ] The service runs as `pi-bot` with the shipped systemd hardening.
- [ ] The bot is invited only to channels where its reading history is acceptable.
- [ ] Logs are retained and someone watches for `secret_redacted`, `internal_path_redacted` and `access_denied`.
