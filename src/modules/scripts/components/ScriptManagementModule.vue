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
        <!-- Button to open script selection modal -->
        <div class="field">
          <button class="button is-link" @click="isScriptModalActive = true">
            <span class="icon is-small">
              <i class="fas fa-file-code"></i>
            </span>
            <span>Select Script</span>
          </button>
        </div>

        <!-- Selected Script Details -->
        <div v-if="selectedScript" class="script-details mt-4">
          <div class="field">
            <label class="label">{{ selectedScript.name }}</label>
            <p class="help">{{ selectedScript.script_path }}</p> <!-- Display path -->
            <p>{{ selectedScript.description }}</p>
          </div>
          
          <!-- Script Parameters -->
          <!-- Check input_schema.properties instead of params -->
          <div class="field" v-if="selectedScript.input_schema && selectedScript.input_schema.properties && Object.keys(selectedScript.input_schema.properties).length > 0">
            <label class="label">Parameters</label>
            <div class="columns is-multiline">
              <!-- Iterate over properties object -->
              <div 
                v-for="(paramSchema, paramName) in selectedScript.input_schema.properties" 
                :key="paramName"
                class="column is-half"
              >
                <div class="field">
                  <!-- Use paramName as label -->
                  <label class="label is-small">{{ paramName }}</label>
                  <div class="control">
                    <input 
                      class="input is-small"
                      :type="paramSchema.type === 'number' ? 'number' : 'text'"
                      :value="scriptParams[paramName]"
                      @input="scriptParams[paramName] = paramSchema.type === 'number' ? Number($event.target.value) : $event.target.value"
                      :placeholder="paramSchema.description || ''"
                    >
                  </div>
                  <!-- Use paramSchema.description -->
                  <p class="help" v-if="paramSchema.description">{{ paramSchema.description }}</p>
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
    
    <!-- Script Selection Modal -->
    <div class="modal" :class="{ 'is-active': isScriptModalActive }">
      <div class="modal-background" @click="isScriptModalActive = false"></div>
      <div class="modal-card">
        <header class="modal-card-head">
          <p class="modal-card-title">Select Script</p>
          <button class="delete" aria-label="close" @click="isScriptModalActive = false"></button>
        </header>
        <section class="modal-card-body">
          <!-- Search Input -->
          <div class="field">
            <div class="control has-icons-left">
              <input class="input" type="text" placeholder="Search scripts by name or path..." v-model="searchTerm">
              <span class="icon is-small is-left">
                <i class="fas fa-search"></i>
              </span>
            </div>
          </div>
          <!-- Script List -->
          <div class="list has-hoverable-list-items script-list-container">
             <a v-for="script in filteredScripts" 
                :key="script.id || script.name" 
                class="list-item" 
                :class="{ 'is-active': selectedScript && (selectedScript.id === script.id || selectedScript.name === script.name) }"
                @click="handleScriptSelect(script)">
                <div class="list-item-content">
                   <div class="list-item-title">{{ script.name }}</div>
                   <div class="list-item-description">{{ script.script_path }}</div>
                </div>
             </a>
             <div v-if="filteredScripts.length === 0" class="list-item">
                No scripts found matching "{{ searchTerm }}".
             </div>
          </div>
        </section>
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
    const isScriptModalActive = ref(false); // Control modal visibility
    const searchTerm = ref(''); // Search term for filtering scripts

    // Computed properties from store
    const scripts = computed(() => store.getters['scripts/scripts']);
    const processes = computed(() => store.getters['scripts/processes']);
    const isLoading = computed(() => store.getters['scripts/isLoading']);
    const isExecuting = computed(() => store.getters['scripts/isExecuting']);
    const error = computed(() => store.getters['scripts/error']);
    const selectedScript = computed(() => store.getters['scripts/selectedScript']);
    const scriptOutput = computed(() => store.getters['scripts/scriptOutput']);

    // Filtered scripts based on search term
    const filteredScripts = computed(() => {
      if (!searchTerm.value) {
        return scripts.value;
      }
      const lowerSearchTerm = searchTerm.value.toLowerCase();
      return scripts.value.filter(script => 
        (script.name && script.name.toLowerCase().includes(lowerSearchTerm)) ||
        (script.script_path && script.script_path.toLowerCase().includes(lowerSearchTerm))
      );
    });
    
    // Format the output with newlines converted to <br>
    const formattedOutput = computed(() => {
      // Ensure scriptOutput is a string before using string methods
      if (!scriptOutput.value) return '';
      
      const outputStr = typeof scriptOutput.value === 'string' 
        ? scriptOutput.value 
        : JSON.stringify(scriptOutput.value, null, 2);
      
      return outputStr
        .replace(/\\n/g, '<br>') // Handle escaped newlines if present
        .replace(/\n/g, '<br>')
        .replace(/ /g, '&nbsp;');
    });
    
    // Format process output for HTML display
    const formatProcessOutput = (output) => {
      if (!output) return '';
      return String(output) // Ensure output is a string
        .replace(/\\n/g, '<br>') // Handle escaped newlines if present
        .replace(/\n/g, '<br>')
        .replace(/ /g, '&nbsp;');
    };
    
    // Format date for display
    const formatDate = (dateString) => {
      if (!dateString) return 'N/A';
      try {
        const date = new Date(dateString);
        // Check if date is valid
        if (isNaN(date.getTime())) {
          return 'Invalid Date';
        }
        return date.toLocaleString();
      } catch (e) {
        console.error("Error formatting date:", dateString, e);
        return 'Invalid Date';
      }
    };
    
    // Script actions
    const refreshData = () => {
      store.dispatch('scripts/fetchData');
    };
    
    // Renamed original selectScript to handleScriptSelect to avoid naming conflict
    const handleScriptSelect = (script) => {
      store.dispatch('scripts/selectScript', script);
      isScriptModalActive.value = false; // Close modal after selection
      // Clear any previous parameters
      scriptParams.value = {};
      
      // Initialize params with defaults if available, reading from input_schema.properties
      if (script.input_schema && script.input_schema.properties) {
        Object.keys(script.input_schema.properties).forEach(paramName => {
          const paramSchema = script.input_schema.properties[paramName];
          // Use paramSchema.default if available (assuming schema might have defaults)
          if (paramSchema.default !== undefined) {
            scriptParams.value[paramName] = paramSchema.default;
          } else {
            // Initialize based on type
            scriptParams.value[paramName] = paramSchema.type === 'number' ? 0 : '';
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
          // If details fetch fails, show the basic info from the list
          selectedProcess.value = { ...process }; 
        }
      } catch (error) {
        console.error("Error fetching process details, showing basic info:", error);
        // Fall back to the process from the list
        selectedProcess.value = { ...process };
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
      isScriptModalActive, // Expose modal state
      searchTerm,          // Expose search term
      filteredScripts,     // Expose filtered scripts
      refreshData,
      handleScriptSelect,  // Expose the selection handler
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
  max-height: 200px; /* Keep output height reasonable */
  white-space: pre-wrap;
  word-wrap: break-word; /* Ensure long lines wrap */
}

.table-container {
  max-height: 200px; /* Keep process list height reasonable */
  overflow-y: auto;
}

.buttons.are-small .button {
  height: 2em;
  padding-left: 0.5em;
  padding-right: 0.5em;
}

/* Style for the script list in the modal */
.script-list-container {
  max-height: 40vh; /* Limit height of the list */
  overflow-y: auto; /* Add scrollbar if needed */
  border: 1px solid #dbdbdb; /* Add border */
  border-radius: 4px;
}

.list-item {
  border-bottom: 1px solid #eee; /* Separator */
}
.list-item:last-child {
  border-bottom: none;
}
.list-item-description {
  font-size: 0.85em;
  color: #7a7a7a;
}
</style>