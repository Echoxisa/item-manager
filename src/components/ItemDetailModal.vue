<template>
  <Teleport to="body">
    <div class="modal-overlay" @click.self="$emit('close')">
      <div class="modal-card">
        <button class="modal-close" @click="$emit('close')">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M18 6 6 18M6 6l12 12"/>
          </svg>
        </button>

        <div class="modal-header">
          <h2 class="modal-name">{{ item.name }}</h2>
          <div class="modal-badges">
            <span class="modal-type" v-if="item.type">{{ item.type }}</span>
            <ExpiryBadge v-if="item.expiryDate" :date="item.expiryDate" />
          </div>
        </div>

        <div class="modal-body">
          <div class="modal-info-grid">
            <div class="info-row" v-if="item.quantity">
              <span class="info-label">数量</span>
              <span class="info-value">{{ item.quantity }}</span>
            </div>
            <div class="info-row" v-if="item.location">
              <span class="info-label">位置</span>
              <span class="info-value">{{ item.location }}</span>
            </div>
            <div class="info-row" v-if="item.brand">
              <span class="info-label">品牌</span>
              <span class="info-value">{{ item.brand }}</span>
            </div>
            <div class="info-row" v-if="item.size">
              <span class="info-label">尺寸</span>
              <span class="info-value">{{ item.size }}</span>
            </div>
            <div class="info-row" v-if="item.price">
              <span class="info-label">金额</span>
              <span class="info-value">{{ item.price }}元</span>
            </div>
            <div class="info-row" v-if="item.entryDate">
              <span class="info-label">入库时间</span>
              <span class="info-value">{{ formatDate(item.entryDate) }}</span>
            </div>
          </div>

          <div class="modal-desc" v-if="item.description">
            <h3>描述</h3>
            <p>{{ item.description }}</p>
          </div>

          <div class="modal-related" v-if="relatedItems && relatedItems.length">
            <h3>关联物品</h3>
            <div class="related-links">
              <button
                v-for="ri in relatedItems"
                :key="ri.id"
                class="related-link"
                @click="$emit('navigate', ri)"
              >
                🔗 {{ ri.name }}
                <span class="related-location">{{ ri.location }}</span>
              </button>
            </div>
          </div>
        </div>

        <button class="delete-btn" @click="confirmDelete">
          删除此物品
        </button>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import ExpiryBadge from './ExpiryBadge.vue'

const props = defineProps({
  item: { type: Object, required: true },
  relatedItems: { type: Array, default: () => [] }
})
const emit = defineEmits(['close', 'navigate', 'delete'])

function confirmDelete() {
  if (confirm(`确定要删除「${props.item.name}」吗？`)) {
    emit('delete', props.item.id)
  }
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(74, 53, 72, 0.35);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-card {
  background: var(--bg-card);
  border: 2px solid var(--border);
  border-radius: 22px;
  padding: 28px;
  width: 90%;
  max-width: 480px;
  max-height: 80vh;
  overflow-y: auto;
  position: relative;
  animation: slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: var(--shadow-lg);
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px) scale(0.95); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.modal-close {
  position: absolute;
  top: 14px;
  right: 14px;
  background: var(--accent-soft);
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  transition: all 0.2s;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.modal-close:hover {
  background: var(--accent);
  color: #fff;
  transform: scale(1.1);
}

.modal-header {
  margin-bottom: 20px;
  padding-right: 36px;
}

.modal-name {
  font-family: 'Fredoka', sans-serif;
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.modal-badges {
  display: flex;
  gap: 8px;
  align-items: center;
}

.modal-type {
  font-size: 12px;
  color: var(--accent-deep);
  background: var(--accent-soft);
  padding: 3px 12px;
  border-radius: 12px;
  font-weight: 600;
  font-family: 'Quicksand', sans-serif;
}

.modal-body {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.modal-info-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid var(--border-light);
}

.info-label {
  font-size: 13px;
  color: var(--text-muted);
  font-weight: 500;
}

.info-value {
  font-size: 14px;
  color: var(--text-primary);
  font-weight: 700;
}

.modal-desc h3,
.modal-related h3 {
  font-family: 'Quicksand', sans-serif;
  font-size: 11px;
  color: var(--text-muted);
  font-weight: 700;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.modal-desc p {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.6;
  background: var(--accent-soft);
  border-radius: var(--radius-sm);
  padding: 12px 14px;
}

.related-links {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.related-link {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: var(--radius-sm);
  border: 2px solid var(--accent);
  background: var(--accent-soft);
  color: var(--accent-deep);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-family: 'Quicksand', sans-serif;
}
.related-link:hover {
  background: var(--accent);
  color: #fff;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px var(--accent-glow);
}

.related-location {
  font-size: 11px;
  color: var(--text-muted);
  font-weight: 500;
}
.related-link:hover .related-location {
  color: rgba(255,255,255,0.7);
}

.delete-btn {
  width: 100%;
  margin-top: 16px;
  padding: 12px;
  border: 2px solid #e74c3c33;
  border-radius: 14px;
  background: transparent;
  color: #e74c3c;
  font-family: 'Quicksand', sans-serif;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}
.delete-btn:hover {
  background: #e74c3c;
  border-color: #e74c3c;
  color: #fff;
  transform: translateY(-1px);
  box-shadow: 0 4px 14px rgba(231, 76, 60, 0.3);
}
</style>