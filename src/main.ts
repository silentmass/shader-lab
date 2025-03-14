import WebGL from "three/addons/capabilities/WebGL.js";
import { ShaderLab } from "./ShaderLab";

if (WebGL.isWebGL2Available()) {
  const canvas = document.getElementById("canvas");

  if (canvas instanceof HTMLCanvasElement) {
    const shaderLab = new ShaderLab(canvas);
  }
} else {
  const warning = WebGL.getWebGL2ErrorMessage();
  document.getElementById("container")?.appendChild(warning);
}
