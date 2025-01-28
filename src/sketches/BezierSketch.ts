"use client";
import { Size } from "aws-cdk-lib/core";
import * as p5 from "p5";
import { off } from "process";


// let cam: p5.MediaElement;

/* 
 function that takes a p5 object with which it draws on the canvas
    this function is not ever explicitly called in the code
    it runs from P5Wrapper.tsx when we create a new p5 instance
    `const instance = new p5(sketch, canvasRef.current);`
    the library automatically injects the `sketch` function with the p5 object required
*/
const BezierSketch = (p: p5) => {
    let [width, height] = [400, 400]

    let offset:number = 0;
    let x1:number; let y1:number;
    let x2:number; let y2:number;
    let x3:number; let y3:number;
    let x4:number; let y4:number;
    
    
    p.setup = () => {
        p.createCanvas(width, height);
        // cam = p.createCapture(p.VIDEO);
        p.stroke(0, 18);
        p.noFill();
        
    };

    p.draw = () => {
        // p.background(200);
        x1 = width * p.noise(offset + 5);
        x2 = width * p.noise(offset + 10);
        x3 = width * p.noise(offset + 15);
        x4 = width * p.noise(offset + 20);
        y1 = height * p.noise(offset + 25);
        y2 = height * p.noise(offset + 30);
        y3 = height * p.noise(offset + 35);
        y4 = height * p.noise(offset + 40);
        offset += 0.001;
        p.bezier(x1, y1, x2, y2, x3, y3, x4, y4);

        // if (p.frameCount % 500 == 0) {
        //     p.background(255);
        // }

    };
};

export default BezierSketch;
