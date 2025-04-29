// API Service for making requests to the backend

import axios from 'axios';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: '/api',  // Keep this simple, just use /api
  timeout: parseInt(import.meta.env.VITE_API_TIMEOUT) || 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Cache mechanism for API responses
const cache = {
  data: {},
  timestamps: {},
  maxAge: 5000, // Default max age for cache entries (5 seconds)

  // Get a value from cache if it exists and is not expired
  get(key) {
    const timestamp = this.timestamps[key];
    if (!timestamp) return null;
    
    const age = Date.now() - timestamp;
    if (age > this.maxAge) return null;
    
    return this.data[key];
  },

  // Set a value in the cache
  set(key, value, customMaxAge) {
    this.data[key] = value;
    this.timestamps[key] = Date.now();
    if (customMaxAge) {
      // Allow per-request cache duration
      this.maxAge = customMaxAge;
    }
  },

  // Clear the cache for a specific key or all keys
  clear(key) {
    if (key) {
      delete this.data[key];
      delete this.timestamps[key];
    } else {
      this.data = {};
      this.timestamps = {};
    }
  }
};

// Add a diagnostic ping function to test API connectivity
export async function pingApi() {
  try {
    console.log('Testing API connectivity...');
    
    // Try to hit system endpoint as a test
    // Add leading slash to ensure proper URL formatting
    const response = await apiClient.get('/system');
    console.log('API connection successful', response.data);
    return {
      success: true,
      data: response.data,
      message: 'API connection successful'
    };
  } catch (error) {
    console.error('API connection failed', error);
    return {
      success: false,
      error: error,
      message: error.message || 'API connection failed'
    };
  }
}

// Request interceptor for API calls
apiClient.interceptors.request.use(
  config => {
    console.log(`API Request: ${config.method.toUpperCase()} ${config.baseURL}${config.url}`);
    return config;
  },
  error => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for API calls
apiClient.interceptors.response.use(
  response => {
    console.log(`API Response: ${response.status} ${response.config.method.toUpperCase()} ${response.config.url}`);
    return response;
  },
  async error => {
    // Handle common error cases
    const errorResponse = {
      status: error.response ? error.response.status : 0,
      message: error.response ? (error.response.data.message || error.message) : 'Network Error',
      data: error.response ? error.response.data : {}
    };
    
    console.error('API Error:', errorResponse);
    
    return Promise.reject(errorResponse);
  }
);

// Generic CRUD methods with optional caching
export default {
  async get(endpoint, useCache = false, cacheMaxAge = null) {
    try {
      // Ensure endpoint starts with a slash
      const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
      
      // Check cache if enabled
      if (useCache) {
        const cachedData = cache.get(path);
        if (cachedData) {
          console.log(`Using cached data for ${path}`);
          return cachedData;
        }
      }
      
      const response = await apiClient.get(path);
      
      // Store in cache if enabled
      if (useCache) {
        cache.set(path, response.data, cacheMaxAge);
      }
      
      return response.data;
    } catch (error) {
      console.error(`GET ${endpoint} failed:`, error);
      throw error;
    }
  },
  
  async post(endpoint, data) {
    try {
      // Ensure endpoint starts with a slash
      const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
      const response = await apiClient.post(path, data);
      
      // Clear related cache entries when modifying data
      if (path.includes('/docker')) {
        cache.clear('/docker');
      } else if (path.includes('/scripts') || path.includes('/processes')) {
        cache.clear('/scripts');
        cache.clear('/processes');
      } else if (path.includes('/system')) {
        cache.clear('/system');
      }
      
      return response.data;
    } catch (error) {
      console.error(`POST ${endpoint} failed:`, error);
      throw error;
    }
  },
  
  async put(endpoint, data) {
    try {
      // Ensure endpoint starts with a slash
      const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
      const response = await apiClient.put(path, data);
      
      // Clear related cache entries when modifying data
      if (path.includes('/docker')) {
        cache.clear('/docker');
      } else if (path.includes('/scripts') || path.includes('/processes')) {
        cache.clear('/scripts');
        cache.clear('/processes');
      } else if (path.includes('/system')) {
        cache.clear('/system');
      }
      
      return response.data;
    } catch (error) {
      console.error(`PUT ${endpoint} failed:`, error);
      throw error;
    }
  },
  
  async delete(endpoint) {
    try {
      // Ensure endpoint starts with a slash
      const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
      const response = await apiClient.delete(path);
      
      // Clear related cache entries when modifying data
      if (path.includes('/docker')) {
        cache.clear('/docker');
      } else if (path.includes('/scripts') || path.includes('/processes')) {
        cache.clear('/scripts');
        cache.clear('/processes');
      } else if (path.includes('/system')) {
        cache.clear('/system');
      }
      
      return response.data;
    } catch (error) {
      console.error(`DELETE ${endpoint} failed:`, error);
      throw error;
    }
  },
  
  // Clear all cache or specific endpoints
  clearCache(endpoint = null) {
    if (endpoint) {
      const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
      cache.clear(path);
    } else {
      cache.clear();
    }
  },
  
  // Utility methods
  ping: pingApi,
  
  // Docker specific methods - make sure to use leading slashes
  async getContainers(useCache = false) {
    return this.get('/docker', useCache);
  },
  
  async startContainer(containerId) {
    return this.post(`/docker/${containerId}/start`);
  },
  
  async stopContainer(containerId) {
    return this.post(`/docker/${containerId}/stop`);
  },
  
  async restartContainer(containerId) {
    return this.post(`/docker/${containerId}/restart`);
  },
  
  // Scripts specific methods - make sure to use leading slashes
  async getScripts(useCache = false) {
    return this.get('/scripts', useCache);
  },
  
  async getProcesses(useCache = false) {
    return this.get('/processes', useCache);
  },
  
  async runScript(scriptId, params = {}) {
    return this.post(`/scripts/${scriptId}`, params);
  },
  
  async getProcessDetails(processId, useCache = false) {
    return this.get(`/processes/${processId}`, useCache);
  },
  
  async killProcess(processId) {
    return this.post(`/processes/${processId}/kill`);
  },
  
  // System specific methods - make sure to use leading slashes
  async getSystemStatus(useCache = true, maxAge = 5000) {
    return this.get('/system', useCache, maxAge);
  },
  
  async getNetworkInfo(useCache = true, maxAge = 5000) {
    return this.get('/system/network', useCache, maxAge);
  },
  
  // Terminal specific methods
  async executeCommand(command) {
    return this.post('/execute', { command });
  },
};