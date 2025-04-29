<template>
  <div class="dashboard-container">
    <div 
      class="minimized-bar" 
      :style="{ width: minimizedBarWidth + 'px' }"
    >
      <div v-for="module in minimizedModules" :key="module" class="minimized-tab" @click="restoreModule(module)">
        <span>{{ formatModuleName(module) }}</span>
      </div>
      <div 
        class="resizer" 
        @mousedown="startResize"
      ></div>
    </div>
    <div class="main-dashboard-content">
      <div class="columns is-multiline">
        <div class="column is-12">
          <div class="level">
            <div class="level-left">
              <div class="level-item">
                <h1 class="title is-4">Dashboard</h1>
              </div>
            </div>
            <div class="level-right">
              <div class="level-item">
                <button class="button is-small" @click="resetLayout">
                  <span class="icon is-small">
                    <i class="fas fa-redo"></i>
                  </span>
                  <span>Reset Layout</span>
                </button>
              </div>
            </div>
          </div>
          <!-- Error banner -->
          <div v-if="error" class="notification is-danger">
            <button class="delete" @click="clearError"></button>
            <p><strong>Error:</strong> {{ error.message }}</p>
            <p v-if="error.details" class="is-size-7 mt-2">{{ error.details }}</p>
          </div>
        </div>
      </div>
      <!-- Dashboard modules simple layout when grid layout fails -->
      <div v-if="layoutError" class="columns is-multiline">
        <div v-for="module in activeModules" :key="module" class="column is-half">
          <DashboardModule :moduleName="module" />
        </div>
      </div>
      <!-- Dashboard modules grid layout -->
      <div v-else-if="gridLoaded">
        <grid-layout
          :layout="layoutItems"
          :col-num="12"
          :row-height="50"
          :is-draggable="true"
          :is-resizable="true"
          :vertical-compact="true"
          :use-css-transforms="true"
          :margin="[10, 10]"
          @layout-updated="layoutUpdated"
        >
          <grid-item 
            v-for="item in layoutItems.filter(i => !minimizedModules.includes(i.i))" 
            :key="item.i"
            :x="item.x"
            :y="item.y"
            :w="item.w"
            :h="item.h"
            :i="item.i"
            :min-w="2"
            :min-h="2"
          >
            <DashboardModule 
              :moduleName="item.i" 
              :isMinimized="false"
              @toggle-minimized="() => minimizeModule(item.i)"
            />
          </grid-item>
        </grid-layout>
      </div>
      <div v-else class="notification is-light has-text-centered p-6">
        <p>
          <span class="icon is-large">
            <i class="fas fa-spinner fa-pulse"></i>
          </span>
        </p>
        <p class="is-size-5 mt-2">Loading dashboard...</p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useStore } from 'vuex';
import { useDebounceFn } from '@vueuse/core';
import DashboardModule from '@/components/DashboardModule.vue';
import { GridLayout, GridItem } from 'vue3-grid-layout';

