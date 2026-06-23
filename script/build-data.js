import { readFileSync, readdirSync, writeFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const ITEMS_DIR = join(__dirname, '..', '..', '物品')
const OUTPUT_PATH = join(__dirname, '..', 'public', 'data.json')

function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!match) return {}
  const yaml = match[1]
  const data = {}
  let currentKey = null

  for (const line of yaml.split(/\r?\n/)) {
    const listMatch = line.match(/^\s+- "(.*)"$/)
    if (listMatch && currentKey) {
      if (!Array.isArray(data[currentKey])) data[currentKey] = []
      data[currentKey].push(listMatch[1])
      continue
    }
    const kvMatch = line.match(/^([\w\u4e00-\u9fa5]+)\s*:\s*(.*)$/)
    if (kvMatch) {
      currentKey = kvMatch[1]
      let val = kvMatch[2].trim()
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.slice(1, -1)
      } else if (val.startsWith("'") && val.endsWith("'")) {
        val = val.slice(1, -1)
      }
      if (val === '') {
        data[currentKey] = null
      } else {
        data[currentKey] = val
      }
    }
  }
  return data
}

function parseItems() {
  if (!existsSync(ITEMS_DIR)) {
    console.error('Items directory not found:', ITEMS_DIR)
    process.exit(1)
  }

  const files = readdirSync(ITEMS_DIR).filter(f => f.endsWith('.md'))
  const items = []

  for (const file of files) {
    const content = readFileSync(join(ITEMS_DIR, file), 'utf-8')
    const fm = parseFrontmatter(content)
    const name = file.replace('.md', '')

    items.push({
      id: name,
      name: name,
      location: fm['位置'] || '未分类',
      quantity: parseInt(fm['数量']) || 1,
      type: fm['物品类型'] || '',
      description: fm['简要描述'] || '',
      expiryDate: fm['过期时间'] || null,
      relatedItems: fm['关联物品'] || [],
      brand: fm['品牌'] || '',
      price: fm['金额'] ? parseFloat(fm['金额']) : null,
      size: fm['尺寸'] || '',
      entryDate: fm['入库时间'] || null,
    })
  }
  return items
}

function groupByArea(items) {
  const areas = {}
  for (const item of items) {
    const loc = item.location
    if (!areas[loc]) {
      areas[loc] = {
        id: loc,
        name: loc,
        items: []
      }
    }
    areas[loc].items.push(item)
  }
  return Object.values(areas)
}

const areaOrder = [
  '白色收纳柜/第一层（工具）',
  '白色收纳柜/第二层（资料）',
  '白色收纳柜/第三层（杂物）',
  '梯形收纳盒',
  '白色小推车/第一层',
  '桌面下/第一层/架子一',
  '桌面下/第二层/箱子一',
  '桌面下/第二层/箱子二',
  '桌面下/第二层/箱子三',
  '桌面下/第二层/架子一',
  '桌面',
  '书包',
  '墙面',
  '衣柜',
  '未分类',
]

const items = parseItems()
const areas = groupByArea(items)

areas.sort((a, b) => {
  const ia = areaOrder.indexOf(a.id)
  const ib = areaOrder.indexOf(b.id)
  return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib)
})

const sceneAreas = [
  { id: 'cabinet', name: '白色收纳柜', subAreas: ['白色收纳柜/第一层（工具）', '白色收纳柜/第二层（资料）', '白色收纳柜/第三层（杂物）'], position: { x: -4, z: -1 } },
  { id: 'trapezoid-box', name: '梯形收纳盒', subAreas: ['梯形收纳盒'], position: { x: -1, z: 0.5 } },
  { id: 'cart', name: '白色小推车', subAreas: ['白色小推车/第一层'], position: { x: 0.5, z: 2 } },
  { id: 'desk', name: '桌面', subAreas: ['桌面', '桌面下/第一层/架子一', '桌面下/第二层/箱子一', '桌面下/第二层/箱子二', '桌面下/第二层/箱子三', '桌面下/第二层/架子一'], position: { x: 2, z: -0.5 } },
  { id: 'bag', name: '书包', subAreas: ['书包'], position: { x: 4, z: 0 } },
  { id: 'wall', name: '墙面', subAreas: ['墙面'], position: { x: 1, z: -3.5 } },
  { id: 'wardrobe', name: '衣柜', subAreas: ['衣柜'], position: { x: 5, z: -2 } },
]

const data = {
  areas,
  items,
  sceneAreas,
  updatedAt: new Date().toISOString()
}

writeFileSync(OUTPUT_PATH, JSON.stringify(data, null, 2), 'utf-8')
console.log(`Generated data.json with ${items.length} items in ${areas.length} areas`)