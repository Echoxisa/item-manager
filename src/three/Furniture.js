import * as THREE from 'three'

const P = {
  wall: 0xFFF5EE,
  wallAccent: 0xF0E0D6,
  floor: 0xEEDCC4,
  floorLine: 0xDDC8A8,
  skirting: 0xCCAE8A,
  desk: 0xE8C9A0,
  deskDark: 0xD4A878,
  cabinet: 0xFFFBF5,
  cabinetShelf: 0xFFF5EA,
  cabinetTrim: 0xEDDCC8,
  cart: 0xFFFFFF,
  cartWheel: 0xBBBBBB,
  bag: 0xC8A87C,
  bagAccent: 0xA88860,
  trapBox: 0xF0DCC0,
  trapBoxDark: 0xDCC4A0,
  plant: 0x88CC66,
  plantDark: 0x66AA44,
  metal: 0xDDDDDD,
  book1: 0xFF9AA2,
  book2: 0xB5D8EB,
  book3: 0xB5EAD7,
  screen: 0x3A4A5A,
  screenGlow: 0xAAE4F7,
  ceiling: 0xFFFAF5,
  highlight: 0xFF8FAB,
  pink: 0xFFB5C8,
  mint: 0xB5EAD7,
  peach: 0xFFDAB9,
  lavender: 0xD4C5F0,
  butter: 0xFFF3B0,
}

const SPARKLE_POOL = []
const HEART_POOL = []
let sparkleGroup = null
let heartGroup = null

function initSparkles(scene) {
  if (sparkleGroup) return sparkleGroup
  sparkleGroup = new THREE.Group()
  sparkleGroup.name = 'sparkles'
  const geo = new THREE.PlaneGeometry(0.06, 0.06)

  const sparkleColors = [0xFFE082, 0xFFB5C8, 0xB5EAD7, 0xD4C5F0, 0xFFFFFF]

  for (let i = 0; i < 35; i++) {
    const mat = new THREE.MeshStandardMaterial({
      color: sparkleColors[i % sparkleColors.length],
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      emissive: sparkleColors[i % sparkleColors.length],
      emissiveIntensity: 0.5,
      roughness: 0.4,
    })
    const s = new THREE.Mesh(geo, mat)
    s.rotation.z = Math.random() * Math.PI
    s.userData = {
      baseX: (Math.random() - 0.5) * 18,
      baseY: Math.random() * 4 + 0.3,
      baseZ: -2.9 + Math.random() * 0.2,
      phase: Math.random() * Math.PI * 2,
      speed: 0.2 + Math.random() * 0.4,
    }
    s.position.set(s.userData.baseX, s.userData.baseY, s.userData.baseZ)
    SPARKLE_POOL.push(s)
    sparkleGroup.add(s)
  }

  heartGroup = new THREE.Group()
  heartGroup.name = 'hearts'
  const heartGeo = createHeartGeometry(0.04)
  const heartColors = [0xFFB5C8, 0xFF9AA2, 0xFFD1DC, 0xD4C5F0]

  for (let i = 0; i < 12; i++) {
    const mat = new THREE.MeshStandardMaterial({
      color: heartColors[i % heartColors.length],
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      emissive: heartColors[i % heartColors.length],
      emissiveIntensity: 0.4,
      roughness: 0.3,
    })
    const h = new THREE.Mesh(heartGeo, mat)
    h.userData = {
      baseX: (Math.random() - 0.5) * 16,
      baseY: Math.random() * 2.5 + 1,
      baseZ: -2.7 + Math.random() * 0.2,
      phase: Math.random() * Math.PI * 2,
      speed: 0.15 + Math.random() * 0.25,
    }
    h.position.set(h.userData.baseX, h.userData.baseY, h.userData.baseZ)
    HEART_POOL.push(h)
    heartGroup.add(h)
  }

  scene.add(sparkleGroup)
  scene.add(heartGroup)
  return sparkleGroup
}

function createHeartGeometry(size) {
  const shape = new THREE.Shape()
  const x = 0, y = 0, s = size
  shape.moveTo(x, y + s * 0.3)
  shape.bezierCurveTo(x, y + s * 0.6, x - s * 0.6, y + s * 0.6, x - s * 0.6, y + s * 0.1)
  shape.bezierCurveTo(x - s * 0.6, y - s * 0.3, x, y - s * 0.3, x, y + s * 0.1)
  shape.bezierCurveTo(x, y - s * 0.3, x + s * 0.6, y - s * 0.3, x + s * 0.6, y + s * 0.1)
  shape.bezierCurveTo(x + s * 0.6, y + s * 0.6, x, y + s * 0.6, x, y + s * 0.3)
  return new THREE.ShapeGeometry(shape)
}

