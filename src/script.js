import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'lil-gui'
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'

const BASE_PATH = '/threejs-burger'

/**
 * Sampling Solutions: 
 * Anti-Aliasing: The process of reducing the distortion artifacts known as aliasing when representing a high-resolution signal at a lower resolution
 * 1. Super Sampling: Render the scene at a higher resolution and then downscale it to the desired resolution
 * 2. Multi Sampling: Render the scene multiple times at the same resolution and then combine the results
 * 3. Stochastic Sampling: Render the scene once at the desired resolution and then apply a random offset to each pixel
 * 4. Temporal Sampling: Render the scene multiple times at the same resolution and then combine the results
 * 5. Adaptive Sampling: Render the scene multiple times at the same resolution and then combine the results
*/


/**
 * Textures
 */

const cubeTextureLoader = new THREE.CubeTextureLoader()

const environmentMapTexture = cubeTextureLoader.load([
    `${BASE_PATH}/textures/environmentMaps/3/px.jpg`,
    `${BASE_PATH}/textures/environmentMaps/3/nx.jpg`,
    `${BASE_PATH}/textures/environmentMaps/3/py.jpg`,
    `${BASE_PATH}/textures/environmentMaps/3/ny.jpg`,
    `${BASE_PATH}/textures/environmentMaps/3/pz.jpg`,
    `${BASE_PATH}/textures/environmentMaps/3/nz.jpg`
])


/**Loaders */

const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath(`${BASE_PATH}/draco/`)
const gltfLoader = new GLTFLoader()
gltfLoader.setDRACOLoader(dracoLoader)


/**
 * Base
 */
// Debug
const gui = new dat.GUI()
const debugObject = {}
debugObject.envMapIntensity = 5

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()
scene.background = environmentMapTexture
scene.environment = environmentMapTexture

/** Update all Materials */

const updateAllMaterials = () =>
{
    scene.traverse((child) =>
    {
        if(child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial)
        {
            // child.material.envMap = environmentMapTexture
            child.material.envMapIntensity = debugObject.envMapIntensity
            child.material.needsUpdate = true
            child.castShadow = true
            child.receiveShadow = true
        }
    })
}

/** Models */

gltfLoader.load(
    `${BASE_PATH}/models/burger.glb`,
    (gltf) =>
    {   
        gltf.scene.scale.set(0.4, 0.4, 0.4)
        gltf.scene.position.set(0, - 4, 0)
        gltf.scene.rotation.y = Math.PI * 0.5

        scene.add(gltf.scene)
        gui.add(gltf.scene.rotation, 'y')
            .min(- Math.PI)
            .max(Math.PI)
            .step(0.001)
            .name('Rotation')
        updateAllMaterials()
    },
    (progress) =>
    {
        console.log('progress', progress)
    },
    (error) =>
    {
        console.log('error', error)
    }
)




/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**Light */

const directionalLight = new THREE.DirectionalLight(0xffffff, 3)
directionalLight.position.set(-2, 5, 4)
directionalLight.castShadow = true
directionalLight.shadow.mapSize.set(1024, 1024)
directionalLight.shadow.camera.far = 15
directionalLight.shadow.normalBias = 0.05

scene.add(directionalLight)

gui.add(directionalLight, 'intensity').min(0).max(10).step(0.001).name('Light intensity')
gui.add(directionalLight.position, 'x').min(- 5).max(5).step(0.001).name('Light x')
gui.add(directionalLight.position, 'y').min(- 5).max(5).step(0.001).name('Light y')
gui.add(directionalLight.position, 'z').min(- 5).max(5).step(0.001).name('Light z')
gui.add(debugObject, 'envMapIntensity').min(0).max(10).step(0.001).name('envMapIntensity').onChange(updateAllMaterials)



// const directionalLightCameraHelper = new THREE.CameraHelper(directionalLight.shadow.camera)
// directionalLightCameraHelper.visible = true
// scene.add(directionalLightCameraHelper)


/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.set(4, 1, - 4)
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    // antialias: true
})


renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.physicallyCorrectLights = true // for realistic lighting
renderer.toneMapping = THREE.ACESFilmicToneMapping // for realistic lighting
renderer.shadowMap.enabled = true // for realistic lighting
renderer.shadowMap.type = THREE.PCFSoftShadowMap // for realistic lighting

gui.add(renderer, 'toneMapping', {
    No: THREE.NoToneMapping,
    Linear: THREE.LinearToneMapping,
    Reinhard: THREE.ReinhardToneMapping,
    Cineon: THREE.CineonToneMapping,
    ACESFilmic: THREE.ACESFilmicToneMapping
    }).onFinishChange(() =>
    {
        renderer.toneMapping = Number(toneMapping.toneMapping)
        updateAllMaterials()
    })
gui.add(renderer, 'toneMappingExposure').min(0).max(10).step(0.001).name('toneMappingExposure')



/**
 * Animate
 */
const tick = () =>
{
    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()