"use client";

import React, { useRef, useEffect, useState } from "react";
import p5 from "p5";


// defines the type of props the component can accept
// expects a single prop of sketch which is a function that takes p5 object as an arg
interface P5WrapperProps {
    sketch: (p: p5) => void;
}

// defining functional component P5Wrapper which takes in the prop function sketch
// equivalent in js to `const P5Wrapper = ({ sketch }) => {`
// React.FC<P5WrapperProps> ensures component is treated as a functional component with porps of type P5WrapperProps
const P5Wrapper: React.FC<P5WrapperProps> = ({ sketch }) => {

    const [p5Instance, setP5Instance] = useState<p5 | null>(null);

    // create ref to keep track of the div for p5 rendering without triggering re-rendering
    const canvasRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (p5Instance) {
            p5Instance.remove();
            setP5Instance(null);
        }

        // Only load p5.js in the browser (client-side, meaning window is available)
        if (typeof window !== "undefined") {
            import("p5").then((p5Module) => { // dynamically import p5 which uses a promise
                const p5 = p5Module.default; // assign default export to p5


                if (canvasRef.current) { // check if canvasRef is created
                    // create a new instance of p5 with sketch attached to div referenced by canvasRef
                    // p5 library automatically creates a p5 object and passes it as an argument to the sketch function 

                    const instance = new p5(sketch, canvasRef.current); 
                    setP5Instance(instance); // store the current p5 instance
                }
            });
        }

        // return clean up function to run on unmount
        // cleans up canvas on unmount if there is a p5Instance currently
        return () => {
            if (canvasRef.current) {
                const existingCanvas = canvasRef.current.querySelector("canvas");
                if (existingCanvas) {
                    existingCanvas.remove();
                }
            }
        };
    }, [sketch]); // runs on sketch prop change

    // return div where p5 canvas will be attached
    return <div ref={canvasRef} style={{position: "fixed", zIndex: -1, top: 0, left: 0, width: "100vw", height: "100vh",}} />;
}

export default P5Wrapper;
