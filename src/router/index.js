import { createRouter, createWebHistory } from 'vue-router';

// Routes definition
const routes = [
  {
    path: '/',
    name: 'Dashboard',
    component: () => import('@/views/Dashboard.vue')
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue')
  }
];

// Create router
const router = createRouter({
  history: createWebHistory(),
  routes
});

// Add module routes dynamically
export const addRoutes = (routesToAdd) => {
  routesToAdd.forEach((route) => {
    router.addRoute(route);
  });
};

export default router;