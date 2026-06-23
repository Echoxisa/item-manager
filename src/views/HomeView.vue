<template>
  <div class="home-view">
    <div class="scene-container" ref="sceneContainer">
      <div v-if="loading" class="loading-overlay">
        <div class="loading-spinner"></div>
        <p class="loading-text">加载房间中...</p>
      </div>
      <div v-if="hoveredArea && !loading" class="hover-label" :style="labelStyle">
        <span class="hover-emoji">✨</span>
        <span class="hover-name">{{ hoveredArea.label }}</span>
        <span class="hover-arrow">→</span>
      </div>
    </div>

    <div class="scene-header">
      <div class="title-group">
        <h1 class="scene-title">我的物品</h1>
        <p class="scene-subtitle">{{ totalItems }} 件物品 · {{ totalAreas }} 个位置</p>
      </div>
      <div class="locator">
        <svg class="locator-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          v-model="localSearch"
          class="locator-input"
          placeholder="搜索物品并定位..."
          @focus="showSearchResults = true"
          @keydown.esc="clearSearch"
        />
        <button v-if="localSearch" class="locator-clear" @click="clearSearch" title="清空搜索">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M18 6 6 18M6 6l12 12"/>
          </svg>
        </button>
        <div v-if="showSearchResults && localSearch.trim()" class="locator-results">
          <button
            v-for="item in searchResults"
            :key="item.id"
            class="locator-result"
            @click="locateItem(item)"
          >
            <span class="result-main">{{ item.name }}</span>
            <span class="result-path">{{ item.location }}</span>
          </button>
          <div v-if="!searchResults.length" class="locator-empty">没有找到匹配物品</div>
        </div>
      </div>
    </div>

    <Transition name="area-panel">
      <aside v-if="selectedSceneArea" class="area-panel">
        <div class="panel-topline">
          <button class="overview-btn" @click="closePanel" title="回到房间总览">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4">
              <path d="m15 18-6-6 6-6"/>
            </svg>
          </button>
          <span class="panel-kicker">当前区域</span>
        </div>
        <h2 class="panel-title">{{ selectedSceneArea.name }}</h2>
        <div class="panel-stats">
          <div class="stat">
            <span class="stat-value">{{ selectedItems.length }}</span>
            <span class="stat-label">物品</span>
          </div>
          <div class="stat">
            <span class="stat-value">{{ selectedSceneArea.subAreas.length }}</span>
            <span class="stat-label">分区</span>
          </div>
          <div class="stat warning-stat">
            <span class="stat-value">{{ expiringCount }}</span>
            <span class="stat-label">临期</span>
          </div>
        </div>

        <div class="panel-section">
          <div class="section-title">分区</div>
          <div class="subarea-list">
            <div v-for="sub in panelSubAreas" :key="sub.id" class="subarea-row">
              <span>{{ shortName(sub.name) }}</span>
              <strong>{{ sub.items.length }}</strong>
            </div>
          </div>
        </div>

        <div class="panel-section">
          <div class="section-title">代表物品</div>
          <div class="preview-items">
            <span v-for="item in previewItems" :key="item.id" class="preview-item">{{ item.name }}</span>
          </div>
        </div>

        <div class="panel-actions">
          <button class="primary-action" @click="openArea">查看全部</button>
          <button class="ghost-action" @click="openSearch">全局搜索</button>
        </div>
      </aside>
    </Transition>

    <div class="scene-footer">
      <span class="footer-hint">点击家具进入区域 · 拖拽旋转 · 滚轮缩放</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { useRouter } from 'vue-router'
import { SceneManager } from '../three/SceneManager.js'
import { useItems } from '../composables/useItems.js'

const { items, areas, sceneAreas, loadData, getSceneAreaBySceneId, getAllSceneAreaItems, getItemsByAreaId, isExpiringSoon } = useItems()
const router = useRouter()

const sceneContainer = ref(null)
const hoveredArea = ref(null)
const labelPos = ref({ x: 0, y: 0 })
const loading = ref(true)
const selectedAreaId = ref(null)
const localSearch = ref('')
const showSearchResults = ref(false)
let sceneManager = null

const totalItems = computed(() => items.value.length)
const totalAreas = computed(() => areas.value.length)
const selectedSceneArea = computed(() => selectedAreaId.value ? getSceneAreaBySceneId(selectedAreaId.value) : null)
const selectedItems = computed(() => selectedSceneArea.value ? getAllSceneAreaItems(selectedSceneArea.value) : [])
const expiringCount = computed(() => selectedItems.value.filter(item => isExpiringSoon(item, 45)).length)
const panelSubAreas = computed(() => {
  if (!selectedSceneArea.value) return []
  return selectedSceneArea.value.subAreas.map(subId => ({
    id: subId,
    name: subId,
    items: getItemsByAreaId(subId),
  }))
})
const previewItems = computed(() => selectedItems.value.slice(0, 8))
const searchResults = computed(() => {
  const q = localSearch.value.trim().toLowerCase()
  if (!q) return []
  return items.value
    .filter(item =>
      item.name.toLowerCase().includes(q) ||
      item.type.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.location.toLowerCase().includes(q)
    )
    .slice(0, 8)
})