export default {
  name: 'DashboardView',
  components: {
    DashboardModule,
    GridLayout,
    GridItem
  },
  setup() {
    const store = useStore();
    const gridLoaded = ref(false);
    const layoutError = ref(false);
    const layoutItems = ref([]);
    
    // Load minimized modules from localStorage with proper validation
    const minimizedModules = ref((() => {
      try {
        const stored = localStorage.getItem('minimizedModules');
        if (!stored) return [];
        
        const parsed = JSON.parse(stored);
        // Ensure it's an array
        if (!Array.isArray(parsed)) {
          console.warn('minimizedModules in localStorage is not an array, resetting to empty array');
          localStorage.removeItem('minimizedModules');
          return [];
        }
        return parsed;
      } catch (e) {
        console.error('Error parsing minimizedModules from localStorage:', e);
        localStorage.removeItem('minimizedModules');
        return [];
      }
    })());
    
    const previousHeights = ref({});
    const minimizedBarWidth = ref(parseInt(localStorage.getItem('minimizedBarWidth')) || 60);
    const isResizing = ref(false);
    const startX = ref(0);
    const startWidth = ref(0);
    
    // Track whether layout has been initialized from localStorage
    const layoutInitialized = ref(false);

    // Get global state values
    const isLoading = computed(() => store.getters['global/isLoading']);
    const error = computed(() => store.getters['global/error']);
    const activeModules = computed(() => store.getters['global/activeModules']);
    
    // Format the module name for display
    const formatModuleName = (moduleName) => {
      // Check if moduleName is a string, if not return it as is or a default value
      if (typeof moduleName !== 'string') {
        console.warn(`formatModuleName received non-string value: ${moduleName}`);
        return moduleName?.toString() || 'Module';
      }
      
      return moduleName
        .replace(/([A-Z])/g, ' $1') // Add space before capital letters
        .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
        .trim();
    };
    
    // Resize handling functions
    const startResize = (event) => {
      isResizing.value = true;
      startX.value = event.clientX;
      startWidth.value = minimizedBarWidth.value;
      document.addEventListener('mousemove', handleResize);
      document.addEventListener('mouseup', stopResize);
    };

    const handleResize = (event) => {
      if (!isResizing.value) return;
      const diffX = event.clientX - startX.value;
      let newWidth = startWidth.value + diffX;
      // Add constraints (e.g., min/max width)
      newWidth = Math.max(50, Math.min(newWidth, 300)); // Min 50px, Max 300px
      minimizedBarWidth.value = newWidth;
    };

    const stopResize = () => {
      if (isResizing.value) {
        isResizing.value = false;
        document.removeEventListener('mousemove', handleResize);
        document.removeEventListener('mouseup', stopResize);
        // Save the final width
        localStorage.setItem('minimizedBarWidth', minimizedBarWidth.value);
      }
    };

    // Save layout to localStorage without debouncing
    const saveLayoutToLocalStorage = (layout) => {
      console.log('Saving layout to localStorage...');
      try {
        // Only include active modules in the layout (exclude minimized ones)
        const activeLayout = layout.filter(item => !minimizedModules.value.includes(item.i));
        localStorage.setItem('dashboardLayout', JSON.stringify(activeLayout));
        console.log('Layout saved successfully');
      } catch (e) {
        console.error('Error saving layout to localStorage:', e);
      }
    };

    // Update layout when grid items are moved or resized
    const layoutUpdated = (newLayout) => {
      console.log('Layout updated event triggered');
      // Update internal state
      layoutItems.value = newLayout;
      // Save to localStorage immediately
      saveLayoutToLocalStorage(newLayout);
    };
    
    // Clear any global errors
    const clearError = () => {
      store.dispatch('global/setError', null);
    };
    
    // Refresh module data
    const refreshModule = (moduleName) => {
      if (store.hasModule(moduleName)) {
        store.dispatch(`${moduleName}/fetchData`);
      }
    };
    
    // Minimize a module (remove from grid, add to bar)
    const minimizeModule = (moduleId) => {
      if (!minimizedModules.value.includes(moduleId)) {
        minimizedModules.value.push(moduleId);
        localStorage.setItem('minimizedModules', JSON.stringify(minimizedModules.value));
        const idx = layoutItems.value.findIndex(item => item.i === moduleId);
        if (idx !== -1) {
          previousHeights.value[moduleId] = layoutItems.value[idx].h;
        }
        // Save layout after minimizing
        saveLayoutToLocalStorage(layoutItems.value);
      }
    };
    
    // Restore a module (remove from bar, add to grid)
    const restoreModule = (moduleId) => {
      // First remove the module from minimized list
      minimizedModules.value = minimizedModules.value.filter(m => m !== moduleId);
      localStorage.setItem('minimizedModules', JSON.stringify(minimizedModules.value));
      
      // Check if the module already exists in layoutItems
      const idx = layoutItems.value.findIndex(item => item.i === moduleId);
      
      if (idx !== -1) {
        // If module exists in layout, just restore its previous height if we have it
        if (previousHeights.value[moduleId]) {
          layoutItems.value[idx].h = previousHeights.value[moduleId];
        }
      } else {
        // If module is not in layoutItems (e.g., after page refresh), add it with default values
        console.log(`Adding module ${moduleId} back to layout after restore`);
        
        // Find a reasonable position for the restored module
        // Either below existing modules or in a default 2-column layout
        let y = 0;
        let x = 0;
        
        if (layoutItems.value.length > 0) {
          // Find the maximum y position plus height to place the module below existing ones
          const maxY = Math.max(...layoutItems.value.map(item => item.y + item.h));
          y = maxY;
          
          // Alternate between left and right columns
          x = layoutItems.value.length % 2 === 0 ? 0 : 6;
        }
        
        // Create new layout item with default size
        const newItem = { 
          i: moduleId, 
          x: x,
          y: y, 
          w: 6, 
          h: previousHeights.value[moduleId] || 4, // Use previous height if available
          minW: 2, 
          minH: 2 
        };
        
        layoutItems.value.push(newItem);
      }
      
      // Save layout after restoring
      saveLayoutToLocalStorage(layoutItems.value);
    };
    
    // Reset dashboard layout
    const resetLayout = () => {
      localStorage.removeItem('dashboardLayout');
      localStorage.removeItem('minimizedModules');
      localStorage.removeItem('minimizedBarWidth');
      
      // Reset state variables
      minimizedModules.value = [];
      minimizedBarWidth.value = 60;
      layoutItems.value = [];
      
      // Create a new default layout
      setupDefaultLayout();
      
      // Save the default layout
      saveLayoutToLocalStorage(layoutItems.value);
    };

    // Set up default layout for all active modules
    const setupDefaultLayout = () => {
      console.log('Creating default layout');
      layoutItems.value = activeModules.value.map((module, index) => {
        const x = index % 2 === 0 ? 0 : 6;
        const itemY = Math.floor(index / 2) * 4;
        return { i: module, x, y: itemY, w: 6, h: 4, minW: 2, minH: 2 };
      });
      gridLoaded.value = true;
    };
    
    // Set up initial layout (either from storage or default)
    const setupLayout = () => {
      try {
        layoutError.value = false;
        
        // Try to load saved layout from localStorage
        const savedLayoutStr = localStorage.getItem('dashboardLayout');
        if (savedLayoutStr) {
          try {
            const savedLayout = JSON.parse(savedLayoutStr);
            
            if (Array.isArray(savedLayout) && savedLayout.length > 0) {
              console.log('Using saved layout from localStorage');
              
              // Filter saved layout to only include active modules
              const activeModuleSet = new Set(activeModules.value);
              layoutItems.value = savedLayout.filter(item => activeModuleSet.has(item.i));
              
              // Add any missing active modules to layout
              activeModules.value.forEach(module => {
                if (!layoutItems.value.some(item => item.i === module) && 
                    !minimizedModules.value.includes(module)) {
                  console.log(`Adding missing module to layout: ${module}`);
                  // Find next available position
                  const x = layoutItems.value.length % 2 === 0 ? 0 : 6;
                  const y = Math.floor(layoutItems.value.length / 2) * 4;
                  layoutItems.value.push({ i: module, x, y, w: 6, h: 4, minW: 2, minH: 2 });
                }
              });
              
              gridLoaded.value = true;
              layoutInitialized.value = true;
              return; // Exit early, we loaded a saved layout
            }
          } catch (e) {
            console.error('Error parsing saved layout, will use default:', e);
            localStorage.removeItem('dashboardLayout'); // Clear corrupt data
          }
        }
        
        // If we get here, either there was no saved layout or it failed to load
        // Create default layout
        setupDefaultLayout();
        layoutInitialized.value = true;
        
      } catch (e) {
        console.error('Error setting up layout:', e);
        layoutError.value = true;
        gridLoaded.value = false;
      }
    };
    
    // Initialize dashboard
    onMounted(() => {
      console.log('Dashboard view mounted');
      
      // Wait for modules to register
      const checkModulesInterval = setInterval(() => {
        if (activeModules.value.length > 0) {
          console.log(`Modules registered: ${activeModules.value.join(', ')}`);
          clearInterval(checkModulesInterval);
          
          // Set up layout once modules are available
          setupLayout();
          store.dispatch('global/refreshAll');
        }
      }, 100);
      
      // Safety timeout after 3 seconds
      const safetyTimeout = setTimeout(() => {
        clearInterval(checkModulesInterval);
        if (!gridLoaded.value && activeModules.value.length > 0) {
          console.warn('Timeout reached. Forcing layout setup.');
          setupLayout();
          store.dispatch('global/refreshAll');
        } else if (activeModules.value.length === 0) {
          console.error('No modules registered after timeout');
          layoutError.value = true;
        }
      }, 3000);
      
      // Cleanup on unmount
      onUnmounted(() => {
        clearInterval(checkModulesInterval);
        clearTimeout(safetyTimeout);
        document.removeEventListener('mousemove', handleResize);
        document.removeEventListener('mouseup', stopResize);
      });
    });

    return {
      isLoading,
      error,
      activeModules,
      clearError,
      layoutError,
      gridLoaded,
      layoutItems,
      minimizedModules,
      minimizeModule,
      restoreModule,
      formatModuleName,
      refreshModule,
      layoutUpdated,
      resetLayout,
      minimizedBarWidth,
      startResize
    };
  }
};
</script>

