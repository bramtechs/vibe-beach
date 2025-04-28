import * as THREE from "three";
import FirstPersonController from "./FirstPersonController";
import { createLights } from "./LightingSystem";
import { createFloor } from "./SceneObjects";
import { createSkybox } from "./Skybox";

class SceneManager {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controller: FirstPersonController;
  private clock: THREE.Clock;
  private animationFrameId: number | null = null;

  constructor() {
    // Initialize scene
    this.scene = new THREE.Scene();
    this.scene.background = createSkybox();
    this.scene.environment = this.scene.background; // Use skybox as environment map for reflections

    // Initialize camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 1.7, 0); // Set camera at human eye level

    // Initialize renderer
    const canvas = document.getElementById("scene-canvas") as HTMLCanvasElement;
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Enable shadows
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Initialize clock for frame-independent movement
    this.clock = new THREE.Clock();

    // Create scene elements
    this.initScene();

    // Initialize controller
    this.controller = new FirstPersonController(this.camera, this.scene);

    // Start animation loop
    this.animate();
  }

  private initScene(): void {
    // Add floor
    const floor = createFloor();
    this.scene.add(floor);

    // Add lights
    const { ambientLight, directionalLight, shadowLight } = createLights(
      this.renderer
    );
    this.scene.add(ambientLight, directionalLight, shadowLight);

    // Add a simple box as an obstacle
    const boxGeometry = new THREE.BoxGeometry(2, 2, 2);
    const boxMaterial = new THREE.MeshStandardMaterial({ color: 0x8844aa });
    const box = new THREE.Mesh(boxGeometry, boxMaterial);
    box.position.set(5, 1, -5);
    box.castShadow = true;
    box.receiveShadow = true;
    this.scene.add(box);

    // Add another box
    const box2 = new THREE.Mesh(
      new THREE.BoxGeometry(1, 3, 1),
      new THREE.MeshStandardMaterial({ color: 0x44aa88 })
    );
    box2.position.set(-4, 1.5, 3);
    box2.castShadow = true;
    box2.receiveShadow = true;
    this.scene.add(box2);
  }

  private animate = (): void => {
    const delta = this.clock.getDelta();

    // Update controller
    this.controller.update(delta);

    // Render scene
    this.renderer.render(this.scene, this.camera);

    // Continue animation loop
    this.animationFrameId = requestAnimationFrame(this.animate);
  };

  public onWindowResize(): void {
    // Update camera aspect ratio
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();

    // Update renderer size
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  public dispose(): void {
    // Stop animation loop
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }

    // Dispose controller
    this.controller.dispose();

    // Dispose renderer
    this.renderer.dispose();
  }
}

export default SceneManager;