function updateSparkles(time) {
  SPARKLE_POOL.forEach(s => {
    const { phase, speed, baseY } = s.userData
    const t = time * speed + phase
    s.material.opacity = Math.max(0, Math.sin(t * 2) * 0.6)
    s.material.emissiveIntensity = s.material.opacity * 0.8
    s.position.y = baseY + Math.sin(t) * 0.06
    s.rotation.z = t * 0.3
    s.scale.setScalar(0.8 + Math.sin(t * 3) * 0.3)
  })
  HEART_POOL.forEach(h => {
    const { phase, speed, baseY } = h.userData
    const t = time * speed + phase
    h.material.opacity = Math.max(0, Math.sin(t * 1.5) * 0.45)
    h.material.emissiveIntensity = h.material.opacity * 0.6
    h.position.y = baseY + Math.sin(t * 0.8) * 0.12
    h.rotation.z = Math.sin(t * 0.5) * 0.1
  })
}

export { initSparkles, updateSparkles }

function makeMat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: opts.roughness ?? 0.7,
    metalness: opts.metalness ?? 0.05,
    emissive: opts.emissive ?? color,
    emissiveIntensity: opts.emissiveIntensity ?? 0.05,
    ...opts,
  })
}

function box(w, h, d, color, x = 0, y = 0, z = 0, opts = {}) {
  const m = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d, 1, 1, 1),
    makeMat(color, opts)
  )
  m.position.set(x, y, z)
  m.castShadow = true
  m.receiveShadow = true
  return m
}

function roundBox(w, h, d, r, color, x = 0, y = 0, z = 0, opts = {}) {
  const geo = new THREE.BoxGeometry(w, h, d, 4, 4, 4)
  const positions = geo.attributes.position
  const vertex = new THREE.Vector3()
  for (let i = 0; i < positions.count; i++) {
    vertex.fromBufferAttribute(positions, i)
    const ox = Math.abs(vertex.x) - w / 2 + r
    const oy = Math.abs(vertex.y) - h / 2 + r
    if (ox > 0 && oy > 0) {
      const len = Math.sqrt(ox * ox + oy * oy)
      const s = Math.min(len, r) / len
      vertex.x -= Math.sign(vertex.x) * ox * (1 - s)
      vertex.y -= Math.sign(vertex.y) * oy * (1 - s)
    }
    positions.setXYZ(i, vertex.x, vertex.y, vertex.z)
  }
  positions.needsUpdate = true
  geo.computeVertexNormals()
  const m = new THREE.Mesh(geo, makeMat(color, opts))
  m.position.set(x, y, z)
  m.castShadow = true
  m.receiveShadow = true
  return m
}

function cyl(rT, rB, h, color, x = 0, y = 0, z = 0, seg = 12, opts = {}) {
  const m = new THREE.Mesh(
    new THREE.CylinderGeometry(rT, rB, h, seg),
    makeMat(color, opts)
  )
  m.position.set(x, y, z)
  m.castShadow = true
  m.receiveShadow = true
  return m
}

function createRoom() {
  const g = new THREE.Group()
  g.name = 'room-water'

  const W = 18, H = 4.5, D = 8
  const wall = box(W, H, 0.12, P.wall, 0, H / 2, -D / 2 + 0.06)
  const floor = box(W + 0.5, 0.05, D + 0.5, P.floor, 0, -0.025, 0, { roughness: 0.9 })
  const ceiling = box(W + 0.5, 0.08, D + 0.5, P.ceiling, 0, H + 0.04, 0)
  const baseboard = box(W, 0.12, 0.14, P.skirting, 0, 0.06, -D / 2 + 0.13)
  const leftWall = box(0.12, H, D, P.wallAccent, -W / 2 - 0.06, H / 2, 0)
  const rightWall = box(0.12, H, D, P.wallAccent, W / 2 + 0.06, H / 2, 0)

  for (let x = -8; x <= 8; x += 2) {
    const line = box(0.02, 0.01, D, P.floorLine, x, 0.01, 0)
    g.add(line)
  }

  const winFrame = roundBox(2.6, 1.8, 0.08, 0.05, P.wallAccent, 5, 3.2, -D / 2 + 0.12)
  const winGlass = box(2.4, 1.6, 0.02, 0xBBDDFF, 5, 3.2, -D / 2 + 0.1, { roughness: 0.1, metalness: 0.1, emissiveIntensity: 0.15, transparent: true, opacity: 0.7 })
  const winBar1 = box(0.04, 1.6, 0.03, P.wallAccent, 5, 3.2, -D / 2 + 0.12)
  const winBar2 = box(2.4, 0.04, 0.03, P.wallAccent, 5, 3.2 + 0.35, -D / 2 + 0.12)

  g.add(wall, floor, ceiling, baseboard, leftWall, rightWall)
  g.add(winFrame, winGlass, winBar1, winBar2)

  return g
}

