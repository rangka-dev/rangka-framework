import * as fs from 'node:fs/promises';
import * as path from 'node:path';

interface ScaffoldOptions {
  name: string;
  dir: string;
}

export async function scaffold({ name, dir }: ScaffoldOptions) {
  const root = path.resolve(dir);
  await fs.mkdir(root, { recursive: true });
  await fs.mkdir(path.join(root, 'models'), { recursive: true });
  await fs.mkdir(path.join(root, 'pages'), { recursive: true });

  await Promise.all([
    write(root, 'package.json', packageJson(name)),
    write(root, 'rangka.config.ts', rangkaConfig()),
    write(root, 'app.ts', appDef(name)),
    write(root, 'tsconfig.json', tsconfig()),
    write(root, '.gitignore', gitignore()),
    write(root, 'models/task.ts', taskModel(name)),
    write(root, 'pages/tasks.ts', tasksPage(name)),
  ]);
}

function write(root: string, filePath: string, content: string) {
  return fs.writeFile(path.join(root, filePath), content);
}

function packageJson(name: string) {
  return (
    JSON.stringify(
      {
        name,
        private: true,
        type: 'module',
        scripts: {
          start: 'rangka start',
          studio: 'rangka studio',
          build: 'rangka build',
        },
        dependencies: {
          rangka: '^0.1.0',
          '@rangka/cli': '^0.1.0',
        },
        devDependencies: {
          '@rangka/studio-core': '^0.1.0',
          typescript: '^5.8.0',
        },
      },
      null,
      2,
    ) + '\n'
  );
}

function rangkaConfig() {
  return `import { defineConfig } from 'rangka';

export default defineConfig({
  server: {
    port: 3000,
  },
});
`;
}

function appDef(name: string) {
  const label = name.charAt(0).toUpperCase() + name.slice(1);
  return `import { defineApp } from 'rangka';

export default defineApp({
  name: '${name}',
  label: '${label}',
  icon: 'box',
  navigation: [
    {
      section: 'Data',
      items: [
        { page: '${name}.tasks', label: 'Tasks' },
      ],
    },
  ],
});
`;
}

function tsconfig() {
  return (
    JSON.stringify(
      {
        compilerOptions: {
          target: 'ES2022',
          module: 'ESNext',
          moduleResolution: 'bundler',
          strict: true,
          esModuleInterop: true,
          skipLibCheck: true,
          outDir: 'dist',
          rootDir: '.',
        },
        include: ['*.ts', 'models', 'pages', 'hooks', 'services', 'jobs', 'rangka.config.ts'],
      },
      null,
      2,
    ) + '\n'
  );
}

function gitignore() {
  return `node_modules/
dist/
.rangka/
.env
`;
}

function taskModel(_appName: string) {
  return `import { defineModel, field } from 'rangka';

export default defineModel({
  name: 'task',
  label: 'Task',
  naming: 'title',
  fields: {
    title: field.string({ required: true }),
    status: field.enum(['open', 'in_progress', 'done'], { default: 'open' }),
    due_date: field.date(),
  },
});
`;
}

function tasksPage(appName: string) {
  return `import { definePage } from 'rangka';
import type { WidgetNode } from 'rangka';

const widgets: WidgetNode[] = [
  {
    type: 'card',
    props: { title: 'Tasks' },
    children: [
      {
        type: 'table',
        source: { model: '${appName}.task' },
        props: { pageSize: 10 },
        children: [
          {
            type: 'column',
            bind: { field: 'title' },
            props: { label: 'Title', sortable: true, filterable: true },
          },
          {
            type: 'column',
            bind: { field: 'status' },
            props: { label: 'Status', sortable: true, filterable: true },
            children: [{ type: 'badge', bind: { field: 'status' } }],
          },
          {
            type: 'column',
            bind: { field: 'due_date' },
            props: { label: 'Due Date', sortable: true },
          },
        ],
      },
    ],
  },
];

export default definePage({
  key: '${appName}.tasks',
  label: 'Tasks',
  widgets,
});
`;
}
