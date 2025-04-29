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
    if (Array.isArray(containers)) {
      state.containers = containers;
    } else if (containers && containers.containers && Array.isArray(containers.containers)) {
      state.containers = containers.containers;
    } else {
      console.error('Unexpected containers data format:', containers);
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
      // Use cache for better performance
      const response = await apiService.getContainers(true);
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
      // Clear container cache to ensure fresh data on next fetch
      apiService.clearCache('/docker');
      // Reload container list
      dispatch('fetchData');
      return true;
    } catch (error) {
      commit('SET_ERROR', {
        message: `Failed to start container: ${error.message}`,
        details: error
      });
      
      dispatch('global/setError', {
        module: 'docker',
        message: `Docker start error: ${error.message}`
      }, { root: true });
      
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
      // Clear container cache to ensure fresh data on next fetch
      apiService.clearCache('/docker');
      // Reload container list
      dispatch('fetchData');
      return true;
    } catch (error) {
      commit('SET_ERROR', {
        message: `Failed to stop container: ${error.message}`,
        details: error
      });
      
      dispatch('global/setError', {
        module: 'docker',
        message: `Docker stop error: ${error.message}`
      }, { root: true });
      
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
      // Clear container cache to ensure fresh data on next fetch
      apiService.clearCache('/docker');
      // Reload container list
      dispatch('fetchData');
      return true;
    } catch (error) {
      commit('SET_ERROR', {
        message: `Failed to restart container: ${error.message}`,
        details: error
      });
      
      dispatch('global/setError', {
        module: 'docker',
        message: `Docker restart error: ${error.message}`
      }, { root: true });
      
      return false;
    } finally {
      commit('SET_LOADING', false);
    }
  }
};

const getters = {
  containers: state => state.containers,
  isLoading: state => state.isLoading,
  error: state => state.error,
  lastUpdated: state => state.lastUpdated,
  selectedContainer: state => state.selectedContainer,
  getContainerById: state => id => {
    // Assuming the API response uses 'ID' (uppercase) based on curl output
    return state.containers.find(c => c.ID === id); 
  },
  // Corrected filter to use 'State' (uppercase) based on API response
  runningContainers: state => {
    return state.containers.filter(c => c.State === 'running');
  },
  // Added getter for total container count
  containerCount: state => state.containers.length, 
  // Added getter for running container count
  runningCount: (state, getters) => getters.runningContainers.length, 
  stoppedContainers: state => {
    // Corrected filter to use 'State' (uppercase)
    return state.containers.filter(c => c.State !== 'running');
  }
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
};