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
  lastProcessId: null // Track the last executed process
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
      // Fetch available scripts
      const scriptsResponse = await apiService.getScripts();
      console.log('Scripts API response:', scriptsResponse);
      commit('SET_SCRIPTS', scriptsResponse);
      
      // Fetch running processes
      const processesResponse = await apiService.getProcesses();
      console.log('Processes API response:', processesResponse);
      commit('SET_PROCESSES', processesResponse);
      
      // If we have a last process ID, also get its detailed status
      if (state.lastProcessId) {
        console.log('Checking status of last process:', state.lastProcessId);
        try {
          const processDetails = await apiService.getProcessDetails(state.lastProcessId);
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
  
  async executeScript({ commit, dispatch, state }, { scriptId, params = {} }) {
    if (!scriptId) return false;
    
    commit('SET_EXECUTING', true);
    commit('SET_ERROR', null);
    commit('APPEND_SCRIPT_OUTPUT', `Executing script ${scriptId}...\n`);
    
    try {
      console.log(`Executing script: ${scriptId} with params:`, params);
      const response = await apiService.runScript(scriptId, params);
      console.log('Script execution response:', response);
      
      // Clear any previous process ID
      commit('SET_LAST_PROCESS_ID', null);
      
      // Handle different response formats
      let processId = null;
      
      if (response && response.process_id) {
        // API format: { process_id: "123", ... }
        processId = response.process_id;
        commit('APPEND_SCRIPT_OUTPUT', `Process started with ID: ${processId}\n`);
      } else if (response && response.processId) {
        // API format: { processId: "123", ... }
        processId = response.processId;
        commit('APPEND_SCRIPT_OUTPUT', `Process started with ID: ${processId}\n`);
      } else if (response && response.async === true) {
        // Look for any process ID in the response
        processId = response.process_id || response.processId || response.id;
        if (processId) {
          commit('APPEND_SCRIPT_OUTPUT', `Async process started with ID: ${processId}\n`);
        } else {
          commit('APPEND_SCRIPT_OUTPUT', 'Async process started (no process ID returned)\n');
        }
      } else if (response && response.success === true) {
        // API format: { success: true, message: "...", ... }
        const message = response.message || 'Script executed successfully';
        commit('APPEND_SCRIPT_OUTPUT', `${message}\n`);
        
        // Check if there's a process ID in the response
        processId = response.process_id || response.processId;
        
        // If there's output data, display it
        if (response.output || response.data) {
          const outputData = response.output || response.data || {};
          const formattedOutput = JSON.stringify(outputData, null, 2);
          commit('APPEND_SCRIPT_OUTPUT', `\nOutput:\n${formattedOutput}\n`);
        }
      } else {
        // Generic success response with minimal information
        commit('APPEND_SCRIPT_OUTPUT', 'Script executed successfully\n');
        
        // If the response itself is meaningful, print it
        if (response && typeof response !== 'string') {
          // Check if there's a process ID in the response
          processId = response.process_id || response.processId;
          
          const formattedOutput = JSON.stringify(response, null, 2);
          commit('APPEND_SCRIPT_OUTPUT', `\nOutput:\n${formattedOutput}\n`);
        } else if (typeof response === 'string') {
          commit('APPEND_SCRIPT_OUTPUT', `\n${response}\n`);
        }
      }
      
      // If we found a process ID, save it and refresh processes
      if (processId) {
        console.log('Saving last process ID:', processId);
        commit('SET_LAST_PROCESS_ID', processId);
      }
      
      // Refresh processes list to get status
      dispatch('fetchData');
      
      return processId || true;
    } catch (error) {
      console.error('Script execution error:', error);
      
      // Extract the error message from different possible formats
      let errorMessage = 'Unknown error occurred';
      
      if (error.data && error.data.error) {
        errorMessage = error.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      commit('APPEND_SCRIPT_OUTPUT', `Error: ${errorMessage}\n`);
      commit('SET_ERROR', {
        message: `Failed to execute script: ${errorMessage}`,
        details: error
      });
      
      // Notify global state about error
      dispatch('global/setError', {
        module: 'scripts',
        message: `Script execution error: ${errorMessage}`
      }, { root: true });
      
      return false;
    } finally {
      commit('SET_EXECUTING', false);
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