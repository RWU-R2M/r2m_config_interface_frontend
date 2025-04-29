// Global store module
const state = {
  isLoading: false,
  error: null,
  refreshInterval: parseInt(localStorage.getItem('refreshInterval')) || 
                   parseInt(import.meta.env.VITE_REFRESH_INTERVAL) || 
                   30000, // 30 seconds default
  lastRefresh: null,
  activeModules: [],
  // Add dashboard pages feature
  dashboardPages: JSON.parse(localStorage.getItem('dashboardPages')) || [
    { id: 'default', name: 'Main Dashboard', modules: [] }
  ],
  currentPageId: localStorage.getItem('currentDashboardPage') || 'default',
  // Store module layouts (position, size)
  moduleLayouts: JSON.parse(localStorage.getItem('moduleLayouts')) || {}
};

const mutations = {
  SET_LOADING(state, isLoading) {
    state.isLoading = isLoading;
  },
  SET_ERROR(state, error) {
    state.error = error;
  },
  SET_LAST_REFRESH(state) {
    state.lastRefresh = new Date();
  },
  REGISTER_MODULE(state, moduleName) {
    if (!state.activeModules.includes(moduleName)) {
      state.activeModules.push(moduleName);
      console.log(`Module ${moduleName} registered in global store, active modules:`, state.activeModules);
      
      // Add this module to the default page if it doesn't exist on any page
      let moduleExists = false;
      state.dashboardPages.forEach(page => {
        if (page.modules.some(m => m.id === moduleName)) {
          moduleExists = true;
        }
      });
      
      if (!moduleExists) {
        // Find default page
        const defaultPage = state.dashboardPages.find(p => p.id === 'default') || state.dashboardPages[0];
        defaultPage.modules.push({
          id: moduleName,
          x: 0,
          y: defaultPage.modules.length, // Place it below existing modules
          w: 1,
          h: 1,
          minimized: false
        });
        // Save to localStorage
        localStorage.setItem('dashboardPages', JSON.stringify(state.dashboardPages));
      }
    }
  },
  SET_REFRESH_INTERVAL(state, interval) {
    state.refreshInterval = interval;
    // Save to localStorage for persistence
    localStorage.setItem('refreshInterval', interval);
  },
  // New mutations for dashboard pages
  ADD_DASHBOARD_PAGE(state, page) {
    state.dashboardPages.push(page);
    localStorage.setItem('dashboardPages', JSON.stringify(state.dashboardPages));
  },
  REMOVE_DASHBOARD_PAGE(state, pageId) {
    // Don't remove if it's the last page
    if (state.dashboardPages.length <= 1) return;
    
    state.dashboardPages = state.dashboardPages.filter(p => p.id !== pageId);
    
    // If current page was removed, switch to first available page
    if (state.currentPageId === pageId) {
      state.currentPageId = state.dashboardPages[0].id;
      localStorage.setItem('currentDashboardPage', state.currentPageId);
    }
    
    localStorage.setItem('dashboardPages', JSON.stringify(state.dashboardPages));
  },
  SET_CURRENT_PAGE(state, pageId) {
    state.currentPageId = pageId;
    localStorage.setItem('currentDashboardPage', pageId);
  },
  UPDATE_PAGE_NAME(state, { pageId, name }) {
    const page = state.dashboardPages.find(p => p.id === pageId);
    if (page) {
      page.name = name;
      localStorage.setItem('dashboardPages', JSON.stringify(state.dashboardPages));
    }
  },
  UPDATE_MODULE_LAYOUT(state, { pageId, layouts }) {
    const page = state.dashboardPages.find(p => p.id === pageId);
    if (page) {
      page.modules = layouts;
      localStorage.setItem('dashboardPages', JSON.stringify(state.dashboardPages));
    }
  },
  TOGGLE_MODULE_MINIMIZED(state, { pageId, moduleId }) {
    const page = state.dashboardPages.find(p => p.id === pageId);
    if (page) {
      const module = page.modules.find(m => m.id === moduleId);
      if (module) {
        module.minimized = !module.minimized;
        localStorage.setItem('dashboardPages', JSON.stringify(state.dashboardPages));
      }
    }
  }
};

