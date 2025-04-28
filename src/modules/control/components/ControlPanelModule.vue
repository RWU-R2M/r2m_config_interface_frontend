<template>
  <div class="card module-container">
    <header class="card-header">
      <p class="card-header-title">
        Control Panel
      </p>
    </header>
    <div class="card-content">
      <div class="buttons">
        <!-- Emergency Stop -->
        <button 
          class="button is-danger is-fullwidth" 
          @click="confirmAction('emergency-stop')"
          :class="{ 'is-loading': isPerformingAction }"
          :disabled="isPerformingAction"
        >
          <span class="icon">
            <i class="fas fa-power-off"></i>
          </span>
          <span>Emergency Stop</span>
        </button>
        
        <!-- Reboot System -->
        <button 
          class="button is-warning is-fullwidth" 
          @click="confirmAction('reboot')"
          :class="{ 'is-loading': isPerformingAction }"
          :disabled="isPerformingAction"
        >
          <span class="icon">
            <i class="fas fa-sync"></i>
          </span>
          <span>Reboot System</span>
        </button>
        
        <!-- Shutdown System -->
        <button 
          class="button is-dark is-fullwidth" 
          @click="confirmAction('shutdown')"
          :class="{ 'is-loading': isPerformingAction }"
          :disabled="isPerformingAction"
        >
          <span class="icon">
            <i class="fas fa-power-off"></i>
          </span>
          <span>Shutdown System</span>
        </button>
      </div>
      
      <div v-if="error" class="notification is-danger mt-3">
        <p>{{ error.message }}</p>
      </div>
    </div>
    
    <!-- Confirmation Modal -->
    <div class="modal" :class="{ 'is-active': confirmingAction }">
      <div class="modal-background" @click="cancelAction"></div>
      <div class="modal-card">
        <header class="modal-card-head">
          <p class="modal-card-title">Confirm Action</p>
          <button class="delete" aria-label="close" @click="cancelAction"></button>
        </header>
        <section class="modal-card-body">
          <p>Are you sure you want to {{ getActionName(confirmingAction) }}?</p>
          <p class="has-text-danger" v-if="confirmingAction === 'emergency-stop'">
            <strong>Warning:</strong> Emergency Stop will halt all operations immediately. This may cause data loss or system instability.
          </p>
        </section>
        <footer class="modal-card-foot">
          <button 
            class="button" 
            :class="getActionClass(confirmingAction)"
            @click="executeAction"
            :disabled="isPerformingAction"
          >
            Confirm
          </button>
          <button class="button" @click="cancelAction">Cancel</button>
        </footer>
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue';
import { useStore } from 'vuex';

export default {
  name: 'ControlPanelModule',
  
  setup() {
    const store = useStore();
    
    // Computed properties from store
    const isPerformingAction = computed(() => store.getters['control/isPerformingAction']);
    const lastAction = computed(() => store.getters['control/lastAction']);
    const error = computed(() => store.getters['control/error']);
    const confirmingAction = computed(() => store.getters['control/confirmingAction']);
    
    // Prepare to confirm an action
    const confirmAction = (action) => {
      store.dispatch('control/setConfirmingAction', action);
    };
    
    // Cancel a pending action
    const cancelAction = () => {
      store.dispatch('control/setConfirmingAction', null);
    };
    
    // Execute the confirmed action
    const executeAction = () => {
      if (confirmingAction.value) {
        store.dispatch('control/performAction', confirmingAction.value);
      }
    };
    
    // Get a user-friendly name for the action
    const getActionName = (action) => {
      switch (action) {
        case 'emergency-stop':
          return 'perform an emergency stop';
        case 'reboot':
          return 'reboot the system';
        case 'shutdown':
          return 'shut down the system';
        default:
          return action;
      }
    };
    
    // Get the appropriate button class for the action
    const getActionClass = (action) => {
      switch (action) {
        case 'emergency-stop':
          return 'is-danger';
        case 'reboot':
          return 'is-warning';
        case 'shutdown':
          return 'is-dark';
        default:
          return 'is-primary';
      }
    };
    
    return {
      isPerformingAction,
      lastAction,
      error,
      confirmingAction,
      confirmAction,
      cancelAction,
      executeAction,
      getActionName,
      getActionClass
    };
  }
};
</script>

<style scoped>
.buttons {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
</style>