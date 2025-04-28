import store from './store';
import ControlPanelModule from './components/ControlPanelModule.vue';

export default {
  name: 'control',
  title: 'Control Panel',
  description: 'Critical system control functions including emergency stop, reboot and shutdown',
  version: '1.0.0',
  store,
  components: {
    'control-panel-module': ControlPanelModule
  }
};