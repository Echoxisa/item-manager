<template>
  <Teleport to="body">
    <Transition name="overlay">
      <div v-if="isOpen" class="search-overlay" @click.self="close">
        <div class="search-panel">
          <div class="search-header">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="search-icon">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              ref="inputRef"
              v-model="query"
              class="search-input"
              placeholder="搜索物品名称、类型、位置..."
              @keydown.esc="close"
            />
            <button class="search-close" @click="close">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M18 6 6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <div class="search-results" v-if="results.length">
            <div
              v-for="group in groupedResults"
              :key="group.areaName"
              class="result-group"
            >
              <h3 class="result-group-title">{{ group.areaName }}</h3>
              <div
                v-for="item in group.items"
                :key="item.id"
                class="result-item"
                @click="goToItem(item)"
              >
                <span class="result-name">{{ item.name }}</span>
                <span class="result-type" v-if="item.type">{{ item.type }}</span>
                <ExpiryBadge v-if="item.expiryDate" :date="item.expiryDate" />
              </div>
            </div>
          </div>
          <div v-else-if="query.trim()" class="search-empty">
            没有找到 "{{ query }}" 相关的物品
          </div>
          <div class="search-hint" v-if="!query.trim()">
            输入关键词搜索你的物品 ✨
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useItems } from '../composables/useItems.js'
import ExpiryBadge from './ExpiryBadge.vue'

const router = useRouter()
const { items, sceneAreas } = useItems()

const isOpen = ref(false)
const query = ref('')
const inputRef = ref(null)

const results = computed(() => {
  if (!query.value.trim()) return []
  const q = query.value.toLowerCase()
  return items.value.filter(item =>
    item.name.toLowerCase().includes(q) ||
    item.type.toLowerCase().includes(q) ||
    item.description.toLowerCase().includes(q) ||
    item.location.toLowerCase().includes(q)
  )
})

const groupedResults = computed(() => {
  const groups = {}
  for (const item of results.value) {
    const loc = item.location
    if (!groups[loc]) groups[loc] = { areaName: loc, items: [] }
    groups[loc].items.push(item)
  }
  return Object.values(groups)
})

function open() {
  isOpen.value = true
  query.value = ''
  nextTick(() => { inputRef.value?.focus() })
}

function close() { isOpen.value = false }

function goToItem(item) {
  const sceneArea = sceneAreas.value.find(sa => sa.subAreas.includes(item.location))
  if (sceneArea) {
    close()
    router.push({ name: 'area', params: { id: sceneArea.id } })
  }
}

defineExpose({ open })
</script>

<style scoped>
.search-overlay {
  position: fixed;
  inset: 0;
  background: rgba(74, 53, 72, 0.3);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  z-index: 2000;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 12vh;
}

.overlay-enter-from, .overlay-leave-to { opacity: 0; }
.overlay-enter-active, .overlay-leave-active { transition: opacity 0.2s ease; }

.search-panel {
  width: 90%;
  max-width: 520px;
  max-height: 65vh;
  background: var(--bg-card);
  border: 2px solid var(--border);
  border-radius: 22px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: slideDown 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: var(--shadow-lg);
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-12px) scale(0.97); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.search-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 2px solid var(--border-light);
}

.search-icon { color: var(--accent); flex-shrink: 0; }

.search-input {
  flex: 1;
  background: none;
  border: none;
  outline: none;
  color: var(--text-primary);
  font-size: 16px;
  font-weight: 500;
  font-family: 'Quicksand', sans-serif;
}
.search-input::placeholder { color: var(--text-muted); }

.search-close {
  background: var(--accent-soft);
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 6px;
  border-radius: 50%;
  transition: all 0.2s;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.search-close:hover {
  background: var(--accent);
  color: #fff;
}

.search-results {
  flex: 1;
  overflow-y: auto;
  padding: 6px 0;
}

.result-group-title {
  font-size: 11px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 10px 20px 4px;
  font-weight: 700;
  font-family: 'Quicksand', sans-serif;
}

.result-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 20px;
  cursor: pointer;
  transition: background 0.15s;
}
.result-item:hover { background: var(--accent-soft); }

.result-name {
  font-size: 14px;
  color: var(--text-primary);
  font-weight: 600;
}

.result-type {
  font-size: 11px;
  color: var(--accent-deep);
  background: var(--accent-soft);
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 600;
}

.search-empty, .search-hint {
  padding: 40px 20px;
  text-align: center;
  color: var(--text-muted);
  font-size: 14px;
}
</style>