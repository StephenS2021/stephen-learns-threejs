// import { useState } from 'react'
import ThreeTerrain from './sketches/ThreeTerrain'
import ThreeRapierScene from './sketches/ThreeRapierScene'
import './App.css'
import stripTerrainSketch from './sketches/stripTerrainSketch'
import P5Wrapper from './components/P5Wrapper'
import BezierSketch from './sketches/BezierSketch'

function App() {

  return (
    <>
      {/* Three.js canvas */}
      {/* <P5Wrapper sketch={stripTerrainSketch}/> */}

      <ThreeTerrain />

      {/* Centered text */}
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 mt-8 z-10 text-left">
        <p className="text-primary text-3xl font-bold">Hi.</p>
        <p className="text-3xl">My name is Stephen Spencer-Wong</p>
        <p className="text-primary text-2xl mt-4">I graduated from NYU in 2025 with a degree in Computer Science.<br/></p>
      </div>
    </>
  )
}

export default App
