#!/usr/bin/env tsx
import { defineCommand, runMain } from 'citty';
import { buildCommand } from './commands/build.js';
import { startCommand } from './commands/start.js';
import { studioCommand } from './commands/studio.js';

const main = defineCommand({
  meta: {
    name: 'rangka',
    version: '0.0.1',
    description: 'Rangka Framework CLI',
  },
  subCommands: {
    build: buildCommand,
    start: startCommand,
    studio: studioCommand,
  },
});

runMain(main);
