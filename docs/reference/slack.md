# Slack scopes and events

## Tokens

| Token | Where | Variable |
|---|---|---|
| App-level token, scope `connections:write` | Settings → Basic Information → App-Level Tokens | `SLACK_APP_TOKEN` (`xapp-…`) |
| Bot User OAuth Token | Settings → Install App | `SLACK_BOT_TOKEN` (`xoxb-…`) |

## Bot token scopes

| Scope | Used for | Required |
|---|---|---|
| `app_mentions:read` | Mentions | Yes |
| `chat:write` | Replies, status updates, help, plan cards | Yes |
| `channels:history` | Context in public channels | Yes |
| `groups:history` | Context in private channels | If used in private channels |
| `im:history` | Direct messages | Yes, for DMs |
| `mpim:history` | Group DMs | If used in group DMs |
| `channels:read`, `groups:read`, `im:read`, `mpim:read` | Channel names in the prompt | Recommended |
| `users:read` | Names; deactivated, guest and bot checks; `list-users.js` | Yes |
| `files:read` | Reading attachments | For file reading |
| `files:write` | Generated files, research reports, long replies | For file output |
| `reactions:write` | 👀 / ✅ / ❌ | Optional |

Views (Home tab, Edit plan dialog) and buttons need no scope.

## Bot events

| Event | Used for |
|---|---|
| `app_mention` | Mentions in channels and threads |
| `message.im` | Direct messages |
| `message.channels`, `message.groups`, `message.mpim` | Answering without a mention, only with `THREAD_FOLLOW=true` |
| `app_home_opened` | The Home tab guide |

## Other settings

| Setting | Where | Why |
|---|---|---|
| Socket Mode | Settings → Socket Mode | No public URL needed |
| Interactivity | Features → Interactivity & Shortcuts | Buttons and the Edit plan dialog |
| Home Tab | Features → App Home | The guide |
| Messages Tab + allow messages | Features → App Home | Direct messages |

After adding scopes, **reinstall the app** and update `SLACK_BOT_TOKEN` if it changed. `node check-files.js` shows the scopes the token really has.

## Slack API methods the bot calls

`auth.test`, `chat.postMessage`, `chat.update`, `chat.postEphemeral`, `conversations.history`, `conversations.replies`, `conversations.info`, `users.info`, `users.list` (only `list-users.js`), `files.info` (only `check-files.js`), `files.uploadV2`, `reactions.add`, `reactions.remove`, `views.open`, `views.publish`.
