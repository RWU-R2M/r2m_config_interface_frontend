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
  // Add the missing fetchData action that's being called by the dashboard
  async fetchData({ commit, dispatch }) {
    try {
      // Get system status information that control panel needs
      // Changed from getStatus() to getSystemStatus() which is the correct method in apiService
      const response = await apiService.getSystemStatus();
      commit('SET_SYSTEM_STATUS', response);
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
    if (!action) return false;
    
    commit('SET_PERFORMING_ACTION', true);
    commit('SET_ERROR', null);
    
    try {
      let response;
      
      switch (action) {
        case 'reboot':
          response = await apiService.reboot();
          break;
        case 'shutdown':
          response = await apiService.shutdown();
          break;
        case 'emergency-stop':
          response = await apiService.emergencyStop();
          break;
        default:
          throw new Error(`Unknown action: ${action}`);
      }
      
      commit('SET_LAST_ACTION', action);
      return true;
    } catch (error) {
      commit('SET_ERROR', {
        message: `Failed to perform action ${action}: ${error.message}`,
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