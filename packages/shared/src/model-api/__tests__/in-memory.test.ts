import { describe } from 'vitest';
import { InMemoryModelAccess } from '../in-memory.js';
import { defineModelAccessContract } from './contract.js';

describe('InMemoryModelAccess contract', () => {
  defineModelAccessContract({
    async create() {
      const models = new InMemoryModelAccess({
        models: [{ name: 'test.item', fields: { name: { searchable: true } } }],
      });
      return { models };
    },
    async seed() {
      // no pre-seeding needed
    },
  });
});
