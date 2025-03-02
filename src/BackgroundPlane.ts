import * as THREE from "three";

export class BackgroundPlane extends THREE.Mesh {
  public isBackgroundPlaneBlack: boolean = false;

  constructor() {
    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.MeshBasicMaterial({ color: "white" });
    super(geometry, material);

    this.position.set(0, 0, -0.1);
  }

  setBlack() {
    this.isBackgroundPlaneBlack = true;
    (this.material as THREE.MeshBasicMaterial).color.set("black");
  }

  setWhite() {
    this.isBackgroundPlaneBlack = false;
    (this.material as THREE.MeshBasicMaterial).color.set("white");
  }
}
