"use client";

import * as THREE from 'three';
import { useEffect, useRef } from "react";
import { OrbitControls } from 'three/examples/jsm/Addons.js';
import dat from 'dat.gui';

const ThreeScene: React.FC = () => {
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
            camera.position.set(0, 2, 5) // set x, y, z of camera
            orbit.update() // update orbit of camera

            /*
              ____                           _              
             / ___| ___  ___  _ __ ___   ___| |_ _ __ _   _ 
            | |  _ / _ \/ _ \| '_ ` _ \ / _ \ __| '__| | | |
            | |_| |  __/ (_) | | | | | |  __/ |_| |  | |_| |
             \____|\___|\___/|_| |_| |_|\___|\__|_|   \__, |
                                                      |___/ 
            */


            // Create axis helper
            const axesHelper = new THREE.AxesHelper(5);
            scene.add(axesHelper)

            // Create box at 0,0 
            const geometry = new THREE.BoxGeometry();
            const material = new THREE.MeshBasicMaterial({color:0x00ff00});
            const cube = new THREE.Mesh(geometry, material);
            scene.add(cube);

            // Create plane
            const planeGeo = new THREE.PlaneGeometry(30, 30);
            const planeMat = new THREE.MeshStandardMaterial({
                color : 0xFFFFFF,
                side: THREE.DoubleSide, // make plane double sided
                // wireframe: true
            });
            const plane  = new THREE.Mesh(planeGeo, planeMat); 
            scene.add(plane);
            plane.rotation.x = -0.5 * Math.PI; // Rotate plane flat
            plane.receiveShadow = true;                                          // Allow the plane to recieve shadows

            // Create grid across x and z
            const gridhelper  = new THREE.GridHelper(30);
            scene.add(gridhelper);

            const sphereGeometry = new THREE.SphereGeometry(4, 30, 30); // create sphere geometry and specify the segments horizontally and vertically
            const sphereMat = new THREE.MeshStandardMaterial({
                color : 0x0000FF,
                wireframe: false // Create wireframe material for sphere
            }); 
            const sphere = new THREE.Mesh(sphereGeometry, sphereMat);
            scene.add(sphere);
            sphere.position.set(0, 5, 6);
            sphere.castShadow = true;                                           // Allow the sphere to cast shadow on to plane



            /**
             _     _       _     _   _             
            | |   (_) __ _| |__ | |_(_)_ __   __ _ 
            | |   | |/ _` | '_ \| __| | '_ \ / _` |
            | |___| | (_| | | | | |_| | | | | (_| |
            |_____|_|\__, |_| |_|\__|_|_| |_|\__, |
                    |___/                   |___/ 
             */
            // Create a dim ambient light
            const ambientLight = new THREE.AmbientLight(0xFFFFFF, 1.5);
            scene.add(ambientLight);

            // add a bright direcitonal light
            const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.3);
            scene.add(directionalLight);
            directionalLight.position.set(-30, 50, 0);
            directionalLight.castShadow = true;                                 // Allow directional light to cast shadow
            directionalLight.shadow.camera.right = 15;
            directionalLight.shadow.camera.top = 15;

            // create directional light helper which indicates the direction of the light
            const dLightHelper = new THREE.DirectionalLightHelper(directionalLight, 5);
            scene.add(dLightHelper);

            const dLightShadowHelper  = new THREE.CameraHelper(directionalLight.shadow.camera);
            scene.add(dLightShadowHelper)

            const spotLight = new THREE.SpotLight(0xFFFFFF, 50);
            scene.add(spotLight);
            spotLight.position.set(50, -50, 0);
            spotLight.angle = 0.2;
            spotLight.distance = 110;
            spotLight.decay = 1;
            spotLight.castShadow = true;

            const sLightHelper = new THREE.SpotLightHelper(spotLight);
            scene.add(sLightHelper);


            /**
             ____    _  _____        ____ _   _ ___ 
            |  _ \  / \|_   _|      / ___| | | |_ _|
            | | | |/ _ \ | |       | |  _| | | || | 
            | |_| / ___ \| |    _  | |_| | |_| || | 
            |____/_/   \_\_|   (_)  \____|\___/|___|
             **/

            // const gui = new dat.GUI(); // Create new gui
            // const options = {
            //     sphereColor: "#ffea00", // add option sphere color, hex string formats automatically are interpreted as color
            //     wireframe: false,
            //     speed: 0.01,
            //     boxX: 0
            // }

            // // change sphere color property using gui panel
            // // addColor detects that sphereColor is a color value and generates the color picker UI
            // gui.addColor(options, 'sphereColor').onChange(function(e){ // Use callback function to real-time update the sphere color
            //     sphere.material.color.set(e);
            // });

            // gui.add(options, 'wireframe').onChange(function(e){
            //     sphere.material.wireframe = e;
            // });
            // // Add slider options for cube rotational speed and height
            // gui.add(options, 'speed', 0.01, 0.5); 
            // gui.add(options, 'boxX', -5, 5); 


            /**
             ____                _           _             
            |  _ \ ___ _ __   __| | ___ _ __(_)_ __   __ _ 
            | |_) / _ \ '_ \ / _` |/ _ \ '__| | '_ \ / _` |
            |  _ <  __/ | | | (_| |  __/ |  | | | | | (_| |
            |_| \_\___|_| |_|\__,_|\___|_|  |_|_| |_|\__, |
                                                     |___/ 
             */

            // renderer.render(scene, camera);
            // Update scene and rotate cube
            const renderScene = () => {
                // cube.rotation.x += options.speed ? options.speed : 0.01;
                // cube.rotation.y += options.speed ? options.speed : 0.01;
                // cube.position.y = options.boxX ? options.boxX : 0;
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


export default ThreeScene;


/* CREDIT: 
* https://medium.com/@claudeando/integrating-three-js-with-next-js-and-typescript-81f47730103e
* https://www.youtube.com/watch?v=xJAfLdUgdc4&list=PLjcjAqAnHd1EIxV4FSZIiJZvsdrBc1Xho
*
* 
* */