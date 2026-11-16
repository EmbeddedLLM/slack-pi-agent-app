---
layout: home

hero:
  name: Slack Pi Agent
  text: Your team's AI assistant, inside Slack, on your own server
  tagline: A multi-user Slack bot powered by the pi coding agent, with role-based access, file reading and generation, cited deep research, and protection for your API keys.
  actions:
    - theme: brand
      text: Quick start
      link: /guide/quick-start
    - theme: alt
      text: How it works
      link: /guide/architecture
    - theme: alt
      text: What it costs
      link: /costs

features:
  - icon: 💬
    title: Works where your team talks
    details: Mention the bot in any channel or thread, or message it directly. It reads the thread or the recent channel messages, so nobody has to repeat themselves.
  - icon: 🔐
    title: Role-based access
    details: An access list decides who can use the bot and what each role (viewer, member, admin) may do, per person and per channel. It is checked on every request, and edits apply immediately.
  - icon: 🛡️
    title: Keys stay secret
    details: Slack tokens never reach the agent. A path guard keeps its file tools inside a workspace, secret values and internal paths are scrubbed from every reply, and runtime package installs are blocked.
  - icon: 📎
    title: Reads and writes files
    details: People attach PDF, Word, PowerPoint, Excel, HTML, text or images. The bot sends back PDF, Markdown, CSV or JSON files.
  - icon: 🔎
    title: Deep research
    details: For admins, a cited and fact-checked report. They review and edit a plan first, watch live progress, and can resume after a stop.
  - icon: 🖥️
    title: Self-hosted
    details: Runs over Slack Socket Mode, so the server needs no public address or open ports. Use a hosted model API, or your own GPU with vLLM.
---
