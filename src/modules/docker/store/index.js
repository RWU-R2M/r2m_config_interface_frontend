import apiService from '@/services/api.service';

// Docker container store module
const state = {
  containers: [],
  isLoading: false,
  error: null,
  lastUpdated: null,
  selectedContainer: null
};

const mutations = {
  SET_CONTAINERS(state, containers) {
    // Handle both direct array and {containers: [...]} format
    if (Array.isArray(containers)) {
      state.containers = containers;
    } else if (containers && containers.containers && Array.isArray(containers.containers)) {
      state.containers = containers.containers;
    } else {
      // Initialize with empty array if data format is unexpected
      console.error('Unexpected container data format:', containers);
      state.containers = [];
    }
    state.lastUpdated = new Date();
  },
  SET_LOADING(state, isLoading) {
    state.isLoading = isLoading;
  },
  SET_ERROR(state, error) {
    state.error = error;
  },
  SET_SELECTED_CONTAINER(state, container) {
    state.selectedContainer = container;
  }
};

const actions = {
  async fetchData({ commit, dispatch }) {
    commit('SET_LOADING', true);
    commit('SET_ERROR', null);
    
    try {
      const response = await apiService.getContainers();
      console.log('Docker API response:', response);
      commit('SET_CONTAINERS', response);
    } catch (error) {
      commit('SET_ERROR', {
        message: `Failed to fetch container information: ${error.message}`,
        details: error
      });
      
      // Notify global state about error
      dispatch('global/setError', {
        module: 'docker',
        message: `Docker module error: ${error.message}`
      }, { root: true });
    } finally {
      commit('SET_LOADING', false);
    }
  },
  
  selectContainer({ commit }, container) {
    commit('SET_SELECTED_CONTAINER', container);
  },
  
  async startContainer({ commit, dispatch }, containerId) {
    commit('SET_LOADING', true);
    commit('SET_ERROR', null);
    
    try {
      await apiService.startContainer(containerId);
      // Refresh the container list
      dispatch('fetchData');
      return true;
    } catch (error) {
      commit('SET_ERROR', {
        message: `Failed to start container: ${error.message}`,
        details: error
      });
      return false;
    } finally {
      commit('SET_LOADING', false);
    }
  },
  
  async stopContainer({ commit, dispatch }, containerId) {
    commit('SET_LOADING', true);
    commit('SET_ERROR', null);
    
    try {
      await apiService.stopContainer(containerId);
      // Refresh the container list
      dispatch('fetchData');
      return true;
    } catch (error) {
      commit('SET_ERROR', {
        message: `Failed to stop container: ${error.message}`,
        details: error
      });
      return false;
    } finally {
      commit('SET_LOADING', false);
    }
  },
  
  async restartContainer({ commit, dispatch }, containerId) {
    commit('SET_LOADING', true);
    commit('SET_ERROR', null);
    
    try {
      await apiService.restartContainer(containerId);
      // Refresh the container list
      dispatch('fetchData');
      return true;
    } catch (error) {
      commit('SET_ERROR', {
        message: `Failed to restart container: ${error.message}`,
        details: error
      });
      return false;
    } finally {
      commit('SET_LOADING', false);
    }
  }
};

const getters = {
  containers: state => state.containers,
  runningContainers: state => state.containers.filter(c => c.state === 'running'),
  stoppedContainers: state => state.containers.filter(c => c.state !== 'running'),
  containerCount: state => state.containers.length,
  runningCount: state => state.containers.filter(c => c.state === 'running').length,
  selectedContainer: state => state.selectedContainer,
  isLoading: state => state.isLoading,
  error: state => state.error,
  lastUpdated: state => state.lastUpdated
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
};