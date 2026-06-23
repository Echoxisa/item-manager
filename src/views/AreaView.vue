<template>
  <div class="area-view" v-if="ready">
    <div class="area-header">
      <button class="back-btn" @click="goBack" title="返回">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="m15 18-6-6 6-6"/>
        </svg>
      </button>
      <div class="area-title-group">
        <h1 class="area-title">{{ currentSceneArea?.name || '' }}</h1>
        <p class="area-subtitle">{{ totalItemsLabel }}</p>
      </div>
      <button class="add-btn" @click="showAddModal = true" title="添加物品">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M12 5v14M5 12h14"/>
        </svg>
      </button>
      <div class="area-search">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input v-model="searchQuery" placeholder="搜索物品..." class="area-search-input" />
      </div>
    </div>

    <div class="sub-areas">
      <button
        v-for="sub in subAreas"
        :key="sub.id"
        class="sub-area-tab"
        :class="{ active: activeSubArea === sub.id }"
        @click="activeSubArea = sub.id"
      >
        {{ shortName(sub.name) }}
        <span class="sub-count">{{ sub.items.length }}</span>
      </button>
    </div>

    <div class="cards-grid" v-if="displayItems.length">
      <ItemCard
        v-for="item in displayItems"
        :key="item.id"
        :item="item"
        @click="openDetail(item)"
        @change-quantity="(d) => updateQuantity(item.id, d)"
      />
    </div>
    <div v-else class="empty-state">
      <p>没有找到匹配的物品 💭</p>
    </div>

    <ItemDetailModal
      v-if="selectedItem"
      :item="selectedItem"
      :related-items="relatedItems"
      @close="selectedItem = null"
      @navigate="navigateToItem"
      @delete="handleDelete"
    />

    <AddItemModal
      v-if="showAddModal"
      :default-location="defaultAddLocation"
      :sub-areas="subAreas"
      @close="showAddModal = false"
      @add="handleAdd"
    />
  </div>
  <div class="area-view loading" v-else>
    <div class="loading-content">
      <div class="loading-spinner"></div>
      <p>加载中...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useItems } from '../composables/useItems.js'
import ItemCard from '../components/ItemCard.vue'
import ItemDetailModal from '../components/ItemDetailModal.vue'
import AddItemModal from '../components/AddItemModal.vue'

const route = useRoute()
const router = useRouter()
const { sceneAreas, searchQuery, getSceneAreaBySceneId, getAllSceneAreaItems, getItemsByAreaId, getRelatedItems, loadData, addItem, deleteItem, updateQuantity } = useItems()

const activeSubArea = ref(null)
const selectedItem = ref(null)
const ready = ref(false)
const showAddModal = ref(false)

const currentSceneArea = computed(() => {
  return getSceneAreaBySceneId(route.params.id)
})

const subAreas = computed(() => {
  if (!currentSceneArea.value) return []
  return currentSceneArea.value.subAreas.map(subId => {
    const items = getItemsByAreaId(subId)
    return { id: subId, name: subId, items }
  })
})

const defaultAddLocation = computed(() => {
  return activeSubArea.value || (subAreas.value.length > 0 ? subAreas.value[0].id : '')
})

const totalItemsLabel = computed(() => {
  if (!currentSceneArea.value) return ''
  const all = getAllSceneAreaItems(currentSceneArea.value)
  return `${all.length} 件物品 · ${currentSceneArea.value.subAreas.length} 个分区`
})

const displayItems = computed(() => {
  if (!currentSceneArea.value) return []
  let items
  if (activeSubArea.value) {
    items = getItemsByAreaId(activeSubArea.value)
  } else {
    items = getAllSceneAreaItems(currentSceneArea.value)
  }
  if (!searchQuery.value.trim()) return items
  const q = searchQuery.value.toLowerCase()
  return items.filter(item =>
    item.name.toLowerCase().includes(q) ||
    item.type.toLowerCase().includes(q) ||
    item.description.toLowerCase().includes(q)
  )
})

const relatedItems = computed(() => {
  if (!selectedItem.value) return []
  return getRelatedItems(selectedItem.value)
})

function shortName(name) {
  if (!name) return ''
  const parts = name.split('/')
  return parts[parts.length - 1].replace(/[（）()]/g, m => m === '（' || m === '(' ? '(' : ')')
}

