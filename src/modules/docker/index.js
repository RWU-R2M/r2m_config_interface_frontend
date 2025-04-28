import store from './store';
import DockerContainerModule from './components/DockerContainerModule.vue';

export default {
  name: 'docker',
  title: 'Docker Containers',
  description: 'Manages Docker containers including start, stop, and restart operations',
  version: '1.0.0',
  store,
  components: {
    'docker-container-module': DockerContainerModule
  }
};