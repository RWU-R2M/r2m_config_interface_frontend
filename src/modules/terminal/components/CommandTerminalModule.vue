<template>
  <div class="card module-container">
    <header class="card-header">
      <p class="card-header-title">
        Command Terminal
      </p>
      <button 
        class="card-header-icon" 
        aria-label="clear" 
        @click="clearOutput"
      >
        <span class="icon">
          <i class="fas fa-trash-alt"></i>
        </span>
      </button>
    </header>
    <div class="card-content">
      <!-- Terminal Output -->
      <div class="terminal" ref="terminalOutput">
        <div v-if="output" v-html="formattedOutput"></div>
        <div v-else class="terminal-placeholder">
          Enter a command below or select a preset command.
        </div>
      </div>
      
      <!-- Command Input -->
      <div class="field has-addons mt-3">
        <div class="control is-expanded">
          <input 
            class="input" 
            type="text" 
            v-model="command" 
            placeholder="Enter command..."
            @keyup.enter="executeCommand"
            :disabled="isExecuting"
          >
        </div>
        <div class="control">
          <button 
            class="button is-primary" 
            @click="executeCommand"
            :class="{ 'is-loading': isExecuting }"
            :disabled="isExecuting || !command.trim()"
          >
            Run
          </button>
        </div>
      </div>
      
      <!-- Preset Commands -->
      <div class="field mt-3">
        <label class="label is-small">Preset Commands</label>
        <div class="buttons are-small">
          <button 
            v-for="preset in presetCommands" 
            :key="preset.command"
            class="button is-light"
            @click="runPresetCommand(preset.command)"
            :disabled="isExecuting"
          >
            {{ preset.name }}
          </button>
        </div>
      </div>
      
      <!-- Command History -->
      <div class="field mt-3" v-if="commandHistory.length > 0">
        <label class="label is-small">Command History</label>
        <div class="select is-small is-fullwidth">
          <select @change="selectHistoryCommand" v-model="selectedHistoryCommand">
            <option value="">Select from history...</option>
            <option 
              v-for="(cmd, index) in commandHistory" 
              :key="index" 
              :value="cmd"
            >
              {{ cmd }}
            </option>
          </select>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, nextTick, onMounted } from 'vue';
import { useStore } from 'vuex';

export default {
  name: 'CommandTerminalModule',
  
  setup() {
    const store = useStore();
    const command = ref('');
    const terminalOutput = ref(null);
    const selectedHistoryCommand = ref('');
    
    // Computed properties from store
    const output = computed(() => store.getters['terminal/output']);
    const isExecuting = computed(() => store.getters['terminal/isExecuting']);
    const error = computed(() => store.getters['terminal/error']);
    const commandHistory = computed(() => store.getters['terminal/commandHistory']);
    const presetCommands = computed(() => store.getters['terminal/presetCommands']);
    
    // Format the output with ANSI color codes converted to HTML
    const formattedOutput = computed(() => {
      // Replace newlines with <br> and maintain spaces
      return output.value
        .replace(/\n/g, '<br>')
        .replace(/ /g, '&nbsp;');
    });
    
    // Execute the current command
    const executeCommand = async () => {
      if (command.value.trim() && !isExecuting.value) {
        await store.dispatch('terminal/executeCommand', command.value);
        command.value = '';
        selectedHistoryCommand.value = '';
      }
    };
    
    // Run a preset command
    const runPresetCommand = async (cmd) => {
      command.value = cmd;
      await executeCommand();
    };
    
    // Clear the terminal output
    const clearOutput = () => {
      store.dispatch('terminal/clearOutput');
    };
    
    // Select a command from history
    const selectHistoryCommand = () => {
      if (selectedHistoryCommand.value) {
        command.value = selectedHistoryCommand.value;
      }
    };
    
    // Scroll to bottom when output changes
    watch(output, () => {
      nextTick(() => {
        if (terminalOutput.value) {
          terminalOutput.value.scrollTop = terminalOutput.value.scrollHeight;
        }
      });
    });
    
    // Initialize
    onMounted(() => {
      // Focus the input element
      nextTick(() => {
        const inputEl = document.querySelector('.card-content .input');
        if (inputEl) {
          inputEl.focus();
        }
      });
    });
    
    return {
      command,
      terminalOutput,
      selectedHistoryCommand,
      output,
      formattedOutput,
      isExecuting,
      error,
      commandHistory,
      presetCommands,
      executeCommand,
      runPresetCommand,
      clearOutput,
      selectHistoryCommand
    };
  }
};
</script>

<style scoped>
.terminal {
  height: 250px;
  overflow-y: auto;
  background-color: #2b2b2b;
  color: #f8f8f8;
  font-family: monospace;
  padding: 1rem;
  border-radius: 4px;
}

.terminal-placeholder {
  opacity: 0.5;
  font-style: italic;
}

.buttons.are-small {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}
</style>