import apiService from '@/services/api.service';

// System status store module
const state = {
  cpu: {
    usage: 0,
    temperature: 0,
    cores: []
  },
  memory: {
    total: 0,
    used: 0,
    free: 0,
    percent: 0
  },
  disk: {
    total: 0,
    used: 0,
    free: 0,
    percent: 0
  },
  network: {
    interfaces: [],
    bytesReceived: 0,
    bytesSent: 0
  },
  lastUpdated: null,
  isLoading: false,
  error: null
};

const mutations = {
  SET_SYSTEM_DATA(state, data) {
    // Handle API response format with proper mapping to our state structure
    console.log('Setting system data:', data);
    
    // Map CPU data from API format to our state format
    if (data.cpu) {
      state.cpu = {
        usage: data.cpu.total_percent || 0,
        temperature: data.cpu.temperature || 0,
        cores: data.cpu.per_core || []
      };
    }
    
    // Map memory data from API format to our state format
    if (data.memory) {
      state.memory = {
        total: data.memory.total || 0,
        used: data.memory.used || 0,
        free: data.memory.available || 0,
        percent: data.memory.percent || 0
      };
    }
    
    // Map disk data from API format to our state format
    if (data.disk) {
      state.disk = {
        total: data.disk.total || 0,
        used: data.disk.used || 0,
        free: data.disk.free || 0,
        percent: data.disk.percent || 0
      };
    }
    
    // If network data is included directly in system status response
    if (data.network) {
      // Process network data using the same logic as SET_NETWORK_DATA
      const interfaces = Object.keys(data.network).map(name => {
        const netInterface = data.network[name];
        return {
          name,
          bytesReceived: netInterface.bytes_recv || 0,
          bytesSent: netInterface.bytes_sent || 0,
          packetsReceived: netInterface.packets_recv || 0,
          packetsSent: netInterface.packets_sent || 0
        };
      });
      
      // Calculate total bytes sent and received
      const bytesReceived = interfaces.reduce((sum, iface) => sum + iface.bytesReceived, 0);
      const bytesSent = interfaces.reduce((sum, iface) => sum + iface.bytesSent, 0);
      
      state.network = {
        interfaces,
        bytesReceived,
        bytesSent
      };
    }
    
    state.lastUpdated = new Date();
  },
  
  SET_LOADING(state, isLoading) {
    state.isLoading = isLoading;
  },
  
  SET_ERROR(state, error) {
    state.error = error;
  }
};

const actions = {
  async fetchData({ commit, dispatch }) {
    commit('SET_LOADING', true);
    commit('SET_ERROR', null);
    
    try {
      // Fetch system info with caching enabled
      const systemData = await apiService.getSystemStatus(true, 5000);
      console.log('System API response:', systemData);
      
      // Set the system data directly from the API response
      commit('SET_SYSTEM_DATA', systemData);
      
      // We no longer need a separate call for network info as it should be included
      // in the system status response. The SET_SYSTEM_DATA mutation handles network data now.
    } catch (error) {
      console.error('Error fetching system data:', error);
      commit('SET_ERROR', {
        message: `Failed to fetch system information: ${error.message || 'Unknown error'}`,
        details: error
      });
      
      // Notify global state about error
      dispatch('global/setError', {
        module: 'system',
        message: `System module error: ${error.message || 'Unknown error'}`
      }, { root: true });
    } finally {
      commit('SET_LOADING', false);
    }
  }
};

const getters = {
  cpuUsage: state => state.cpu.usage,
  cpuTemperature: state => state.cpu.temperature,
  cpuCores: state => state.cpu.cores,
  memoryUsage: state => state.memory.percent,
  memoryDetails: state => ({
    total: formatBytes(state.memory.total),
    used: formatBytes(state.memory.used),
    free: formatBytes(state.memory.free)
  }),
  diskUsage: state => state.disk.percent,
  diskDetails: state => ({
    total: formatBytes(state.disk.total),
    used: formatBytes(state.disk.used),
    free: formatBytes(state.disk.free)
  }),
  networkInterfaces: state => state.network.interfaces,
  networkUsage: state => ({
    received: formatBytes(state.network.bytesReceived),
    sent: formatBytes(state.network.bytesSent)
  }),
  isLoading: state => state.isLoading,
  error: state => state.error,
  lastUpdated: state => state.lastUpdated
};

// Helper function to format bytes
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
};