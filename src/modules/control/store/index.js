import apiService from '@/services/api.service';

// Control Panel store module
const state = {
  isPerformingAction: false,
  lastAction: null,
  error: null,
  confirmingAction: null,
  systemStatus: null
};

const mutations = {
  SET_PERFORMING_ACTION(state, isPerforming) {
    state.isPerformingAction = isPerforming;
  },
  SET_LAST_ACTION(state, action) {
    state.lastAction = {
      name: action,
      timestamp: new Date()
    };
  },
  SET_ERROR(state, error) {
    state.error = error;
  },
  SET_CONFIRMING_ACTION(state, action) {
    state.confirmingAction = action;
  },
  SET_SYSTEM_STATUS(state, status) {
    state.systemStatus = status;
  }
};

const actions = {
  // Modified fetchData to use cached system status data
  async fetchData({ commit, dispatch, rootState }) {
    try {
      // Use cached system status data if available from system module
      // This prevents redundant API calls for the same information
      const systemModule = rootState.system;
      if (systemModule && 
          systemModule.lastUpdated && 
          (Date.now() - systemModule.lastUpdated) < 10000) { // within 10 seconds
        
        console.log('Control panel using cached system status data');
        // Extract only the minimal data needed for control panel
        const minimalStatus = {
          // Add any specific status fields needed for control panel operation
          status: systemModule.status || 'unknown',
          ready: true  // Assuming system is ready if we have data
        };
        commit('SET_SYSTEM_STATUS', minimalStatus);
        return true;
      }
      
      // If no cached data is available, make the API call with caching enabled
      console.log('Control panel fetching system status data');
      const response = await apiService.getSystemStatus(true);
      
      // Extract only what we need from the response
      const minimalStatus = {
        status: response.status || 'unknown',
        ready: true
      };
      commit('SET_SYSTEM_STATUS', minimalStatus);
      return true;
    } catch (error) {
      commit('SET_ERROR', {
        message: `Failed to fetch control panel data: ${error.message}`,
        details: error
      });
      
      // Notify global state about error
      dispatch('global/setError', {
        module: 'control',
        message: `Control panel data fetch error: ${error.message}`
      }, { root: true });
      
      return false;
    }
  },
  
  setConfirmingAction({ commit }, action) {
    commit('SET_CONFIRMING_ACTION', action);
  },
  
  async performAction({ commit, dispatch }, action) {
    commit('SET_PERFORMING_ACTION', true);
    commit('SET_ERROR', null);
    
    try {
      // Different endpoints based on action type
      let endpoint;
      
      switch(action) {
        case 'emergency-stop':
          endpoint = '/control/emergency-stop';
          break;
        case 'reboot':
          endpoint = '/control/reboot';
          break;
        case 'shutdown':
          endpoint = '/control/shutdown';
          break;
        default:
          throw new Error(`Unknown action: ${action}`);
      }
      
      // Perform the action by posting to the appropriate endpoint
      const response = await apiService.post(endpoint);
      
      // Record the successful action
      commit('SET_LAST_ACTION', action);
      
      // Clear the system status cache since the action may change system state
      apiService.clearCache('/system');
      
      // Trigger a refresh of data after action is complete
      dispatch('global/refreshAll', null, { root: true });
      
      return true;
    } catch (error) {
      commit('SET_ERROR', {
        message: `Failed to perform action: ${error.message}`,
        details: error
      });
      
      // Notify global state about error
      dispatch('global/setError', {
        module: 'control',
        message: `Control panel error: ${error.message}`
      }, { root: true });
      
      return false;
    } finally {
      commit('SET_PERFORMING_ACTION', false);
      commit('SET_CONFIRMING_ACTION', null);
    }
  }
};

const getters = {
  isPerformingAction: state => state.isPerformingAction,
  lastAction: state => state.lastAction,
  error: state => state.error,
  confirmingAction: state => state.confirmingAction,
  systemStatus: state => state.systemStatus
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
};