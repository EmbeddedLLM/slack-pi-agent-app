import { defineConfig } from 'vitepress';
import { withMermaid } from 'vitepress-plugin-mermaid';

// Served from https://embeddedllm.github.io/slack-pi-agent-app/
export default withMermaid(
  defineConfig({
    title: 'Slack Pi Agent',
    description: 'A self-hosted, multi-user AI assistant for Slack, powered by the pi coding agent.',
    base: '/slack-pi-agent-app/',
    lang: 'en-US',
    cleanUrls: true,
    lastUpdated: true,
    head: [['meta', { name: 'theme-color', content: '#4a154b' }]],
    themeConfig: {
      nav: [
        { text: 'Guide', link: '/guide/introduction' },
        { text: 'Setup', link: '/setup/' },
        { text: 'Reference', link: '/reference/configuration' },
        { text: 'Costs', link: '/costs' },
      ],
      sidebar: [
        {
          text: 'Guide',
          items: [
            { text: 'Introduction', link: '/guide/introduction' },
            { text: 'Quick start', link: '/guide/quick-start' },
            { text: 'Architecture', link: '/guide/architecture' },
            { text: 'How it behaves', link: '/guide/behavior' },
            { text: 'Using it in Slack', link: '/guide/using-in-slack' },
          ],
        },
        {
          text: 'Setup',
          items: [
            { text: 'Overview', link: '/setup/' },
            { text: '1. Slack app', link: '/setup/slack-app' },
            { text: '2. Server and pi', link: '/setup/server' },
            { text: '3. Model', link: '/setup/model' },
            { text: '4. Bot and service', link: '/setup/bot' },
            { text: '5. Deep research (optional)', link: '/setup/deep-research' },
          ],
        },
        {
          text: 'Features',
          items: [
            { text: 'Files in and out', link: '/features/files' },
            { text: 'Deep research', link: '/features/deep-research' },
            { text: 'Help and onboarding', link: '/features/help' },
          ],
        },
        {
          text: 'Administration',
          items: [
            { text: 'Access control (RBAC)', link: '/admin/access-control' },
            { text: 'Security model', link: '/admin/security' },
            { text: 'Operations', link: '/admin/operations' },
            { text: 'Troubleshooting', link: '/admin/troubleshooting' },
          ],
        },
        {
          text: 'Reference',
          items: [
            { text: 'Configuration (.env)', link: '/reference/configuration' },
            { text: 'access.json', link: '/reference/access-json' },
            { text: 'Slack scopes and events', link: '/reference/slack' },
            { text: 'Log events', link: '/reference/logs' },
          ],
        },
        { text: 'Costs', link: '/costs' },
        { text: 'Development', link: '/development' },
      ],
      socialLinks: [{ icon: 'github', link: 'https://github.com/EmbeddedLLM/slack-pi-agent-app' }],
      editLink: {
        pattern: 'https://github.com/EmbeddedLLM/slack-pi-agent-app/edit/main/docs/:path',
        text: 'Edit this page on GitHub',
      },
      search: { provider: 'local' },
      outline: { level: [2, 3] },
      footer: { message: 'Self-hosted Slack assistant built on the pi coding agent.' },
    },
    mermaid: { theme: 'neutral' },
  })
);
