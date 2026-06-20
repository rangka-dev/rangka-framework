import { defineConfig } from 'vitepress';
import llmstxt from 'vitepress-plugin-llms';

export default defineConfig({
  title: 'Rangka',
  description: 'Rangka Framework Documentation',
  srcExclude: ['spec/**'],
  vite: {
    plugins: [llmstxt()],
  },
  themeConfig: {
    nav: [
      { text: 'Guide', link: '/introduction' },
      { text: 'Reference', link: '/reference/cli' },
    ],
    sidebar: {
      '/': [
        {
          text: 'Getting Started',
          items: [
            { text: 'Overview', link: '/introduction' },
            { text: 'Your First Module', link: '/guides/your-first-module' },
            { text: 'How It Works', link: '/concepts/how-it-works' },
            { text: 'Project Structure', link: '/concepts/project-structure' },
          ],
        },
        {
          text: 'Data Layer',
          collapsed: false,
          items: [
            { text: 'Modules', link: '/concepts/modules' },
            { text: 'Models', link: '/concepts/models' },
            { text: 'Hooks', link: '/concepts/hooks' },
            { text: 'Services', link: '/concepts/services' },
            { text: 'Jobs', link: '/concepts/jobs' },
            { text: 'Fixtures', link: '/concepts/fixtures' },
            { text: 'Permissions', link: '/concepts/permissions' },
          ],
        },
        {
          text: 'UI Layer',
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
          text: 'Advanced',
          collapsed: false,
          items: [
            { text: 'Extending Models', link: '/guides/extending-models' },
            { text: 'Deployment', link: '/guides/deployment' },
          ],
        },
        {
          text: 'Reference',
          collapsed: false,
          items: [
            { text: 'CLI', link: '/reference/cli' },
            { text: 'defineModule', link: '/reference/define-module' },
            { text: 'defineModel', link: '/reference/define-model' },
            { text: 'definePage', link: '/reference/define-page' },
            { text: 'defineWidget', link: '/reference/define-widget' },
            { text: 'defineService', link: '/reference/define-service' },
            { text: 'defineHook', link: '/reference/define-hook' },
            { text: 'defineJob', link: '/reference/define-job' },
            { text: 'defineFixture', link: '/reference/define-fixture' },
            { text: 'defineRoles', link: '/reference/define-roles' },
            { text: 'Built-in Widgets', link: '/reference/built-in-widgets' },
            { text: 'Builder API', link: '/reference/builder-api' },
            { text: 'Data API', link: '/reference/data-api' },
            { text: 'Meta API', link: '/reference/meta-api' },
          ],
        },
        {
          text: 'Contributing',
          collapsed: true,
          items: [
            { text: 'Development', link: '/contributing/development' },
            { text: 'Architecture', link: '/contributing/architecture' },
            { text: 'Project Structure', link: '/contributing/project-structure' },
          ],
        },
      ],
    },
    socialLinks: [{ icon: 'github', link: 'https://github.com/nicerapp/rangka-framework' }],
    search: {
      provider: 'local',
    },
  },
});
