# Help and onboarding

People can't use a feature they don't know exists. The bot explains itself in four places, and each shows only what that person's role allows.

## The help card

Opens with any of:

```
@assistant help
@assistant what can you do?
@assistant hi
@assistant
```

In a DM, `help` or `hi` is enough.

- **In channels:** only the person who asked sees it (an ephemeral message).
- **In DMs:** a normal message, worded for DMs.
- **Doesn't run the agent:** it is instant and costs nothing.

**Contents:**

- One section per thing the person can do, each with a ready-to-copy example: ask anything, search the web, read files, make files, deep research with its `research <topic>` command, workspace tools.
- Tips: how to follow up in a thread, the Cancel button, `whoami`.
- Their role.

**People without access** see how to get it, with their member ID to send to an admin.

## The Home tab

Opening the app in Slack's sidebar shows the same guide in its **Home** tab. Admins also see a five-step *How deep research works* section. It needs the Home tab turned on and the `app_home_opened` event; see [Slack app](/setup/slack-app#app-home).

## Answers about itself

Every request tells the model what this person can do. That way, questions in other words get correct answers: "can you read Excel files?", "can you make a PDF?", "how do I start deep research?". The model is told not to offer anything else, and that it can't start deep research itself.

## One-time tips

Small private notes after an answer:

| When | Tip | How often |
|---|---|---|
| Someone's first answer | *First time here? `@assistant help` shows everything I can do for you.* | Once per person |
| An admin asks for an "in-depth", "deep dive", "comprehensive report" or "compare … alternatives" without the research command | *For a cited, fact-checked report on this, try `@assistant research <your question>`.* | At most twice per person |

Which tips each person has seen is saved in `HINTS_FILE`, so they don't come back after a restart.

## `whoami`

`@assistant whoami` shows, privately, the person's member ID, role, why they have it, their tools, whether they can share and receive files, use deep research, and how many requests they may run at once.

## The bot's name in examples

Examples use the bot's Slack username. If people know it by another name, set `BOT_DISPLAY_NAME` in `.env`.