function createCabinet() {
  const g = new THREE.Group()
  g.name = 'cabinet'

  const W = 2.0, H = 2.8, D = 1.0
  const body = roundBox(W, H, D, 0.06, P.cabinet, 0, H / 2, 0)
  const div1 = box(W - 0.08, 0.04, D - 0.08, P.cabinetTrim, 0, H * 2 / 3, 0)
  const div2 = box(W - 0.08, 0.04, D - 0.08, P.cabinetTrim, 0, H / 3, 0)
  const h1 = cyl(0.04, 0.04, 0.22, P.metal, 0.75, H * 5 / 6, D / 2 + 0.02, 12, { metalness: 0.6 })
  const h2 = cyl(0.04, 0.04, 0.22, P.metal, 0.75, H / 2, D / 2 + 0.02, 12, { metalness: 0.6 })
  const h3 = cyl(0.04, 0.04, 0.22, P.metal, 0.75, H / 6, D / 2 + 0.02, 12, { metalness: 0.6 })
  const b1 = cyl(0.04, 0.04, 0.18, P.peach, -0.35, H * 2 / 3 + 0.19, 0.52)
  const b2 = cyl(0.035, 0.035, 0.14, P.mint, 0, H * 2 / 3 + 0.15, 0.52)
  const b3 = cyl(0.03, 0.03, 0.12, P.lavender, 0.3, H * 2 / 3 + 0.12, 0.52)
  const cup = cyl(0.05, 0.05, 0.1, P.metal, 0.5, H * 2 / 3 + 0.12, 0.3, 12, { metalness: 0.4 })
  const pen1 = cyl(0.008, 0.008, 0.14, P.book3, 0.48, H * 2 / 3 + 0.22, 0.3)
  const pen2 = cyl(0.008, 0.008, 0.14, P.book1, 0.52, H * 2 / 3 + 0.22, 0.3)
  const bk1 = roundBox(0.12, 0.18, 0.22, 0.02, P.book1, -0.4, H / 3 + 0.18, 0)
  const bk2 = roundBox(0.1, 0.2, 0.2, 0.02, P.book2, -0.25, H / 3 + 0.2, 0)
  const bk3 = roundBox(0.14, 0.16, 0.24, 0.02, P.book3, -0.1, H / 3 + 0.16, 0)
  const bx1 = roundBox(0.28, 0.12, 0.22, 0.03, P.trapBox, 0.35, H / 6 + 0.08, 0.1)

  g.add(body, div1, div2, h1, h2, h3, b1, b2, b3, cup, pen1, pen2, bk1, bk2, bk3, bx1)
  g.userData = { sceneId: 'cabinet', label: '白色收纳柜' }
  return g
}

