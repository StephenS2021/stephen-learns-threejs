import * as THREE from 'three'
import { useEffect, useRef } from 'react'
import * as RAPIER from '@dimforge/rapier3d-compat'
import { OrbitControls } from 'three/examples/jsm/Addons.js'

const ThreeRapierScene: React.FC = () => {
    const canvasRef = useRef<HTMLDivElement>(null)
    useEffect(() => {
        if (!canvasRef.current) return

        let animationId: number // Animation ID used in requestAnimationFrame and we cancel it on unmount

        // Declare Rapier and Three.js objects at the top scope
        let world: RAPIER.World
        let cubeBody: RAPIER.RigidBody
        let scene: THREE.Scene
        let camera: THREE.PerspectiveCamera
        let renderer: THREE.WebGLRenderer
        let cubeMesh: THREE.Mesh
        let surfaceMesh: THREE.Mesh
        let debugRenderPipeline: RAPIER.DebugRenderPipeline
        let debugRenderBuffers: RAPIER.DebugRenderBuffers
        let debugMesh: THREE.LineSegments
        let orbit:OrbitControls


        const setup = async () => {
            // 1️⃣ Initialize Rapier WASM & build physics world with gravity pointing down -9.81 m/s² on Y
            await RAPIER.init()
            world = new RAPIER.World({ x: 0, y: -9.81, z: 0 })

            // Creating the THREE.js scene and camera
            scene = new THREE.Scene()
            camera = new THREE.PerspectiveCamera(
                75,
                window.innerWidth / window.innerHeight,
                0.1,
                1000
            )
            camera.position.set(0, 5, 10)
            camera.lookAt(0, 0, 0) // Look at the scene origin
            
            // Creating the WebGL renderer
            renderer = new THREE.WebGLRenderer({ antialias: true }) 
            renderer.setSize(window.innerWidth, window.innerHeight) // Set the size of the renderer to the window size
            canvasRef.current!.appendChild(renderer.domElement) // Add the renderer to the CanvasRef in the DOM

            orbit = new OrbitControls(camera, renderer.domElement);
            orbit.update()

            
            // Create a cube mesh in THREE.js (this is the visual representation, not the physics body)
            const cubeGeometry: THREE.BoxGeometry = new THREE.BoxGeometry(1, 1, 1) // Create a box geometry with dimensions 1 x 1 x 1
            const cubeMaterial: THREE.MeshNormalMaterial = new THREE.MeshNormalMaterial() // Use a normal material for the cube
            cubeMesh = new THREE.Mesh(cubeGeometry, cubeMaterial)
            scene.add(cubeMesh) // Add the cube mesh to the scene

            // Create the surface mesh (again this is the visual representation within THREE.js, not in the pyhsics world)
            const surfaceGeometry: THREE.BoxGeometry = new THREE.BoxGeometry(10, 0.5, 10)
            const surfaceMaterial: THREE.MeshNormalMaterial = new THREE.MeshNormalMaterial({ wireframe: true })
            surfaceMesh = new THREE.Mesh(surfaceGeometry, surfaceMaterial)

            /*
                 ____             _             ____            _        __  
                |  _ \ __ _ _ __ (_) ___ _ __  |  _ \ __ _ _ __| |_   _  \ \ 
                | |_) / _` | '_ \| |/ _ \ '__| | |_) / _` | '__| __| (_)  | |
                |  _ < (_| | |_) | |  __/ |    |  __/ (_| | |  | |_   _   | |
                |_| \_\__,_| .__/|_|\___|_|    |_|   \__,_|_|   \__| (_)  | |
                         |_|                                             /_/ 
            */

            /* 
                Create the dynamic cube physics body (this is the object in Rapier that is affected by the physics sim)
                - Dynamic body means it is affected by forces and gravity
                - Initially playced at y=5 so it will fall down
                A rigid-body is created by a World.createRigidBody method. The initial state of the rigid-body to create is described by an instance of the RigidBodyDesc class. (From Rapier docs)
            */
            const cubeBodyDesc: RAPIER.RigidBodyDesc = RAPIER.RigidBodyDesc.dynamic().setTranslation(0, 5, 0) // You configure the body descriptor before actually creating it in the world
            cubeBody = world.createRigidBody(cubeBodyDesc) // Create the physics body inside the Rapier world using the descriptor provided
            
            // Attach a collider to the cube (box shape values are half the dimensions of the cube. This is called half extents and I don't know why it's used)
            //    - Colliders represent the geometric shapes that generate contacts and collision events when they touch
            //    - Friction controls sliding resistance (can be between 0 and 1)
            const cubeColliderDesc: RAPIER.ColliderDesc = RAPIER.ColliderDesc.cuboid(0.5, 0.5, 0.5).setFriction(0.5) // Create a descriptor for the collider with the dimensions of the cube
            world.createCollider(cubeColliderDesc, cubeBody) // Create the collider using the descriptor and attach it to the cube physics body




            // CREATING THE SURFACE
            const inclineAngle = 0.52 // Angle of the incline in rad
            const surfaceBodyDesc: RAPIER.RigidBodyDesc = RAPIER.RigidBodyDesc.fixed()
                .setTranslation(0, 0, 0) // Set the position of the surface to be at the world origin in space (of the physics world)
                .setRotation({ // Set the rotation of the surface object using a quaternion (I do not yet know how a quaternion works)
                    x: Math.sin(inclineAngle / 2), // Rotate around the X axis
                    y: 0,
                    z: 0,
                    w: Math.cos(inclineAngle / 2), // This apparently normalizes the quaternion or scales it? I don't know it's magic powers
            })
            const surfaceBody: RAPIER.RigidBody = world.createRigidBody(surfaceBodyDesc) // Create the surface body in the physics world using the descriptor
            const surfaceColliderDesc = RAPIER.ColliderDesc.cuboid(5, 0.25, 5).setFriction(0.5) // Create the collider descriptor for the surface (again, the dimensions are in half extents)
            world.createCollider(surfaceColliderDesc, surfaceBody) // Create the collider using the descriptor and attach it to the physics body of the surface

            // [THIS PART IS IN THREE.JS]
            // Finishing the THREE.js surface mesh using the quaternion used in the physics body
            // Rotate the mesh visually the same as the physics body
            //  - Still don't know how a quaternion works
            surfaceMesh.setRotationFromQuaternion(new THREE.Quaternion(
                Math.sin(inclineAngle / 2),
                0,
                0,
                Math.cos(inclineAngle / 2)
            ))
            scene.add(surfaceMesh) // Add the surface mesh (visual) to the scene 

            // Call to start animation loop
            animate()
        }

        const animate = () => {
            animationId = requestAnimationFrame(animate)

            // Advance the physics simulation by one step or frame or something
            world.step()
            
            const cubePos = cubeBody.translation()
            const cubeRot = cubeBody.rotation()
            cubeMesh.position.set(cubePos.x, cubePos.y, cubePos.z)
            cubeMesh.setRotationFromQuaternion(
                new THREE.Quaternion(cubeRot.x, cubeRot.y, cubeRot.z, cubeRot.w)
            )


            // Render Three.js scene
            renderer.render(scene, camera)
        }

        setup()

        // Clean up on unmount
        return () => {
            cancelAnimationFrame(animationId)
            if (canvasRef.current?.firstChild) {
                canvasRef.current.removeChild(canvasRef.current.firstChild);
            }
        }
    }, [])

    return (
        <div
        ref={canvasRef}
        style={{
            width: '100vw',
            height: '100vh',
            margin: 0,
            padding: 0,
            overflow: 'hidden',
        }}
        />
    );
};

