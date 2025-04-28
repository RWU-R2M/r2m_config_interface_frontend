import store from './store';
import SystemStatusModule from './components/SystemStatusModule.vue';

export default {
  name: 'system',
  title: 'System Status',
  description: 'Displays system metrics including CPU, memory, disk usage, and network information',
  version: '1.0.0',
  store,
  components: {
    'system-status-module': SystemStatusModule
  }
};