const labelStyle = computed(() => ({
  left: labelPos.value.x + 'px',
  top: labelPos.value.y + 'px',
}))

function openSearch() {
  window.dispatchEvent(new CustomEvent('open-search'))
}

function shortName(name) {
  if (!name) return ''
  const parts = name.split('/')
  return parts[parts.length - 1].replace(/[（）()]/g, m => m === '（' || m === '(' ? '(' : ')')
}

function selectArea(sceneId) {
  selectedAreaId.value = sceneId
  sceneManager?.flyToObject(sceneId)
}

function closePanel() {
  selectedAreaId.value = null
  sceneManager?.flyToOverview()
}

function openArea() {
  if (!selectedAreaId.value) return
  router.push({ name: 'area', params: { id: selectedAreaId.value } })
}

function clearSearch() {
  localSearch.value = ''
  showSearchResults.value = false
}

function locateItem(item) {
  const sceneArea = sceneAreas.value.find(sa => sa.subAreas.includes(item.location))
  if (!sceneArea) return
  selectedAreaId.value = sceneArea.id
  showSearchResults.value = false
  localSearch.value = item.name
  sceneManager?.flyToObject(sceneArea.id)
}

onMounted(async () => {
  await loadData()
  if (!sceneContainer.value) return

  sceneManager = new SceneManager(sceneContainer.value)

  try {
    await sceneManager.loadRoom()
  } catch (e) {
    console.error('Room load failed:', e)
  }

  loading.value = false

  sceneManager.onAreaHover = (data) => {
    hoveredArea.value = data
  }

  sceneManager.onAreaClick = (data) => {
    if (data && data.sceneId) {
      selectArea(data.sceneId)
    }
  }

  sceneManager.renderer.domElement.addEventListener('pointermove', (e) => {
    if (hoveredArea.value) {
      labelPos.value = { x: e.clientX + 16, y: e.clientY - 40 }
    }
  })
})

onBeforeUnmount(() => {
  if (sceneManager) sceneManager.dispose()
})
</script>

<style scoped>
.home-view {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  background: var(--bg-gradient);
}

.scene-container {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 0;
}

