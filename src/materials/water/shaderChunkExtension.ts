// shaderChunkExtension.ts - Helper to properly extend THREE.ShaderChunk in TypeScript

import * as THREE from "three";
import utils from "../../glsl/water/utils.glsl";

// First, we need to extend the THREE.ShaderChunk type to include our custom shader
declare module "three" {
  namespace THREE.ShaderChunk {
    const utils: string;
  }
}

// Initialize function that adds custom shader chunks to THREE.ShaderChunk
export function initializeCustomShaders() {
  // WebGL2 always has derivatives support
  let hasDerivatives = true;

  try {
    // Verify WebGL2 is being used
    const tempCanvas = document.createElement("canvas");
    const gl = tempCanvas.getContext("webgl2");

    if (gl) {
      console.log(
        "ShaderChunkExtension: WebGL2 detected - derivatives are natively supported"
      );
    } else {
      console.warn(
        "ShaderChunkExtension: WebGL2 not available - THREE.js r163+ requires WebGL2"
      );
      hasDerivatives = false;
    }
  } catch (e) {
    console.warn("ShaderChunkExtension: Error checking WebGL context", e);
  }

  // Add utils shader chunk - use indexing notation to avoid TypeScript error
  (THREE.ShaderChunk as any)["utils"] = utils;

  // Log successful initialization
  console.log(
    "Custom shader chunks initialized, derivatives support:",
    hasDerivatives
  );

  // Return true to indicate success
  return true;
}
