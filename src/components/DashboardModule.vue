<template>
  <div class="dashboard-module box" :class="{ 'is-minimized': isMinimized }">
    <div class="module-header level is-mobile">
      <div class="level-left">
        <p class="level-item title is-6">{{ formattedModuleName }}</p>
      </div>
      <div class="level-right">
        <div class="level-item buttons are-small">
          <button class="button" @click="refreshModuleData" :disabled="isLoading" title="Refresh">
            <span class="icon">
              <i class="fas fa-sync" :class="{ 'fa-spin': isLoading }"></i>
            </span>
          </button>
          <button class="button" @click="toggleMinimize" title="Minimize/Restore">
            <span class="icon">
              <i :class="isMinimized ? 'fas fa-expand-alt' : 'fas fa-compress-alt'"></i>
            </span>
          </button>
        </div>
      </div>
    </div>
    <div v-if="!isMinimized" class="module-content">
      <div v-if="error" class="notification is-warning is-light is-size-7 p-2">
        <button class="delete is-small" @click="clearError"></button>
        <strong>Error:</strong> {{ error.message || 'Unknown error' }}
        <p v-if="error.details" class="mt-1">{{ JSON.stringify(error.details) }}</p>
      </div>
      <div v-if="componentLoading" class="has-text-centered p-4">
        <span class="icon is-medium">
          <i class="fas fa-spinner fa-pulse"></i>
        </span>
        <p class="is-size-7">Loading module...</p>
      </div>
      <component v-else-if="moduleComponent" :is="moduleComponent" />
      <div v-else class="notification is-light p-3">
        Module component not found or failed to load.
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, defineAsyncComponent, onMounted, watch, markRaw } from 'vue'; // Import markRaw
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
    const moduleComponent = ref(null);
    const componentLoading = ref(true);
    const componentError = ref(null);

    // Computed properties for module state
    const isLoading = computed(() => store.getters[`${props.moduleName}/isLoading`] || false);
    const error = computed(() => store.getters[`${props.moduleName}/error`]);

    // Format module name for display
    const formattedModuleName = computed(() => {
      return props.moduleName
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .trim();
    });

    // Load the specific module component dynamically
    const loadComponent = async () => {
      componentLoading.value = true;
      componentError.value = null;
      moduleComponent.value = null; // Reset component ref
      
      try {
        // Map module names to their corresponding component filenames
        const moduleComponentMap = {
          'terminal': 'CommandTerminalModule.vue',
          'system': 'SystemStatusModule.vue',
          'docker': 'DockerContainerModule.vue',
          'scripts': 'ScriptManagementModule.vue',
          'control': 'ControlPanelModule.vue'
        };
        
        // Use the mapping if available, otherwise use the default convention
        const componentFileName = moduleComponentMap[props.moduleName] || 
          `${formattedModuleName.value.replace(/\s+/g, '')}Module.vue`;
          
        console.log(`Loading component for ${props.moduleName} from: ${componentFileName}`);
        
        // Map module names to direct import functions based on known modules
        // This approach works better with Vite's static analysis
        let componentPromise;
        
        /* Handle each module with explicit imports instead of fully dynamic paths */
        switch (props.moduleName) {
          case 'terminal':
            componentPromise = import('../modules/terminal/components/CommandTerminalModule.vue');
            break;
          case 'system':
            componentPromise = import('../modules/system/components/SystemStatusModule.vue');
            break;
          case 'docker':
            componentPromise = import('../modules/docker/components/DockerContainerModule.vue');
            break;
          case 'scripts':
            componentPromise = import('../modules/scripts/components/ScriptManagementModule.vue');
            break;
          case 'control':
            componentPromise = import('../modules/control/components/ControlPanelModule.vue');
            break;
          default:
            // For custom modules, use a vite-ignore comment to suppress the warning
            // This fallback is needed but will likely not be used often
            componentPromise = import(
              /* @vite-ignore */ 
              `../modules/${props.moduleName}/components/${componentFileName}`
            );
            break;
        }
        
        // Process the import result
        const componentDefinition = await componentPromise;
        
        // Wrap the loaded component with markRaw to avoid reactivity warnings
        moduleComponent.value = markRaw(defineAsyncComponent(() => Promise.resolve(componentDefinition.default)));
        console.log(`Component for module "${props.moduleName}" loaded successfully`);
      } catch (e) {
        console.error(`Error loading component for module ${props.moduleName}:`, e);
        componentError.value = { message: `Failed to load component for ${props.moduleName}.`, details: e };
        // Dispatch a global error for the UI to display
        store.dispatch('global/setError', { 
            module: 'DashboardModule', 
            message: `Failed to load component for ${props.moduleName}`,
            details: e.message
        });
      } finally {
        componentLoading.value = false;
      }
    };

    // Function to refresh module data
    const refreshModuleData = () => {
      const actionName = `${props.moduleName}/fetchData`;
      // Check if the module exists and dispatch the action
      if (store.hasModule(props.moduleName)) {
         console.log(`Refreshing module: ${props.moduleName}`);
         store.dispatch(actionName).catch(err => {
           console.error(`Error refreshing module ${props.moduleName}:`, err);
           // Error is usually handled within the module's store action, but catch here too
         });
      } else {
         console.warn(`Module ${props.moduleName} not found in store. Skipping refresh.`);
      }
    };

    // Function to clear local module error
    const clearError = () => {
      const mutationName = `${props.moduleName}/SET_ERROR`;
       if (store.hasModule(props.moduleName) && store.mutations.hasOwnProperty(mutationName)) {
           store.commit(mutationName, null);
       } else {
            console.warn(`Mutation ${mutationName} not found for module ${props.moduleName}. Cannot clear error.`);
       }
    };

    // Toggle minimize state by emitting an event
    const toggleMinimize = () => {
      emit('toggle-minimized');
    };

    // Load component when the moduleName prop changes (though unlikely in current setup)
    watch(() => props.moduleName, loadComponent, { immediate: true });

    // Initial data fetch on mount if not minimized
    onMounted(() => {
      if (!props.isMinimized) {
        // Delay initial fetch slightly to allow component rendering
        // setTimeout(refreshModuleData, 100);
        // No need to call refreshModuleData here, global refreshAll handles it
      }
    });

    return {
      moduleComponent,
      componentLoading,
      componentError, // Expose component loading error state
      isLoading,
      error,
      formattedModuleName,
      refreshModuleData,
      clearError,
      toggleMinimize
    };
  }
};
</script>

<style scoped>
.dashboard-module {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden; /* Prevent content overflow */
}

.module-header {
  background-color: #f5f5f5;
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid #dbdbdb;
  flex-shrink: 0; /* Prevent header from shrinking */
}

.module-header .title {
  margin-bottom: 0; /* Override Bulma default */
}

.module-content {
  padding: 0.75rem;
  flex-grow: 1; /* Allow content to fill available space */
  overflow-y: auto; /* Add scroll if content overflows */
}

.dashboard-module.is-minimized .module-content {
  display: none;
}

/* Add styles for loading/error states within the module */
.notification.is-warning {
    font-size: 0.8rem;
}
.notification .delete {
    right: 0.5rem;
    top: 0.5rem;
}
</style>