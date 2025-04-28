<template>
  <div class="card module-container">
    <header class="card-header">
      <p class="card-header-title">
        Docker Containers
        <span class="tag is-info ml-2">{{ runningCount }}/{{ containerCount }}</span>
      </p>
    </header>
    <div class="card-content">
      <div v-if="isLoading && containers.length === 0" class="has-text-centered p-4">
        <span class="icon is-large">
          <i class="fas fa-circle-notch fa-spin fa-2x"></i>
        </span>
        <p>Loading containers...</p>
      </div>
      
      <div v-else-if="error" class="notification is-danger">
        <p>{{ error.message }}</p>
      </div>
      
      <div v-else-if="containers.length === 0" class="notification is-warning">
        <p>No Docker containers found.</p>
      </div>
      
      <div v-else>
        <div class="container-list">
          <div 
            v-for="container in containers" 
            :key="container.id" 
            class="container-item"
            @click="selectContainer(container)"
          >
            <div class="level is-mobile">
              <div class="level-left">
                <div class="level-item">
                  <span 
                    class="status-indicator"
                    :class="container.state === 'running' ? 'status-running' : 'status-stopped'"
                  ></span>
                </div>
                <div class="level-item">
                  <div>
                    <strong>{{ container.name }}</strong>
                    <br>
                    <small>{{ container.image }}</small>
                  </div>
                </div>
              </div>
              <div class="level-right">
                <div class="level-item">
                  <div class="buttons are-small">
                    <button 
                      v-if="container.state === 'running'"
                      class="button is-light" 
                      @click.stop="stopContainer(container.id)"
                      :disabled="isLoading"
                    >
                      <span class="icon">
                        <i class="fas fa-stop"></i>
                      </span>
                    </button>
                    <button 
                      v-else
                      class="button is-success" 
                      @click.stop="startContainer(container.id)"
                      :disabled="isLoading"
                    >
                      <span class="icon">
                        <i class="fas fa-play"></i>
                      </span>
                    </button>
                    <button 
                      class="button is-info" 
                      @click.stop="restartContainer(container.id)"
                      :disabled="isLoading || container.state !== 'running'"
                    >
                      <span class="icon">
                        <i class="fas fa-sync"></i>
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Container Details Modal -->
      <div class="modal" :class="{ 'is-active': selectedContainer }">
        <div class="modal-background" @click="closeDetails"></div>
        <div class="modal-card">
          <header class="modal-card-head">
            <p class="modal-card-title">Container Details</p>
            <button class="delete" aria-label="close" @click="closeDetails"></button>
          </header>
          <section class="modal-card-body">
            <div v-if="selectedContainer">
              <div class="field">
                <label class="label">Name</label>
                <p>{{ selectedContainer.name }}</p>
              </div>
              <div class="field">
                <label class="label">Image</label>
                <p>{{ selectedContainer.image }}</p>
              </div>
              <div class="field">
                <label class="label">Status</label>
                <p>
                  <span 
                    class="tag"
                    :class="selectedContainer.state === 'running' ? 'is-success' : 'is-danger'"
                  >
                    {{ selectedContainer.state }}
                  </span>
                </p>
              </div>
              <div class="field">
                <label class="label">Created</label>
                <p>{{ new Date(selectedContainer.created).toLocaleString() }}</p>
              </div>
              <div class="field">
                <label class="label">Ports</label>
                <div v-if="selectedContainer.ports && selectedContainer.ports.length">
                  <div v-for="(port, index) in selectedContainer.ports" :key="index">
                    {{ port.hostPort }}:{{ port.containerPort }}/{{ port.protocol }}
                  </div>
                </div>
                <p v-else>No ports exposed</p>
              </div>
            </div>
          </section>
          <footer class="modal-card-foot">
            <button class="button" @click="closeDetails">Close</button>
          </footer>
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
import { computed, onMounted } from 'vue';
import { useStore } from 'vuex';

export default {
  name: 'DockerContainerModule',
  
  setup() {
    const store = useStore();
    
    // Computed properties to access store data
    const containers = computed(() => store.getters['docker/containers']);
    const runningCount = computed(() => store.getters['docker/runningCount']);
    const containerCount = computed(() => store.getters['docker/containerCount']);
    const selectedContainer = computed(() => store.getters['docker/selectedContainer']);
    const isLoading = computed(() => store.getters['docker/isLoading']);
    const error = computed(() => store.getters['docker/error']);
    const lastUpdated = computed(() => store.getters['docker/lastUpdated']);
    
    // Format last updated time
    const lastUpdatedText = computed(() => {
      if (!lastUpdated.value) return 'Never';
      return lastUpdated.value.toLocaleTimeString();
    });
    
    // Container actions
    const refreshData = () => {
      store.dispatch('docker/fetchData');
    };
    
    const selectContainer = (container) => {
      store.dispatch('docker/selectContainer', container);
    };
    
    const closeDetails = () => {
      store.dispatch('docker/selectContainer', null);
    };
    
    const startContainer = (containerId) => {
      store.dispatch('docker/startContainer', containerId);
    };
    
    const stopContainer = (containerId) => {
      store.dispatch('docker/stopContainer', containerId);
    };
    
    const restartContainer = (containerId) => {
      store.dispatch('docker/restartContainer', containerId);
    };
    
    // Load data on component mount
    onMounted(() => {
      refreshData();
    });
    
    return {
      containers,
      runningCount,
      containerCount,
      selectedContainer,
      isLoading,
      error,
      lastUpdatedText,
      refreshData,
      selectContainer,
      closeDetails,
      startContainer,
      stopContainer,
      restartContainer
    };
  }
};
</script>

<style scoped>
.container-list {
  max-height: 400px;
  overflow-y: auto;
}

.container-item {
  padding: 0.75rem;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.2s;
}

.container-item:hover {
  background-color: #f5f5f5;
}

.container-item:last-child {
  border-bottom: none;
}

.buttons.are-small .button {
  height: 2em;
  padding-left: 0.5em;
  padding-right: 0.5em;
}
</style>