<template>
  <div id="app-root">
    <SearchOverlay ref="searchOverlay" />
    <router-view v-slot="{ Component, route }">
      <transition name="page" mode="out-in">
        <component :is="Component" :key="route.path" />
      </transition>
    </router-view>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import SearchOverlay from './components/SearchOverlay.vue'

const searchOverlay = ref(null)

onMounted(() => {
  window.addEventListener('open-search', () => {
    if (searchOverlay.value) searchOverlay.value.open()
  })
})
</script>