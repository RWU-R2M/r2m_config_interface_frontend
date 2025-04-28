import apiService from '@/services/api.service';

// Terminal store module
const state = {
  commands: [],
  output: '',
  isExecuting: false,
  error: null,
  commandHistory: [],
  presetCommands: [
    { name: 'System Info', command: 'uname -a' },
    { name: 'Disk Usage', command: 'df -h' },
    { name: 'Memory Usage', command: 'free -h' },
    { name: 'Process List', command: 'ps aux | head -10' },
    { name: 'Network Interfaces', command: 'ifconfig' },
    { name: 'ROS Nodes', command: 'rosnode list' }
  ]
};

const mutations = {
  SET_OUTPUT(state, output) {
    state.output = output;
  },
  APPEND_OUTPUT(state, output) {
    state.output += output;
  },
  CLEAR_OUTPUT(state) {
    state.output = '';
  },
  SET_EXECUTING(state, isExecuting) {
    state.isExecuting = isExecuting;
  },
  SET_ERROR(state, error) {
    state.error = error;
  },
  ADD_TO_HISTORY(state, command) {
    // Add to front of array and limit history to 10 items
    state.commandHistory.unshift(command);
    if (state.commandHistory.length > 10) {
      state.commandHistory.pop();
    }
  }
};

const actions = {
  // Add the missing fetchData action that's being called by the dashboard
  async fetchData({ commit, dispatch }) {
    // For the terminal module, this might just check connectivity
    try {
      // Use getSystemStatus() instead of getStatus() which doesn't exist
      const healthCheck = await apiService.getSystemStatus();
      return true;
    } catch (error) {
      commit('SET_ERROR', {
        message: `Failed to connect to terminal service: ${error.message}`,
        details: error
      });
      
      // Notify global state about error
      dispatch('global/setError', {
        module: 'terminal',
        message: `Terminal connectivity error: ${error.message}`
      }, { root: true });
      
      return false;
    }
  },
  
  async executeCommand({ commit, dispatch }, command) {
    if (!command.trim()) return;
    
    commit('SET_EXECUTING', true);
    commit('SET_ERROR', null);
    commit('APPEND_OUTPUT', `> ${command}\n`);
    
    try {
      const response = await apiService.executeCommand(command);
      
      // The backend returns stdout/stderr fields, not output
      if (response && response.stdout) {
        commit('APPEND_OUTPUT', response.stdout + '\n');
      } else if (response && response.stderr) {
        commit('APPEND_OUTPUT', response.stderr + '\n');
      } else {
        commit('APPEND_OUTPUT', 'Command executed successfully (no output)\n');
      }
      
      // Add to command history
      commit('ADD_TO_HISTORY', command);
      
      return true;
    } catch (error) {
      const errorMessage = error.data && error.data.error 
        ? error.data.error 
        : (error.message || 'Unknown error occurred');
        
      commit('APPEND_OUTPUT', `${errorMessage}\n`);
      commit('SET_ERROR', {
        message: `Failed to execute command: ${errorMessage}`,
        details: error
      });
      
      // Notify global state about error
      dispatch('global/setError', {
        module: 'terminal',
        message: `Terminal error: ${errorMessage}`
      }, { root: true });
      
      return false;
    } finally {
      commit('SET_EXECUTING', false);
    }
  },
  
  clearOutput({ commit }) {
    commit('CLEAR_OUTPUT');
  }
};

const getters = {
  output: state => state.output,
  isExecuting: state => state.isExecuting,
  error: state => state.error,
  commandHistory: state => state.commandHistory,
  presetCommands: state => state.presetCommands
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
};