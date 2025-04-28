<template>
  <div class="card module-container">
    <header class="card-header">
      <p class="card-header-title">
        System Status
      </p>
    </header>
    <div class="card-content">
      <div v-if="isLoading && !hasData" class="has-text-centered p-4">
        <span class="icon is-large">
          <i class="fas fa-circle-notch fa-spin fa-2x"></i>
        </span>
        <p>Loading system information...</p>
      </div>
      
      <div v-else-if="error" class="notification is-danger">
        <p>{{ error.message }}</p>
      </div>
      
      <div v-else>
        <!-- CPU Section -->
        <div class="metric-section">
          <h4 class="title is-6">CPU Usage</h4>
          <progress 
            class="progress" 
            :class="getStatusClass(cpuUsage)"
            :value="cpuUsage" 
            max="100"
          ></progress>
          <div class="level is-mobile">
            <div class="level-left">
              <div class="level-item">
                <span>{{ cpuUsage.toFixed(1) }}%</span>
              </div>
            </div>
            <div class="level-right">
              <div class="level-item">
                <span>{{ cpuTemperature }}°C</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Memory Section -->
        <div class="metric-section">
          <h4 class="title is-6">Memory Usage</h4>
          <progress 
            class="progress" 
            :class="getStatusClass(memoryUsage)"
            :value="memoryUsage" 
            max="100"
          ></progress>
          <div class="level is-mobile">
            <div class="level-left">
              <div class="level-item">
                <span>{{ memoryUsage.toFixed(1) }}%</span>
              </div>
            </div>
            <div class="level-right">
              <div class="level-item">
                <span>{{ memoryDetails.used }} / {{ memoryDetails.total }}</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Disk Section -->
        <div class="metric-section">
          <h4 class="title is-6">Disk Usage</h4>
          <progress 
            class="progress" 
            :class="getStatusClass(diskUsage)"
            :value="diskUsage" 
            max="100"
          ></progress>
          <div class="level is-mobile">
            <div class="level-left">
              <div class="level-item">
                <span>{{ diskUsage.toFixed(1) }}%</span>
              </div>
            </div>
            <div class="level-right">
              <div class="level-item">
                <span>{{ diskDetails.free }} free</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Network Section -->
        <div class="metric-section">
          <h4 class="title is-6">Network</h4>
          <div class="columns is-mobile">
            <div class="column">
              <div class="network-stat">
                <span class="icon has-text-success">
                  <i class="fas fa-arrow-down"></i>
                </span>
                <span>{{ networkUsage.received }}</span>
              </div>
            </div>
            <div class="column">
              <div class="network-stat">
                <span class="icon has-text-info">
                  <i class="fas fa-arrow-up"></i>
                </span>
                <span>{{ networkUsage.sent }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <footer class="card-footer">
      <small class="card-footer-item is-size-7">
        Last updated: {{ lastUpdatedText }}
      </small>
    </footer>
  </div>
</template>

<script>
import { computed, onMounted, onUnmounted } from 'vue';
import { useStore } from 'vuex';

export default {
  name: 'SystemStatusModule',
  
  setup() {
    const store = useStore();
    
    // Computed properties to access store data
    const cpuUsage = computed(() => store.getters['system/cpuUsage']);
    const cpuTemperature = computed(() => store.getters['system/cpuTemperature']);
    const memoryUsage = computed(() => store.getters['system/memoryUsage']);
    const memoryDetails = computed(() => store.getters['system/memoryDetails']);
    const diskUsage = computed(() => store.getters['system/diskUsage']);
    const diskDetails = computed(() => store.getters['system/diskDetails']);
    const networkUsage = computed(() => store.getters['system/networkUsage']);
    const isLoading = computed(() => store.getters['system/isLoading']);
    const error = computed(() => store.getters['system/error']);
    const lastUpdated = computed(() => store.getters['system/lastUpdated']);
    
    // Format last updated time
    const lastUpdatedText = computed(() => {
      if (!lastUpdated.value) return 'Never';
      return lastUpdated.value.toLocaleTimeString();
    });
    
    // Check if we have any data loaded
    const hasData = computed(() => {
      return cpuUsage.value > 0 || memoryUsage.value > 0 || diskUsage.value > 0;
    });
    
    // Refresh data
    const refreshData = () => {
      store.dispatch('system/fetchData');
    };
    
    // Get status class based on usage percentage
    const getStatusClass = (value) => {
      if (value >= 90) return 'is-danger';
      if (value >= 70) return 'is-warning';
      return 'is-success';
    };
    
    // Load data on component mount
    onMounted(() => {
      refreshData();
    });
    
    return {
      cpuUsage,
      cpuTemperature,
      memoryUsage,
      memoryDetails,
      diskUsage,
      diskDetails,
      networkUsage,
      isLoading,
      error,
      lastUpdatedText,
      hasData,
      refreshData,
      getStatusClass
    };
  }
};
</script>

<style scoped>
.metric-section {
  margin-bottom: 1.5rem;
}

.network-stat {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.card-header-icon {
  padding: 0.75rem;
}

.card-header-icon.is-loading {
  pointer-events: none;
}

.card-header-icon.is-loading .icon {
  animation: spinAround 500ms infinite linear;
}

@keyframes spinAround {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(359deg);
  }
}
</style>