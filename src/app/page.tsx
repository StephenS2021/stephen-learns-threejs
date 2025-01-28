
import P5Wrapper from "@/components/P5Wrapper";
// import BezierSketch from "@/sketches/BezierSketch";
import stripTerrainSketch from "@/sketches/stripTerrainSketch";
export default function Home() {
  return (
    <div>
      <P5Wrapper sketch={stripTerrainSketch} />
      <p className="h-screen flex items-center justify-center text-[#4CBB17] text-[200px]">oenis</p>
    </div>
  );
}
