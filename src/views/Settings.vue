<template>
  <div class="settings-container">
    <h1 class="title is-4">Settings</h1>
    <p class="subtitle is-6">Configure dashboard settings</p>

    <div class="box">
      <div class="field">
        <label class="label">Auto-refresh Interval</label>
        <div class="control">
          <div class="select">
            <select v-model="selectedInterval">
              <option v-for="option in refreshOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </div>
        </div>
        <p class="help">How often the dashboard will automatically refresh data</p>
      </div>

      <div class="field">
        <label class="label">Active Modules</label>
        <div class="control">
          <div class="columns is-multiline">
            <div class="column is-half" v-for="module in availableModules" :key="module.name">
              <label class="checkbox">
                <input type="checkbox" :value="module.name" v-model="selectedModules">
                {{ module.title }}
              </label>
            </div>
          </div>
        </div>
        <p class="help">Select which modules to display on the dashboard</p>
      </div>

      <div class="field">
        <label class="label">Theme</label>
        <div class="control">
          <div class="select">
            <select v-model="selectedTheme">
              <option value="light">Light</option>
              <option value="dark">Dark (Coming Soon)</option>
            </select>
          </div>
        </div>
        <p class="help">Dashboard color theme</p>
      </div>

      <div class="field">
        <label class="label">API Endpoint</label>
        <div class="control">
          <input class="input" type="text" v-model="apiEndpoint" placeholder="http://localhost:5000">
        </div>
        <p class="help">Backend API URL (requires page reload)</p>
      </div>

      <div class="field is-grouped">
        <div class="control">
          <button class="button is-primary" @click="saveSettings">Save Settings</button>
        </div>
        <div class="control">
          <button class="button is-light" @click="resetDefaults">Reset to Defaults</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import moduleRegistry from '@/modules/register';

export default {
  name: 'SettingsView',
  setup() {
    const store = useStore();
    const router = useRouter();
    
    // Settings
    const selectedInterval = ref(store.getters['global/refreshInterval']);
    const selectedTheme = ref(localStorage.getItem('theme') || 'light');
    const apiEndpoint = ref(import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000');
    const selectedModules = ref([]);
    
    // Available refresh intervals
    const refreshOptions = [
      { value: 2000, label: '2 seconds' },
      { value: 5000, label: '5 seconds' },
      { value: 10000, label: '10 seconds' },
      { value: 30000, label: '30 seconds' },
      { value: 60000, label: '1 minute' },
      { value: 300000, label: '5 minutes' }
    ];
    
    // Get available modules from registry
    const availableModules = computed(() => {
      const registry = moduleRegistry.getRegistry();
      return Object.values(registry).map(module => ({
        name: module.name,
        title: module.title || module.name
      }));
    });
    
    // Initialize selected modules from active modules
    onMounted(() => {
      const activeModules = store.getters['global/activeModules'];
      selectedModules.value = [...activeModules];
    });
    
    // Save settings
    const saveSettings = () => {
      // Save refresh interval
      store.dispatch('global/setRefreshInterval', selectedInterval.value);
      
      // Save theme preference
      localStorage.setItem('theme', selectedTheme.value);
      
      // Save API endpoint
      if (apiEndpoint.value !== import.meta.env.VITE_API_BASE_URL) {
        localStorage.setItem('apiEndpoint', apiEndpoint.value);
        // This would require a page reload in a real app
      }
      
      // Module preferences would be saved in a real app
      
      // Navigate back to dashboard
      router.push('/');
    };
    
    // Reset settings to defaults
    const resetDefaults = () => {
      selectedInterval.value = parseInt(import.meta.env.VITE_REFRESH_INTERVAL) || 5000;
      selectedTheme.value = 'light';
      apiEndpoint.value = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
      // Reset module selection in a real app
    };
    
    return {
      selectedInterval,
      selectedTheme,
      apiEndpoint,
      selectedModules,
      refreshOptions,
      availableModules,
      saveSettings,
      resetDefaults
    };
  }
};
</script>

<style scoped>
.settings-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 1rem;
}
</style>