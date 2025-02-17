"use client";

import * as THREE from 'three';
import { useEffect, useRef } from "react";
import { OrbitControls } from 'three/examples/jsm/Addons.js';
import { createNoise3D, NoiseFunction3D } from 'simplex-noise';

// import dat from 'dat.gui';

const ThreeTerrain: React.FC = () => {
    // create ref to keep track of the div for rendering without triggering re-rendering
    const canvasRef = useRef<HTMLDivElement>(null);    

    useEffect(() => {
        if(typeof window !== 'undefined'){
            const scene = new THREE.Scene();
            const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
            
            // Create renderer
            const renderer = new THREE.WebGLRenderer();
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.shadowMap.enabled =true;                       // Enable shadows
            canvasRef.current?.appendChild(renderer.domElement);

            // Create orbit controls for the camera
            const orbit = new OrbitControls(camera, renderer.domElement)
            camera.position.set(0, 15, 30) // set x, y, z of camera

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
            const segments:number = 100; // number of segments across the sketch
    
            const geometry:THREE.BufferGeometry<THREE.NormalBufferAttributes> = new THREE.BufferGeometry();
    
            // Create vertex array
            const vertices = [];
    
            // const noise = new ImprovedNoise(); // initialize noise with seed
            const noise3d:NoiseFunction3D = createNoise3D();
            const scale:number = 0.03; // How much space between each sample
            const amplitude:number = 20; // Amplify perlin noise
    
    
            // Create vertex by perlin noise
            // Loop over x for each row y
            for( let i = 0; i <= segments; i++ ){ // Row
                for( let j = 0; j <= segments; j++){ // Column
                    const x = ((i / segments) * width) - (width / 2); // Scale the x and y for each segment to the width / height then subtract height / width to center aroung 0, 0, 0
                    const y = ((j / segments) * height) - (height / 2);
                    const z = noise3d(x * scale, y * scale, 0) * amplitude; // Sample perlin noise and amplify it
                    vertices.push(x, y, z);
                }
            }
            
            // Set vertex positions in the geometry, specify each vertex has 3 components
            geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    
            // Create indecies from vertices
            // This runs one less than the vertices loop because for each segment there are segment+1 vertices
            // A quad is 4 vertices and corresponds to the segments
            const indices = [];
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
                    const a = y * (segments + 1) + x; // Top-left vertex of the quad
                    const b = a + 1; // Top-right vertex of the quad
                    const c = (y + 1) * (segments + 1) + x; // Bottom-left vertex of the quad
                    const d = c + 1; // Bottom-right vertex of the quad
    
    
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

            const terrainGeometry = geometry;
            const terrainMaterial = new THREE.MeshStandardMaterial({ color: 0x046A38, wireframe: true, side: THREE.DoubleSide });
            const terrainMesh = new THREE.Mesh(terrainGeometry, terrainMaterial);
            scene.add(terrainMesh);

            terrainMesh.castShadow = true;
            terrainMesh.receiveShadow = true;
            terrainMesh.rotation.x = -0.5 * Math.PI; // Rotate terrain flat


            /**
             _     _       _     _   _             
            | |   (_) __ _| |__ | |_(_)_ __   __ _ 
            | |   | |/ _` | '_ \| __| | '_ \ / _` |
            | |___| | (_| | | | | |_| | | | | (_| |
            |_____|_|\__, |_| |_|\__|_|_| |_|\__, |
                    |___/                   |___/ 
             */
            const ambientLight = new THREE.AmbientLight(0xFFFFFF, 2);
            scene.add(ambientLight);

            const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 1);
            scene.add(directionalLight);
            directionalLight.position.set(-30, 50, 0);
            directionalLight.castShadow = true;                                 // Allow directional light to cast shadow
            directionalLight.shadow.camera.right = 15;
            directionalLight.shadow.camera.top = 15;

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

            let flying = 0;
            // Update scene and rotate cube
            const renderScene = () => {

                flying -= 0.01;
                const positions = terrainMesh.geometry.attributes.position.array;
                for( let i = 0; i <= segments; i++ ){ // columns
                    for( let j = 0; j <= segments; j++){ // rows
                        const index = (i * (segments + 1) + j) * 3; // Get correct index calculations
                        const x = (i / segments) * width - width / 2;
                        const y = (j / segments) * height - height / 2;
                        positions[index + 2] = noise3d(x * scale, y * scale + flying, 0) * amplitude; // Update z value
                    }
                }

                // Mark the buffer as needing an update
                terrainMesh.geometry.attributes.position.needsUpdate = true;
                // Recompute normals
                terrainMesh.geometry.computeVertexNormals();

                renderer.render(scene,camera);

                requestAnimationFrame(renderScene);
            }

            renderScene();

            // Cleanup function removes gui and canvas dom element
            return () => {
                // gui.destroy(); // Remove GUI on unmount
                canvasRef.current?.removeChild(renderer.domElement);
                renderer.dispose();
            };
        }
    }, [])
    
    return <div ref={canvasRef} />;
}   


export default ThreeTerrain;


/* CREDIT: 
* https://medium.com/@claudeando/integrating-three-js-with-next-js-and-typescript-81f47730103e
* https://www.youtube.com/watch?v=xJAfLdUgdc4&list=PLjcjAqAnHd1EIxV4FSZIiJZvsdrBc1Xho
*
* 
* */