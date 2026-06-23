import { ref, computed } from 'vue'

const items = ref([])
const areas = ref([])
const sceneAreas = ref([])

let dataLoaded = false
let dataLoadPromise = null

async function loadData() {
  if (dataLoaded) return
  if (dataLoadPromise) return dataLoadPromise

  dataLoadPromise = fetch('/data.json')
    .then(r => r.json())
    .then(data => {
      items.value = data.items
      areas.value = data.areas
      sceneAreas.value = data.sceneAreas
      dataLoaded = true
    })
    .catch(err => {
      console.error('Failed to load items data:', err)
    })

  return dataLoadPromise
}

const searchQuery = ref('')

const filteredItems = computed(() => {
  if (!searchQuery.value.trim()) return items.value
  const q = searchQuery.value.toLowerCase()
  return items.value.filter(item =>
    item.name.toLowerCase().includes(q) ||
    item.type.toLowerCase().includes(q) ||
    item.description.toLowerCase().includes(q) ||
    item.location.toLowerCase().includes(q)
  )
})

const filteredAreas = computed(() => {
  if (!searchQuery.value.trim()) return areas.value
  const q = searchQuery.value.toLowerCase()
  return areas.value
    .map(area => ({
      ...area,
      items: area.items.filter(item =>
        item.name.toLowerCase().includes(q) ||
        item.type.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q)
      )
    }))
    .filter(area => area.items.length > 0)
})

function getItemsByAreaId(areaId) {
  const area = areas.value.find(a => a.id === areaId)
  return area ? area.items : []
}

function getSceneAreaBySceneId(sceneId) {
  return sceneAreas.value.find(s => s.id === sceneId)
}

function getAllSceneAreaItems(sceneArea) {
  if (!sceneArea) return []
  return sceneArea.subAreas.flatMap(subId => getItemsByAreaId(subId))
}

function getItemByName(name) {
  return items.value.find(i => i.name === name || i.id === name)
}

function getRelatedItems(item) {
  if (!item.relatedItems || item.relatedItems.length === 0) return []
  return item.relatedItems
    .map(ref => {
      const name = ref.replace(/\[\[|\]\]/g, '')
      return items.value.find(i => i.name === name || i.id === name)
    })
    .filter(Boolean)
}

function isExpired(item) {
  if (!item.expiryDate) return false
  return new Date(item.expiryDate) < new Date()
}

function isExpiringSoon(item, daysThreshold = 30) {
  if (!item.expiryDate) return false
  const diff = new Date(item.expiryDate) - new Date()
  return diff > 0 && diff < daysThreshold * 24 * 60 * 60 * 1000
}

function generateId(name) {
  return name.replace(/[\/\\]/g, '-').trim()
}

function addItem(itemData) {
  const newItem = {
    id: generateId(itemData.name),
    name: itemData.name || '',
    location: itemData.location || '',
    quantity: itemData.quantity || 1,
    type: itemData.type || '',
    description: itemData.description || '',
    expiryDate: itemData.expiryDate || null,
    relatedItems: itemData.relatedItems || [],
    brand: itemData.brand || '',
    price: itemData.price || null,
    size: itemData.size || '',
    entryDate: new Date().toISOString().slice(0, 10),
  }
  items.value.push(newItem)

  const area = areas.value.find(a => a.id === newItem.location)
  if (area) {
    area.items.push(newItem)
  }

  return newItem
}

function deleteItem(itemId) {
  const idx = items.value.findIndex(i => i.id === itemId)
  if (idx === -1) return
  const item = items.value[idx]
  items.value.splice(idx, 1)

  for (const area of areas.value) {
    const aidx = area.items.findIndex(i => i.id === itemId)
    if (aidx !== -1) {
      area.items.splice(aidx, 1)
      break
    }
  }
}

function updateQuantity(itemId, delta) {
  const item = items.value.find(i => i.id === itemId)
  if (!item) return
  item.quantity = Math.max(0, item.quantity + delta)
  const area = areas.value.find(a => a.id === item.location)
  if (area) {
    const ai = area.items.find(i => i.id === itemId)
    if (ai) ai.quantity = item.quantity
  }
  if (item.quantity === 0) {
    deleteItem(itemId)
  }
}

export function useItems() {
  return {
    loadData,
    items,
    areas,
    sceneAreas,
    searchQuery,
    filteredItems,
    filteredAreas,
    getItemsByAreaId,
    getSceneAreaBySceneId,
    getAllSceneAreaItems,
    getItemByName,
    getRelatedItems,
    isExpired,
    isExpiringSoon,
    addItem,
    deleteItem,
    updateQuantity,
  }
}