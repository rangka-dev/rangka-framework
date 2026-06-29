import { defineConfig } from 'vitepress';
import llmstxt from 'vitepress-plugin-llms';

const icon = (svg: string) =>
  `<span style="display:inline-flex;margin-right:6px;width:16px;height:16px;vertical-align:-2px;">${svg}</span>`;

const icons = {
  rocket: icon(
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>',
  ),
  database: icon(
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/></svg>',
  ),
  layout: icon(
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>',
  ),
  settings: icon(
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>',
  ),
  book: icon(
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>',
  ),
  users: icon(
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  ),
};

export default defineConfig({
  title: 'Rangka Docs',
  description: 'Rangka Framework Documentation',
  base: '/docs/',
  srcExclude: ['spec/**'],
  vite: {
    plugins: [llmstxt({ domain: 'https://rangka.app' })],
  },
  head: [['link', { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }]],
  themeConfig: {
    logo: {
      light: '/logo-light.svg',
      dark: '/logo-dark.svg',
    },
    nav: [
      { text: 'Guide', link: '/' },
      { text: 'Reference', link: '/reference/cli' },
    ],
    sidebar: {
      '/': [
        {
          text: `${icons.rocket}Getting Started`,
          items: [
            { text: 'Overview', link: '/' },
            { text: 'Your First App', link: '/guides/your-first-app' },
            { text: 'How It Works', link: '/concepts/how-it-works' },
            { text: 'Project Structure', link: '/concepts/project-structure' },
          ],
        },
        {
          text: `${icons.database}Data Layer`,
          collapsed: false,
          items: [
            { text: 'Apps', link: '/concepts/apps' },
            { text: 'Models', link: '/concepts/models' },
            { text: 'Hooks', link: '/concepts/hooks' },
            { text: 'Services', link: '/concepts/services' },
            { text: 'Jobs', link: '/concepts/jobs' },
            { text: 'Fixtures', link: '/concepts/fixtures' },
            { text: 'Permissions', link: '/concepts/permissions' },
          ],
        },
        {
          text: `${icons.layout}UI Layer`,
          collapsed: false,
          items: [
            { text: 'Widgets', link: '/concepts/widgets' },
            { text: 'Reactivity', link: '/concepts/reactivity' },
            { text: 'Pages', link: '/concepts/pages' },
            { text: 'Shell', link: '/concepts/shell' },
            { text: 'Navigation', link: '/concepts/navigation' },
            { text: 'Actions', link: '/concepts/actions' },
            { text: 'Custom Widgets', link: '/guides/custom-widgets' },
            { text: 'Fields', link: '/ui/fields' },
            { text: 'Theming', link: '/ui/theming' },
            {
              text: 'Coming From...',
              collapsed: true,
              items: [
                { text: 'Excel', link: '/concepts/coming-from-excel' },
                { text: 'jQuery', link: '/concepts/coming-from-jquery' },
                { text: 'React', link: '/concepts/coming-from-react' },
              ],
            },
          ],
        },
        {
          text: `${icons.settings}Advanced`,
          collapsed: false,
          items: [
            { text: 'Extending Models', link: '/guides/extending-models' },
            { text: 'Deployment', link: '/guides/deployment' },
          ],
        },
        {
          text: `${icons.book}Reference`,
          collapsed: false,
          items: [
            { text: 'CLI', link: '/reference/cli' },
            {
              text: 'Definitions',
              collapsed: true,
              items: [
                { text: 'defineApp', link: '/reference/define-app' },
                { text: 'defineModel', link: '/reference/define-model' },
                { text: 'definePage', link: '/reference/define-page' },
                { text: 'defineWidget', link: '/reference/define-widget' },
                { text: 'defineService', link: '/reference/define-service' },
                { text: 'defineHook', link: '/reference/define-hook' },
                { text: 'defineJob', link: '/reference/define-job' },
                { text: 'defineFixture', link: '/reference/define-fixture' },
                { text: 'defineRoles', link: '/reference/define-roles' },
                { text: 'definePlugin', link: '/reference/define-plugin' },
                { text: 'defineExternalModel', link: '/reference/define-external-model' },
              ],
            },
            {
              text: 'Widgets & Actions',
              collapsed: true,
              items: [
                { text: 'Built-in Widgets', link: '/reference/built-in-widgets' },
                { text: 'Widget Builder', link: '/reference/widget-builder' },
                { text: 'Actions', link: '/reference/actions' },
                { text: 'Reactivity', link: '/reference/reactivity' },
              ],
            },
            {
              text: 'Data',
              collapsed: true,
              items: [
                { text: 'Data API', link: '/reference/data-api' },
                { text: 'Data Access', link: '/reference/data-access' },
                { text: 'Meta API', link: '/reference/meta-api' },
              ],
            },
          ],
        },
        {
          text: `${icons.users}Contributing`,
          collapsed: true,
          items: [
            { text: 'Development', link: '/contributing/development' },
            { text: 'Architecture', link: '/contributing/architecture' },
            { text: 'Widget System', link: '/architecture/widget-system' },
            { text: 'Project Structure', link: '/contributing/project-structure' },
            { text: 'Custom Widget Build', link: '/contributing/custom-widget-build' },
          ],
        },
      ],
    },
    socialLinks: [{ icon: 'github', link: 'https://github.com/rangka-dev/rangka-framework' }],
    search: {
      provider: 'local',
    },
  },
});
