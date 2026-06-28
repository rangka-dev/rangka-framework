import { defineConfig } from '@rangka/shared';

export default defineConfig({
  apps: ['tenant', 'sales'],
  database: {
    dialect: 'pg',
    host: process.env.RANGKA_DB_HOST ?? 'localhost',
    port: Number(process.env.RANGKA_DB_PORT ?? 5433),
    database: process.env.RANGKA_DB_NAME ?? 'rangka_test',
    user: process.env.RANGKA_DB_USER ?? 'rangka',
    password: process.env.RANGKA_DB_PASSWORD ?? 'rangka',
  },
  server: {
    port: 3000,
  },
});
