// import { useState } from 'react'
import ThreeTerrain from './sketches/ThreeTerrain'
import ThreeRapierScene from './sketches/ThreeRapierScene'
import './App.css'
import ThreeEnvironmentScene from './sketches/ThreeEnvironmentScene'

function App() {

  return (
    <>
      {/* Three.js canvas */}
      <ThreeTerrain />
      {/* <ThreeRapierScene/> */}
      {/* <ThreeEnvironmentScene/> */}

      {/* Centered text */}
      {/*
      * relative --- position the element relative to its normal position
      * top-1/2 and left-1/2 --- position the element at 50% of the height and width of the parent (this centers the top-left corner of the element)
      * transform -translate-x-1/2 -translate-y-1/2 --- moves the text back by 50% of its own height and width (to adjust for the fact mentioned above)
      * z-10 --- sets the z-index to 10, making it appear above the ThreeTerrain canvas (which has a z-index of 0)
      */}
      <div className="relative top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
        {/* <p className="text-primary text-3xl">Stephen Spencer-Wong</p> */}
      </div>
    </>
  )
}

export default App
