import { createStore } from 'vuex'; // Use Pinia!!!
import global from './modules/global';

// Create a new store instance
const store = createStore({
  modules: {
    global
  },
  strict: import.meta.env.DEV // Enable strict mode in development
});

// Track registered modules
const registeredModules = new Set(['global']);

/**
 * Register a module dynamically with the store
 * @param {string} moduleName - Name of the module
 * @param {Object} module - Vuex module object with state, mutations, actions, getters
 */
export function registerModule(moduleName, module) {
  try {
    // Check if module is already registered
    if (store.state[moduleName]) {
      console.warn(`Module '${moduleName}' is already registered with the store`);
      return;
    }
    
    // If the module is namespaced, ensure it has proper format
    if (!module.namespaced) {
      console.warn(`Registering module '${moduleName}' without namespacing`);
      module.namespaced = true;
    }
    
    // Register the module with the store
    store.registerModule(moduleName, module);
    registeredModules.add(moduleName);
    
    console.log(`Module '${moduleName}' registered with store successfully`);
    
    // Initial data fetch
    if (typeof store.dispatch === 'function' && 
        module.actions && 
        typeof module.actions.fetchData === 'function') {
      // Schedule initial data fetch
      setTimeout(() => {
        try {
          store.dispatch(`${moduleName}/fetchData`);
          console.log(`Initial data fetch for '${moduleName}' triggered`);
        } catch (err) {
          console.error(`Failed to fetch initial data for '${moduleName}':`, err);
        }
      }, 100);
    }
  } catch (err) {
    console.error(`Failed to register module '${moduleName}':`, err);
  }
}

/**
 * Check if a module is registered with the store
 * @param {string} moduleName - Name of the module to check
 * @returns {boolean} - True if the module is registered
 */
export function hasModule(moduleName) {
  return store.state.hasOwnProperty(moduleName);
}

/**
 * Get a list of all registered modules
 * @returns {Array} - Array of registered module names
 */
export function getRegisteredModules() {
  return Array.from(registeredModules);
}

// Augment Vue store instance with additional methods
// This allows components to check for module registration
store.hasModule = hasModule;
store.getRegisteredModules = getRegisteredModules;

export default store;