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
    const minimizedModules = ref([]); // Now an array of module names
    const previousHeights = ref({});
    const minimizedBarWidth = ref(parseInt(localStorage.getItem('minimizedBarWidth')) || 60); // Default width
    const isResizing = ref(false);
    const startX = ref(0);
    const startWidth = ref(0);

    // Get global state values
    const isLoading = computed(() => store.getters['global/isLoading']);
    const error = computed(() => store.getters['global/error']);
    const activeModules = computed(() => store.getters['global/activeModules']);
    
    // Format the module name for display
    const formatModuleName = (moduleName) => {
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

    // Cleanup listeners when component is unmounted
    onUnmounted(() => {
      document.removeEventListener('mousemove', handleResize);
      document.removeEventListener('mouseup', stopResize);
    });
    
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
        // Optionally, store previous height if you want to restore
        const idx = layoutItems.value.findIndex(item => item.i === moduleId);
        if (idx !== -1) {
          previousHeights.value[moduleId] = layoutItems.value[idx].h;
        }
      }
    };
    
    // Restore a module (remove from bar, add to grid)
    const restoreModule = (moduleId) => {
      minimizedModules.value = minimizedModules.value.filter(m => m !== moduleId);
      // Optionally, restore previous height
      const idx = layoutItems.value.findIndex(item => item.i === moduleId);
      if (idx !== -1 && previousHeights.value[moduleId]) {
        layoutItems.value[idx].h = previousHeights.value[moduleId];
      }
    };
    
    // Update layout when grid items are moved or resized
    const layoutUpdated = (newLayout) => {
      layoutItems.value = newLayout;
      localStorage.setItem('dashboardLayout', JSON.stringify(newLayout));
    };
    
    // Reset dashboard layout
    const resetLayout = () => {
      // Clear all stored layout data
      localStorage.removeItem('dashboardLayout');
      localStorage.removeItem('dashboardPages');
      localStorage.removeItem('currentDashboardPage');
      localStorage.removeItem('minimizedModules');
      localStorage.removeItem('minimizedBarWidth');
      
      // Force page reload to start fresh
      window.location.reload();
    };
    
    // Set up initial layout
    const setupLayout = () => {
      try {
        // Clear previous state
        layoutError.value = false;
        
        // Create default layout
        if (activeModules.value.length > 0) {
          layoutItems.value = activeModules.value.map((module, index) => {
            const x = index % 2 === 0 ? 0 : 6; // Alternate between left and right columns
            const itemY = Math.floor(index / 2) * 4; // Stack vertically, 2 per row
            
            return {
              i: module,
              x: x,
              y: itemY,
              w: 6,
              h: 4,
              minW: 2,
              minH: 2
            };
          });
          
          localStorage.setItem('dashboardLayout', JSON.stringify(layoutItems.value));
          gridLoaded.value = true;
        }
      } catch (e) {
        console.error('Error setting up layout:', e);
        layoutError.value = true;
      }
    };
    
    // Initialize dashboard
    onMounted(() => {
      console.log('Dashboard view mounted');
      
      // First clear any potentially corrupted layout data
      try {
        // Try to parse saved layout - if it fails, it's corrupted
        const savedLayout = localStorage.getItem('dashboardLayout');
        if (savedLayout) {
          JSON.parse(savedLayout);
        }
        
        // Also check dashboard pages
        const savedPages = localStorage.getItem('dashboardPages');
        if (savedPages) {
          JSON.parse(savedPages);
        }
      } catch (e) {
        console.error('Found corrupted layout data, resetting...', e);
        localStorage.removeItem('dashboardLayout');
        localStorage.removeItem('dashboardPages');
        localStorage.removeItem('currentDashboardPage');
      }
      
      // Wait for modules to register
      const checkModules = setInterval(() => {
        if (activeModules.value.length > 0) {
          console.log(`Modules registered: ${activeModules.value.join(', ')}`);
          clearInterval(checkModules);
          setupLayout();
          store.dispatch('global/refreshAll');
        }
      }, 200);
      
      // Safety timeout after 3 seconds
      setTimeout(() => {
        clearInterval(checkModules);
        if (activeModules.value.length === 0) {
          console.error('No modules registered after timeout');
          layoutError.value = true;
        } else {
          setupLayout();
        }
      }, 3000);
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