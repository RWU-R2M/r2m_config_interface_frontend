import { describe, it, expect, vi } from 'vitest';
import apiService from './api.service';

// Mock axios properly with create method
vi.mock('axios', () => ({
  default: {
    create: () => ({
      get: vi.fn(() => Promise.resolve({ data: { cpu: {}, memory: {}, disk: {} } })),
      post: vi.fn(() => Promise.resolve({ data: {} })),
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() }
      }
    })
  }
}));

describe('apiService', () => {
  it('fetches system status', async () => {
    const data = await apiService.getSystemStatus();
    expect(data).toHaveProperty('cpu');
    expect(data).toHaveProperty('memory');
    expect(data).toHaveProperty('disk');
  });
});