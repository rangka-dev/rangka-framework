import type { BootResponse } from '@rangka/shared';
import { apiClient } from './client.js';

export async function fetchBoot(): Promise<BootResponse> {
  const response = await apiClient('/api/meta/boot');
  if (!response.ok) {
    throw response;
  }
  return response.json() as Promise<BootResponse>;
}