function createDesk() {
  const g = new THREE.Group()
  g.name = 'desk'

  const W = 4.5, H = 1.05
  const top = roundBox(W, 0.08, 2.2, 0.03, P.desk, 0, H, 0)
  const legL = box(0.08, H, 0.08, P.deskDark, -W / 2 + 0.06, H / 2, 1.0)
  const legR = box(0.08, H, 0.08, P.deskDark, W / 2 - 0.06, H / 2, 1.0)
  const backL = box(0.08, H + 0.3, 0.08, P.deskDark, -W / 2 + 0.06, (H + 0.3) / 2 - 0.15, -1.0)
  const backR = box(0.08, H + 0.3, 0.08, P.deskDark, W / 2 - 0.06, (H + 0.3) / 2 - 0.15, -1.0)
  const bp = box(W, 0.4, 0.06, P.deskDark, 0, 0.2, -1.06)
  const shelf = box(W - 0.16, 0.04, 2.0, P.deskDark, 0, 0.35, 0)

  const screen = roundBox(1.2, 0.75, 0.04, 0.02, P.screen, 0.6, H + 0.54, -0.6, { roughness: 0.2, metalness: 0.3 })
  const screenFace = box(1.1, 0.65, 0.01, P.screenGlow, 0.6, H + 0.54, -0.57, { emissiveIntensity: 0.8, roughness: 0.05, metalness: 0.1 })
  const screenBase = roundBox(0.3, 0.04, 0.2, 0.02, P.metal, 0.6, H + 0.06, -0.6, 12, { metalness: 0.6 })
  const keyboard = roundBox(0.75, 0.02, 0.28, 0.01, P.screen, 0.5, H + 0.02, 0.2, { roughness: 0.4, metalness: 0.2 })
  const mouse = roundBox(0.08, 0.02, 0.12, 0.01, P.metal, 1.3, H + 0.02, 0.2, { metalness: 0.3 })
  const mug = cyl(0.06, 0.05, 0.1, P.peach, -0.8, H + 0.08, 0.4)
  const pencil = cyl(0.006, 0.006, 0.14, P.book1, -1.2, H + 0.08, 0.4)
  pencil.rotation.z = Math.PI / 6
  const notepad = roundBox(0.22, 0.01, 0.28, 0.01, P.butter, -1.5, H + 0.01, 0.3)
  const plantPot = cyl(0.07, 0.06, 0.12, P.peach, 1.7, H + 0.08, 0.5)
  const plantLeaf = cyl(0.001, 0.12, 0.15, P.plant, 1.7, H + 0.22, 0.5, 5)

  g.add(top, legL, legR, backL, backR, bp, shelf)
  g.add(screen, screenFace, screenBase, keyboard, mouse, mug, pencil, notepad, plantPot, plantLeaf)

  g.userData = { sceneId: 'desk', label: '桌面' }
  return g
}

function createTrapezoidBox() {
  const g = new THREE.Group()
  g.name = 'trapezoid-box'
  const b = roundBox(1.0, 0.5, 0.7, 0.04, P.trapBox, 1.2, 1.05 + 0.25, 0.3)
  const lid = roundBox(0.95, 0.04, 0.65, 0.02, P.trapBoxDark, 1.2, 1.05 + 0.53, 0.3)
  const item = cyl(0.04, 0.04, 0.1, P.mint, 1.05, 1.05 + 0.57, 0.3)
  g.add(b, lid, item)
  g.userData = { sceneId: 'trapezoid-box', label: '梯形收纳盒' }
  return g
}

function createCart() {
  const g = new THREE.Group()
  g.name = 'cart'
  const s1 = roundBox(1.4, 0.04, 0.8, 0.02, P.cart, 3.2, 1.6, 0.5)
  const s2 = roundBox(1.4, 0.04, 0.8, 0.02, P.cart, 3.2, 0.9, 0.5)
  const s3 = roundBox(1.4, 0.04, 0.8, 0.02, P.cart, 3.2, 0.2, 0.5)
  const p1 = cyl(0.025, 0.025, 1.7, P.metal, 3.2 - 0.65, 0.85, 0.85, 12, { metalness: 0.5 })
  const p2 = cyl(0.025, 0.025, 1.7, P.metal, 3.2 + 0.65, 0.85, 0.85, 12, { metalness: 0.5 })
  const p3 = cyl(0.025, 0.025, 1.7, P.metal, 3.2 - 0.65, 0.85, 0.15, 12, { metalness: 0.5 })
  const p4 = cyl(0.025, 0.025, 1.7, P.metal, 3.2 + 0.65, 0.85, 0.15, 12, { metalness: 0.5 })
  const wh1 = cyl(0.08, 0.08, 0.04, P.cartWheel, 3.2 - 0.6, 0.0, 0.85)
  wh1.rotation.z = Math.PI / 2
  const wh2 = cyl(0.08, 0.08, 0.04, P.cartWheel, 3.2 + 0.6, 0.0, 0.85)
  wh2.rotation.z = Math.PI / 2
  const b1 = cyl(0.035, 0.035, 0.14, P.peach, 3.0, 1.72, 0.4)
  const b2 = cyl(0.03, 0.03, 0.1, P.mint, 3.35, 1.7, 0.5)
  const b3 = cyl(0.03, 0.03, 0.09, P.lavender, 3.5, 1.69, 0.3)
  g.add(s1, s2, s3, p1, p2, p3, p4, wh1, wh2, b1, b2, b3)
  g.userData = { sceneId: 'cart', label: '白色小推车' }
  return g
}

