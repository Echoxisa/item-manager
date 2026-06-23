import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { EffectComposer, RenderPass, EffectPass, BloomEffect, OutlineEffect, BlendFunction, KernelSize } from 'postprocessing'
import gsap from 'gsap'

export class SceneManager {
  constructor(container) {
    this.container = container
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0xFFF6EA)
    this.scene.fog = new THREE.FogExp2(0xFFF6EA, 0.018)

    const w = container.clientWidth
    const h = container.clientHeight

    this.camera = new THREE.PerspectiveCamera(38, w / h, 0.1, 200)
    this.camera.position.set(-7.2, 5.4, -9.5)

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setSize(w, h)
    this.renderer.setClearColor(0xFFF6EA)
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.3
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.domElement.style.width = '100%'
    this.renderer.domElement.style.height = '100%'
    this.renderer.domElement.style.display = 'block'
    container.appendChild(this.renderer.domElement)

    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.08
    this.controls.target.set(0, 1.05, 0)
    this.controls.minDistance = 4
    this.controls.maxDistance = 20
    this.controls.minPolarAngle = 0.1
    this.controls.maxPolarAngle = Math.PI / 1.8
    this.controls.enablePan = false
    this.controls.enableZoom = true
    this.controls.zoomSpeed = 0.8

    this.composer = new EffectComposer(this.renderer)
    this.composer.addPass(new RenderPass(this.scene, this.camera))

    this.bloomEffect = new BloomEffect({
      blendFunction: BlendFunction.ADD,
      luminanceThreshold: 0.85,
      luminanceSmoothing: 0.4,
      intensity: 0.35,
      kernelSize: KernelSize.MEDIUM,
    })

    this.outlineEffect = new OutlineEffect(this.scene, this.camera, {
      blendFunction: BlendFunction.SCREEN,
      edgeStrength: 2.5,
      pulseSpeed: 0.0,
      visibleEdgeColor: new THREE.Color(0xFF8FAB),
      hiddenEdgeColor: new THREE.Color(0xFFBBDD),
      blur: true,
      kernelSize: KernelSize.SMALL,
    })

    this.composer.addPass(new EffectPass(this.camera, this.bloomEffect, this.outlineEffect))

    this.raycaster = new THREE.Raycaster()
    this.mouse = new THREE.Vector2()
    this.hoveredArea = null
    this.isAnimating = false
    this.roomModel = null
    this.nodeToArea = new Map()
    this.clickableObjects = []
    this.onAreaClick = null
    this.onAreaHover = null
    this.onLoadProgress = null

    this.gltfLoader = new GLTFLoader()
    try {
      const dracoLoader = new DRACOLoader()
      dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/')
      this.gltfLoader.setDRACOLoader(dracoLoader)
    } catch (e) { /* draco not critical */ }

    this.defaultCameraPos = new THREE.Vector3(-7.2, 5.4, -9.5)
    this.defaultTarget = new THREE.Vector3(0, 1.05, 0)

