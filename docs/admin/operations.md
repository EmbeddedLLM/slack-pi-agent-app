# Operations

## Service control

| Do | Command |
|---|---|
| Status | `sudo systemctl status pi-slack-bot --no-pager` |
| Follow logs | `sudo journalctl -u pi-slack-bot -f` |
| Restart | `sudo systemctl restart pi-slack-bot` |
| Stop | `sudo systemctl stop pi-slack-bot` |

On stop or restart, the bot cancels running requests and edits their Slack messages to say so. Running research gets a Resume button.

## Logs

The bot writes one JSON object per line to standard output, so journald stores them. Filter with `grep` or `jq`:

```bash
sudo journalctl -u pi-slack-bot -o cat | jq -c 'select(.evt=="job")'
```

Every request ends with a `job` line: who, which role, where, the outcome, time spent queued and running, and prompt and reply sizes. Errors are logged with a reference (`C…:…`) that is also shown in Slack. The full list is in [Log events](/reference/logs).

Useful questions to ask of the logs:

| Question | Filter |
|---|---|
| Who used it today, how often? | `select(.evt=="job") \| .user` |
| Slow requests | `select(.evt=="job" and .runMs > 60000)` |
| Denied access | `select(.evt=="access_denied")` |
| Anything redacted | `select(.evt=="secret_redacted" or .evt=="internal_path_redacted")` |
| Tool calls written as text | `select(.evt=="unparsed_tool_call")` |
| Research outcomes | `select(.evt=="research_result")` |

## Changing access

Edit `access.json`. It is re-read on the next request, with no restart. Check the result in the logs (`access_loaded`, or `access_file_error` with the problem). See [Access control](/admin/access-control).

## Data on disk and clean-up

| Data | Where | Cleaned up |
|---|---|---|
| Uploaded files | `INPUT_FILES_DIR` | After each request; leftovers on start |
| Thread sessions | `PI_SESSION_DIR` | **Never.** Delete old files on a schedule if you need to. |
| Research reports | `RESEARCH_DIR` | Folders unused for `RESEARCH_KEEP_DAYS` days, checked daily |
| Tips seen | `HINTS_FILE` | Never (tiny) |

To delete session files older than 90 days, for example from a daily cron job:

```bash
find /home/pi-bot/slack-sessions -name '*.jsonl' -mtime +90 -delete
```

## Backups

Back up `.env`, `access.json` and pi's configuration in `/home/pi-bot/.pi/agent/`: `settings.json`, `models.json`, `auth.json`, and `extensions/`. They contain secrets, so encrypt the backup. Sessions and reports are optional.

## Upgrades

- **The bot:** `git pull`, `npm ci --omit=dev`, then restart. See [Bot and service](/setup/bot#updating).
- **pi and packages:** as `pi-bot`, update with pi's own commands. Then send one test request with each tool before telling the team.
- **The model:** a new model may need different tool-call parser flags. Run the [tool-calling checks](/setup/model#tool-calling) first.

## Capacity

- **Throughput:** each request is one pi process. Throughput is bounded by `MAX_CONCURRENT_JOBS` and by your model's speed.
- **Memory:** the bot itself is light. PDF rendering starts Chromium for a few seconds.
- **When people queue often:** raise `MAX_CONCURRENT_JOBS` if the model server has headroom. Each extra slot is one more concurrent model conversation.
