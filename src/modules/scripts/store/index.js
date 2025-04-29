import apiService from '@/services/api.service';

// Scripts store module
const state = {
  scripts: [],
  processes: [],
  isLoading: false,
  isExecuting: false,
  error: null,
  selectedScript: null,
  scriptOutput: '',
  lastUpdated: null,
  lastProcessId: null, // Track the last executed process
  lastRunResult: null  // Store the result of the last script execution
};

const mutations = {
  SET_SCRIPTS(state, scriptsData) {
    // Handle both direct array and {scripts: [...]} format
    if (Array.isArray(scriptsData)) {
      state.scripts = scriptsData;
    } else if (scriptsData && scriptsData.scripts && Array.isArray(scriptsData.scripts)) {
      state.scripts = scriptsData.scripts;
    } else {
      // Initialize with empty array if data format is unexpected
      console.error('Unexpected scripts data format:', scriptsData);
      state.scripts = [];
    }
    state.lastUpdated = new Date();
  },
  SET_PROCESSES(state, processesData) {
    // Handle multiple possible API response formats
    console.log('Setting processes with data:', processesData);
    
    let processArray = [];
    
    if (Array.isArray(processesData)) {
      processArray = processesData;
    } else if (processesData && processesData.processes && Array.isArray(processesData.processes)) {
      processArray = processesData.processes;
    } else {
      // Initialize with empty array if data format is unexpected
      console.error('Unexpected processes data format:', processesData);
      state.processes = [];
      return;
    }
    
    // Map API process data to our frontend format
    state.processes = processArray.map(p => ({
      id: p.process_id || p.processId || p.id,
      scriptId: p.script || p.scriptId || p.name || 'Unknown',
      status: mapProcessStatus(p),
      startTime: p.start_time || p.startTime,
      endTime: p.end_time || p.endTime,
      output: p.output || p.stdout || '',
      running: p.running === undefined ? (p.status === 'running') : p.running
    }));
    
    console.log('Mapped processes:', state.processes);
  },
  SET_LOADING(state, isLoading) {
    state.isLoading = isLoading;
  },
  SET_EXECUTING(state, isExecuting) {
    state.isExecuting = isExecuting;
  },
  SET_ERROR(state, error) {
    state.error = error;
  },
  SET_SELECTED_SCRIPT(state, script) {
    state.selectedScript = script;
  },
  SET_SCRIPT_OUTPUT(state, output) {
    state.scriptOutput = output;
  },
  APPEND_SCRIPT_OUTPUT(state, output) {
    state.scriptOutput += output;
  },
  CLEAR_SCRIPT_OUTPUT(state) {
    state.scriptOutput = '';
  },
  SET_LAST_PROCESS_ID(state, processId) {
    state.lastProcessId = processId;
  },
  SET_LAST_RUN_RESULT(state, result) {
    state.lastRunResult = result;
  }
};

// Helper function to map process status from API to our frontend format
function mapProcessStatus(process) {
  // Check various properties that might indicate status
  if (process.status) {
    return process.status.toLowerCase();
  } else if (process.running === false && process.completed === true) {
    return process.returncode === 0 ? 'completed' : 'failed';
  } else if (process.running === false) {
    return 'completed';
  } else if (process.running === true) {
    return 'running';
  } else if (process.exit_status) {
    return process.exit_status === 'success' ? 'completed' : 'failed';
  }
  
  // Default to 'unknown' if we can't determine status
  return 'unknown';
}

