import { registerModule } from '@/store';
import { addRoutes } from '@/router';

// Module registry to keep track of loaded modules
const moduleRegistry = {};

/**
 * Register a module with the application
 * @param {Object} module - The module definition
 * @param {string} module.name - Unique name for the module
 * @param {Object} module.store - Vuex store module
 * @param {Array} module.routes - Vue router routes
 * @param {Object} module.components - Vue components to register
 */
function registerDashboardModule(app, module) {
  if (!module.name) {
    console.error('Module must have a name');
    return;
  }

  // Check if module is already registered
  if (moduleRegistry[module.name]) {
    console.warn(`Module ${module.name} is already registered`);
    return;
  }

  console.log(`Registering module: ${module.name}`);

  // Register store module if provided
  if (module.store) {
    try {
      registerModule(module.name, module.store);
      console.log(`Store module registered: ${module.name}`);
    } catch (err) {
      console.error(`Failed to register store for module ${module.name}:`, err);
    }
  }

  // Register routes if provided
  if (module.routes && Array.isArray(module.routes)) {
    try {
      addRoutes(module.routes);
      console.log(`Routes registered for module: ${module.name}`);
    } catch (err) {
      console.error(`Failed to register routes for module ${module.name}:`, err);
    }
  }

  // Register components if provided
  if (module.components) {
    Object.entries(module.components).forEach(([name, component]) => {
      try {
        app.component(name, component);
        console.log(`Registered component: ${name}`);
      } catch (err) {
        console.error(`Failed to register component ${name}:`, err);
      }
    });
  }

  // Add to registry
  moduleRegistry[module.name] = module;
  
  // Dispatch to global store to track active modules
  try {
    if (app.config.globalProperties.$store) {
      app.config.globalProperties.$store.dispatch('global/registerModule', module.name);
      console.log(`Module ${module.name} registered with global store`);
    } else {
      console.warn(`Store not available when registering module ${module.name}`);
      // We'll handle this in the initialization phase
      setTimeout(() => {
        const store = app.config.globalProperties.$store;
        if (store) {
          store.dispatch('global/registerModule', module.name);
          console.log(`Registered module ${module.name} with store (delayed)`);
        } else {
          console.error(`Failed to register module ${module.name} with store`);
        }
      }, 200);
    }
  } catch (err) {
    console.error(`Error while registering module ${module.name} with global store:`, err);
  }
  
  console.log(`Module ${module.name} registered successfully`);
}

/**
 * Register all built-in modules
 */
export function registerModules(app) {
  console.log('Starting module registration process');
  
  // Import all modules
  try {
    const moduleContext = import.meta.glob('./*/index.js', { eager: true });
    
    // Register each module
    Object.values(moduleContext).forEach((moduleExport) => {
      try {
        const module = moduleExport.default;
        if (module && module.name) {
          registerDashboardModule(app, module);
        } else {
          console.error('Invalid module format:', moduleExport);
        }
      } catch (err) {
        console.error('Error registering module:', err);
      }
    });
  } catch (err) {
    console.error('Failed to import modules:', err);
  }
  
  // Log all registered modules
  console.log('All modules registered:', Object.keys(moduleRegistry));
  
  // Add a manual init step after app is mounted
  setTimeout(() => {
    try {
      const store = app.config.globalProperties.$store;
      if (store) {
        Object.keys(moduleRegistry).forEach(moduleName => {
          store.dispatch('global/registerModule', moduleName);
        });
        console.log('Module registration refreshed with store');
      }
    } catch (err) {
      console.error('Error during module refresh:', err);
    }
  }, 500);
}

export default {
  registerDashboardModule,
  registerModules,
  getRegistry: () => moduleRegistry
};