export default ThreeRapierScene;









// import * as THREE from 'three';
// import { useEffect, useRef } from "react";
// import { OrbitControls } from 'three/examples/jsm/Addons.js';
// import * as RAPIER from '@dimforge/rapier3d-compat';
// // import dat from 'dat.gui';

// const ThreeRapierScene: React.FC = () => {
//     const canvasRef = useRef<HTMLDivElement>(null);
    
//     useEffect(() => {
//         if (!canvasRef.current) return;
//         let animationId: number
//         let world: RAPIER.World
//         let scene: THREE.Scene, camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer
//         let cubeMesh: THREE.Mesh, cubeBody: RAPIER.RigidBody



//         const setup = async () => {
//             await RAPIER.init()
//             world = new RAPIER.World({ x: 0, y: -9.81, z: 0 }) // Inititalize the physics world with gravity

//             // Three.js setup
//             scene = new THREE.Scene()
//             camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
//             camera.position.z = -5
//             camera.position.x = -5

//             // Set up renderer
//             renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
//             renderer.setSize(window.innerWidth, window.innerHeight)
//             canvasRef.current!.appendChild(renderer.domElement)

//             // Set up camera controls
//             const orbit:OrbitControls = new OrbitControls(camera, renderer.domElement);
//             orbit.update() // update orbit of camera

