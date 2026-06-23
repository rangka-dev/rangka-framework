import * as fs from 'node:fs/promises';
import * as path from 'node:path';

interface ScaffoldOptions {
  name: string;
  dir: string;
}

export async function scaffold({ name, dir }: ScaffoldOptions) {
  const root = path.resolve(dir);
  await fs.mkdir(root, { recursive: true });
  await fs.mkdir(path.join(root, 'modules', 'main', 'models'), { recursive: true });
  await fs.mkdir(path.join(root, 'modules', 'main', 'pages'), { recursive: true });

  await Promise.all([
    write(root, 'package.json', packageJson(name)),
    write(root, 'rangka.config.ts', rangkaConfig()),
    write(root, 'tsconfig.json', tsconfig()),
    write(root, '.gitignore', gitignore()),
    write(root, 'modules/main/module.ts', moduleDef()),
    write(root, 'modules/main/models/task.ts', taskModel()),
    write(root, 'modules/main/pages/tasks.ts', tasksPage()),
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
  database: {
    dialect: 'pg',
    host: 'localhost',
    port: 5432,
    database: '${`rangka_dev`}',
    user: 'rangka',
    password: 'rangka',
  },
  server: {
    port: 3000,
  },
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
        include: ['modules', 'rangka.config.ts'],
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

function moduleDef() {
  return `import { defineModule } from 'rangka';

export default defineModule({
  name: 'main',
  label: 'Main',
  description: 'Default application module',
  icon: 'box',
  order: 1,
  navigation: [
    {
      section: 'Data',
      items: [
        { page: 'main.tasks', label: 'Tasks' },
      ],
    },
  ],
});
`;
}

function taskModel() {
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

function tasksPage() {
  return `import { definePage } from 'rangka';
import type { WidgetNode } from 'rangka';

const widgets: WidgetNode[] = [
  {
    type: 'card',
    props: { title: 'Tasks' },
    children: [
      {
        type: 'table',
        source: { model: 'main.task' },
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
  key: 'main.tasks',
  label: 'Tasks',
  path: '/main/tasks',
  widgets,
});
`;
}
