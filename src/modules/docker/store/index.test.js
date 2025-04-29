import { describe, it, expect } from 'vitest';
import docker from './index';

describe('docker store', () => {
  it('sets container list in state', () => {
    const state = { ...docker.state };
    const containers = [
      { id: 'abc123', name: 'test_container', state: 'running' },
      { id: 'def456', name: 'test_container2', state: 'stopped' }
    ];
    
    docker.mutations.SET_CONTAINERS(state, containers);
    
    expect(state.containers).toEqual(containers);
    expect(state.lastUpdated).toBeInstanceOf(Date);
  });
  
  it('sets loading state', () => {
    const state = { ...docker.state };
    docker.mutations.SET_LOADING(state, true);
    expect(state.isLoading).toBe(true);
  });
});