    this.addLights()
    this.addFloor()
    this.setupEvents()
    this.animate()
  }

  addLights() {
    const ambient = new THREE.AmbientLight(0xFFF8F0, 1.15)
    this.scene.add(ambient)

    const hemi = new THREE.HemisphereLight(0xFFF5EE, 0xD8C3A4, 0.75)
    this.scene.add(hemi)

    const sun = new THREE.DirectionalLight(0xFFF3D6, 2.45)
    sun.position.set(4, 10, 6)
    sun.castShadow = true
    sun.shadow.mapSize.width = 2048
    sun.shadow.mapSize.height = 2048
    sun.shadow.camera.near = 0.5
    sun.shadow.camera.far = 30
    sun.shadow.camera.left = -12
    sun.shadow.camera.right = 12
    sun.shadow.camera.top = 8
    sun.shadow.camera.bottom = -2
    sun.shadow.bias = -0.001
    sun.shadow.normalBias = 0.02
    this.scene.add(sun)

    const fill = new THREE.DirectionalLight(0xDCEEFF, 0.72)
    fill.position.set(-4, 4, 8)
    this.scene.add(fill)

    const warm = new THREE.PointLight(0xFFD7A8, 0.62, 20)
    warm.position.set(2, 3.5, 2)
    this.scene.add(warm)

    const back = new THREE.DirectionalLight(0xE0E8FF, 0.42)
    back.position.set(0, 3, -6)
    this.scene.add(back)
  }

  addFloor() {
    const floorGeo = new THREE.PlaneGeometry(40, 40)
    const floorMat = new THREE.MeshStandardMaterial({ color: 0xDDF3FF, roughness: 0.92, metalness: 0.0 })
    const floor = new THREE.Mesh(floorGeo, floorMat)
    floor.rotation.x = -Math.PI / 2
    floor.position.y = -0.01
    floor.receiveShadow = true
    floor.name = '__floor__'
    this.scene.add(floor)
  }

  enhanceMaterials(model) {
    const materialStyles = {
      'Wall': { color: 0xFFF9EE, roughness: 0.92 },
      'Wardrobe': { color: 0xFFF0CF },
      'Handle': { color: 0xD39B73, roughness: 0.55, metalness: 0.12 },
      'White': { color: 0xFFF7E8 },
      'White.001': { color: 0xFFE8F0 },
      'White.002': { color: 0xE4F7F1 },
      'Book yellow': { color: 0xFFD45C },
      'Book yellow.001': { color: 0xFFD45C },
      'Book yellow.002': { color: 0xFFB84D },
      'Black': { color: 0x4C4050, roughness: 0.72 },
      'Screen': { color: 0x343856, emissive: 0x789CFF, emissiveIntensity: 0.12, roughness: 0.35, metalness: 0.05 },
      'Blanket': { color: 0xFFB8C7, roughness: 0.95 },
      'Paint green': { color: 0x7FD6A7 },
      'Paint red': { color: 0xFF7D8D },
      'Paint yellow': { color: 0xFFE072 },
      'Book red': { color: 0xFF6F8F },
      'Book blue': { color: 0x5B8DEF },
      'Floor': { color: 0xF0C891, roughness: 0.92 },
      'Material': { color: 0xF8D7A8 },
    }

    const nameStyles = [
      { test: /wall/i, style: { color: 0xFFF9EE, roughness: 0.92 } },
      { test: /floor/i, style: { color: 0xF0C891, roughness: 0.92 } },
      { test: /wardrobe/i, style: { color: 0xFFF0CF, roughness: 0.82 } },
      { test: /bed/i, style: { color: 0xFFF6DE, roughness: 0.85 } },
      { test: /blanket|pillow/i, style: { color: 0xFFB8C7, roughness: 0.95 } },
      { test: /table|desk/i, style: { color: 0xFFCFA3, roughness: 0.78 } },
      { test: /chair/i, style: { color: 0x93DCC0, roughness: 0.78 } },
      { test: /shelf|bookshelf/i, style: { color: 0xFFE6A6, roughness: 0.78 } },
      { test: /book stack|book/i, style: { color: 0xFFD45C, roughness: 0.82 } },
      { test: /pc|keyboard|screen/i, style: { color: 0x343856, emissive: 0x789CFF, emissiveIntensity: 0.1, roughness: 0.45 } },
      { test: /picture|paint/i, style: { color: 0xF7A8BE, roughness: 0.82 } },
      { test: /cube\.008/i, style: { color: 0xE9FBF5, roughness: 0.8 } },
    ]

    const fallbackPalette = [0xFFE8F0, 0xE4F7F1, 0xFFF2B8, 0xD8D5FF, 0xFFD8AD]

    const styleFor = (mesh, mat, index) => {
      const meshName = mesh.name || ''
      const materialName = mat?.name || ''
      const byName = nameStyles.find(entry => entry.test.test(meshName))
      if (byName) return byName.style
      if (materialStyles[materialName]) return materialStyles[materialName]
      const key = `${meshName}-${materialName}-${index}`
      let hash = 0
      for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0
      return { color: fallbackPalette[hash % fallbackPalette.length], roughness: 0.86 }
    }

    model.traverse(child => {
      if (!child.isMesh) return
      child.castShadow = true
      child.receiveShadow = true

      const mats = Array.isArray(child.material) ? child.material : [child.material]
      const newMats = mats.map(mat => {
        if (!mat) return new THREE.MeshStandardMaterial({ color: 0xDDDDDD, roughness: 0.7 })

        const override = styleFor(child, mat, child.id)

        if (mat.isMeshStandardMaterial || mat.isMeshPhysicalMaterial) {
          mat.color.setHex(override.color)
          mat.roughness = override.roughness ?? 0.82
          mat.metalness = override.metalness ?? 0.02
          if ('flatShading' in mat) mat.flatShading = true
          if (override.emissive !== undefined) {
            mat.emissive.setHex(override.emissive)
            mat.emissiveIntensity = override.emissiveIntensity ?? 0
          } else if (mat.emissive) {
            mat.emissive.setHex(0x000000)
            mat.emissiveIntensity = 0
          }
          if (override.opacity !== undefined) {
            mat.transparent = true
            mat.opacity = override.opacity
            mat.depthWrite = false
            mat.side = THREE.DoubleSide
          } else {
            mat.transparent = false
            mat.opacity = 1
            mat.depthWrite = true
          }
          if (mat.map) mat.map.colorSpace = THREE.SRGBColorSpace
          mat.needsUpdate = true
          return mat
        }

        const newMat = new THREE.MeshStandardMaterial({
          color: override.color,
          roughness: override.roughness ?? 0.82,
          metalness: override.metalness ?? 0.02,
          map: mat.map || undefined,
          flatShading: true,
          transparent: override.opacity !== undefined,
          opacity: override.opacity ?? 1,
          depthWrite: override.opacity === undefined,
          side: override.opacity !== undefined ? THREE.DoubleSide : THREE.FrontSide,
        })
        if (override?.emissive) {
          newMat.emissive.setHex(override.emissive)
          newMat.emissiveIntensity = override.emissiveIntensity ?? 0
        }
        if (newMat.map) newMat.map.colorSpace = THREE.SRGBColorSpace
        mat.dispose()
        return newMat
      })
      child.material = newMats.length === 1 ? newMats[0] : newMats
    })
  }