function createBag() {
  const g = new THREE.Group()
  g.name = 'bag'
  const body = roundBox(1.1, 0.9, 0.7, 0.06, P.bag, 5.2, 0.45, 0.5)
  const flap = roundBox(1.05, 0.04, 0.68, 0.02, P.bagAccent, 5.2, 0.92, 0.49)
  const s1 = box(0.06, 0.5, 0.06, P.bagAccent, 5.2 - 0.3, 1.15, 0.82)
  const s2 = box(0.06, 0.5, 0.06, P.bagAccent, 5.2 + 0.3, 1.15, 0.82)
  const tablet = roundBox(0.65, 0.02, 0.45, 0.01, P.screen, 5.2, 0.96, 0.5, { roughness: 0.2, metalness: 0.3 })
  g.add(body, flap, s1, s2, tablet)
  g.userData = { sceneId: 'bag', label: '书包' }
  return g
}

function createWallItems() {
  const g = new THREE.Group()
  g.name = 'wall'
  const h1 = cyl(0.03, 0.03, 0.12, P.metal, -2, 3.5, -3.38, 12, { metalness: 0.5 })
  const h2 = cyl(0.03, 0.03, 0.12, P.metal, -0.5, 3.5, -3.38, 12, { metalness: 0.5 })
  const h3 = cyl(0.03, 0.03, 0.12, P.metal, 1.0, 3.5, -3.38, 12, { metalness: 0.5 })
  const scissors = box(0.02, 0.1, 0.02, P.metal, -2, 3.3, -3.35, { metalness: 0.6 })
  const hat = cyl(0.13, 0.17, 0.06, P.lavender, -0.5, 3.3, -3.35)
  const necklace = cyl(0.001, 0.1, 0.1, P.butter, 1.0, 3.3, -3.35)
  g.add(h1, h2, h3, scissors, hat, necklace)
  g.userData = { sceneId: 'wall', label: '墙面' }
  return g
}

function createWardrobe() {
  const g = new THREE.Group()
  g.name = 'wardrobe'
  const body = roundBox(1.8, 3.2, 0.9, 0.06, P.cabinet, 7.5, 1.6, -1.5)
  const dL = roundBox(0.85, 2.95, 0.06, 0.03, P.cabinetShelf, 7.5 - 0.47, 1.6, -1.05)
  const dR = roundBox(0.85, 2.95, 0.06, 0.03, P.cabinetShelf, 7.5 + 0.47, 1.6, -1.05)
  const handle1 = cyl(0.02, 0.02, 0.35, P.metal, 7.5 - 0.05, 1.6, -1.02, 12, { metalness: 0.6 })
  const handle2 = cyl(0.02, 0.02, 0.35, P.metal, 7.5 + 0.05, 1.6, -1.02, 12, { metalness: 0.6 })
  g.add(body, dL, dR, handle1, handle2)
  g.userData = { sceneId: 'wardrobe', label: '衣柜' }
  return g
}

function createPlant(x, z) {
  const g = new THREE.Group()
  const pot = cyl(0.15, 0.12, 0.25, P.peach, x, 0.125, z)
  const soil = cyl(0.14, 0.14, 0.03, 0x8B6914, x, 0.26, z)
  const leaf1 = cyl(0.001, 0.3, 0.6, P.plant, x, 0.55, z, 5)
  const leaf2 = cyl(0.001, 0.22, 0.45, P.plantDark, x + 0.08, 0.5, z + 0.05, 5)
  const leaf3 = cyl(0.001, 0.25, 0.5, P.mint, x - 0.06, 0.48, z - 0.03, 6)
  g.add(pot, soil, leaf1, leaf2, leaf3)
  return g
}

export function createAllFurniture(scene) {
  const furniture = new THREE.Group()
  furniture.name = 'furniture'

  const room = createRoom()
  furniture.add(room)

  const cabinet = createCabinet()
  cabinet.position.set(-7, 0, -2.0)

  const desk = createDesk()
  desk.position.set(-1.5, 0, -0.3)

  const trapBox = createTrapezoidBox()
  const cart = createCart()
  const bag = createBag()
  const wall = createWallItems()
  const wardrobe = createWardrobe()

  const plant1 = createPlant(-7.5, 1.5)
  const plant2 = createPlant(7.5, 1.0)

  const clickableObjects = [cabinet, desk, trapBox, cart, bag, wall, wardrobe]

  clickableObjects.forEach(obj => {
    obj.userData.originalY = obj.position.y
    furniture.add(obj)
    obj.traverse(child => {
      if (child.isMesh) {
        child.userData.parentClickable = obj.name
      }
    })
  })

  furniture.add(plant1, plant2)

  initSparkles(scene)

  return { furniture, clickableObjects }
}