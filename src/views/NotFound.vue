<template>
  <div class="not-found-container">
    <div class="content has-text-centered">
      <h1 class="title is-1">404</h1>
      <p class="subtitle is-3">Page Not Found</p>
      <p>The page you're looking for doesn't exist or has been moved.</p>
      <router-link to="/" class="button is-primary mt-5">
        Back to Dashboard
      </router-link>
    </div>
  </div>
</template>

<script>
export default {
  name: 'NotFoundView'
};
</script>

<style scoped>
.not-found-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 70vh;
}
</style>