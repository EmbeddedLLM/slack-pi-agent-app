# Log events

Each line is a JSON object with `t` (time), `evt` (the event name) and event-specific fields. Prompts and answers are **not** logged, only their sizes.

## Requests

| Event | When | Fields |
|---|---|---|
| `job` | Every request, research plan and research run ends | `id`, `user`, `role` or `kind`, `channel`, `outcome` (`ok`, `cancelled`, `error`, `clarify`, …), `queuedMs`, `runMs`, `promptChars`, `replyChars` |
| `input_files` | Attachments were prepared | `id`, `files` (name, kind, images, error) |
| `input_file_failed` | One attachment could not be read | `file`, `error` |
| `files` | Generated files were attached | `id`, `names` |
| `files_blocked` | The role may not receive files | `id`, `user`, `role` |
| `unparsed_tool_call` | The model wrote a tool call as text | `id`, `attempt` (1 = retried, 2 = gave up), `tool`, `sample` |
| `session_restore_failed` | A thread session could not be rolled back before a retry | `error` |

## Access

| Event | When | Fields |
|---|---|---|
| `access_loaded` | `access.json` was (re)read | `file`, `users`, `defaultRole` |
| `access_file_error` | `access.json` is broken or unreadable | `error`, `using` (last good version, or deny everyone) |
| `access_warning` | Started without `ACCESS_FILE` | `message` |
| `access_denied` | Someone without access asked | `user`, `channel`, `why` |
| `access_revoked` | Access was removed while a request was queued | `id`, `user`, `why` |

## Safety

| Event | When | Fields |
|---|---|---|
| `secret_redacted` | A key value was removed from a reply | `id`, `user`, `channel`, `count` |
| `internal_path_redacted` | Internal paths or tool-call tags were removed | `id`, `user`, `channel`, `count` |
| `secret_file_unreadable` | A file in `PI_SECRET_FILES` could not be read (its values can't be redacted) | `file`, `error` |

## Deep research

| Event | When | Fields |
|---|---|---|
| `research_drsh` / `research_warning` | At start: drsh found, or not found on `PATH` | `drsh` or `message`, `PATH`, `HOME` |
| `research_plan` | A plan card was posted | `id`, `plan`, `user`, `depth`, `questions`, `parsed` |
| `research_plan_unparsed` | The model's plan wasn't valid JSON; a basic plan was used | `id`, `sample` |
| `research_start` / `research_resume` | A run was started / resumed | `plan`, `user`, `depth` |
| `research_tool_not_called` | The model didn't call `deep_research`; retrying | `id`, `sample` |
| `research_result` | The tool returned | `id`, `state`, `isError`, `stage`, `text` (the tool's message, without the report) |
| `research_dir_removed` | An old thread folder was deleted | `dir` |

## Help

| Event | When | Fields |
|---|---|---|
| `help` | The help card was shown | `user`, `role` |
| `help_failed`, `home_publish_failed` | Slack rejected the card or Home tab | `error` |
| `hints_save_failed` | `HINTS_FILE` could not be written | `error` |

## Slack and lifecycle

| Event | When |
|---|---|
| `started` | Connected; includes the main settings |
| `shutdown` | Stopping; `inFlight` requests were cancelled |
| `status_update_failed`, `plan_card_update_failed`, `views_open_failed` | Slack rejected an update (`error`) |
| `file_render_failed`, `file_upload_failed` | A generated file could not be made or uploaded |
| `reactions_disabled` | No `reactions:write` scope; reactions turned off |
| `pi_event_handler_failed` | Bug guard while reading pi's event stream |

Errors with stack traces are written to standard error with the prefix `[slack-pi-error]` and the request reference.
