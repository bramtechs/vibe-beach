import * as THREE from "three";
import FirstPersonController from "./FirstPersonController";
import { createLights } from "./LightingSystem";
import { createSkybox } from "./Skybox";
import { SandTrailManager } from "./SandTrails";
import { Ocean } from "./Ocean";
import { Terrain } from "./Terrain";

class SceneManager {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controller: FirstPersonController;
  private clock: THREE.Clock;
  private animationFrameId: number | null = null;
  private sandTrailManager: SandTrailManager;
  private ocean: Ocean;
  private terrain!: Terrain;
  private directionalLight!: THREE.DirectionalLight;
  private ambientLight!: THREE.AmbientLight;
  private shadowLight!: THREE.DirectionalLight;
  private timeOfDay: number = 12; // Default to noon

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
    this.controller = new FirstPersonController(
      this.camera,
      this.scene,
      this.terrain
    );

    // Load saved position
    this.controller.loadPosition();

    // Initialize sand trail manager
    this.sandTrailManager = new SandTrailManager(this.scene);

    // Initialize ocean
    this.ocean = new Ocean();
    this.scene.add(this.ocean.getMesh());

    // Start animation loop
    this.animate();

    // Set up periodic position saving
    this.setupPositionSaving();
  }

  private initScene(): void {
    // Add terrain
    this.terrain = new Terrain();
    this.scene.add(this.terrain.getMesh());

    // Add lights
    const { ambientLight, directionalLight, shadowLight } = createLights(
      this.renderer
    );
    this.ambientLight = ambientLight;
    this.directionalLight = directionalLight;
    this.shadowLight = shadowLight;
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

  public setTimeOfDay(hour: number): void {
    this.timeOfDay = hour;
    this.updateLighting();
  }

  private updateLighting(): void {
    // Convert hour to angle (0-360 degrees)
    const angle = (this.timeOfDay / 24) * Math.PI * 2;

    // Calculate sun position
    const radius = 50;
    const sunX = Math.cos(angle) * radius;
    const sunY = Math.sin(angle) * radius;
    const sunZ = Math.sin(angle) * radius;

    // Update directional light position
    this.directionalLight.position.set(sunX, sunY, sunZ);

    // Update light intensity based on time of day
    const isDay = this.timeOfDay > 6 && this.timeOfDay < 18;
    const intensity = isDay ? 4.5 : 0.5;
    this.directionalLight.intensity = intensity;

    // Update ambient light color and intensity
    const ambientIntensity = isDay ? 0.8 : 0.2;
    const ambientColor = isDay ? 0x4040ff : 0x000033;
    this.ambientLight.intensity = ambientIntensity;
    this.ambientLight.color.setHex(ambientColor);

    // Update shadow light
    this.shadowLight.position.set(-sunX, -sunY, -sunZ);
    this.shadowLight.intensity = isDay ? 1.5 : 0.2;
  }

  private animate = (): void => {
    const delta = this.clock.getDelta();

    // Update controller
    this.controller.update(delta);

    // Update sand trails
    this.sandTrailManager.update(delta, this.camera.position);

    // Update ocean
    this.ocean.update(delta);

    // Update terrain
    this.terrain.update(delta);

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

  public resetCamera(): void {
    this.controller.resetPosition();
  }

  public dispose(): void {
    // Stop animation loop
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }

    // Dispose controller
    this.controller.dispose();

    // Dispose sand trail manager
    this.sandTrailManager.dispose();

    // Dispose ocean
    this.ocean.dispose();

    // Dispose terrain
    this.terrain.dispose();

    // Dispose renderer
    this.renderer.dispose();
  }

  private setupPositionSaving(): void {
    // Save position every 5 seconds
    setInterval(() => {
      this.controller.savePosition();
    }, 5000);

    // Also save position when the window is about to close
    window.addEventListener("beforeunload", () => {
      this.controller.savePosition();
    });
  }
}

export default SceneManager;
