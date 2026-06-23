<template>
  <div class="item-card" :class="cardClass" @click="$emit('click')">
    <div class="card-header">
      <span class="card-type" v-if="item.type">{{ item.type }}</span>
      <ExpiryBadge v-if="item.expiryDate" :date="item.expiryDate" />
    </div>
    <div class="card-name">{{ item.name }}</div>
    <div class="card-desc" v-if="item.description">{{ item.description }}</div>
    <div class="card-footer">
      <div class="card-qty-group">
        <button class="qty-btn" @click.stop="$emit('changeQuantity', -1)" title="减少">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 12h14"/></svg>
        </button>
        <span class="card-qty">×{{ item.quantity }}</span>
        <button class="qty-btn" @click.stop="$emit('changeQuantity', 1)" title="增加">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M12 5v14M5 12h14"/></svg>
        </button>
      </div>
      <span class="card-related" v-if="item.relatedItems && item.relatedItems.length">
        🔗 {{ item.relatedItems.length }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useItems } from '../composables/useItems.js'
import ExpiryBadge from './ExpiryBadge.vue'

const props = defineProps({
  item: { type: Object, required: true }
})
defineEmits(['click', 'changeQuantity'])

const { isExpired, isExpiringSoon } = useItems()

const cardClass = computed(() => ({
  'card-expired': isExpired(props.item),
  'card-expiring': isExpiringSoon(props.item),
}))
</script>

<style scoped>
.item-card {
  background: var(--bg-card);
  border: 2px solid var(--border-light);
  border-radius: var(--radius);
  padding: 16px;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 100px;
  box-shadow: 0 2px 8px rgba(255, 143, 171, 0.06);
}
.item-card:hover {
  background: var(--bg-card-hover);
  border-color: var(--accent);
  transform: translateY(-4px) scale(1.02);
  box-shadow: 0 8px 24px var(--accent-glow);
}
.item-card.card-expired {
  border-left: 3px solid var(--danger);
}
.item-card.card-expiring {
  border-left: 3px solid var(--warning);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-type {
  font-size: 11px;
  color: var(--accent-deep);
  background: var(--accent-soft);
  padding: 3px 10px;
  border-radius: 10px;
  font-weight: 600;
  font-family: 'Quicksand', sans-serif;
}

.card-name {
  font-family: 'Fredoka', sans-serif;
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.3;
}

.card-desc {
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
}

.card-qty-group {
  display: flex;
  align-items: center;
  gap: 4px;
}

.qty-btn {
  width: 24px;
  height: 24px;
  border-radius: 8px;
  border: 1.5px solid var(--border);
  background: var(--bg-card);
  color: var(--text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
  padding: 0;
}
.qty-btn:hover {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
  transform: scale(1.1);
}

.card-qty {
  font-size: 13px;
  color: var(--text-muted);
  font-weight: 700;
  min-width: 28px;
  text-align: center;
}

.card-related {
  font-size: 12px;
  color: var(--accent);
  font-weight: 600;
}
</style>