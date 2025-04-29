import { describe, it, expect, beforeEach } from 'vitest';
import docker from './index';

// Mock API response structure
const mockContainers = [
  { ID: 'abc123xyz', Name: 'test_container_running', Image: 'test:latest', State: 'running', CreatedAt: '2025-04-30 10:00:00 +0000 UTC', Ports: '80/tcp' },
  { ID: 'def456uvw', Name: 'test_container_stopped', Image: 'another:1.0', State: 'exited', CreatedAt: '2025-04-29 15:30:00 +0000 UTC', Ports: '' },
  { ID: 'ghi789rst', Name: 'test_container_running_2', Image: 'test:latest', State: 'running', CreatedAt: '2025-04-30 11:00:00 +0000 UTC', Ports: '8080/tcp' }
];

describe('docker store', () => {
  let state;

  // Reset state before each test
  beforeEach(() => {
    state = { ...docker.state, containers: [] }; // Start with empty containers
  });

  describe('mutations', () => {
    it('SET_CONTAINERS sets container list correctly from array', () => {
      docker.mutations.SET_CONTAINERS(state, mockContainers);
      expect(state.containers).toEqual(mockContainers);
      expect(state.lastUpdated).toBeInstanceOf(Date);
    });

    it('SET_CONTAINERS sets container list correctly from object with containers property', () => {
      const response = { containers: mockContainers };
      docker.mutations.SET_CONTAINERS(state, response);
      expect(state.containers).toEqual(mockContainers);
      expect(state.lastUpdated).toBeInstanceOf(Date);
    });

    it('SET_CONTAINERS handles unexpected data format', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      docker.mutations.SET_CONTAINERS(state, { someOtherProp: [] });
      expect(state.containers).toEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Unexpected containers data format:', { someOtherProp: [] });
      consoleErrorSpy.mockRestore();
    });

    it('SET_LOADING sets loading state', () => {
      docker.mutations.SET_LOADING(state, true);
      expect(state.isLoading).toBe(true);
      docker.mutations.SET_LOADING(state, false);
      expect(state.isLoading).toBe(false);
    });

    it('SET_ERROR sets error state', () => {
      const error = { message: 'Test error' };
      docker.mutations.SET_ERROR(state, error);
      expect(state.error).toEqual(error);
    });

    it('SET_SELECTED_CONTAINER sets selected container', () => {
      const container = mockContainers[0];
      docker.mutations.SET_SELECTED_CONTAINER(state, container);
      expect(state.selectedContainer).toEqual(container);
      docker.mutations.SET_SELECTED_CONTAINER(state, null);
      expect(state.selectedContainer).toBeNull();
    });
  });

  describe('getters', () => {
    beforeEach(() => {
      // Populate state with mock data for getter tests
      docker.mutations.SET_CONTAINERS(state, mockContainers);
      docker.mutations.SET_LOADING(state, false);
      docker.mutations.SET_ERROR(state, null);
      docker.mutations.SET_SELECTED_CONTAINER(state, mockContainers[0]);
    });

    it('containers returns the container list', () => {
      expect(docker.getters.containers(state)).toEqual(mockContainers);
    });

    it('isLoading returns the loading state', () => {
      expect(docker.getters.isLoading(state)).toBe(false);
    });

    it('error returns the error state', () => {
      expect(docker.getters.error(state)).toBeNull();
    });

    it('lastUpdated returns the last updated timestamp', () => {
      expect(docker.getters.lastUpdated(state)).toBeInstanceOf(Date);
    });

    it('selectedContainer returns the selected container', () => {
      expect(docker.getters.selectedContainer(state)).toEqual(mockContainers[0]);
    });

    it('getContainerById returns the correct container', () => {
      const getterFn = docker.getters.getContainerById(state);
      expect(getterFn('abc123xyz')).toEqual(mockContainers[0]);
      expect(getterFn('nonexistent')).toBeUndefined();
    });

    it('runningContainers returns only running containers', () => {
      const running = docker.getters.runningContainers(state);
      expect(running).toHaveLength(2);
      expect(running).toEqual([mockContainers[0], mockContainers[2]]);
    });

    it('containerCount returns the total number of containers', () => {
      expect(docker.getters.containerCount(state)).toBe(3);
    });

    it('runningCount returns the number of running containers', () => {
      // Need to pass getters object as the second argument
      const getters = { runningContainers: docker.getters.runningContainers(state) };
      expect(docker.getters.runningCount(state, getters)).toBe(2);
    });

    it('stoppedContainers returns only non-running containers', () => {
      const stopped = docker.getters.stoppedContainers(state);
      expect(stopped).toHaveLength(1);
      expect(stopped).toEqual([mockContainers[1]]);
    });
  });

  // TODO: Add tests for actions (requires mocking apiService)
});