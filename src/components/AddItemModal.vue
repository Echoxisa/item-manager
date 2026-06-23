<template>
  <Teleport to="body">
    <div class="modal-overlay" @click.self="$emit('close')">
      <div class="modal-card">
        <button class="modal-close" @click="$emit('close')">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M18 6 6 18M6 6l12 12"/>
          </svg>
        </button>

        <h2 class="modal-title">添加物品</h2>

        <div class="form-body">
          <div class="form-group">
            <label>名称 *</label>
            <input v-model="form.name" placeholder="物品名称" class="form-input" />
          </div>

          <div class="form-group">
            <label>位置</label>
            <select v-model="form.location" class="form-input">
              <option v-for="sub in subAreas" :key="sub.id" :value="sub.id">{{ sub.name }}</option>
            </select>
          </div>

          <div class="form-row">
            <div class="form-group flex-1">
              <label>数量</label>
              <input v-model.number="form.quantity" type="number" min="1" class="form-input" />
            </div>
            <div class="form-group flex-1">
              <label>类型</label>
              <input v-model="form.type" placeholder="如：电子设备" class="form-input" />
            </div>
          </div>

          <div class="form-group">
            <label>描述</label>
            <textarea v-model="form.description" placeholder="物品描述..." class="form-input form-textarea" rows="2"></textarea>
          </div>

          <div class="form-row">
            <div class="form-group flex-1">
              <label>品牌</label>
              <input v-model="form.brand" placeholder="品牌" class="form-input" />
            </div>
            <div class="form-group flex-1">
              <label>价格</label>
              <input v-model.number="form.price" type="number" min="0" step="0.01" placeholder="0" class="form-input" />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group flex-1">
              <label>尺寸</label>
              <input v-model="form.size" placeholder="如：30x20cm" class="form-input" />
            </div>
            <div class="form-group flex-1">
              <label>过期时间</label>
              <input v-model="form.expiryDate" type="date" class="form-input" />
            </div>
          </div>
        </div>

        <button class="submit-btn" :disabled="!form.name.trim()" @click="submit">
          确认添加
        </button>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { reactive } from 'vue'

const props = defineProps({
  defaultLocation: { type: String, default: '' },
  subAreas: { type: Array, default: () => [] }
})
const emit = defineEmits(['close', 'add'])

const form = reactive({
  name: '',
  location: props.defaultLocation,
  quantity: 1,
  type: '',
  description: '',
  brand: '',
  price: null,
  size: '',
  expiryDate: '',
})

function submit() {
  if (!form.name.trim()) return
  emit('add', {
    name: form.name.trim(),
    location: form.location,
    quantity: form.quantity || 1,
    type: form.type,
    description: form.description,
    brand: form.brand,
    price: form.price || null,
    size: form.size,
    expiryDate: form.expiryDate || null,
  })
  emit('close')
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(74, 53, 72, 0.35);
  backdrop-filter: blur(10px);
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
  max-height: 85vh;
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
.modal-title {
  font-family: 'Fredoka', sans-serif;
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 20px;
  padding-right: 36px;
}
.form-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-bottom: 20px;
}
.form-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.form-group label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
  font-family: 'Quicksand', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.form-input {
  background: var(--bg-gradient);
  border: 2px solid var(--border);
  border-radius: 12px;
  padding: 10px 14px;
  color: var(--text-primary);
  font-size: 14px;
  font-family: 'Quicksand', sans-serif;
  font-weight: 500;
  outline: none;
  transition: all 0.2s;
}
.form-input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 4px var(--accent-soft);
}
.form-textarea {
  resize: vertical;
  min-height: 60px;
}
.form-row {
  display: flex;
  gap: 12px;
}
.flex-1 {
  flex: 1;
}
.submit-btn {
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 14px;
  background: var(--accent);
  color: #fff;
  font-family: 'Fredoka', sans-serif;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 14px var(--accent-glow);
}
.submit-btn:hover:not(:disabled) {
  background: var(--accent-deep);
  transform: translateY(-1px);
  box-shadow: 0 6px 20px var(--accent-glow);
}
.submit-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
select.form-input {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='3'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 36px;
}
</style>