const actions = {
  setLoading({ commit }, isLoading) {
    commit('SET_LOADING', isLoading);
  },
  
  setError({ commit }, error) {
    commit('SET_ERROR', error);
  },
  
  registerModule({ commit }, moduleName) {
    console.log(`Registering module in global store: ${moduleName}`);
    commit('REGISTER_MODULE', moduleName);
  },
  
  refreshAll({ dispatch, state, commit }) {
    // Set last refresh time
    commit('SET_LAST_REFRESH');
    commit('SET_LOADING', true);
    
    // Track the number of modules that have completed their refresh
    let completedCount = 0;
    const totalModules = state.activeModules.length;
    
    // No modules to refresh
    if (totalModules === 0) {
      commit('SET_LOADING', false);
      return;
    }
    
    // Function to check if all modules have completed
    const checkCompletion = () => {
      completedCount++;
      if (completedCount >= totalModules) {
        commit('SET_LOADING', false);
      }
    };
    
    // Group modules by priority and refresh strategy
    // System data is fetched first as it's used by other modules
    const highPriorityModules = ['system']; 
    
    // Some modules share data sources, so we can optimize them
    const sharedDataGroups = {
      scripts: ['scripts'], // scripts module also loads processes data
      docker: ['docker']
    };
    
    // Get modules that need individual refresh and aren't in other groups
    const individualModules = state.activeModules.filter(
      module => module !== 'global' && 
                !highPriorityModules.includes(module) &&
                !Object.values(sharedDataGroups).flat().includes(module)
    );
    
    const refreshModule = (module) => {
      try {
        // Use Promise.resolve to handle both synchronous and asynchronous dispatch results
        return Promise.resolve(dispatch(`${module}/fetchData`, null, { root: true }))
          .then(() => {
            console.log(`Module ${module} refresh completed`);
            checkCompletion();
          })
          .catch(error => {
            console.error(`Error refreshing module ${module}:`, error);
            checkCompletion();
          });
      } catch (error) {
        console.error(`Failed to dispatch fetchData for module ${module}:`, error);
        checkCompletion();
        return Promise.resolve(); // Return resolved promise to continue chain
      }
    };
    
    // Function to process modules with a delay
    const processWithDelay = (modules, delay) => {
      if (modules.length === 0) return Promise.resolve();
      
      const [currentModule, ...remainingModules] = modules;
      
      return refreshModule(currentModule)
        .then(() => {
          if (remainingModules.length > 0) {
            return new Promise(resolve => {
              setTimeout(() => {
                resolve(processWithDelay(remainingModules, delay));
              }, delay);
            });
          }
        });
    };
    
    // Process modules in sequence with optimized grouping
    Promise.resolve()
      // First load high priority modules (system)
      .then(() => processWithDelay(highPriorityModules, 0))
      // Then load shared data groups one by one with a small delay
      .then(() => {
        // Process each shared data group
        const processGroups = (groupKeys) => {
          if (groupKeys.length === 0) return Promise.resolve();
          
          const [currentKey, ...remainingKeys] = groupKeys;
          const modules = sharedDataGroups[currentKey].filter(
            module => state.activeModules.includes(module)
          );
          
          // Only process this group if it has active modules
          if (modules.length > 0) {
            // Only process the first module in each group since it loads shared data
            return refreshModule(modules[0])
              .then(() => {
                // Mark all modules in this group as completed
                modules.slice(1).forEach(() => checkCompletion());
                
                // Process next group after a delay
                return new Promise(resolve => {
                  setTimeout(() => {
                    resolve(processGroups(remainingKeys));
                  }, 100);
                });
              });
          } else {
            // Skip this group and move to the next
            return processGroups(remainingKeys);
          }
        };
        
        return processGroups(Object.keys(sharedDataGroups));
      })
      // Finally load remaining individual modules with a small delay
      .then(() => processWithDelay(individualModules, 200));
  },
  
  setRefreshInterval({ commit }, interval) {
    commit('SET_REFRESH_INTERVAL', interval);
  },
  // New actions for dashboard pages
  addDashboardPage({ commit }, { name }) {
    const newPage = {
      id: 'page_' + Date.now(),
      name,
      modules: []
    };
    commit('ADD_DASHBOARD_PAGE', newPage);
    return newPage.id;
  },
  
  removeDashboardPage({ commit }, pageId) {
    commit('REMOVE_DASHBOARD_PAGE', pageId);
  },
  
  setCurrentPage({ commit }, pageId) {
    commit('SET_CURRENT_PAGE', pageId);
  },
  
  updatePageName({ commit }, { pageId, name }) {
    commit('UPDATE_PAGE_NAME', { pageId, name });
  },
  
  updateModuleLayout({ commit }, { pageId, layouts }) {
    commit('UPDATE_MODULE_LAYOUT', { pageId, layouts });
  },
  
  toggleModuleMinimized({ commit }, { pageId, moduleId }) {
    commit('TOGGLE_MODULE_MINIMIZED', { pageId, moduleId });
  }
};

const getters = {
  isLoading: state => state.isLoading,
  error: state => state.error,
  refreshInterval: state => state.refreshInterval,
  lastRefresh: state => state.lastRefresh,
  activeModules: state => state.activeModules,
  // New getters for dashboard pages
  dashboardPages: state => state.dashboardPages,
  currentPageId: state => state.currentPageId,
  currentPage: state => {
    return state.dashboardPages.find(p => p.id === state.currentPageId) || state.dashboardPages[0];
  },
  pageModules: state => pageId => {
    const page = state.dashboardPages.find(p => p.id === pageId);
    return page ? page.modules : [];
  }
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
};