const actions = {
  async fetchData({ commit, dispatch, state }) {
    commit('SET_LOADING', true);
    commit('SET_ERROR', null);
    
    try {
      // Fetch available scripts with caching enabled
      const scriptsResponse = await apiService.getScripts(true);
      console.log('Scripts API response:', scriptsResponse);
      commit('SET_SCRIPTS', scriptsResponse);
      
      // Fetch running processes with caching enabled
      const processesResponse = await apiService.getProcesses(true);
      console.log('Processes API response:', processesResponse);
      commit('SET_PROCESSES', processesResponse);
      
      // If we have a last process ID, also get its detailed status
      if (state.lastProcessId) {
        console.log('Checking status of last process:', state.lastProcessId);
        try {
          const processDetails = await apiService.getProcessDetails(state.lastProcessId, true);
          console.log('Process details response:', processDetails);
          
          // Replace the process in the list with updated data if needed
          if (processDetails) {
            const updatedProcesses = [...state.processes];
            const index = updatedProcesses.findIndex(p => 
              p.id === state.lastProcessId || 
              p.id === String(state.lastProcessId)
            );
            
            if (index !== -1) {
              updatedProcesses[index] = {
                ...updatedProcesses[index],
                ...processDetails,
                id: state.lastProcessId,
                status: mapProcessStatus(processDetails)
              };
              
              console.log('Updated process in list:', updatedProcesses[index]);
              commit('SET_PROCESSES', updatedProcesses);
            }
          }
        } catch (error) {
          console.warn('Failed to get process details for process ID:', state.lastProcessId, error);
          // Don't fail the entire operation if getting a single process fails
        }
      }
    } catch (error) {
      commit('SET_ERROR', {
        message: `Failed to fetch scripts: ${error.message}`,
        details: error
      });
      
      // Notify global state about error
      dispatch('global/setError', {
        module: 'scripts',
        message: `Scripts module error: ${error.message}`
      }, { root: true });
    } finally {
      commit('SET_LOADING', false);
    }
  },
  
  async fetchProcessStatus({ commit, state }, processId = null) {
    // If no process ID specified, use the last one
    const idToCheck = processId || state.lastProcessId;
    
    if (!idToCheck) return null;
    
    try {
      console.log('Fetching status for process:', idToCheck);
      const processDetails = await apiService.getProcessDetails(idToCheck);
      
      if (processDetails) {
        // Update this specific process in the list
        const updatedProcesses = [...state.processes];
        const index = updatedProcesses.findIndex(p => 
          p.id === idToCheck || p.id === String(idToCheck)
        );
        
        if (index !== -1) {
          updatedProcesses[index] = {
            ...updatedProcesses[index],
            ...processDetails,
            id: idToCheck,
            status: mapProcessStatus(processDetails)
          };
          
          commit('SET_PROCESSES', updatedProcesses);
        }
        
        return processDetails;
      }
      return null;
    } catch (error) {
      console.error('Error fetching process status:', error);
      return null;
    }
  },
  
  selectScript({ commit }, script) {
    commit('SET_SELECTED_SCRIPT', script);
    commit('CLEAR_SCRIPT_OUTPUT');
  },
  
  async runScript({ commit, dispatch }, { scriptId, params }) {
    commit('SET_LOADING', true);
    commit('SET_EXECUTING', true); // Set executing state to true
    commit('SET_ERROR', null); // Clear previous errors
    commit('SET_LAST_RUN_RESULT', null); // Clear previous results
    commit('CLEAR_SCRIPT_OUTPUT'); // Clear previous output
    
    try {
      const response = await apiService.runScript(scriptId, params);
      commit('SET_LAST_RUN_RESULT', response);
      
      // Update the script output with the response data
      if (response) {
        // Handle different response formats
        if (typeof response === 'string') {
          commit('SET_SCRIPT_OUTPUT', response);
        } else if (response.output || response.stdout) {
          // Try to get output from response.output or response.stdout
          commit('SET_SCRIPT_OUTPUT', response.output || response.stdout || '');
        } else {
          // If no string output, format the JSON response for display
          commit('SET_SCRIPT_OUTPUT', 'Result: ' + JSON.stringify(response, null, 2));
        }
        
        // If the response contains a process ID, store it for tracking
        if (response.process_id || response.id || response.processId) {
          const processId = response.process_id || response.id || response.processId;
          commit('SET_LAST_PROCESS_ID', processId);
        }
      }
      
      // Refresh process list to show the new process
      dispatch('fetchData');
      return true;
    } catch (error) {
      // Store the error message from the API response
      const errorMessage = error.data?.error || error.message || 'Failed to run script';
      commit('SET_ERROR', { 
        message: errorMessage,
        details: error.data || error 
      });
      
      // Also display error in script output
      commit('SET_SCRIPT_OUTPUT', 'Error: ' + errorMessage);
      
      // Notify global state about error
      dispatch('global/setError', {
        module: 'scripts',
        message: `Script execution error: ${errorMessage}`
      }, { root: true });
      
      return false;
    } finally {
      commit('SET_LOADING', false);
      commit('SET_EXECUTING', false); // Set executing state back to false
    }
  },
  
  async getProcessDetails({ commit, dispatch }, processId) {
    try {
      console.log('Getting details for process ID:', processId);
      const response = await apiService.getProcessDetails(processId);
      console.log('Process details response:', response);
      
      if (response) {
        // Convert the response to our frontend process format
        return {
          id: processId,
          scriptId: response.script || response.scriptId || 'Unknown',
          status: mapProcessStatus(response),
          startTime: response.start_time || response.startTime,
          endTime: response.end_time || response.endTime,
          output: response.output || response.stdout || '',
          running: response.running === undefined ? (response.status === 'running') : response.running,
          returncode: response.returncode,
          exitStatus: response.exit_status,
          // Include the raw response for debugging
          rawResponse: response
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting process details:', error);
      return null;
    }
  },
  
  async killProcess({ commit, dispatch }, processId) {
    commit('SET_LOADING', true);
    
    try {
      await apiService.killProcess(processId);
      dispatch('fetchData');
      return true;
    } catch (error) {
      commit('SET_ERROR', {
        message: `Failed to kill process: ${error.message}`,
        details: error
      });
      return false;
    } finally {
      commit('SET_LOADING', false);
    }
  }
};

const getters = {
  scripts: state => state.scripts,
  processes: state => state.processes,
  isLoading: state => state.isLoading,
  isExecuting: state => state.isExecuting,
  error: state => state.error,
  selectedScript: state => state.selectedScript,
  scriptOutput: state => state.scriptOutput,
  lastUpdated: state => state.lastUpdated,
  lastProcessId: state => state.lastProcessId,
  getProcessById: state => processId => {
    return state.processes.find(p => p.id === processId || p.id === String(processId));
  }
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
};