.loading-overlay {
  position: absolute;
  inset: 0;
  z-index: 50;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(255, 245, 238, 0.92);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 3px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.loading-text {
  margin-top: 16px;
  font-family: 'Quicksand', sans-serif;
  font-size: 15px;
  color: var(--text-secondary);
  font-weight: 600;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.scene-header {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;
  padding: 20px 28px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  background: linear-gradient(to bottom, rgba(255,245,238,0.92) 0%, rgba(255,245,238,0.5) 70%, transparent 100%);
  pointer-events: none;
}

.title-group {
  pointer-events: auto;
}

.scene-title {
  font-family: 'Fredoka', 'Quicksand', sans-serif;
  font-size: 26px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: 0;
  line-height: 1.2;
}

.scene-subtitle {
  font-size: 13px;
  color: var(--text-muted);
  margin-top: 4px;
  font-weight: 500;
}

.locator {
  position: relative;
  display: flex;
  align-items: center;
  background: var(--bg-card);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 2px solid var(--border);
  border-radius: 26px;
  width: min(360px, 40vw);
  height: 48px;
  color: var(--text-secondary);
  transition: all 0.25s ease;
  pointer-events: auto;
  box-shadow: var(--shadow);
}
.locator:focus-within {
  border-color: var(--accent);
  box-shadow: 0 0 0 4px var(--accent-soft), var(--shadow);
}
.locator-icon {
  margin-left: 16px;
  color: var(--accent);
  flex-shrink: 0;
}
.locator-input {
  width: 100%;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  padding: 0 14px 0 10px;
  color: var(--text-primary);
  font-family: 'Quicksand', sans-serif;
  font-size: 14px;
  font-weight: 600;
}
.locator-input::placeholder {
  color: var(--text-muted);
}
.locator-clear {
  width: 28px;
  height: 28px;
  margin-right: 10px;
  border: none;
  border-radius: 50%;
  background: var(--accent-soft);
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.locator-results {
  position: absolute;
  top: 56px;
  left: 0;
  right: 0;
  z-index: 120;
  padding: 8px;
  border: 2px solid var(--border);
  border-radius: 18px;
  background: rgba(255,255,255,0.96);
  box-shadow: var(--shadow-lg);
  max-height: 330px;
  overflow-y: auto;
}
.locator-result {
  width: 100%;
  border: none;
  background: transparent;
  border-radius: 12px;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 3px;
  text-align: left;
  cursor: pointer;
  transition: background 0.15s ease;
}
.locator-result:hover {
  background: var(--accent-soft);
}
.result-main {
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 700;
}
.result-path {
  color: var(--text-muted);
  font-size: 11px;
  line-height: 1.35;
}
.locator-empty {
  padding: 18px 10px;
  text-align: center;
  color: var(--text-muted);
  font-size: 13px;
}

.hover-label {
  position: fixed;
  z-index: 100;
  background: var(--bg-card);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 2px solid var(--accent);
  border-radius: 14px;
  padding: 8px 16px;
  display: flex;
  align-items: center;
  gap: 6px;
  pointer-events: none;
  animation: labelIn 0.15s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 4px 16px var(--accent-glow);
}

.area-panel {
  position: absolute;
  top: 104px;
  right: 28px;
  z-index: 20;
  width: min(360px, calc(100vw - 40px));
  max-height: calc(100vh - 176px);
  overflow-y: auto;
  padding: 20px;
  background: rgba(255,255,255,0.9);
  border: 2px solid rgba(255,255,255,0.7);
  border-radius: 8px;
  box-shadow: 0 20px 60px rgba(74, 53, 72, 0.18);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
}

.area-panel-enter-from,
.area-panel-leave-to {
  opacity: 0;
  transform: translateX(18px) scale(0.98);
}
.area-panel-enter-active,
.area-panel-leave-active {
  transition: all 0.24s ease;
}

.panel-topline {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}
.overview-btn {
  width: 34px;
  height: 34px;
  border: 2px solid var(--border);
  border-radius: 50%;
  background: var(--bg-card);
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.overview-btn:hover {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
}
.panel-kicker,
.section-title {
  color: var(--text-muted);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0;
}
.panel-title {
  font-family: 'Fredoka', 'Quicksand', sans-serif;
  color: var(--text-primary);
  font-size: 28px;
  line-height: 1.1;
  margin-bottom: 16px;
}
.panel-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 18px;
}
.stat {
  border: 2px solid var(--border-light);
  border-radius: 8px;
  padding: 12px 10px;
  background: rgba(255, 248, 240, 0.8);
}
.stat-value {
  display: block;
  color: var(--text-primary);
  font-size: 23px;
  font-weight: 800;
  line-height: 1;
}
.stat-label {
  display: block;
  margin-top: 5px;
  color: var(--text-muted);
  font-size: 11px;
  font-weight: 700;
}
.warning-stat .stat-value {
  color: var(--warning);
}
.panel-section {
  margin-top: 16px;
}
.subarea-list {
  margin-top: 8px;
  display: grid;
  gap: 6px;
}
.subarea-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 9px 10px;
  border-radius: 8px;
  background: rgba(255,255,255,0.62);
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 650;
}
.subarea-row strong {
  color: var(--accent-deep);
  font-size: 12px;
}
.preview-items {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin-top: 9px;
}
.preview-item {
  max-width: 100%;
  border-radius: 8px;
  padding: 6px 9px;
  background: var(--mint-soft);
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 700;
}
.panel-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 20px;
}
.primary-action,
.ghost-action {
  border-radius: 8px;
  height: 42px;
  font-family: 'Quicksand', sans-serif;
  font-weight: 800;
  cursor: pointer;
}
.primary-action {
  border: 2px solid var(--accent);
  background: var(--accent);
  color: #fff;
}
.ghost-action {
  border: 2px solid var(--border);
  background: rgba(255,255,255,0.66);
  color: var(--text-secondary);
}

.hover-emoji {
  font-size: 14px;
}

.hover-name {
  font-family: 'Fredoka', sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.hover-arrow {
  font-size: 12px;
  color: var(--accent);
  font-weight: 600;
}

@keyframes labelIn {
  from { opacity: 0; transform: translateY(8px) scale(0.9); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.scene-footer {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 10;
  padding: 14px 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(to top, rgba(255,245,238,0.85) 0%, transparent 100%);
  pointer-events: none;
}

.footer-hint {
  font-size: 13px;
  color: var(--text-muted);
  font-weight: 500;
}

@media (max-width: 640px) {
  .scene-header {
    padding: 14px 16px;
    gap: 12px;
  }
  .scene-title {
    font-size: 20px;
  }
  .locator {
    width: 48px;
    flex-shrink: 0;
  }
  .locator:focus-within {
    width: min(280px, calc(100vw - 32px));
    position: absolute;
    right: 16px;
  }
  .locator:not(:focus-within) .locator-input,
  .locator:not(:focus-within) .locator-clear {
    display: none;
  }
  .area-panel {
    left: 14px;
    right: 14px;
    top: auto;
    bottom: 58px;
    width: auto;
    max-height: 48vh;
    padding: 16px;
  }
  .panel-title {
    font-size: 24px;
  }
}
</style>
