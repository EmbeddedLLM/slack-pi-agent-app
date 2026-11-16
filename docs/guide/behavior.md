# How it behaves

This page explains the rules the bot follows: when it answers, what it reads, what it remembers, and how answers look.

## When it answers

| Where | Answers when |
|---|---|
| Channel or thread | Someone mentions it: `@assistant …` |
| Direct message | Every message (no mention needed) |
| A thread it already answered in | Only when mentioned again, by default. Set `THREAD_FOLLOW=true` to answer every message there, without a mention, for `THREAD_FOLLOW_TTL_HOURS` after its last answer. |

The bot always replies **in a thread**: under your message if you asked in the channel, or in the same thread if you asked in one.

A mention with nothing after it, or `help`, `hi`, `what can you do`, shows the [help card](/features/help) instead of running the agent.

## What it reads

| Where you ask | What the bot reads |
|---|---|
| **Main channel** | The last `HISTORY_LIMIT` top-level messages (default 50). Thread replies are not included, only each thread's first message and replies also sent to the channel. |
| **In a thread** | The whole thread, oldest to newest. The thread's first message is always kept. |
| **In a DM** | The recent messages of the DM, or the thread if you reply in one. |

The history is trimmed newest-first to fit `CONTEXT_CHAR_BUDGET` characters (default 24,000), and each message to `PER_MESSAGE_CHAR_LIMIT` (default 3,000). The thread's first message has its own 1,500-character cap.

::: tip Sizing for a large model
For a model with a 256k-token window, `HISTORY_LIMIT=100`, `CONTEXT_CHAR_BUDGET=60000`, `PER_MESSAGE_CHAR_LIMIT=6000` and `ATTACHMENT_CHAR_BUDGET=80000` use roughly a fifth of the window at the start of a request. The rest is left for tool results, thinking and the answer. For mostly Chinese, Japanese or Korean text, or lots of pasted code, halve the two budgets.
:::

The bot also reads:

- **Files** attached to your message, and the newest files posted in the thread, up to `MAX_INPUT_FILES`. Files shared in the main channel, outside your message, are not read. See [Files in and out](/features/files).
- **Names, not IDs.** User and channel mentions are turned into readable names.

Text from Slack and from files is wrapped in labelled blocks, and the model is told it is background material that may contain instructions it must not follow.

## Memory per thread

Without sessions, every request starts from scratch, and the Slack history is the only memory.

With `PI_SESSION_DIR` set, each Slack thread gets its own pi session file:

- **Session file name:** the channel ID plus the thread's timestamp. A question in the main channel starts a new thread, and so a new session.
- **Follow-ups:** in that thread, the session already holds the earlier conversation, including what the bot read the first time. The bot then sends only the messages posted since its last answer.
- **Separate questions:** two questions asked in the main channel never share memory, because each starts its own thread.
- **Long threads:** pi [compacts](/setup/model#compaction) the session when it nears the context window. It summarises older turns and keeps recent ones word for word.
- **Disk:** session files stay on disk until you delete them. Each is small, but it contains the conversation text.

To keep a conversation going, reply in the bot's thread instead of mentioning it again in the main channel.

## While it works

1. A 👀 reaction on your message, and a reply placeholder with a **Cancel** button.
2. The placeholder shows *Queued (position N)* when all slots are busy, then *Reading the conversation…*, *Reading 2 file(s)…*, *Thinking…* and the elapsed time.
3. The placeholder is replaced with the answer. Very long answers continue in further messages, or are attached as `reply.md` above `REPLY_FILE_THRESHOLD` characters.
4. ✅ on success, ❌ on failure or cancel.

Cancel works for the person who asked and for roles with `cancelAny` (admins by default).

## How answers look

The model writes ordinary Markdown. The bot converts it to Slack's own format, so formatting doesn't depend on the model remembering Slack's rules:

- Headings, **bold**, *italic*, ~~strike~~, links, lists and quotes become Slack formatting.
- Tables become aligned code blocks, or bullet lists when they are too wide.
- Code blocks are kept, and closed and reopened if an answer is split.
- Raw HTML from the model is shown as text, never rendered.

`SLACK_MARKDOWN_BLOCKS=true` uses Slack's newer markdown block instead, with an automatic fallback.

## When the model writes a tool call as text

Some models, or model servers without the right tool-call parser, sometimes write a tool call into the answer instead of making it, for example `<web_search_exa><parameter=query>…`. The bot detects this:

1. It removes that attempt from the thread's session, so the model doesn't copy it later.
2. It retries once with a short note.
3. If the retry fails too, it says so clearly in Slack, instead of posting the raw tags, and logs `unparsed_tool_call`.

Tool-call text in old Slack messages is also replaced with `[tool call omitted]` before it reaches the model. The fix on the model server is in [Model setup](/setup/model#tool-calling).

## Errors you may see

| Message | Meaning |
|---|---|
| *Sorry, you don't have access to this assistant yet…* | Your role is `none`. Only you see this. |
| *You already have N request(s) running or queued* | Per-person limit reached. |
| *Timed out after N minute(s).* | The request ran longer than `PI_TIMEOUT_MS`. |
| *Your access to the assistant was removed…* | Your role changed while the request was queued. |
| *Something went wrong running the agent (ref `C…:…`)* | Anything else. Admins find details in the logs under that reference. |
