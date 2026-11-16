# Development

## Repository layout

```
index.js                  the bot
list-users.js             workspace members and their roles; starter access.json
check-files.js            token scopes and file-download diagnosis
pi-extensions/
  path-guard.ts           pi extension: workspace confinement, install blocking
deploy/
  pi-slack-bot.service    systemd unit
  pi-settings.example.json        pi settings: packages, model, compaction
  pi-models.vllm.example.json     pi models.json for a self-hosted vLLM
.env.example              every setting, commented
access.example.json       access list example
test/e2e/                 end-to-end tests (fake Slack, fake pi)
docs/                     this site (VitePress)
```

`index.js` is one file on purpose, so it is easy to copy to a server and read top to bottom. Its sections, in order:

1. Config
2. Secrets and redaction
3. Job queue
4. Users and access control
5. Context
6. Uploaded files
7. Prompt
8. Running pi
9. Output formatting
10. Generated files
11. Deep research
12. Help
13. Request handling
14. Startup

## Tests

```bash
npm test
```

The end-to-end tests start `index.js` with a fake Slack client and a fake `pi` (`test/e2e/fake-pi.mjs`), then drive real handlers: mentions, DMs, buttons, the Edit plan dialog, the Home tab. They check what the bot would have sent to Slack and to pi. No network, Slack workspace or model is needed.

| Suite | Covers |
|---|---|
| `research.test.mjs` | Role checks, plan card, editing, thread replies, start, progress, report upload, follow-up tools, clarification, cancel and resume, retry when the tool isn't called |
| `help.test.mjs` | Help card per role, bare mention, no-access message, DMs, Home tab, the capability list in the prompt, one-time tips |

They need Node.js 22.15 or newer, which provides the module hooks used to swap in the fakes.

## Docs

```bash
npm run docs:dev
```

opens a local preview. `npm run docs:build` builds the static site into `docs/.vitepress/dist`. Pushing to `main` publishes it to GitHub Pages through `.github/workflows/docs.yml`. In the repository settings, set **Pages → Source** to **GitHub Actions**.

## Changing behaviour safely

- **New settings:** add them to `cfg`, to `.env.example` and to the [configuration reference](/reference/configuration).
- **Anything posted to Slack** that contains model or tool output must go through `redactSecrets` and `redactInternalPaths` (the `scrub` helper).
- **New tools for a role:** they reach pi only through the role's `tools` allowlist; never pass a tool list from user input.
- **New buttons:** check the clicker's role inside the handler, not only when the button was posted.
- **New features:** add an end-to-end test next to the existing ones.
