import { describe, it, expect } from 'vitest';
import { field } from '../field.js';

describe('field builders', () => {
  describe('primitives', () => {
    it('string', () => {
      const f = field.string();
      expect(f).toEqual({ type: 'string' });
    });

    it('string with options', () => {
      const f = field.string({ required: true, maxLength: 255, label: 'Name' });
      expect(f).toEqual({ type: 'string', required: true, maxLength: 255, label: 'Name' });
    });

    it('text', () => {
      const f = field.text();
      expect(f).toEqual({ type: 'text' });
    });

    it('int', () => {
      const f = field.int({ default: 0 });
      expect(f).toEqual({ type: 'int', default: 0 });
    });

    it('decimal', () => {
      const f = field.decimal({ precision: 10, scale: 2 });
      expect(f).toEqual({ type: 'decimal', precision: 10, scale: 2 });
    });

    it('boolean', () => {
      const f = field.boolean({ default: false });
      expect(f).toEqual({ type: 'boolean', default: false });
    });

    it('date', () => {
      const f = field.date({ required: true });
      expect(f).toEqual({ type: 'date', required: true });
    });

    it('datetime', () => {
      const f = field.datetime();
      expect(f).toEqual({ type: 'datetime' });
    });

    it('enum', () => {
      const f = field.enum(['draft', 'active', 'closed']);
      expect(f).toEqual({ type: 'enum', options: ['draft', 'active', 'closed'] });
    });

    it('enum with options', () => {
      const f = field.enum(['a', 'b'], { default: 'a', label: 'Status' });
      expect(f).toEqual({ type: 'enum', options: ['a', 'b'], default: 'a', label: 'Status' });
    });

    it('json', () => {
      const f = field.json();
      expect(f).toEqual({ type: 'json' });
    });

    it('sequence', () => {
      const f = field.sequence({ prefix: 'INV-', digits: 5 });
      expect(f).toEqual({ type: 'sequence', prefix: 'INV-', digits: 5 });
    });

    it('money', () => {
      const f = field.money();
      expect(f).toEqual({ type: 'money' });
    });

    it('code', () => {
      const f = field.code({ language: 'expression' });
      expect(f).toEqual({ type: 'code', language: 'expression' });
    });

    it('attachment', () => {
      const f = field.attachment({ accept: ['image/*'], maxSize: '5MB' });
      expect(f).toEqual({ type: 'attachment', accept: ['image/*'], maxSize: '5MB' });
    });

    it('attachments', () => {
      const f = field.attachments({ maxCount: 10 });
      expect(f).toEqual({ type: 'attachments', maxCount: 10 });
    });
  });

  describe('relationships', () => {
    it('link', () => {
      const f = field.link('Customer');
      expect(f).toEqual({ type: 'link', model: 'Customer' });
    });

    it('link with options', () => {
      const f = field.link('Customer', { required: true, nullable: false });
      expect(f).toEqual({ type: 'link', model: 'Customer', required: true, nullable: false });
    });

    it('hasMany', () => {
      const f = field.hasMany('OrderLine', { foreignKey: 'order_id' });
      expect(f).toEqual({ type: 'hasMany', model: 'OrderLine', foreignKey: 'order_id' });
    });

    it('children', () => {
      const f = field.children('InvoiceLine', { foreignKey: 'invoice_id' });
      expect(f).toEqual({ type: 'children', model: 'InvoiceLine', foreignKey: 'invoice_id' });
    });

    it('manyToMany', () => {
      const f = field.manyToMany('Tag', { through: 'item_tags' });
      expect(f).toEqual({ type: 'manyToMany', model: 'Tag', through: 'item_tags' });
    });

    it('dynamicLink', () => {
      const f = field.dynamicLink('ref_type');
      expect(f).toEqual({ type: 'dynamicLink', modelField: 'ref_type' });
    });
  });

  describe('composites', () => {
    it('tree returns TreeFieldConfig', () => {
      const result = field.tree({ parentField: 'parent', strategy: 'materialized_path' });
      expect(result).toEqual({
        type: 'tree',
        parentField: 'parent',
        strategy: 'materialized_path',
      });
    });
  });

  describe('type discriminants', () => {
    it('each builder sets the correct type field', () => {
      expect(field.string().type).toBe('string');
      expect(field.text().type).toBe('text');
      expect(field.int().type).toBe('int');
      expect(field.decimal().type).toBe('decimal');
      expect(field.boolean().type).toBe('boolean');
      expect(field.date().type).toBe('date');
      expect(field.datetime().type).toBe('datetime');
      expect(field.enum(['x']).type).toBe('enum');
      expect(field.json().type).toBe('json');
      expect(field.link('M').type).toBe('link');
      expect(field.hasMany('M', { foreignKey: 'fk' }).type).toBe('hasMany');
      expect(field.children('M', { foreignKey: 'fk' }).type).toBe('children');
      expect(field.manyToMany('M', { through: 't' }).type).toBe('manyToMany');
      expect(field.dynamicLink('f').type).toBe('dynamicLink');
      expect(field.money().type).toBe('money');
      expect(field.code({ language: 'expression' }).type).toBe('code');
      expect(field.sequence().type).toBe('sequence');
      expect(field.attachment().type).toBe('attachment');
      expect(field.attachments().type).toBe('attachments');
    });
  });
});