//             // Create and add a box
//             const geometry:THREE.BoxGeometry = new THREE.BoxGeometry(1, 1, 1)
//             const material:THREE.MeshBasicMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 })
//             cubeMesh = new THREE.Mesh(geometry, material)
//             scene.add(cubeMesh)

//             const surfaceGeometry:THREE.PlaneGeometry = new THREE.BoxGeometry(10, 0.2, 10); // Create a plane geometry in three
//             const surfaceMaterial:THREE.MeshBasicMaterial = new THREE.MeshBasicMaterial({ color: 0x808080, side: THREE.DoubleSide })
//             const surfaceMesh:THREE.Mesh = new THREE.Mesh(surfaceGeometry, surfaceMaterial)

//             scene.add(surfaceMesh)

//             // Lighting
//             const light:THREE.DirectionalLight = new THREE.DirectionalLight(0xffffff, 1)
//             light.position.set(5, 5, 5)
//             scene.add(light)

            
//             // Creating the physics body for the cube
//             const rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic().setTranslation(0, 5, 0) // Set initial position of 
//             cubeBody = world.createRigidBody(rigidBodyDesc) // Create a dynamic rigid body from the descriptor
//             const colliderDesc = RAPIER.ColliderDesc.cuboid(0.5, 0.5, 0.5).setFriction(0.1) // Create a colider descriptor the sizes are half the dimensions of the cube
//             world.createCollider(colliderDesc, cubeBody) // Attach the collider to the cube body


//             const inclineAngle = (Math.PI / 2) + 0.75;

//             // Use THREE.Quaternion to get the correct rotation
//             const threeQuat = new THREE.Quaternion();
//             threeQuat.setFromEuler(new THREE.Euler(inclineAngle, 0, 0));
//             surfaceMesh.setRotationFromEuler(new THREE.Euler(inclineAngle, 0, 0));


//             const surfaceBodyDesc = RAPIER.RigidBodyDesc.fixed()
//                 .setTranslation(0, 0, 0)
//                 .setRotation({x: threeQuat.x,
//                     y: threeQuat.y,
//                     z: threeQuat.z,
//                     w: threeQuat.w
//                 }); // Create a fixed body for the surface in the physics world
                
//             const surfaceBody = world.createRigidBody(surfaceBodyDesc) // Create a fixed rigid body
//             const surfaceColliderDesc = RAPIER.ColliderDesc.cuboid(5, 0.1, 5).setFriction(0.1) // Create a collider for the surface
//             world.createCollider(surfaceColliderDesc, surfaceBody) // Attach the collider to the surface body

            
//             animate()
//         }

//         const animate = () => {
//             animationId = requestAnimationFrame(animate)

//             world.step() // Advance the physics simulation
//             const pos = cubeBody.translation() // Get the position of the physics body from Rapier
//             cubeMesh.position.set(pos.x, pos.y, pos.z) // Update the mesh position to match the physics body

//             renderer.render(scene, camera)
//         }

//         setup()

//         return () => {
//             cancelAnimationFrame(animationId)
//             if (canvasRef.current?.firstChild) {
//               canvasRef.current.removeChild(canvasRef.current.firstChild)
//             }
//         }

//     }, [])

//     return <div ref={canvasRef} style={{
//         width: '100vw', 
//         height: '100vh',
//         margin: 0,
//         padding: 0,
//         overflow: 'hidden',
//         zIndex: 1,           // Ensure it stays behind other content
//         position: 'absolute', // Position absolute to fill the screen
//         top: 0,
//         left: 0,
//     }}/>;
// } 


// export default ThreeRapierScene;
