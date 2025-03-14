import * as THREE from "three";

/**
 * Utility class for debugging GLSL shader issues
 */
export class ShaderDebugger {
  /**
   * Test if a shader compiles
   * @param renderer THREE.js renderer
   * @param vertexShader Vertex shader code
   * @param fragmentShader Fragment shader code
   * @param uniforms Uniforms object
   * @returns True if compiled successfully, false otherwise
   */
  public static testCompilation(
    renderer: THREE.WebGLRenderer,
    vertexShader: string,
    fragmentShader: string,
    uniforms: any = {}
  ): boolean {
    try {
      // Create a simple test material with the shaders
      const material = new THREE.RawShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms,
      });

      // Create a test mesh
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);

      // Set up a simple scene
      const scene = new THREE.Scene();
      scene.add(mesh);

      const camera = new THREE.PerspectiveCamera();
      camera.position.z = 5;

      // Compile the material - this will trigger shader compilation
      renderer.compile(scene, camera);

      console.log("Shader compiled successfully");
      return true;
    } catch (error) {
      console.error("Shader compilation failed:", error);
      return false;
    }
  }

  /**
   * Analyze and print shader dependencies
   * @param shaderCode The shader code to analyze
   */
  public static analyzeIncludes(shaderCode: string): void {
    console.log("Analyzing shader includes:");

    // Extract all #include statements
    const includeRegex = /#include\s+<([^>]+)>/g;
    let match;
    const includes = [];

    while ((match = includeRegex.exec(shaderCode)) !== null) {
      includes.push(match[1]);
    }

    if (includes.length === 0) {
      console.log("No #include statements found");
    } else {
      console.log("Found includes:", includes);

      // Check if includes exist in THREE.ShaderChunk
      includes.forEach((include) => {
        const exists = (THREE.ShaderChunk as any)[include] !== undefined;
        console.log(`- ${include}: ${exists ? "Available" : "MISSING"}`);
      });
    }
  }

  /**
   * Try to fix common shader issues
   * @param fragmentShader The fragment shader code
   * @returns Potentially fixed fragment shader
   */
  public static fixCommonIssues(fragmentShader: string): string {
    let fixed = fragmentShader;

    // Check for missing precision declaration
    if (!fixed.includes("precision ")) {
      fixed = "precision highp float;\n" + fixed;
      console.log("Added missing precision declaration");
    }

    // Check for missing main function
    if (!fixed.includes("void main(")) {
      console.warn("No main function found in shader!");
    }

    // Check for missing gl_FragColor assignment
    if (!fixed.includes("gl_FragColor")) {
      console.warn("No gl_FragColor assignment found in shader!");
    }

    return fixed;
  }

  /**
   * Generate a minimal working fragment shader
   * @returns A simple working fragment shader
   */
  public static generateSimpleFragmentShader(): string {
    return `
precision highp float;

varying vec2 vUv;

void main() {
  gl_FragColor = vec4(vUv.x, vUv.y, 0.5, 1.0);
}
    `;
  }

  /**
   * Generate a minimal working vertex shader
   * @returns A simple working vertex shader
   */
  public static generateSimpleVertexShader(): string {
    return `
precision highp float;

attribute vec3 position;
attribute vec2 uv;

varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
    `;
  }
}
