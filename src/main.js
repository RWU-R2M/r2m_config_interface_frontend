import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';
import { registerModules } from './modules/register';
import './assets/styles/main.css';

// Import Bulma CSS
import 'bulma/css/bulma.min.css';

// Create Vue application
const app = createApp(App);

// Use store first to make it available during module registration
app.use(store);

// Then use router
app.use(router);

// Register all modules with the app instance
registerModules(app);

// Finally mount the app
app.mount('#app');