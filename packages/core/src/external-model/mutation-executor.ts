import type { DataAdapter, AdapterCapability } from '../plugins/types.js';
import type { ExternalFieldConfig } from './types.js';
import { reverseMapForWrite, mapAdapterResponse } from './field-mapper.js';
import { evaluateComputedFields } from './computed-fields.js';

export class CapabilityNotSupportedError extends Error {
  constructor(
    public readonly adapterName: string,
    public readonly operation: string,
  ) {
    super(`Adapter "${adapterName}" does not support operation "${operation}"`);
    this.name = 'CapabilityNotSupportedError';
  }
}

export interface ExternalMutationOptions {
  adapter: DataAdapter;
  adapterName: string;
  modelName: string;
  fields: Record<string, ExternalFieldConfig>;
  capabilities: AdapterCapability[];
}

export class ExternalMutationExecutor {
  private readonly adapter: DataAdapter;
  private readonly adapterName: string;
  private readonly modelName: string;
  private readonly fields: Record<string, ExternalFieldConfig>;
  private readonly capabilities: Set<AdapterCapability>;

  constructor(options: ExternalMutationOptions) {
    this.adapter = options.adapter;
    this.adapterName = options.adapterName;
    this.modelName = options.modelName;
    this.fields = options.fields;
    this.capabilities = new Set(options.capabilities);
  }

  async create(data: Record<string, unknown>): Promise<Record<string, unknown>> {
    if (!this.capabilities.has('create') || !this.adapter.create) {
      throw new CapabilityNotSupportedError(this.adapterName, 'create');
    }

    const mapped = reverseMapForWrite(data, this.fields);
    const raw = await this.adapter.create(this.modelName, mapped);
    return this.transformRecord(raw);
  }

  async update(id: string, data: Record<string, unknown>): Promise<Record<string, unknown>> {
    if (!this.capabilities.has('update') || !this.adapter.update) {
      throw new CapabilityNotSupportedError(this.adapterName, 'update');
    }

    const mapped = reverseMapForWrite(data, this.fields);
    const raw = await this.adapter.update(this.modelName, id, mapped);
    return this.transformRecord(raw);
  }

  async delete(id: string): Promise<void> {
    if (!this.capabilities.has('delete') || !this.adapter.delete) {
      throw new CapabilityNotSupportedError(this.adapterName, 'delete');
    }

    await this.adapter.delete(this.modelName, id);
  }

  private transformRecord(raw: Record<string, unknown>): Record<string, unknown> {
    const mapped = mapAdapterResponse(raw, this.fields);
    return evaluateComputedFields(mapped, this.fields);
  }
}
