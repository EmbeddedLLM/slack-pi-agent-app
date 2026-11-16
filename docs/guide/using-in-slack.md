# Using it in Slack

A one-page guide you can share with your team. Replace `@assistant` with your bot's name.

## Ask

Mention the bot and say what you need in plain words:

```
@assistant explain the difference between the two proposals above
```

- **In a channel:** it reads the recent channel messages and replies in a thread under your message.
- **In a thread:** it reads the whole thread first.
- **In a direct message:** open the bot under *Apps* in the sidebar and type. No mention needed.

## Follow up

Reply **in the bot's thread** and mention it again:

```
@assistant make it shorter and add a table
```

It reads the thread, so you don't need to repeat yourself. A new mention in the main channel starts a fresh conversation.

## Things to try

| You want | Write |
|---|---|
| Catch up | `@assistant summarise this thread: decisions, open questions, owners` |
| A draft | `@assistant draft a friendly reply to Sam's question above` |
| Something looked up | `@assistant search the web: what's new in Kubernetes 1.34?` |
| A file read | Attach it, then `@assistant what are the three biggest risks in this?` |
| A file made | `@assistant turn this into a one-page PDF report` |
| A deep, cited report (admins) | `@assistant research <topic>` |
| To see what you can do | `@assistant help` |
| To see your access | `@assistant whoami` |

## Files

- **Reading files:** attach PDF, Word, PowerPoint, Excel, OpenDocument, HTML, text, code or images to the message where you mention the bot. Images inside documents are read too.
- **Getting files back:** ask for a PDF, Markdown, CSV or JSON file, and the bot attaches it to its reply.

Your role decides whether you can do either. `@assistant whoami` tells you.

## While it works

- **Cancel:** the reply shows *Queued* or *Thinking…* with a **Cancel** button.
- **Reactions:** 👀 means it's working, ✅ done, ❌ failed or cancelled.

## Good to know

- It can be wrong. For anything important, check the sources it links.
- Don't paste secrets (passwords, keys) into Slack. The bot removes known keys from its replies, but it can't un-send what you posted.
- In channels, everyone in the channel can see the bot's answers. Use a DM for private questions.
