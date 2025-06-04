import * as THREE from 'three'
import { useEffect, useRef } from "react"
import { OrbitControls } from 'three/examples/jsm/Addons.js'
import { GLTFLoader, RGBELoader } from 'three/examples/jsm/Addons.js'
import * as dat from 'lil-gui'


const ThreeEnvironmentScene: React.FC  = () => {
    const canvasRef = useRef<HTMLDivElement>(null)
    const sceneRef = useRef<THREE.Scene | null>(null)
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
    const animationFrameIdRef = useRef<number | null>(null)


    useEffect(() => {
        if (!canvasRef.current) return
        
        // const gui = new dat.GUI()
        const scene:THREE.Scene = new THREE.Scene()
        sceneRef.current = scene

        const camera:THREE.PerspectiveCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
        camera.position.set(0, 5, 10)
        camera.lookAt(0, 0, 0) // Look at the scene origin

       

        // Create renderer
        const renderer:THREE.WebGLRenderer = new THREE.WebGLRenderer({
            antialias: true,
            powerPreference: "high-performance"
        })


        renderer.setPixelRatio(window.devicePixelRatio)
        renderer.setSize(window.innerWidth, window.innerHeight)
        renderer.shadowMap.enabled = true
        rendererRef.current = renderer // Store the renderer in a ref
        canvasRef.current.appendChild(renderer.domElement) // Add renderer to the canvas ref
        
        const orbit = new OrbitControls(camera, renderer.domElement)
        camera.position.set(0, 2, 5) // set x, y, z of camera
        orbit.update() // update orbit of camera

        // const gltfLoader: GLTFLoader = new GLTFLoader()
        // const cubeTextureLoader: THREE.CubeTextureLoader = new THREE.CubeTextureLoader()
        // const envMap = cubeTextureLoader.load([
        //     '/models/pure-sky/Standard-Cube-Map/px.png',
        //     '/models/pure-sky/Standard-Cube-Map/nx.png',
        //     '/models/pure-sky/Standard-Cube-Map/py.png',
        //     '/models/pure-sky/Standard-Cube-Map/ny.png',
        //     '/models/pure-sky/Standard-Cube-Map/pz.png',
        //     '/models/pure-sky/Standard-Cube-Map/nz.png',
        // ], () => { console.log('Loaded Cube Map')})

        // scene.background = envMap

        new RGBELoader().load('/models/pure-sky/kloofendal_48d_partly_cloudy_puresky_4k.hdr', (envMap) => {
            envMap.mapping = THREE.EquirectangularReflectionMapping
            scene.background = envMap
            scene.environment = envMap // Set the environment map for reflections from the HDRI file
        })

        const geometry = new THREE.BoxGeometry(2,2,2)
        const material = new THREE.MeshStandardMaterial({ color: 0x00ff00})
        const cube = new THREE.Mesh(geometry, material)
        scene.add(cube)

        
        // const ambientLight: THREE.AmbientLight = new THREE.AmbientLight(0xFFFFFF, 2)
        // scene.add(ambientLight)

        // const directionalLight = new THREE.DirectionalLight(0xffffff, 2)
        // directionalLight.position.set(5, 10, 7.5)
        // scene.add(directionalLight)



        const renderScene = () => {
            renderer.render(scene,camera);
            
            animationFrameIdRef.current = requestAnimationFrame(renderScene)
        }
        animationFrameIdRef.current = requestAnimationFrame(renderScene)

        return () => {
            // Stop animation loop
            if (animationFrameIdRef.current) {
                cancelAnimationFrame(animationFrameIdRef.current)
            }

            // Dispose of renderer and the canvas element
            if (rendererRef.current) {
                // First hide and remove the canvas
                const canvas = rendererRef.current.domElement;
                canvas.style.display = 'none';

                // Force a context loss to ensure WebGL resources are released
                rendererRef.current.forceContextLoss();

                // Dispose of the renderer
                rendererRef.current.dispose();
                // Remove canvas from the dom
                if (canvasRef.current && rendererRef.current.domElement) {
                    canvasRef.current.removeChild(rendererRef.current.domElement);
                }
                // Clear the renderer ref
                rendererRef.current = null;
            }

            // Dispose of the children of sceneRef
            // Disposes geometry, terrainGeometry, terrainMaterial
            if (sceneRef.current) {
                while (sceneRef.current.children.length > 0) {
                    const child = sceneRef.current.children[0];
                    if (child instanceof THREE.Mesh) {
                        child.geometry?.dispose();
                        child.material?.dispose();
                    }
                    sceneRef.current.remove(child);
                }
            }

            orbit.dispose();
            THREE.Cache.clear();
        }
        

    }, [])

    // Return canvas within a div container
    // This way we can dynamically create a canvas and append it to a div
    // Set canvas to be initially 100% of view
    return <div ref={canvasRef} style={{
        width: '100vw', 
        height: '100vh',
        margin: 0,
        padding: 0,
        overflow: 'hidden',
        zIndex: 1,           // Ensure it stays behind other content
        position: 'absolute', // Position absolute to fill the screen
        top: 0,
        left: 0,
    }}/>
}

export default ThreeEnvironmentScene;

/* CREDIT: 
* - https://threejs-journey.com/lessons/environment-map#
* - https://polyhaven.com/a/kloofendal_48d_partly_cloudy_puresky
* 
* */