addOverlayItems(model) {
    const getNodeWorldPos = (name) => {
      let node = null
      model.traverse(c => { if (c.name === name && !node) node = c })
      if (!node) return null
      const pos = new THREE.Vector3()
      node.getWorldPosition(pos)
      return pos
    }

    const bedsidePos = getNodeWorldPos('Bedside table 1')
    const tablePos = getNodeWorldPos('Table 1')
    const chairPos = getNodeWorldPos('Chair 1')
    const wardrobePos = getNodeWorldPos('Wardrobe 1')

    const P = {
      cabinet: 0xFFF8F0, cabinetTrim: 0xEDDCC8, metal: 0xBBBBBB,
      peach: 0xFFDAB9, mint: 0xB5EAD7, lavender: 0xD4C5F0,
      bag: 0xC8A87C, bagAccent: 0xA88860, cart: 0xFFFFFF, cartWheel: 0xBBBBBB,
      trapBox: 0xF0DCC0, trapBoxDark: 0xDCC4A0,
    }

    function makeMat(color, opts = {}) {
      return new THREE.MeshStandardMaterial({
        color, roughness: opts.roughness ?? 0.65, metalness: opts.metalness ?? 0.05, ...opts,
      })
    }
    function box(w, h, d, color, x, y, z) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), makeMat(color))
      m.position.set(x, y, z)
      m.castShadow = true
      m.receiveShadow = true
      return m
    }
    function roundBox(w, h, d, r, color, x, y, z) {
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
      const m = new THREE.Mesh(geo, makeMat(color))
      m.position.set(x, y, z)
      m.castShadow = true
      m.receiveShadow = true
      return m
    }
    function cyl(rT, rB, h, color, x, y, z, seg) {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(rT, rB, h, seg || 12), makeMat(color))
      m.position.set(x, y, z)
      m.castShadow = true
      m.receiveShadow = true
      return m
    }

    this.clickableObjects = []

    // 1. Cabinet (白色收纳柜) - standing beside the computer desk
    const cabinetGroup = new THREE.Group()
    cabinetGroup.name = 'cabinet'
    const cW = 1.2, cH = 2.0, cD = 0.7
    cabinetGroup.add(roundBox(cW, cH, cD, 0.06, P.cabinet, 0, cH / 2, 0))
    cabinetGroup.add(box(cW - 0.06, 0.04, cD - 0.06, P.cabinetTrim, 0, cH * 2 / 3, 0))
    cabinetGroup.add(box(cW - 0.06, 0.04, cD - 0.06, P.cabinetTrim, 0, cH / 3, 0))
    cabinetGroup.add(cyl(0.03, 0.03, 0.15, P.metal, 0.4, cH * 5 / 6, cD / 2 + 0.01))
    cabinetGroup.add(cyl(0.03, 0.03, 0.15, P.metal, 0.4, cH / 2, cD / 2 + 0.01))
    cabinetGroup.add(cyl(0.03, 0.03, 0.15, P.metal, 0.4, cH / 6, cD / 2 + 0.01))
    cabinetGroup.add(cyl(0.035, 0.035, 0.1, P.peach, -0.2, cH * 2 / 3 + 0.1, 0.38))
    cabinetGroup.add(cyl(0.03, 0.03, 0.08, P.mint, 0.05, cH * 2 / 3 + 0.08, 0.38))
    cabinetGroup.add(cyl(0.025, 0.025, 0.06, P.lavender, 0.25, cH * 2 / 3 + 0.06, 0.38))
    cabinetGroup.userData = { sceneId: 'cabinet', label: '白色收纳柜' }
    cabinetGroup.rotation.y = Math.PI
    const roomPlatformY = 0.72
    if (tablePos) {
      cabinetGroup.position.set(tablePos.x + 2.35, roomPlatformY, tablePos.z - 0.72)
    } else {
      cabinetGroup.position.set(3.0, roomPlatformY, 2.5)
    }
    cabinetGroup.traverse(c => { if (c.isMesh) c.userData.parentClickable = 'cabinet' })

    // 2. Bag (书包) - ON the chair seat
    const bagGroup = new THREE.Group()
    bagGroup.name = 'bag'
    const bagBody = roundBox(0.55, 0.45, 0.35, 0.06, P.bag, 0, 0.225, 0)
    const bagFlap = roundBox(0.5, 0.025, 0.3, 0.02, P.bagAccent, 0, 0.46, 0)
    const strap1 = box(0.04, 0.25, 0.04, P.bagAccent, -0.18, 0.58, 0.19)
    const strap2 = box(0.04, 0.25, 0.04, P.bagAccent, 0.18, 0.58, 0.19)
    bagGroup.add(bagBody, bagFlap, strap1, strap2)
    bagGroup.userData = { sceneId: 'bag', label: '书包' }
    if (chairPos) {
      bagGroup.position.set(chairPos.x, chairPos.y + 0.45, chairPos.z)
    } else {
      bagGroup.position.set(1.78, 0.6, 1.51)
    }
    bagGroup.traverse(c => { if (c.isMesh) c.userData.parentClickable = 'bag' })

    // 3. Trapezoid box (梯形收纳盒) - ON the bedside table
    const trapGroup = new THREE.Group()
    trapGroup.name = 'trapezoid-box'
    const trapBody = roundBox(0.8, 0.35, 0.55, 0.04, P.trapBox, 0, 0.175, 0)
    const trapLid = roundBox(0.75, 0.03, 0.5, 0.02, P.trapBoxDark, 0, 0.37, 0)
    const trapItem = cyl(0.04, 0.04, 0.08, P.mint, -0.15, 0.41, 0.2)
    const trapItem2 = cyl(0.03, 0.03, 0.06, P.lavender, 0.12, 0.4, 0.2)
    trapGroup.add(trapBody, trapLid, trapItem, trapItem2)
    trapGroup.userData = { sceneId: 'trapezoid-box', label: '梯形收纳盒' }
    if (bedsidePos) {
      trapGroup.position.set(bedsidePos.x, bedsidePos.y + 0.95, bedsidePos.z)
    } else {
      trapGroup.position.set(-0.7, 1.1, 3.5)
    }
    trapGroup.traverse(c => { if (c.isMesh) c.userData.parentClickable = 'trapezoid-box' })

    // 4. Cart (白色小推车) - next to wardrobe on the left side
    const cartGroup = new THREE.Group()
    cartGroup.name = 'cart'
    const cShelf1 = roundBox(1.2, 0.04, 0.7, 0.02, P.cart, 0, 1.3, 0)
    const cShelf2 = roundBox(1.2, 0.04, 0.7, 0.02, P.cart, 0, 0.75, 0)
    const cShelf3 = roundBox(1.2, 0.04, 0.7, 0.02, P.cart, 0, 0.2, 0)
    const cPole1 = cyl(0.02, 0.02, 1.4, P.metal, -0.5, 0.75, 0.5)
    const cPole2 = cyl(0.02, 0.02, 1.4, P.metal, 0.5, 0.75, 0.5)
    const cPole3 = cyl(0.02, 0.02, 1.4, P.metal, -0.5, 0.75, -0.3)
    const cPole4 = cyl(0.02, 0.02, 1.4, P.metal, 0.5, 0.75, -0.3)
    const cWheel1 = cyl(0.06, 0.06, 0.04, P.cartWheel, -0.45, 0.03, 0.5)
    cWheel1.rotation.z = Math.PI / 2
    const cWheel2 = cyl(0.06, 0.06, 0.04, P.cartWheel, 0.45, 0.03, 0.5)
    cWheel2.rotation.z = Math.PI / 2
    const cWheel3 = cyl(0.06, 0.06, 0.04, P.cartWheel, -0.45, 0.03, -0.3)
    cWheel3.rotation.z = Math.PI / 2
    const cWheel4 = cyl(0.06, 0.06, 0.04, P.cartWheel, 0.45, 0.03, -0.3)
    cWheel4.rotation.z = Math.PI / 2
    const cB1 = cyl(0.03, 0.03, 0.1, P.peach, -0.3, 1.42, 0.1)
    const cB2 = cyl(0.025, 0.025, 0.08, P.mint, 0.15, 1.4, 0.15)
    const cB3 = cyl(0.025, 0.025, 0.07, P.lavender, 0.35, 1.39, 0.05)
    cartGroup.add(cShelf1, cShelf2, cShelf3, cPole1, cPole2, cPole3, cPole4)
    cartGroup.add(cWheel1, cWheel2, cWheel3, cWheel4, cB1, cB2, cB3)
    cartGroup.userData = { sceneId: 'cart', label: '白色小推车' }
    if (wardrobePos) {
      cartGroup.position.set(wardrobePos.x + 1.8, 0, wardrobePos.z + 0.5)
    } else {
      cartGroup.position.set(-1.2, 0, -1.7)
    }
    cartGroup.traverse(c => { if (c.isMesh) c.userData.parentClickable = 'cart' })

    this.clickableObjects = [cabinetGroup, bagGroup, trapGroup, cartGroup]
    this.scene.add(cabinetGroup, bagGroup, trapGroup, cartGroup)

    cabinetGroup.traverse(c => { if (c.isMesh) this.nodeToArea.set(c.uuid, { areaId: 'cabinet', label: '白色收纳柜' }) })
    bagGroup.traverse(c => { if (c.isMesh) this.nodeToArea.set(c.uuid, { areaId: 'bag', label: '书包' }) })
    trapGroup.traverse(c => { if (c.isMesh) this.nodeToArea.set(c.uuid, { areaId: 'trapezoid-box', label: '梯形收纳盒' }) })
    cartGroup.traverse(c => { if (c.isMesh) this.nodeToArea.set(c.uuid, { areaId: 'cart', label: '白色小推车' }) })
  }

  buildNodeToAreaMap(model) {
    this.nodeToArea.clear()
    // Map GLB node names to data.json sceneIds (all 7 areas)
    const mapping = {
      'wardrobe': { names: ['Wardrobe 1'], label: '衣柜' },
      'trapezoid-box': { names: ['Bedside table 1'], label: '梯形收纳盒' },
      'desk': { names: ['Table 1', 'PC 1', 'Keyboard 1', 'Chair 1'], label: '桌面' },
      'cart': { names: ['Cube.008'], label: '白色小推车' },
      'shelf': { names: ['Wall shelf.001', 'Book stack 1.001', 'Book stack 2.001', 'Wall bookshelf.001'], label: '架子' },
      'wall': { names: ['Picture 1.001', 'Picture 2.001', 'Picture 3.001', 'Picture'], label: '墙面' },
    }

    model.traverse(child => {
      if (!child.isMesh) return
      for (const [areaId, m] of Object.entries(mapping)) {
        for (const pattern of m.names) {
          if (child.name === pattern || child.name?.startsWith(pattern.split(' ')[0])) {
            this.nodeToArea.set(child.uuid, { areaId, label: m.label })
            return
          }
        }
      }
    })
  }

  findAreaForMesh(mesh) {
    if (this.nodeToArea.has(mesh.uuid)) {
      return this.nodeToArea.get(mesh.uuid)
    }
    let current = mesh.parent
    while (current && current !== this.roomModel) {
      if (this.nodeToArea.has(current.uuid)) {
        return this.nodeToArea.get(current.uuid)
      }
      const name = current.name || ''
      const mapping = {
        'wardrobe': { names: ['Wardrobe 1'], label: '衣柜' },
        'trapezoid-box': { names: ['Bedside table 1'], label: '梯形收纳盒' },
        'desk': { names: ['Table 1', 'PC 1', 'Keyboard 1', 'Chair 1'], label: '桌面' },
        'cart': { names: ['Cube.008'], label: '白色小推车' },
        'shelf': { names: ['Wall shelf.001', 'Book stack 1.001', 'Book stack 2.001', 'Wall bookshelf.001'], label: '架子' },
        'wall': { names: ['Picture 1.001', 'Picture 2.001', 'Picture 3.001', 'Picture'], label: '墙面' },
      }
      for (const [areaId, m] of Object.entries(mapping)) {
        for (const pattern of m.names) {
          if (name === pattern || name?.startsWith(pattern.split(' ')[0])) {
            return { areaId, label: m.label }
          }
        }
      }
      current = current.parent
    }
    return null
  }

  async loadRoom() {
    return new Promise((resolve, reject) => {
      this.gltfLoader.load(
        '/models/roomv3.glb',
        (gltf) => {
          const model = gltf.scene
          this.enhanceMaterials(model)

          const box3 = new THREE.Box3().setFromObject(model)
          const center = box3.getCenter(new THREE.Vector3())
          model.position.x -= center.x
          model.position.y -= box3.min.y
          model.position.z -= center.z

          this.scene.add(model)
          this.roomModel = model
          this.buildNodeToAreaMap(model)
          this.addOverlayItems(model)
          resolve(model)
        },
        (progress) => {
          if (progress.total > 0 && this.onLoadProgress) {
            this.onLoadProgress(Math.round((progress.loaded / progress.total) * 100))
          }
        },
        (err) => {
          console.error('Failed to load room model:', err)
          reject(err)
        }
      )
    })
  }

  setupEvents() {
    this._onPointerMove = this.onPointerMove.bind(this)
    this._onPointerDown = this.onPointerDown.bind(this)
    this._onResize = this.onResize.bind(this)
    this.renderer.domElement.addEventListener('pointermove', this._onPointerMove)
    this.renderer.domElement.addEventListener('pointerdown', this._onPointerDown)
    window.addEventListener('resize', this._onResize)
  }

  onPointerMove(event) {
    if (!this.roomModel) return
    const rect = this.renderer.domElement.getBoundingClientRect()
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    this.raycaster.setFromCamera(this.mouse, this.camera)

    const allMeshes = []
    this.roomModel.traverse(c => { if (c.isMesh) allMeshes.push(c) })
    if (this.clickableObjects) {
      this.clickableObjects.forEach(obj => {
        obj.traverse(c => { if (c.isMesh) allMeshes.push(c) })
      })
    }

    const intersects = this.raycaster.intersectObjects(allMeshes, false)

    if (intersects.length > 0) {
      const hitMesh = intersects[0].object

      // Check overlay objects first
      if (this.clickableObjects) {
        for (const obj of this.clickableObjects) {
          let found = false
          obj.traverse(c => { if (c === hitMesh) found = true })
          if (found) {
            const areaId = obj.userData.sceneId
            const label = obj.userData.label
            if (!this.hoveredArea || this.hoveredArea.areaId !== areaId) {
              this.unhover()
              this.hoveredArea = { areaId, label }
              const meshes = []
              obj.traverse(c => { if (c.isMesh) meshes.push(c) })
              this.outlineEffect.selection.set(meshes)
              gsap.to(obj.scale, { x: 1.04, y: 1.05, z: 1.04, duration: 0.25, ease: 'back.out(1.5)' })
              this.renderer.domElement.style.cursor = 'pointer'
              if (this.onAreaHover) this.onAreaHover({ sceneId: areaId, label })
            }
            return
          }
        }
      }

      const area = this.findAreaForMesh(hitMesh)
      if (area) {
        if (!this.hoveredArea || this.hoveredArea.areaId !== area.areaId) {
          this.unhoverOverlayObjects()
          this.hoveredArea = area
          this.hover(area.areaId)
          this.renderer.domElement.style.cursor = 'pointer'
          if (this.onAreaHover) this.onAreaHover({ sceneId: area.areaId, label: area.label })
        }
      } else if (this.hoveredArea) {
        this.unhoverOverlayObjects()
        this.hoveredArea = null
        this.renderer.domElement.style.cursor = 'default'
        if (this.onAreaHover) this.onAreaHover(null)
      }
    } else if (this.hoveredArea) {
      this.unhoverOverlayObjects()
      this.hoveredArea = null
      this.renderer.domElement.style.cursor = 'default'
      if (this.onAreaHover) this.onAreaHover(null)
    }
  }

  unhoverOverlayObjects() {
    if (this.clickableObjects) {
      this.clickableObjects.forEach(obj => {
        gsap.to(obj.scale, { x: 1, y: 1, z: 1, duration: 0.2, ease: 'power2.out' })
      })
    }
  }

  hover(areaId) {
    if (!this.roomModel) return
    const highlighted = []
    this.roomModel.traverse(child => {
      if (!child.isMesh) return
      const a = this.findAreaForMesh(child)
      if (a && a.areaId === areaId) highlighted.push(child)
    })
    if (highlighted.length > 0) {
      this.outlineEffect.selection.set(highlighted)
    }
  }

  unhover() {
    this.outlineEffect.selection.clear()
  }

  flyToObject(sceneId) {
    if (!this.roomModel || this.isAnimating) return

    const nodeMap = {
      'wardrobe': 'Wardrobe 1',
      'trapezoid-box': 'Bedside table 1',
      'desk': 'Table 1',
      'cart': 'Cube.008',
      'shelf': 'Wall shelf.001',
      'wall': 'Picture 1.001',
    }

    const customPositions = {
      'cabinet': { node: 'Table 1', offsetX: 2.35, offsetY: 1.22, offsetZ: -0.72, label: '白色收纳柜' },
      'bag': { node: 'Chair 1', offsetX: 0, offsetY: 0.45, offsetZ: 0, label: '书包' },
    }

    if (customPositions[sceneId]) {
      const info = customPositions[sceneId]
      let targetPos = new THREE.Vector3(info.offsetX, info.offsetY, info.offsetZ)
      if (info.node && this.roomModel) {
        let node = null
        this.roomModel.traverse(c => { if (c.name === info.node && !node) node = c })
        if (node) {
          const nodePos = new THREE.Vector3()
          node.getWorldPosition(nodePos)
          targetPos = nodePos.clone().add(new THREE.Vector3(info.offsetX, info.offsetY, info.offsetZ))
        }
      }

      this.isAnimating = true
      this.controls.enabled = false

      const direction = new THREE.Vector3().subVectors(this.camera.position, this.controls.target).normalize()
      const newCamPos = targetPos.clone().add(direction.multiplyScalar(5))
      newCamPos.y = Math.max(newCamPos.y, targetPos.y + 2)

      gsap.to(this.camera.position, {
        x: newCamPos.x, y: newCamPos.y, z: newCamPos.z,
        duration: 0.7, ease: 'power2.inOut',
      })
      gsap.to(this.controls.target, {
        x: targetPos.x, y: targetPos.y + 0.3, z: targetPos.z,
        duration: 0.7, ease: 'power2.inOut',
        onComplete: () => { this.isAnimating = false; this.controls.enabled = true },
      })
      this.unhover()
      this.hoveredArea = null
      return
    }

    const targetName = nodeMap[sceneId]
    if (!targetName) return

    let targetNode = null
    this.roomModel.traverse(child => {
      if (child.name === targetName && !targetNode) targetNode = child
    })
    if (!targetNode) {
      const prefix = targetName.split(' ')[0]
      this.roomModel.traverse(child => {
        if (child.name?.startsWith(prefix) && !targetNode) targetNode = child
      })
    }
    if (!targetNode) return

    const targetPos = new THREE.Vector3()
    targetNode.getWorldPosition(targetPos)

    this.isAnimating = true
    this.controls.enabled = false

    const direction = new THREE.Vector3().subVectors(this.camera.position, this.controls.target).normalize()
    const dist = 5
    const newCamPos = targetPos.clone().add(direction.multiplyScalar(dist))
    newCamPos.y = Math.max(newCamPos.y, targetPos.y + 2)

    gsap.to(this.camera.position, {
      x: newCamPos.x, y: newCamPos.y, z: newCamPos.z,
      duration: 0.7, ease: 'power2.inOut',
    })
    gsap.to(this.controls.target, {
      x: targetPos.x, y: targetPos.y + 0.3, z: targetPos.z,
      duration: 0.7, ease: 'power2.inOut',
      onComplete: () => {
        this.isAnimating = false
        this.controls.enabled = true
      },
    })

    this.unhover()
    this.hoveredArea = null
  }

  flyToOverview() {
    if (this.isAnimating) return
    this.isAnimating = true
    this.controls.enabled = false

    gsap.to(this.camera.position, {
      x: this.defaultCameraPos.x, y: this.defaultCameraPos.y, z: this.defaultCameraPos.z,
      duration: 0.6, ease: 'power2.inOut',
    })
    gsap.to(this.controls.target, {
      x: this.defaultTarget.x, y: this.defaultTarget.y, z: this.defaultTarget.z,
      duration: 0.6, ease: 'power2.inOut',
      onComplete: () => {
        this.isAnimating = false
        this.controls.enabled = true
      },
    })

    this.unhover()
    this.hoveredArea = null
  }

  addFurniture() { /* unused with GLB mode */ }

  onPointerDown(event) {
    if (this.isAnimating) return
    const rect = this.renderer.domElement.getBoundingClientRect()
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

    this.raycaster.setFromCamera(this.mouse, this.camera)

    const allMeshes = []
    if (this.roomModel) this.roomModel.traverse(c => { if (c.isMesh) allMeshes.push(c) })
    if (this.clickableObjects) {
      this.clickableObjects.forEach(obj => {
        obj.traverse(c => { if (c.isMesh) allMeshes.push(c) })
      })
    }
    if (allMeshes.length === 0) return

    const intersects = this.raycaster.intersectObjects(allMeshes, false)
    if (intersects.length === 0) return

    const hitMesh = intersects[0].object

    // Check overlay objects first
    if (this.clickableObjects) {
      for (const obj of this.clickableObjects) {
        let found = false
        obj.traverse(c => { if (c === hitMesh) found = true })
        if (found && this.onAreaClick) {
          this.onAreaClick({ sceneId: obj.userData.sceneId, label: obj.userData.label })
          return
        }
      }
    }

    if (!this.roomModel) return
    const area = this.findAreaForMesh(hitMesh)
    if (area && this.onAreaClick) {
      this.onAreaClick({ sceneId: area.areaId, label: area.label })
    }
  }

  onResize() {
    const w = this.container.clientWidth
    const h = this.container.clientHeight
    if (w === 0 || h === 0) return
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(w, h)
    this.composer.setSize(w, h)
  }

  animate() {
    this._animId = requestAnimationFrame(() => this.animate())
    this.controls.update()
    this.composer.render()
  }

  dispose() {
    cancelAnimationFrame(this._animId)
    this.controls.dispose()
    this.composer.dispose()
    this.renderer.dispose()
    this.renderer.domElement.removeEventListener('pointermove', this._onPointerMove)
    this.renderer.domElement.removeEventListener('pointerdown', this._onPointerDown)
    window.removeEventListener('resize', this._onResize)
    if (this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement)
    }
  }
}
