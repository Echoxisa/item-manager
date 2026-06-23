<template>
  <span class="expiry-badge" :class="badgeClass">{{ label }}</span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  date: { type: String, required: true }
})

const badgeClass = computed(() => {
  const d = new Date(props.date)
  const now = new Date()
  const diff = d - now
  if (diff < 0) return 'badge-expired'
  if (diff < 30 * 24 * 60 * 60 * 1000) return 'badge-expiring'
  return 'badge-ok'
})

const label = computed(() => {
  const d = new Date(props.date)
  const now = new Date()
  const diff = d - now
  const days = Math.ceil(diff / (24 * 60 * 60 * 1000))
  if (days < 0) return '已过期'
  if (days < 30) return `${days}天后过期`
  if (days < 365) return `${Math.floor(days / 30)}个月后过期`
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
})
</script>

<style scoped>
.expiry-badge {
  font-size: 10px;
  padding: 3px 8px;
  border-radius: 10px;
  font-weight: 700;
  white-space: nowrap;
  font-family: 'Quicksand', sans-serif;
}
.badge-expired {
  background: rgba(255, 107, 107, 0.15);
  color: var(--danger);
}
.badge-expiring {
  background: rgba(255, 183, 77, 0.15);
  color: var(--warning);
}
.badge-ok {
  background: rgba(123, 204, 164, 0.15);
  color: var(--success);
}
</style>