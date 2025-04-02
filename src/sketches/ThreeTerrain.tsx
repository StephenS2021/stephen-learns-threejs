import * as THREE from 'three';
import { useEffect, useRef } from "react";
import { OrbitControls } from 'three/examples/jsm/Addons.js';
import { createNoise3D, NoiseFunction3D } from 'simplex-noise';
// import dat from 'dat.gui';

const ThreeTerrain: React.FC = () => {
    // create ref to keep track of the div for rendering without triggering re-rendering
    // this canvasRef is a div that will contain the canvas element within it
    const canvasRef = useRef<HTMLDivElement>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    
    // Using a ref instead of a regular variable so it persists between re-renders
    // If we didn't use a ref, we ensure that the animation frame is the latest value 
    //   because it wont be reset due to changes in state/props
    const animationFrameIdRef = useRef<number | null>(null); 
    
    const fractalPerlinNoise = (
        noise:NoiseFunction3D, 
        x:number, 
        y:number, 
        z:number,
        octaves:number, // Number of noise layers
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

        canvasRef.current.appendChild(renderer.domElement);


        // Create orbit controls for the camera
        const orbit:OrbitControls = new OrbitControls(camera, renderer.domElement);
        camera.position.set(0, 15, 30); // set x, y, z of camera
        camera.rotation.y = 0;
        camera.position.set(-camera.position.x, camera.position.y, -camera.position.z); // set x, y, z of camera

        orbit.update() // update orbit of camera


        /*
             ____                           _              
            / ___| ___  ___  _ __ ___   ___| |_ _ __ _   _ 
           | |  _ / _ \/ _ \| '_ ` _ \ / _ \ __| '__| | | |
           | |_| |  __/ (_) | | | | | |  __/ |_| |  | |_| |
            \____|\___|\___/|_| |_| |_|\___|\__|_|   \__, |
                                                    |___/ 
        */
        const width:number = 200;
        const height:number = 200;
        const segments:number = 150; // number of segments across the sketch

        const geometry:THREE.BufferGeometry = new THREE.BufferGeometry();

        // Create vertex array
        const vertices: number[] = [];

        // const noise = new ImprovedNoise(); // initialize noise with seed
        const noise3d:NoiseFunction3D = createNoise3D();
        const scale:number = 0.03; // How much space between each sample
        const amplitude:number = 20; // Amplify perlin noise


        // Create vertex by perlin noise
        // Loop over x for each row y
        for( let i = 0; i <= segments; i++ ){ // Row
            for( let j = 0; j <= segments; j++){ // Column
                const x:number = ((i / segments) * width) - (width / 2); // Scale the x and y for each segment to the width / height then subtract height / width to center aroung 0, 0, 0
                const y:number = ((j / segments) * height) - (height / 2);
                // const z:number = noise3d(x * scale, y * scale, 0) * amplitude; // Sample perlin noise and amplify it
                const z:number = fractalPerlinNoise(noise3d, x, y, 0, 4, 0.5, 2, scale) * amplitude;
                // console.log(fractalPerlinNoise(noise3d, x, y, 4, 0.5, 0, 20));
                vertices.push(x, y, z);
            }
        }
        
        // Set vertex positions in the geometry, specify each vertex has 3 components
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

        // Create indecies from vertices
        // This runs one less than the vertices loop because for each segment there are segment+1 vertices
        // A quad is 4 vertices and corresponds to the segments
        const indices:number[] = [];
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
            color: 0x2E88F0, 
            wireframe: true, 
            // shininess: 200, 
            roughness: 0.1,
            side: THREE.DoubleSide 
        });
        const terrainMesh:THREE.Mesh = new THREE.Mesh(terrainGeometry, terrainMaterial);
        terrainMesh.castShadow = true;
        terrainMesh.receiveShadow = true;
        terrainMesh.rotation.x = -0.5 * Math.PI; // Rotate terrain flat
        scene.add(terrainMesh);

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
            const positions:THREE.TypedArray = terrainMesh.geometry.attributes.position.array;
            for( let i = 0; i <= segments; i++ ){ // columns
                for( let j = 0; j <= segments; j++){ // rows
                    const index:number = (i * (segments + 1) + j) * 3; // Get correct index calculations
                    const x:number = (i / segments) * width - width / 2;
                    const y:number = (j / segments) * height - height / 2;
                    // positions[index + 2] = noise3d(x * scale, y * scale + flying, 0) * amplitude; // Update z value
                    positions[index + 2] = fractalPerlinNoise(noise3d, x, y + flying, flying, 8, 0.6, 1.8, 0.020) * (amplitude + 1);

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
        zIndex: 0           // Ensure it stays behind other content

    }}/>;
}   


export default ThreeTerrain;


/* CREDIT: 
* https://medium.com/@claudeando/integrating-three-js-with-next-js-and-typescript-81f47730103e
* https://www.youtube.com/watch?v=xJAfLdUgdc4&list=PLjcjAqAnHd1EIxV4FSZIiJZvsdrBc1Xho
* https://thebookofshaders.com/13/
* 
* */