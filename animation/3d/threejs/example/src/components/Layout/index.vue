<script lang="ts" setup>
defineOptions({ name: 'Layout' })
</script>

<template>
  <div class="layout">
    <nav class="navbar">
      <RouterLink to="/">Home</RouterLink>
      <RouterLink to="/01-scene">01 scene</RouterLink>
    </nav>
    <main>
      <slot></slot>
    </main>
  </div>
</template>

<style lang="scss" scoped>
.layout {
  display: flex;
  min-height: 100vh;
  .navbar {
    flex-shrink: 0;
    position: sticky;
    top: 0;
    max-height: 100vh;
    overflow: auto;
    width: 150px;
    border-right: 1px solid #ccc;
    padding: 10px;
    a {
      display: block;
    }
  }
  main {
    width: calc(100% - 150px);
    height: 100vh;
    flex-grow: 1;
    padding: 10px;
    overflow: auto;
  }
}
</style>
