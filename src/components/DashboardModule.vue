<template>
  <div class="dashboard-module">
    <div class="box">
      <div class="module-header">
        <h3 class="title is-5">{{ displayName }}</h3>
        <div class="module-controls">
          <!-- Add fold/unfold toggle button -->
          <button 
            class="button is-small" 
            @click="toggleMinimized"
            title="Toggle module visibility"
          >
            <span class="icon">
              <i class="fas" :class="isMinimized ? 'fa-expand' : 'fa-compress'"></i>
            </span>
          </button>
          <!-- Keep existing refresh button -->
          <button 
            class="button is-small" 
            @click="refreshModule" 
            :class="{ 'is-loading': isLoading }"
            title="Refresh module data"
          >
            <span class="icon">
              <i class="fas fa-sync-alt"></i>
            </span>
          </button>
        </div>
      </div>
      
      <div v-if="error" class="notification is-danger is-light">
        <button class="delete" @click="clearError"></button>
        Error: {{ error.message }}
      </div>
      
      <!-- Add v-show with animation classes for minimizing -->
      <div class="module-content" :class="{ 'is-minimized': isMinimized }">
        <component v-if="loadedComponent" :is="loadedComponent" />
        <div v-else-if="isLoading" class="has-text-centered p-4">
          <span class="icon is-large">
            <i class="fas fa-spinner fa-pulse"></i>
          </span>
        </div>
        <div v-else class="notification is-warning">
          Module "{{ moduleName }}" not found or not properly registered.
          <div class="mt-2">
            <button class="button is-small" @click="attemptReload">
              <span class="icon is-small">
                <i class="fas fa-redo"></i>
              </span>
              <span>Attempt Reload</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, defineAsyncComponent, onMounted, watch } from 'vue';
import { useStore } from 'vuex';

export default {
  name: 'DashboardModule',
  props: {
    moduleName: {
      type: String,
      required: true
    },
    isMinimized: {
      type: Boolean,
      default: false
    }
  },
  emits: ['toggle-minimized'],
  setup(props, { emit }) {
    const store = useStore();
    const loadedComponent = ref(null);
    const loadError = ref(null);
    
    // Global state
    const isLoading = computed(() => {
      // Check if module exists first
      if (store.hasModule(props.moduleName)) {
        return store.getters[`${props.moduleName}/isLoading`] || false;
      }
      return false;
    });
    
    const error = computed(() => {
      // Check for module-specific error first
      if (store.hasModule(props.moduleName)) {
        return store.getters[`${props.moduleName}/error`] || null;
      }
      // Return load error if we have one
      return loadError.value;
    });
    
    // Format the module name for display (capitalize and add spaces)
    const displayName = computed(() => {
      return props.moduleName
        .replace(/([A-Z])/g, ' $1') // Add space before capital letters
        .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
        .trim();
    });
    
    // Toggle minimized state
    const toggleMinimized = () => {
      emit('toggle-minimized');
    };
    
    // Attempt to dynamically import the component
    const loadComponent = async () => {
      try {
        loadError.value = null;
        
        // The module registry approach
        const components = {
          'system': defineAsyncComponent(() => import('@/modules/system/components/SystemStatusModule.vue')),
          'docker': defineAsyncComponent(() => import('@/modules/docker/components/DockerContainerModule.vue')),
          'terminal': defineAsyncComponent(() => import('@/modules/terminal/components/CommandTerminalModule.vue')),
          'scripts': defineAsyncComponent(() => import('@/modules/scripts/components/ScriptManagementModule.vue')),
          'control': defineAsyncComponent(() => import('@/modules/control/components/ControlPanelModule.vue'))
        };
        
        if (components[props.moduleName]) {
          loadedComponent.value = components[props.moduleName];
          console.log(`Component for module "${props.moduleName}" loaded successfully`);
        } else {
          console.error(`Module component for "${props.moduleName}" not found in registry`);
          loadError.value = {
            message: `Component for module "${props.moduleName}" not found`
          };
        }
      } catch (err) {
        console.error(`Failed to load module "${props.moduleName}":`, err);
        loadError.value = {
          message: `Failed to load: ${err.message}`
        };
      }
    };
    
    // Refresh the module data
    const refreshModule = () => {
      if (store.hasModule(props.moduleName)) {
        console.log(`Refreshing module: ${props.moduleName}`);
        store.dispatch(`${props.moduleName}/fetchData`);
      } else {
        console.warn(`Module "${props.moduleName}" not registered with store`);
        loadError.value = {
          message: `Module "${props.moduleName}" not registered with store`
        };
      }
    };
    
    // Clear module error
    const clearError = () => {
      if (store.hasModule(props.moduleName)) {
        store.dispatch(`${props.moduleName}/clearError`);
      }
      loadError.value = null;
    };
    
    // Attempt to reload the module
    const attemptReload = () => {
      console.log(`Attempting to reload module: ${props.moduleName}`);
      loadComponent();
      refreshModule();
    };
    
    // Watch for changes to the module name prop
    watch(() => props.moduleName, (newName, oldName) => {
      if (newName !== oldName) {
        console.log(`Module name changed from ${oldName} to ${newName}, reloading`);
        loadComponent();
        refreshModule();
      }
    });
    
    // Load component on mount
    onMounted(() => {
      loadComponent();
      refreshModule();
    });
    
    return {
      loadedComponent,
      isLoading,
      error,
      displayName,
      refreshModule,
      clearError,
      attemptReload,
      isMinimized: computed(() => props.isMinimized),
      toggleMinimized
    };
  }
};
</script>

<style scoped>
.dashboard-module {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.box {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 1rem;
  margin: 0; /* Remove margin for grid layout */
}

.module-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  cursor: move; /* Indicate the header can be used to drag */
}

.module-content {
  flex: 1;
  overflow: auto;
  transition: max-height 0.3s ease-out, opacity 0.3s ease-out;
  max-height: 1000px; /* Set a high initial value */
  opacity: 1;
}

.module-content.is-minimized {
  max-height: 0;
  opacity: 0;
  overflow: hidden;
  margin: 0;
  padding: 0;
}

.module-controls {
  display: flex;
  gap: 0.5rem;
}
</style>