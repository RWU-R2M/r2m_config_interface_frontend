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

// Generic CRUD methods (these already look correct)
export default {
  async get(endpoint) {
    try {
      // Ensure endpoint starts with a slash
      const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
      const response = await apiClient.get(path);
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
      return response.data;
    } catch (error) {
      console.error(`DELETE ${endpoint} failed:`, error);
      throw error;
    }
  },
  
  // Utility methods
  ping: pingApi,
  
  // Docker specific methods - make sure to use leading slashes
  async getContainers() {
    return this.get('/docker');
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
  async getScripts() {
    return this.get('/scripts');
  },
  
  async getProcesses() {
    return this.get('/processes');
  },
  
  async runScript(scriptId, params = {}) {
    return this.post(`/scripts/${scriptId}`, params);
  },
  
  async getProcessDetails(processId) {
    return this.get(`/processes/${processId}`);
  },
  
  async killProcess(processId) {
    return this.post(`/processes/${processId}/kill`);
  },
  
  // System specific methods - make sure to use leading slashes
  async getSystemStatus() {
    return this.get('/system');
  },
  
  async getNetworkInfo() {
    return this.get('/system/network');
  },
  
  // Terminal specific methods
  async executeCommand(command) {
    return this.post('/execute', { command });
  },
};