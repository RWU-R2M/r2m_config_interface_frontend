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
  async fetchData({ commit }) {
    // Terminal module doesn't need to fetch initial data,
    // but we implement this to maintain consistency with other modules
    console.log('Terminal module fetchData called - no operation needed');
    return Promise.resolve(); // Return resolved promise for consistency
  },
  
  async executeCommand({ commit, dispatch }, command) {
    commit('SET_LOADING', true);
    commit('APPEND_OUTPUT', `\n> ${command}`); // Echo command
    commit('SET_ERROR', null); // Clear previous errors
    
    try {
      const response = await apiService.executeCommand(command);
      
      // Append stdout if it exists
      if (response.stdout) {
        commit('APPEND_OUTPUT', `\n${response.stdout.trim()}`);
      }
      
      // Append stderr if it exists (treat as error/warning)
      if (response.stderr) {
        commit('APPEND_OUTPUT', `\n[ERROR] ${response.stderr.trim()}`);
        // Optionally set a separate error state if needed
        // commit('SET_ERROR', { message: response.stderr.trim() });
      }

      // If the command itself reported an error (e.g., timeout, execution failure)
      if (response.error) {
          commit('APPEND_OUTPUT', `\n[SYSTEM ERROR] ${response.error}`);
          // commit('SET_ERROR', { message: response.error });
      }

      // Check return code for success/failure indication
      if (response.returncode !== 0 && !response.stderr && !response.error) {
          commit('APPEND_OUTPUT', `\n[Command failed with return code ${response.returncode}]`);
      }

      return true;
    } catch (error) {
      const errorMessage = error.data?.error || error.message || 'Failed to execute command';
      commit('APPEND_OUTPUT', `\n[API ERROR] ${errorMessage}`);
      commit('SET_ERROR', { 
        message: errorMessage,
        details: error.data || error 
      });
      
      // Notify global state about error
      dispatch('global/setError', {
        module: 'terminal',
        message: `Terminal error: ${errorMessage}`
      }, { root: true });
      
      return false;
    } finally {
      commit('SET_LOADING', false);
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