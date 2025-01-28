/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
import p5 from "p5";

declare global {
    const p5Instance: p5; // Explicit use of p5 type
    const p5: typeof import("p5");
  }