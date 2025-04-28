import store from './store';
import ScriptManagementModule from './components/ScriptManagementModule.vue';

export default {
  name: 'scripts',
  title: 'Script Management',
  description: 'Run and monitor custom scripts on the system',
  version: '1.0.0',
  store,
  components: {
    'script-management-module': ScriptManagementModule
  }
};