<style scoped>
.dashboard-container {
  display: flex;
  flex-direction: row;
  padding: 1rem;
}

.minimized-bar {
  position: relative; /* Needed for absolute positioning of resizer */
  min-width: 50px;
  background: #f5f5f5;
  border-radius: 8px;
  margin-right: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.5rem 0;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  height: calc(100vh - 2rem);
  overflow: hidden; /* Hide overflowing content during resize */
  transition: width 0.1s ease-out;
}

.resizer {
  position: absolute;
  top: 0;
  right: 0;
  width: 5px; /* Width of the draggable area */
  height: 100%;
  cursor: col-resize; /* Indicate resizability */
  background: transparent; /* Make it invisible, relies on cursor */
  z-index: 10; /* Ensure it's above other content */
}

.resizer:hover {
  background: rgba(0, 0, 0, 0.05); /* Slight visual feedback on hover */
}

.minimized-tab {
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 6px;
  margin: 0.5rem 0;
  padding: 0.5rem 0.25rem;
  width: calc(100% - 12px);
  text-align: center;
  cursor: pointer;
  font-size: 0.85em;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  transition: background 0.2s;
  white-space: nowrap; /* Prevent text wrapping */
  overflow: hidden; /* Hide text that doesn't fit */
  text-overflow: ellipsis; /* Add ellipsis (...) for overflow */
  box-sizing: border-box;
}

.minimized-tab:hover {
  background: #e0e0e0;
}

.main-dashboard-content {
  flex: 1;
  overflow-x: auto; /* Allow horizontal scroll if content overflows */
}
</style>