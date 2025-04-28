<template>
  <div class="app-container">
    <header class="app-header">
      <div class="navbar is-dark">
        <div class="navbar-brand">
          <router-link to="/" class="navbar-item">
            <strong>ROS Web Dashboard</strong>
          </router-link>
          <a role="button" class="navbar-burger" @click="toggleMobileMenu" :class="{ 'is-active': mobileMenuOpen }">
            <span></span>
            <span></span>
            <span></span>
          </a>
        </div>
        
        <div class="navbar-menu" :class="{ 'is-active': mobileMenuOpen }">
          <div class="navbar-end">
            <div class="navbar-item">
              <div class="buttons">
                <button class="button is-info" @click="refreshAll" :class="{ 'is-loading': isRefreshing }">
                  <span class="icon">
                    <i class="fas fa-sync-alt"></i>
                  </span>
                  <span>Refresh All</span>
                </button>
                
                <div class="field has-addons">
                  <div class="control">
                    <input
                      v-model="refreshInterval" 
                      class="input"
                      type="number" 
                      min="0" 
                      max="3600"
                      :disabled="!autoRefreshEnabled"
                      style="width: 80px;"
                    >
                  </div>
                  <div class="control">
                    <button 
                      class="button" 
                      :class="{ 'is-success': autoRefreshEnabled, 'is-outlined': !autoRefreshEnabled }"
                      @click="toggleAutoRefresh"
                    >
                      Auto (sec)
                    </button>
                  </div>
                </div>
                
                <span class="navbar-item">
                  Last updated: {{ lastUpdatedText }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
    
    <main class="app-content">
      <router-view ref="currentView" />
    </main>
    
    <footer class="app-footer">
      <div class="content has-text-centered">
        <p class="is-size-7">
          ROS Web Dashboard &copy; {{ new Date().getFullYear() }}
        </p>
      </div>
    </footer>
  </div>
</template>

<script>
export default {
  name: 'App',
  data() {
    return {
      mobileMenuOpen: false,
      autoRefreshEnabled: false,
      refreshInterval: 60,
      refreshTimer: null,
      isRefreshing: false,
      lastUpdated: null
    };
  },
  computed: {
    lastUpdatedText() {
      if (!this.lastUpdated) return 'Never';
      return this.lastUpdated.toLocaleTimeString();
    }
  },
  methods: {
    toggleMobileMenu() {
      this.mobileMenuOpen = !this.mobileMenuOpen;
    },
    
    async refreshAll() {
      if (this.isRefreshing) return;
      
      this.isRefreshing = true;
      try {
        // Refresh global state
        await this.$store.dispatch('global/refreshAll');
        
        // Update last refresh time
        this.lastUpdated = new Date();
        
        // If we have a current view with a refresh method, call it
        if (this.$refs.currentView && typeof this.$refs.currentView.refreshData === 'function') {
          await this.$refs.currentView.refreshData();
        }
      } catch (error) {
        console.error('Error refreshing data:', error);
      } finally {
        this.isRefreshing = false;
      }
    },
    
    toggleAutoRefresh() {
      this.autoRefreshEnabled = !this.autoRefreshEnabled;
      
      if (this.autoRefreshEnabled) {
        this.startAutoRefresh();
      } else {
        this.stopAutoRefresh();
      }
    },
    
    startAutoRefresh() {
      this.stopAutoRefresh(); // Clear any existing timer first
      
      if (this.refreshInterval > 0) {
        this.refreshTimer = setInterval(() => {
          this.refreshAll();
        }, this.refreshInterval * 1000);
      }
    },
    
    stopAutoRefresh() {
      if (this.refreshTimer) {
        clearInterval(this.refreshTimer);
        this.refreshTimer = null;
      }
    }
  },
  watch: {
    refreshInterval(newValue) {
      // If we change the interval and auto-refresh is enabled, restart the timer
      if (this.autoRefreshEnabled) {
        this.startAutoRefresh();
      }
    }
  },
  mounted() {
    // Initial data load
    this.refreshAll();
  },
  beforeUnmount() {
    this.stopAutoRefresh();
  }
};
</script>

<style>
.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

main {
  flex: 1;
}

.footer {
  padding: 1.5rem;
  margin-top: auto;
}
</style>