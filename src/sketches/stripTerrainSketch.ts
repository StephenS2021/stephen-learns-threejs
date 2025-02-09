"use client";
// import { Size } from "aws-cdk-lib/core";
import * as p5 from "p5";

// import { off } from "process";


// let cam: p5.MediaElement;

/* 
 function that takes a p5 object with which it draws on the canvas
    this function is not ever explicitly called in the code
    it runs from P5Wrapper.tsx when we create a new p5 instance
    `const instance = new p5(sketch, canvasRef.current);`
    the library automatically injects the `sketch` function with the p5 object required
*/
const stripTerrainSketch = (p: p5) => {
    // const [width, height] = [1500, 900]
    let cols:number; let rows:number;
    const scl:number = 20; // controls how many vertices fit within the triangle strip by defining spacing between grid points
    let xCamOffset: number;
    let yCamOffset: number;
    const terrain: number[][] = [];

    let xOff:number = 0;
    let yOff:number = 0;
    let flying:number = 0;

    const perlinScale:number = 0.12; // how far apart the noise samples are (basically zooming out or in)
    const mapScale:number = 130; // the max which the perlin noise can be scaled to by the map function

    let graphics: p5.Graphics;



    p.setup = () => {
        p.createCanvas(p.windowWidth, p.windowHeight, p.WEBGL);
        // cols = width / scl;
        // rows = height / scl;
        cols = Math.floor(p.windowWidth / scl);
        rows = Math.floor(p.windowHeight / scl);
        const gridWidth = cols * scl;
        const gridHeight = rows * scl;
        xCamOffset = -(gridWidth / 2); // TODO FIGURE OUT WHAT THSI IS DOING
        yCamOffset = -(gridHeight / 2);

        graphics = p.createGraphics(cols * scl, rows * scl, p.WEBGL); // create a graphics buffer


        for (let y = 0; y < rows; y++) {
            terrain[y] = [];
            for (let x = 0; x < cols; x++) {
                terrain[y][x] = 0; // Initialize with zero
            }
        }
    
    };

    const updateTerrain = () => {
        flying -= 0.02;
        yOff = flying
        for( let y = 0; y < rows; y++ ){
            xOff = 0;
            for( let x = 0; x < cols; x++){
                terrain[y][x] = p.map(p.noise(xOff, yOff), 0, 1, -mapScale, mapScale);
                xOff += perlinScale;
            }
            yOff += perlinScale;
        }
    }

    const drawGraphicsBuffer = () => {
        graphics.push();
        graphics.clear()
        graphics.rotateX(p.PI/3 + 0.15)
        
        graphics.translate(xCamOffset, yCamOffset+150);

        graphics.normalMaterial()
        graphics.stroke(255);
        graphics.fill(0)
        
        for( let y = 0; y < rows-1; y++ ){
            graphics.beginShape(p.TRIANGLE_STRIP);
            for( let x = 0; x < cols; x++){
                // p.rect(i*scl, j*scl, scl, scl);
                graphics.vertex(x*scl, y*scl, terrain[y][x]);
                graphics.vertex(x*scl, (y+1)*scl, terrain[y+1][x]);

            }
            graphics.endShape();
        }
        graphics.pop();
    }

    p.draw = () => {
        p.background(0);
        console.log(p.frameRate())
        updateTerrain();
        drawGraphicsBuffer();
        
        
        p.image(graphics, -p.width / 2, -p.height / 2);
    };

    p.windowResized = () => {
        p.resizeCanvas(p.windowWidth, p.windowHeight);

        // Recalculate cols and rows for the new window size
        cols = Math.floor(p.windowWidth / scl);
        rows = Math.floor(p.windowHeight / scl);

        const gridWidth = cols * scl;
        const gridHeight = rows * scl;

        // Recenter the camera based on new window size
        xCamOffset = -(gridWidth / 2);
        yCamOffset = -(gridHeight / 2);
        graphics = p.createGraphics(cols * scl, rows * scl, p.WEBGL);
        updateTerrain();
        drawGraphicsBuffer();
    };

};

export default stripTerrainSketch;
