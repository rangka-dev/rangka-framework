import { defineModel, field } from '@rangka/shared';

export const userSchema = defineModel({
  name: 'user',
  label: 'User',
  fields: {
    email: field.string({ required: true }),
    password_hash: field.string({ required: true }),
    full_name: field.string({ required: true }),
    enabled: field.boolean({ default: true }),
  },
  indexes: [{ fields: ['email'], unique: true }],
});

export const roleSchema = defineModel({
  name: 'role',
  label: 'Role',
  fields: {
    name: field.string({ required: true }),
    inherits: field.json({}),
    permissions: field.json({}),
  },
  indexes: [{ fields: ['name'], unique: true }],
});

export const userRoleSchema = defineModel({
  name: 'user_role',
  label: 'User Role',
  fields: {
    user_id: field.link('core.user', { required: true }),
    role_id: field.link('core.role', { required: true }),
  },
  indexes: [{ fields: ['user_id', 'role_id'], unique: true }],
});

export const sessionSchema = defineModel({
  name: 'session',
  label: 'Session',
  fields: {
    token: field.string({ required: true }),
    user_id: field.link('core.user', { required: true }),
    expires_at: field.datetime({ required: true }),
    created_at: field.datetime({ required: true }),
  },
  indexes: [
    { fields: ['token'], unique: true },
    { fields: ['user_id'] },
    { fields: ['expires_at'] },
  ],
});

export const coreSchemas = [userSchema, roleSchema, userRoleSchema, sessionSchema];
