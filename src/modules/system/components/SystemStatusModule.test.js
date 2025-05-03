import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import SystemStatusModule from './SystemStatusModule.vue';
import { createStore } from 'vuex';

// Create a mock store
function createMockStore() {
  // Mock the fetchData action
  const mockFetchData = vi.fn();

  return createStore({
    modules: {
      system: {
        namespaced: true,
        state: {
          cpu: { usage: 25, temperature: 45, cores: [] },
          memory: { total: 8000, used: 4000, free: 4000, percent: 50 },
          disk: { total: 40000, used: 20000, free: 20000, percent: 50 },
          network: { interfaces: [], bytesReceived: 1000, bytesSent: 2000 },
          lastUpdated: new Date(),
          isLoading: false,
          error: null
        },
        getters: {
          cpuUsage: state => state.cpu.usage,
          cpuTemperature: state => state.cpu.temperature,
          cpuCores: state => state.cpu.cores,
          memoryUsage: state => state.memory.percent,
          memoryDetails: state => ({
            total: '8 GB',
            used: '4 GB',
            free: '4 GB'
          }),
          diskUsage: state => state.disk.percent,
          diskDetails: state => ({
            total: '40 GB',
            used: '20 GB',
            free: '20 GB'
          }),
          networkUsage: state => ({
            received: '1 KB',
            sent: '2 KB'
          }),
          isLoading: state => state.isLoading,
          error: state => state.error,
          lastUpdated: state => state.lastUpdated
        },
        // Add mock actions
        actions: {
          fetchData: mockFetchData
        }
      }
    }
  });
}

describe('SystemStatusModule', () => {
  it('renders the component', () => {
    const store = createMockStore();
    const wrapper = mount(SystemStatusModule, {
      global: {
        plugins: [store],
        stubs: ['router-link', 'chart-js']
      }
    });
    expect(wrapper.exists()).toBe(true);
    // Optionally, you could assert if the action was called if the component calls it on mount
    // expect(store._modulesNamespaceMap['system/'].context.actions.fetchData).toHaveBeenCalled();
  });
});