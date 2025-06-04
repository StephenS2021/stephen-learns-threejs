import * as THREE from 'three';
import { useEffect, useRef } from "react";
import { OrbitControls, RGBELoader } from 'three/examples/jsm/Addons.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { createNoise3D, NoiseFunction3D } from 'simplex-noise';
// import dat from 'dat.gui';

const ThreeTerrain: React.FC = () => {
    // create ref to keep track of the div for rendering without triggering re-rendering
    // this canvasRef holds a div that will contain the canvas element within it
    // This way we can manipulate the DOM (like appending the canvas) withou t triggering a re-render of the component
    const canvasRef = useRef<HTMLDivElement>(null);
    const sceneRef = useRef<THREE.Scene | null>(null); // Holds reference to the scene object which can be modified without causing re-renders
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null); // Holds reference to the renderer object which can be modified without causing re-renders
    
    // Using a ref instead of a regular variable so it persists between re-renders
    // If we didn't use a ref, we ensure that the animation frame is the latest value 
    //   because it wont be reset due to changes in state/props
    const animationFrameIdRef = useRef<number | null>(null); 
    
    const fractalPerlinNoise = (
        noise:NoiseFunction3D, 
        x:number, 
        y:number, 
        z:number,
        octaves:number, // Number of noise layers i.e how many combined samples are taken at the given point
        persistence:number, // How much each octave contributes
        lacunarity:number, // How much the frequency changes per octave
        scale:number // Scales how far apart each sample is taken
    ):number => {
        let value:number = 0;
        let amplitude:number = 1;
        let maxValue:number = 0;
        let frequency:number = 1;
        for( let i = 0; i < octaves; i++ ){
            value += noise((x * frequency) * scale, (y * frequency )* scale, (z * frequency) * scale) * amplitude;
            maxValue += amplitude;
            frequency *= lacunarity;
            amplitude *= persistence;
        }

        return value / maxValue;
    };
    
    useEffect(() => {
        if (!canvasRef.current) return;

        const scene:THREE.Scene = new THREE.Scene();
        sceneRef.current = scene;

        const camera:THREE.PerspectiveCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        
        // Create renderer
        const renderer:THREE.WebGLRenderer = new THREE.WebGLRenderer({
            antialias: true,
            powerPreference: "high-performance"
        });

        renderer.setPixelRatio(window.devicePixelRatio);

        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true;                       // Enable shadows
        rendererRef.current = renderer;

        canvasRef.current.appendChild(renderer.domElement); // Add renderer to the canvas ref


        // Create orbit controls for the camera
        const orbit:OrbitControls = new OrbitControls(camera, renderer.domElement);
        camera.position.set(0, 15, 100); // set x, y, z of camera
        camera.rotation.y = 0;
        camera.position.set(-camera.position.x, camera.position.y, -camera.position.z); // set x, y, z of camera

        orbit.update() // update orbit of camera

        new RGBELoader().load('/models/pure-sky/kloofendal_48d_partly_cloudy_puresky_4k.hdr', (envMap) => {
            envMap.mapping = THREE.EquirectangularReflectionMapping
            scene.background = envMap
            scene.environment = envMap // Set the environment map for reflections from the HDRI file
        })

        /*
             ____                           _              
            / ___| ___  ___  _ __ ___   ___| |_ _ __ _   _ 
           | |  _ / _ \/ _ \| '_ ` _ \ / _ \ __| '__| | | |
           | |_| |  __/ (_) | | | | | |  __/ |_| |  | |_| |
            \____|\___|\___/|_| |_| |_|\___|\__|_|   \__, |
                                                    |___/ 
        */
        const width:number = 200; // width of the terrain
        const height:number = 200; // height of the terrain


        // Noise parameters
        const scale:number = 0.03; // How much space between each sample. A larger scale means more variance in height (i.e. more drastic hills and valleys) 
        const octaves:number = 4; // Number of octaves to use for the fractal noise
        const persistence:number = 0.5; // How much each octave contributes to the final value
        const lacunarity:number = 5; // How much the frequency changes per octave
        const amplitude:number = 5.5; // How much the noise affects the height of the terrain. Also correlated with how drastic the hills and valleys are

        // Number of segments across the sketch. Defines how many vertices are created across the width and height
        // The more segments, the more vertices, the more detail
        // If segments = 2, then there are 3 vertices across the width and height
        const segments:number = 150; 

    

        const geometry:THREE.BufferGeometry = new THREE.BufferGeometry(); // Create a new geometry object
        const vertices: number[] = []; // Create vertex array
        const noise3d:NoiseFunction3D = createNoise3D(); // Create a 3D noise function from simplex-noise

        // Create vertex by perlin noise
        // Loop over x for each row y
        for( let i = 0; i <= segments; i++ ){ // Row
            for( let j = 0; j <= segments; j++){ // Column
                const x:number = ((i / segments) * width) - (width / 2); // Scale the x and y for each segment to the width / height then subtract height / width to center aroung 0, 0, 0
                const y:number = ((j / segments) * height) - (height / 2);
                // const z:number = noise3d(x * scale, y * scale, 0) * amplitude; // Sample perlin noise and amplify it

                const z:number = fractalPerlinNoise(noise3d, x, y, 0, octaves, persistence, lacunarity, scale) * amplitude; // Sample fractal perlin noise and amplify it
                // console.log(fractalPerlinNoise(noise3d, x, y, 4, 0.5, 0, 20));
                vertices.push(x, y, z);
            }
        }
        
        // Set vertex positions in the geometry, specify each vertex has 3 components
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

        // Conect vertices into quads
        // This runs one less than the vertices loop (using < rather than ≤) because for each segment there are segment+1 vertices ()
        // A quad is a square formed from 4 vertices, and each quad is made up of 2 triangles
        // Segments = n, the grid will have (N + 1) x (N + 1) vertices. N x N quads (squares).
        const indices:number[] = [];
        // Indices is an array of numbers that specify the order in which vertices are connected to form triangles.
        for( let y = 0; y < segments; y++ ){
            for( let x = 0; x < segments; x++){ 
                // Calculates the index at vertex for row i and column j
                /**
                 *  
                    If segments = 2
                        Vertices:
                        0 --- 1 --- 2
                        |     |     |
                        3 --- 4 --- 5
                        |     |     |
                        6 --- 7 --- 8
                    
                    a = 0 * (2 + 1) + 0 = 0
                    b = 0 + 1 = 1
                    c = (0 + 1) * (2 + 1) + 0 = 3
                    d = 3 + 1 = 4

                    Then
                        triangle_1 = (0, 1, 3) = (a, b, c)
                        triangle_2 = (1, 4, 3) = (b, d, c)

                    Triangle Quad:
                        0 --- 1     2
                        |  /  |      
                        3 --- 4     5
                                    
                        6     7     8
                    * 
                    * 
                    */
                const a:number = y * (segments + 1) + x; // Top-left vertex of the quad
                const b:number = a + 1; // Top-right vertex of the quad
                const c:number = (y + 1) * (segments + 1) + x; // Bottom-left vertex of the quad
                const d:number = c + 1; // Bottom-right vertex of the quad


                // Create two triangles for each quad
                indices.push(a, b, c);
                indices.push(b, d, c);
            }
        }

        // Set indices in the geometry
        // THREE will automatically interpret the list in groups of 3 to form triangles
        geometry.setIndex(indices);

        // Compute normals for lighting
        //  A normal is a vector that is perpendicular to a surface
        geometry.computeVertexNormals();            // For indexed geometries, the method sets each vertex normal to be the average of the face normals of the faces that share that vertex.

        // Just assign the complete geometry to a new variable named terrainGeometry
        // TODO: just change geometry to terrainGeometry.
        const terrainGeometry:THREE.BufferGeometry = geometry;
        const terrainMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x2B65EC, 
            // wireframe: true, 
            // shininess: 50, 
            roughness: 0,
            side: THREE.DoubleSide,
        });
        const terrainMesh:THREE.Mesh = new THREE.Mesh(terrainGeometry, terrainMaterial);
        terrainMesh.castShadow = true;
        terrainMesh.receiveShadow = true;
        terrainMesh.rotation.x = -0.5 * Math.PI; // Rotate terrain flat
        scene.add(terrainMesh);

        let textMesh:THREE.Mesh = new THREE.Mesh() // Initialize textMesh to avoid undefined errors
        const loader = new FontLoader();

        // Load font from JSON file because I think that is the only way to load a font in Three.js cus its 3D
        loader.load( '/fonts/Roboto_Bold.json', ( font ) => {
            const textGeo = new TextGeometry( 'Stephen Spencer-Wong', { // Create a text geometry and write my name :)
                font: font,
                size: 10,
                depth: 5,
                curveSegments: 1,
                bevelEnabled: false,
                bevelThickness: 1,
                bevelSize: 1,
                bevelOffset: 0,
                bevelSegments: 0
            })
            textGeo.center() // Center text at the origin
            const material:THREE.MeshStandardMaterial = new THREE.MeshStandardMaterial({ color: 0x34ebab, roughness: 0, side: THREE.DoubleSide }) // Give text a material just like any other ThreeJs object
            textMesh = new THREE.Mesh(textGeo, material)
            textMesh.name = 'Stephen_Name' // Name the text mesh so I can identify it with raycasting later
            textMesh.position.set(0, 10, 0) // Position the text above the terrain
            textMesh.castShadow = true // Allow text to cast shadow
            textMesh.receiveShadow = true // Allow text to receive shadow
            textMesh.rotateY(Math.PI) // Rotate text to face the camera
            scene.add(textMesh)
        })

        /**
             _     _       _     _   _             
            | |   (_) __ _| |__ | |_(_)_ __   __ _ 
            | |   | |/ _` | '_ \| __| | '_ \ / _` |
            | |___| | (_| | | | | |_| | | | | (_| |
            |_____|_|\__, |_| |_|\__|_|_| |_|\__, |
                    |___/                    |___/ 
            */
        const ambientLight:THREE.AmbientLight = new THREE.AmbientLight(0xFFFFFF, 2);
        scene.add(ambientLight);

        const directionalLight:THREE.DirectionalLight = new THREE.DirectionalLight(0xFFFFFF, 1);
        
        directionalLight.position.set(-30, 50, 0);
        directionalLight.castShadow = true;                                 // Allow directional light to cast shadow
        directionalLight.shadow.camera.right = 15;
        directionalLight.shadow.camera.top = 15;

        scene.add(directionalLight);

        // const dLightHelper = new THREE.DirectionalLightHelper(directionalLight, 5);
        // scene.add(dLightHelper);

        /**
             ____                           _   _             
            |  _ \ __ _ _   _  ___ __ _ ___| |_(_)_ __   __ _ 
            | |_) / _` | | | |/ __/ _` / __| __| | '_ \ / _` |
            |  _ < (_| | |_| | (_| (_| \__ \ |_| | | | | (_| |
            |_| \_\__,_|\__, |\___\__,_|___/\__|_|_| |_|\__, |
                        |___/                           |___/ 
         */

        const raycaster:THREE.Raycaster = new THREE.Raycaster() // Create a raycaster to detect mouse clicks
        document.addEventListener('click', (event:MouseEvent) => {
            if (!canvasRef.current) return
            const coords:THREE.Vector2  = new THREE.Vector2(
                (event.clientX / canvasRef.current.clientWidth) * 2 - 1, // Calculate the coordinates of the mouse click normalized between -1 and 1
                -((event.clientY / canvasRef.current.clientHeight) * 2 -1) // Invert y coordinate because Three.js uses different system or something
            )

            raycaster.setFromCamera(coords, camera); // Set the raycaster from the camera and mouse coordinates
            const intersects:THREE.Intersection[] = raycaster.intersectObjects(scene.children, true); // Check for intersections with the scene children
            if (intersects.length > 0) { // If there are intersections
                console.log(intersects[0].object); // Log the first intersection object
            }
        })

        document.addEventListener('pointermove', (event:MouseEvent) => {
            if (!canvasRef.current) return
            textMesh.material.color.set(0x34ebab); // Reset text color to original
            const coords:THREE.Vector2  = new THREE.Vector2(
                (event.clientX / canvasRef.current.clientWidth) * 2 - 1, // Calculate the coordinates of the mouse click normalized between -1 and 1
                -((event.clientY / canvasRef.current.clientHeight) * 2 -1) // Invert y coordinate because Three.js uses different system or something
            )

            raycaster.setFromCamera(coords, camera); // Set the raycaster from the camera and mouse coordinates
            const intersects:THREE.Intersection[] = raycaster.intersectObjects(scene.children, true); // Check for intersections with the scene children
            if (intersects.length > 0) { // If there are intersections
                console.log(intersects[0].object); // Log the first intersection object
                const intersectedObject = intersects[0].object // Get the intersected object
                if(intersectedObject.name === 'Stephen_Name') { // If the intersected object is the text
                    intersectedObject.material.color.set(0xFFFFFF); // Change the color of the text to red
                }
            }
        })
        /**
             ____                _           _             
            |  _ \ ___ _ __   __| | ___ _ __(_)_ __   __ _ 
            | |_) / _ \ '_ \ / _` |/ _ \ '__| | '_ \ / _` |
            |  _ <  __/ | | | (_| |  __/ |  | | | | | (_| |
            |_| \_\___|_| |_|\__,_|\___|_|  |_|_| |_|\__, |
                                                    |___/ 
            */

        let flying:number = 0;
        // Update scene and rotate cube
        const renderScene = () => {
            flying -= 0.05;
            const positions:THREE.TypedArray = terrainMesh.geometry.attributes.position.array; // Get the position array from the geometry
            for( let i = 0; i <= segments; i++ ){ // columns
                for( let j = 0; j <= segments; j++){ // rows
                    const index:number = (i * (segments + 1) + j) * 3; // Get correct index calculations
                    const x:number = (i / segments) * width - width / 2; // Scale the x and y for each segment to the width / height then subtract height / width to center aroung 0, 0, 0
                    const y:number = (j / segments) * height - height / 2;
                    // positions[index + 2] = noise3d(x * scale, y * scale + flying, 0) * amplitude; // Update z value
                    positions[index + 2] = fractalPerlinNoise(noise3d, x, y + flying, flying, 8, 0.6, 1.8, 0.020) * (amplitude + 1); // Update z value using custom fractal noise function

                }
            }

            // Mark the buffer as needing an update
            terrainMesh.geometry.attributes.position.needsUpdate = true;
            // Recompute normals
            terrainMesh.geometry.computeVertexNormals();

            renderer.render(scene,camera);

            animationFrameIdRef.current = requestAnimationFrame(renderScene); // Save animation frame for cleanup
        }
        animationFrameIdRef.current = requestAnimationFrame(renderScene);

        // Handle window resize
        const handleResize = () => {
            // If no canvas ref don't resize
            if (!canvasRef.current) return;
    
            const width = canvasRef.current.clientWidth;
            const height = canvasRef.current.clientHeight;
            
            // Update camera
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            
            // Update renderer
            renderer.setSize(width, height, false);
        };
        // Call resize immediately because we initialize with specific styling when we return the canvas below
        handleResize();
        window.addEventListener('resize', handleResize);

        // Cleanup function removes gui and canvas dom element
        return () => {

            // Stop animation loop
            if (animationFrameIdRef.current) {
                cancelAnimationFrame(animationFrameIdRef.current);
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
        };
        
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
    }}/>;
}   


export default ThreeTerrain;


/* CREDIT: 
* - https://medium.com/@claudeando/integrating-three-js-with-next-js-and-typescript-81f47730103e
* - https://www.youtube.com/watch?v=xJAfLdUgdc4&list=PLjcjAqAnHd1EIxV4FSZIiJZvsdrBc1Xho
* - https://thebookofshaders.com/13/
* - Learning Three.js - 2nd Edition by Jos Dirksen
* - Real Time Rendering - 4th Edition by  Eric Haines, Naty Hoffman, and Tomas Möller
* - https://www.youtube.com/watch?v=jK4uXGY07vA
* -
* */