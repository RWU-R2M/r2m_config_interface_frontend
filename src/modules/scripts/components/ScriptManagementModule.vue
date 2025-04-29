<template>
  <div class="card module-container">
    <header class="card-header">
      <p class="card-header-title">
        Script Management
      </p>
    </header>
    <div class="card-content">
      <div v-if="isLoading && scripts.length === 0" class="has-text-centered p-4">
        <span class="icon is-large">
          <i class="fas fa-circle-notch fa-spin fa-2x"></i>
        </span>
        <p>Loading scripts...</p>
      </div>
      
      <div v-else-if="error" class="notification is-danger">
        <p>{{ error.message }}</p>
      </div>
      
      <div v-else-if="scripts.length === 0" class="notification is-warning">
        <p>No scripts available.</p>
      </div>
      
      <div v-else>
        <!-- Scripts List -->
        <div class="tabs is-boxed">
          <ul>
            <li 
              v-for="script in scripts" 
              :key="script.id || script.name"
              :class="{ 'is-active': selectedScript && (selectedScript.id === script.id || selectedScript.name === script.name) }"
              @click="selectScript(script)"
            >
              <a>
                <span class="icon is-small">
                  <i class="fas fa-file-code"></i>
                </span>
                <span>{{ script.name }}</span>
              </a>
            </li>
          </ul>
        </div>
        
        <!-- Selected Script Details -->
        <div v-if="selectedScript" class="script-details">
          <div class="field">
            <label class="label">{{ selectedScript.name }}</label>
            <p>{{ selectedScript.description }}</p>
          </div>
          
          <!-- Script Parameters -->
          <div class="field" v-if="selectedScript.params && selectedScript.params.length > 0">
            <label class="label">Parameters</label>
            <div class="columns is-multiline">
              <div 
                v-for="param in selectedScript.params" 
                :key="param.name"
                class="column is-half"
              >
                <div class="field">
                  <label class="label is-small">{{ param.name }}</label>
                  <div class="control">
                    <input 
                      class="input is-small"
                      :type="param.type === 'number' ? 'number' : 'text'"
                      v-model="scriptParams[param.name]"
                      :placeholder="param.description || ''"
                    >
                  </div>
                  <p class="help" v-if="param.description">{{ param.description }}</p>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Execution Button -->
          <div class="field">
            <div class="control">
              <button 
                class="button is-primary" 
                @click="executeScript"
                :class="{ 'is-loading': isExecuting }"
                :disabled="isExecuting"
              >
                Run Script
              </button>
            </div>
          </div>
          
          <!-- Script Output -->
          <div v-if="scriptOutput" class="field mt-4">
            <label class="label">Output</label>
            <div class="terminal">
              <div v-html="formattedOutput"></div>
            </div>
          </div>
        </div>
        
        <!-- Running Processes -->
        <div v-if="processes.length > 0" class="field mt-4">
          <div class="level">
            <div class="level-left">
              <label class="label level-item">Running Processes</label>
            </div>
          </div>
          <div class="table-container">
            <table class="table is-fullwidth is-striped">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Script</th>
                  <th>Status</th>
                  <th>Started</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="process in processes" :key="process.id">
                  <td>{{ process.id }}</td>
                  <td>{{ process.scriptId }}</td>
                  <td>
                    <span 
                      class="tag"
                      :class="{
                        'is-success': process.status === 'running',
                        'is-info': process.status === 'completed',
                        'is-danger': process.status === 'failed'
                      }"
                    >
                      {{ process.status }}
                    </span>
                  </td>
                  <td>{{ formatDate(process.startTime) }}</td>
                  <td>
                    <div class="buttons are-small">
                      <button 
                        class="button is-danger" 
                        @click="killProcess(process.id)"
                        :disabled="process.status !== 'running' || isLoading"
                      >
                        <span class="icon is-small">
                          <i class="fas fa-stop"></i>
                        </span>
                      </button>
                      <button 
                        class="button is-info" 
                        @click="viewProcessDetails(process)"
                      >
                        <span class="icon is-small">
                          <i class="fas fa-eye"></i>
                        </span>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Process Details Modal -->
    <div class="modal" :class="{ 'is-active': selectedProcess }">
      <div class="modal-background" @click="closeProcessDetails"></div>
      <div class="modal-card">
        <header class="modal-card-head">
          <p class="modal-card-title">Process Details</p>
          <button class="delete" aria-label="close" @click="closeProcessDetails"></button>
        </header>
        <section class="modal-card-body">
          <div v-if="selectedProcess">
            <!-- Process details content -->
            <div class="field">
              <label class="label">Process ID</label>
              <p>{{ selectedProcess.id }}</p>
            </div>
            <div class="field">
              <label class="label">Script</label>
              <p>{{ selectedProcess.scriptId }}</p>
            </div>
            <div class="field">
              <label class="label">Status</label>
              <p>
                <span 
                  class="tag"
                  :class="{
                    'is-success': selectedProcess.status === 'running',
                    'is-info': selectedProcess.status === 'completed',
                    'is-danger': selectedProcess.status === 'failed'
                  }"
                >
                  {{ selectedProcess.status }}
                </span>
              </p>
            </div>
            <div class="field">
              <label class="label">Started</label>
              <p>{{ formatDate(selectedProcess.startTime) }}</p>
            </div>
            <div class="field" v-if="selectedProcess.endTime">
              <label class="label">Ended</label>
              <p>{{ formatDate(selectedProcess.endTime) }}</p>
            </div>
            <div class="field" v-if="selectedProcess.output">
              <label class="label">Output</label>
              <div class="terminal">
                <div v-html="formatProcessOutput(selectedProcess.output)"></div>
              </div>
            </div>
          </div>
        </section>
        <footer class="modal-card-foot">
          <button class="button" @click="closeProcessDetails">Close</button>
        </footer>
      </div>
    </div>
  </div>
