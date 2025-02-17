"use client";

import * as THREE from 'three';
import { useEffect, useRef } from "react";
import { OrbitControls } from 'three/examples/jsm/Addons.js';
import { ImprovedNoise } from 'three/examples/jsm/math/ImprovedNoise.js';

// import dat from 'dat.gui';

const ThreeTerrain: React.FC = () => {
    // create ref to keep track of the div for rendering without triggering re-rendering
    const canvasRef = useRef<HTMLDivElement>(null);

    const createTerrain = () => {
        const width = 100;
        const height = 100;
        const segments = 50; // number of segments across the sketch

        const geometry = new THREE.BufferGeometry();

        // Create vertex array
        const vertecies = [];

        const noise = new ImprovedNoise(); // initialize noise with seed
        const scale = 20; // same this as multiplying by scl = 0.2 in my p5 sketch
        const amplitude = 20;


        // create create vertex by perlin noise
        for( let i = 0; i <= segments; i++ ){
            for( let j = 0; j <= segments; j++){
                const x = (i / segments) * width - width / 2; // Scale the x and y for each segment to the width / height then subtract height / width to center aroung 0, 0, 0
                const y = (j / segments) * height - height / 2;
                const z = noise.noise(x / scale, y / scale, 0) * amplitude; // Sample perlin noise and amplify it
                vertecies.push(x, y, z);
            }
        }
        
        // Set vertecies in the geometry
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertecies, 3));

        // Create indecies from vertecies
        const indices = [];
        for( let i = 0; i < segments; i++ ){
            for( let j = 0; j < segments; j++){ //                                  WHAT IS THIS DOING AAAAAAAAAA
                const a = i * (segments + 1) + j; // Top-left vertex of the quad
                const b = a + 1; // Top-right vertex of the quad
                const c = (i + 1) * (segments + 1) + j; // Bottom-left vertex of the quad
                const d = c + 1; // Bottom-right vertex of the quad


                // Create two triangles for each quad
                indices.push(a, b, c);
                indices.push(b, d, c);
            }
        }

        // Set indices in the geometry
        geometry.setIndex(indices);

        // Compute normals for lighting
        geometry.computeVertexNormals();            // WHAT IS THIS DOING AAAAAAAAAA

        return geometry;
    }

    

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
            camera.position.set(0, 2, 5) // set x, y, z of camera
            camera.up.set(0, -1, 0); // flip the camera because the terrain is upside down

            orbit.update() // update orbit of camera

            const terrainGeometry = createTerrain();
            const terrainMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00, wireframe: false, side: THREE.DoubleSide });
            const terrainMesh = new THREE.Mesh(terrainGeometry, terrainMaterial);
            scene.add(terrainMesh);
            terrainMesh.castShadow = true;
            terrainMesh.receiveShadow = true;
            terrainMesh.rotation.x = -0.5 * Math.PI; // Rotate terrain flat


            const ambientLight = new THREE.AmbientLight(0xFFFFFF, 2);
            scene.add(ambientLight);

            const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 1);
            scene.add(directionalLight);
            directionalLight.position.set(-30, -50, 0);
            directionalLight.castShadow = true;                                 // Allow directional light to cast shadow
            directionalLight.shadow.camera.right = 15;
            directionalLight.shadow.camera.top = 15;

            const dLightHelper = new THREE.DirectionalLightHelper(directionalLight, 5);
            scene.add(dLightHelper);


            // renderer.render(scene, camera);
            // Update scene and rotate cube
            const renderScene = () => {
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