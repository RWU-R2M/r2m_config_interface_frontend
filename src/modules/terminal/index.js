import store from './store';
import CommandTerminalModule from './components/CommandTerminalModule.vue';

export default {
  name: 'terminal',
  title: 'Command Terminal',
  description: 'Execute commands on the system and view output',
  version: '1.0.0',
  store,
  components: {
    'command-terminal-module': CommandTerminalModule
  }
};