</template>

<script>
import { computed, ref, onMounted } from 'vue';
import { useStore } from 'vuex';

export default {
  name: 'ScriptManagementModule',
  
  setup() {
    const store = useStore();
    const scriptParams = ref({});
    const selectedProcess = ref(null);
    
    // Computed properties from store
    const scripts = computed(() => store.getters['scripts/scripts']);
    const processes = computed(() => store.getters['scripts/processes']);
    const isLoading = computed(() => store.getters['scripts/isLoading']);
    const isExecuting = computed(() => store.getters['scripts/isExecuting']);
    const error = computed(() => store.getters['scripts/error']);
    const selectedScript = computed(() => store.getters['scripts/selectedScript']);
    const scriptOutput = computed(() => store.getters['scripts/scriptOutput']);
    
    // Format the output with newlines converted to <br>
    const formattedOutput = computed(() => {
      // Ensure scriptOutput is a string before using string methods
      if (!scriptOutput.value) return '';
      
      const outputStr = typeof scriptOutput.value === 'string' 
        ? scriptOutput.value 
        : JSON.stringify(scriptOutput.value, null, 2);
      
      return outputStr
        .replace(/\n/g, '<br>')
        .replace(/ /g, '&nbsp;');
    });
    
    // Format process output for HTML display
    const formatProcessOutput = (output) => {
      if (!output) return '';
      return output
        .replace(/\n/g, '<br>')
        .replace(/ /g, '&nbsp;');
    };
    
    // Format date for display
    const formatDate = (dateString) => {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      return date.toLocaleString();
    };
    
    // Script actions
    const refreshData = () => {
      store.dispatch('scripts/fetchData');
    };
    
    const selectScript = (script) => {
      store.dispatch('scripts/selectScript', script);
      // Clear any previous parameters
      scriptParams.value = {};
      
      // Initialize params with defaults if available
      if (script.params) {
        script.params.forEach(param => {
          if (param.default !== undefined) {
            scriptParams.value[param.name] = param.default;
          } else {
            scriptParams.value[param.name] = '';
          }
        });
      }
    };
    
    const executeScript = () => {
      if (selectedScript.value) {
        // Use script name instead of id since that's what the backend expects
        const scriptId = selectedScript.value.name || selectedScript.value.endpoint || selectedScript.value.id;
        console.log('Executing script:', scriptId, 'with params:', scriptParams.value);
        store.dispatch('scripts/runScript', {
          scriptId: scriptId,
          params: scriptParams.value
        }).then(result => {
          console.log('Script execution result:', result);
          if (result) {
            // Force an immediate refresh to pick up the new process
            refreshData();
          }
        });
      }
    };
    
    // Process actions
    const viewProcessDetails = async (process) => {
      // Before showing details, get the latest status
      try {
        const details = await store.dispatch('scripts/getProcessDetails', process.id);
        if (details) {
          selectedProcess.value = details;
        } else {
          selectedProcess.value = process;
        }
      } catch (error) {
        // Fall back to the process from the list
        selectedProcess.value = process;
      }
    };
    
    const closeProcessDetails = () => {
      selectedProcess.value = null;
    };
    
    const killProcess = (processId) => {
      if (confirm('Are you sure you want to terminate this process?')) {
        store.dispatch('scripts/killProcess', processId);
      }
    };
    
    // Initialize
    onMounted(() => {
      refreshData();
    });
    
    return {
      scripts,
      processes,
      isLoading,
      isExecuting,
      error,
      selectedScript,
      scriptOutput,
      formattedOutput,
      scriptParams,
      selectedProcess,
      refreshData,
      selectScript,
      executeScript,
      viewProcessDetails,
      closeProcessDetails,
      killProcess,
      formatDate,
      formatProcessOutput
    };
  }
};
</script>

<style scoped>
.script-details {
  padding: 1rem;
  background-color: #f9f9f9;
  border-radius: 4px;
}

.terminal {
  background-color: #2b2b2b;
  color: #f8f8f8;
  font-family: monospace;
  padding: 1rem;
  border-radius: 4px;
  overflow-y: auto;
  max-height: 200px;
  white-space: pre-wrap;
}

.table-container {
  max-height: 200px;
  overflow-y: auto;
}

.buttons.are-small .button {
  height: 2em;
  padding-left: 0.5em;
  padding-right: 0.5em;
}
</style>