function goBack() {
  router.push({ name: 'home' })
}

function openDetail(item) {
  selectedItem.value = item
}

function navigateToItem(item) {
  const sceneArea = sceneAreas.value.find(sa =>
    sa.subAreas.includes(item.location)
  )
  if (sceneArea) {
    router.push({ name: 'area', params: { id: sceneArea.id } })
  }
  selectedItem.value = item
}

function handleAdd(itemData) {
  addItem(itemData)
}

function handleDelete(itemId) {
  deleteItem(itemId)
  selectedItem.value = null
}

onMounted(async () => {
  await loadData()
  ready.value = true
  if (subAreas.value.length > 0) {
    activeSubArea.value = subAreas.value[0].id
  }
})
</script>

<style scoped>
.area-view {
  width: 100%;
  height: 100%;
  background: var(--bg-gradient);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.area-header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 24px;
  border-bottom: 2px solid var(--border-light);
  background: var(--bg-card);
  backdrop-filter: blur(16px);
  flex-shrink: 0;
}

.back-btn {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  border: 2px solid var(--border);
  background: var(--bg-card);
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(255, 143, 171, 0.08);
}
.back-btn:hover {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
  transform: scale(1.05);
  box-shadow: 0 4px 16px var(--accent-glow);
}

.add-btn {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  border: 2px solid var(--accent);
  background: var(--accent);
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
  box-shadow: 0 2px 12px var(--accent-glow);
}
.add-btn:hover {
  background: var(--accent-deep);
  border-color: var(--accent-deep);
  transform: scale(1.1);
  box-shadow: 0 4px 20px var(--accent-glow);
}

.area-title-group {
  flex: 1;
  min-width: 0;
}

.area-title {
  font-family: 'Fredoka', sans-serif;
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
}

.area-subtitle {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 2px;
  font-weight: 500;
}

.area-search {
  position: relative;
  display: flex;
  align-items: center;
  flex-shrink: 0;
}
.area-search svg {
  position: absolute;
  left: 14px;
  color: var(--text-muted);
  pointer-events: none;
}
.area-search-input {
  background: var(--bg-card);
  border: 2px solid var(--border);
  border-radius: 24px;
  padding: 10px 18px 10px 40px;
  color: var(--text-primary);
  font-size: 14px;
  font-family: 'Quicksand', sans-serif;
  font-weight: 500;
  width: 220px;
  outline: none;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(255, 143, 171, 0.06);
}
.area-search-input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 4px var(--accent-soft), var(--shadow);
}
.area-search-input::placeholder {
  color: var(--text-muted);
}

.sub-areas {
  display: flex;
  gap: 8px;
  padding: 12px 24px;
  overflow-x: auto;
  flex-shrink: 0;
  border-bottom: 2px solid var(--border-light);
  background: var(--bg-card);
  backdrop-filter: blur(8px);
}

.sub-area-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 16px;
  border-radius: 20px;
  border: 2px solid var(--border);
  background: var(--bg-card);
  color: var(--text-secondary);
  font-family: 'Quicksand', sans-serif;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
  box-shadow: 0 1px 4px rgba(255, 143, 171, 0.05);
}
.sub-area-tab:hover {
  border-color: var(--accent);
  color: var(--accent);
  transform: translateY(-1px);
  box-shadow: 0 3px 12px var(--accent-soft);
}
.sub-area-tab.active {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
  box-shadow: 0 4px 14px var(--accent-glow);
}
.sub-count {
  font-size: 11px;
  background: rgba(255,255,255,0.2);
  padding: 1px 7px;
  border-radius: 10px;
  font-weight: 700;
}
.sub-area-tab:not(.active) .sub-count {
  background: var(--accent-soft);
  color: var(--accent);
}

.cards-grid {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 14px;
  align-content: start;
}

.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  font-size: 15px;
  font-weight: 500;
}

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-gradient);
}
.loading-content {
  text-align: center;
  color: var(--text-secondary);
}
.loading-spinner {
  width: 36px;
  height: 36px;
  border: 3px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 12px;
}
@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 640px) {
  .area-header {
    padding: 12px 14px;
    gap: 10px;
  }
  .area-search-input {
    width: 140px;
  }
  .cards-grid {
    padding: 14px 14px;
    grid-template-columns: repeat(auto-fill, minmax(155px, 1fr));
    gap: 10px;
  }
}
</style>