# Troubleshooting

Start with the logs: `sudo journalctl -u pi-slack-bot -f`. Most problems leave a named event; see [Log events](/reference/logs).

## The bot doesn't answer at all

| Check | How |
|---|---|
| Is it running and connected? | A `started` line after the last restart; `systemctl status pi-slack-bot` |
| Is it in the channel? | `/invite @assistant`. It can't see channels it isn't in. |
| Did you mention it? | In channels, it only answers mentions (unless `THREAD_FOLLOW=true`). |
| Do you have access? | `@assistant whoami`. A `none` role gets a private note. |
| Is the event subscribed? | `app_mention` (channels) and `message.im` (DMs), see [Slack app](/setup/slack-app#events). |
| DMs say "Sending messages to this app has been turned off" | App Home → Messages Tab → allow messages. |

## "I wasn't able to access the image / file"

The download failed. The reply usually says why. The common cause is that `files:read` was added but the app was not reinstalled, so the token doesn't have it yet.

```bash
cd /opt/pi-slack-bridge && sudo -u pi-bot node check-files.js
```

It lists the token's real scopes. Pass a file link to test one download. Fix: [reinstall the app](/setup/slack-app#changing-scopes-later-reinstall), update `SLACK_BOT_TOKEN` if it changed, and restart.

## Web search "gets stuck", or the reply shows `<parameter=…>` tags

The model wrote a tool call as text instead of calling the tool. The bot retries once. If you see *its tool call came back as plain text*, or `unparsed_tool_call` in the logs:

- **Self-hosted vLLM:** start it with `--enable-auto-tool-choice --tool-call-parser qwen3_coder --reasoning-parser qwen3` for Qwen3.6; other models need their own parser. See [Model](/setup/model#tool-calling).
- **Occasional failures:** lower the temperature (about 0.6) and presence penalty (0.5 to 1.0) in pi's model settings.

## Replies contain `</think>` or long reasoning

The reasoning parser is missing on the model server (`--reasoning-parser qwen3` for Qwen3.6).

## "Timed out after N minute(s)"

The request ran longer than `PI_TIMEOUT_MS`. Reports and PDFs take longer than chat; 180,000 (3 minutes) is a reasonable value. Deep research has its own `RESEARCH_TIMEOUT_MS`.

## PDF requests fail

| Message | Fix |
|---|---|
| *PDF export is not installed* | `npm ci` didn't install `md-to-pdf`. Run it again and check the output. |
| Chromium errors in the logs (`file_render_failed`) | Missing system libraries; see [Puppeteer troubleshooting](https://pptr.dev/troubleshooting). In containers, `PDF_NO_SANDBOX=true`. |
| *upload failed (the bot needs the files:write scope)* | Add `files:write` and reinstall. |

## Office files are not read

`officeparser` isn't installed. Run `npm ci --omit=dev` again and check the output.

## Deep research

| Symptom | Cause and fix |
|---|---|
| *did not finish after 5s* | drsh failed before searching; the message includes its reason. Check `research_warning` and `research_result` in the logs. |
| `research_warning: drsh not found` | The service's `PATH` doesn't include drsh. Add its folder in the unit file, or set `DRSH_BIN`. |
| Works in a terminal, fails in Slack | The service has a different `PATH`, `HOME` or user than your shell. drsh reads its keys from `$HOME/.config/deep-research/`. Run `drsh setup` as `pi-bot`. |
| *The model did not start the research tool* | The pi-deep-research package isn't installed for `pi-bot`, or tool calling is broken (see above). |
| *rate-limited* | The search provider throttled. Wait about ten minutes, then press Resume. |
| A plan card button says *no longer available* | The bot restarted (plans live in memory) or the plan is over 24 hours old. Ask again. |

To reproduce exactly what the bot runs, with the service's environment (replace `<pid>` with the bot's process ID from `pgrep -f index.js`):

```bash
cd /opt/pi-workspace && sudo -u pi-bot env -i $(sudo cat /proc/<pid>/environ | tr '\0' '\n' | grep -E '^(PATH|HOME|USER|DRSH_BIN)=') DEEP_RESEARCH_PI_RUNS=/tmp/drtest /home/pi-bot/.pi/agent/bin/pi --tools deep_research --mode json --no-session 'Call deep_research once with question "What is vLLM?" and depth "quick".' | grep tool_execution_end
```

## The bot reveals or describes configuration

It shouldn't: paths are replaced with `[internal path]`. If something slipped through:

- **A path:** add its folder to `PI_REDACT_PATHS`.
- **A key:** add the file that holds it to `PI_SECRET_FILES`.

Check that `path-guard.ts` is installed in `~/.pi/agent/extensions/`.

## Help card or Home tab missing

- **Home tab blank:** turn on App Home → **Home Tab** and subscribe to `app_home_opened`.
- **Help card:** needs no setup. If `@assistant help` runs the agent instead, the message probably had more words than the help phrases.
