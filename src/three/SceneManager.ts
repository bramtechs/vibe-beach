import * as THREE from "three";
import FirstPersonController from "./FirstPersonController";
import { createLights } from "./LightingSystem";
import { createSkybox } from "./Skybox";
import { SandTrailManager } from "./SandTrails";
import { Ocean } from "./Ocean";
import { Terrain } from "./Terrain";
import { Lighthouse } from "./Lighthouse";
import { BeachChairs } from "./BeachChairs";

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
  private isWireframeMode: boolean = false;
  private lighthouse!: Lighthouse;
  private beachChairs!: BeachChairs;

  constructor() {
    // Initialize scene
    this.scene = new THREE.Scene();
    this.scene.background = createSkybox();
    this.scene.environment = this.scene.background; // Use skybox as environment map for reflections

    // Add fog to the scene
    this.scene.fog = new THREE.FogExp2(0x87ceeb, 0.01); // Light blue fog with medium density

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
    this.renderer.shadowMap.autoUpdate = true;

    // Initialize clock for frame-independent movement
    this.clock = new THREE.Clock();

    // Create scene elements
    this.initScene();

    // Initialize controller
    this.controller = new FirstPersonController(
      this.camera,
      this.scene,
      this.terrain,
      this
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
    // Add lights first
    const { ambientLight, directionalLight, shadowLight } = createLights();
    this.ambientLight = ambientLight;
    this.directionalLight = directionalLight;
    this.shadowLight = shadowLight;
    this.scene.add(ambientLight, directionalLight, shadowLight);

    // Add terrain after lights are set up
    this.terrain = new Terrain(this.scene, this.camera);

    // Add lighthouse to the center of the island
    this.lighthouse = new Lighthouse(this.scene);
    this.lighthouse.setPosition(0, this.terrain.getHeightAt(0, 0), 0);

    // Update terrain uniforms with lighting information
    this.terrain.updateUniforms(
      directionalLight.position.clone().normalize(),
      new THREE.Color(0x87ceeb),
      0.01
    );

    // Add beach chairs
    this.beachChairs = new BeachChairs(this.scene, this.terrain);

    // Create rock formations
    this.createRockFormations();

    // Create palm trees
    this.createPalmTrees();
  }

  private createRockFormations(): void {
    // Create a group for rock formations
    const rockGroup = new THREE.Group();

    // Define cluster centers - increased number of clusters
    const clusterCenters = [
      { x: 10, y: 0, z: -8 },
      { x: -12, y: 0, z: 5 },
      { x: 8, y: 0, z: 12 },
      { x: -15, y: 0, z: -10 },
      { x: 5, y: 0, z: -15 },
      { x: -8, y: 0, z: 10 },
      { x: 12, y: 0, z: 8 },
      { x: -15, y: 0, z: -5 },
      { x: 0, y: 0, z: -20 },
      { x: -20, y: 0, z: 0 },
      { x: 20, y: 0, z: 0 },
      { x: 0, y: 0, z: 20 },
    ];

    // For each cluster center, create multiple smaller rocks
    clusterCenters.forEach((center) => {
      // Create 3-5 rocks per cluster
      const numRocks = Math.floor(Math.random() * 3) + 3;

      for (let i = 0; i < numRocks; i++) {
        // Random offset from cluster center (0.5 to 2 units)
        const offsetX = (Math.random() - 0.5) * 3;
        const offsetZ = (Math.random() - 0.5) * 3;

        // Smaller scale (0.3 to 0.8)
        const scale = 0.3 + Math.random() * 0.5;

        // Create a rock using a dodecahedron
        const geometry = new THREE.DodecahedronGeometry(scale, 1);
        const material = new THREE.MeshStandardMaterial({
          color: 0x888888,
          roughness: 0.9,
          metalness: 0.1,
        });

        const rock = new THREE.Mesh(geometry, material);
        rock.position.set(center.x + offsetX, center.y, center.z + offsetZ);
        rock.castShadow = true;
        rock.receiveShadow = true;

        // Add some random rotation for natural look
        rock.rotation.set(
          Math.random() * Math.PI,
          Math.random() * Math.PI,
          Math.random() * Math.PI
        );

        rockGroup.add(rock);
      }
    });

    this.scene.add(rockGroup);
  }

  private createPalmTrees(): void {
    // Create a group for palm trees
    const palmGroup = new THREE.Group();

    // Create different palm tree positions - increased number of trees
    const palmPositions = [
      { x: 5, y: 0, z: -15 },
      { x: -8, y: 0, z: 10 },
      { x: 12, y: 0, z: 8 },
      { x: -15, y: 0, z: -5 },
      { x: 10, y: 0, z: -8 },
      { x: -12, y: 0, z: 5 },
      { x: 8, y: 0, z: 12 },
      { x: -15, y: 0, z: -10 },
      { x: 0, y: 0, z: -20 },
      { x: -20, y: 0, z: 0 },
      { x: 20, y: 0, z: 0 },
      { x: 0, y: 0, z: 20 },
      { x: 15, y: 0, z: -15 },
      { x: -15, y: 0, z: 15 },
      { x: 15, y: 0, z: 15 },
      { x: -15, y: 0, z: -15 },
    ];

    palmPositions.forEach((pos) => {
      // Create trunk with segments for a more natural look
      const trunkHeight = 4;
      const trunkRadius = 0.3;
      const trunkSegments = 8;
      const trunkGeometry = new THREE.CylinderGeometry(
        trunkRadius,
        trunkRadius * 1.2,
        trunkHeight,
        trunkSegments
      );

      // Add some texture to the trunk
      const trunkMaterial = new THREE.MeshStandardMaterial({
        color: 0x8b4513,
        roughness: 0.9,
        bumpScale: 0.1,
      });

      const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
      trunk.position.set(0, trunkHeight / 2, 0); // Position relative to group
      trunk.castShadow = true;
      trunk.receiveShadow = true;

      // Create fronds
      const frondGroup = new THREE.Group();
      const numFronds = 8;
      const frondLength = 2;
      const frondWidth = 0.8;

      for (let i = 0; i < numFronds; i++) {
        // Create individual frond
        const frondGeometry = new THREE.PlaneGeometry(frondLength, frondWidth);
        const frondMaterial = new THREE.MeshStandardMaterial({
          color: 0x228b22,
          side: THREE.DoubleSide,
          roughness: 0.9,
        });

        const frond = new THREE.Mesh(frondGeometry, frondMaterial);

        // Position and rotate frond relative to the trunk top
        const angle = (i / numFronds) * Math.PI * 2;
        const radius = 0.5;
        frond.position.set(
          Math.cos(angle) * radius,
          trunkHeight, // Position at top of trunk
          Math.sin(angle) * radius
        );

        // Rotate frond to point outward and slightly downward
        frond.rotation.y = angle;
        frond.rotation.x = Math.PI / 4; // Tilt fronds downward

        // Add some random variation
        frond.rotation.z = (Math.random() - 0.5) * 0.2;
        frond.scale.y = 0.8 + Math.random() * 0.4;

        frond.castShadow = true;
        frond.receiveShadow = true;
        frondGroup.add(frond);
      }

      // Create the palm tree group
      const palmTree = new THREE.Group();
      palmTree.position.set(pos.x, 0, pos.z); // Set the group's position
      palmTree.add(trunk);
      palmTree.add(frondGroup);

      // Add some random rotation to the whole tree
      palmTree.rotation.y = Math.random() * Math.PI * 2;

      palmGroup.add(palmTree);
    });

    this.scene.add(palmGroup);
  }

  public setTimeOfDay(hour: number): void {
    this.timeOfDay = hour;
    this.updateLighting();
  }

  public setFogDensity(density: number): void {
    if (this.scene.fog instanceof THREE.FogExp2) {
      this.scene.fog.density = density;

      // Update terrain uniforms with lighting information
      this.terrain.updateUniforms(
        this.directionalLight.position.clone().normalize(),
        new THREE.Color(0x87ceeb),
        density
      );
    }
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

    // Update shadow camera to look at the center of the scene
    this.directionalLight.target.position.set(0, 0, 0);
    this.directionalLight.target.updateMatrixWorld();

    // Update light intensity based on time of day
    const isDay = this.timeOfDay > 6 && this.timeOfDay < 18;
    const intensity = isDay ? 4.5 : 0.5;
    this.directionalLight.intensity = intensity;

    // Update ambient light color and intensity
    const ambientIntensity = isDay ? 0.8 : 0.2;
    const ambientColor = isDay ? 0x4040ff : 0x000033;
    this.ambientLight.intensity = ambientIntensity;
    this.ambientLight.color.setHex(ambientColor);

    // Update fog color and density based on time of day
    const fogColor = isDay ? 0x87ceeb : 0x1a237e;
    const fogDensity = isDay ? 0.01 : 0.015;

    if (this.scene.fog instanceof THREE.FogExp2) {
      this.scene.fog.color.setHex(fogColor);
      this.scene.fog.density = fogDensity;
    }

    // Update terrain uniforms
    this.terrain.updateUniforms(
      this.directionalLight.position.clone().normalize(),
      new THREE.Color(0x87ceeb),
      0.01
    );

    // Update shadow light to match sun position
    this.shadowLight.position.copy(this.directionalLight.position);
    this.shadowLight.intensity = isDay ? 1.5 : 0.2;

    const shadowCamera = this.directionalLight.shadow.camera;
    const sunAngle = Math.atan2(sunY, Math.sqrt(sunX * sunX + sunZ * sunZ));

    // Adjust shadow camera frustum based on sun angle
    const baseDistance = 100;
    const distance = baseDistance / Math.max(0.1, Math.cos(sunAngle));
    shadowCamera.left = -distance;
    shadowCamera.right = distance;
    shadowCamera.top = distance;
    shadowCamera.bottom = -distance;
    shadowCamera.updateProjectionMatrix();
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

    // Dispose of all scene objects
    this.terrain.dispose();
    this.ocean.dispose();
    this.lighthouse.dispose();
    this.beachChairs.dispose();
    this.sandTrailManager.dispose();

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

  public toggleWireframeMode(): void {
    this.isWireframeMode = !this.isWireframeMode;

    // Update all meshes in the scene
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        if (
          object.material instanceof THREE.MeshStandardMaterial ||
          object.material instanceof THREE.ShaderMaterial
        ) {
          object.material.wireframe = this.isWireframeMode;
        } else if (Array.isArray(object.material)) {
          object.material.forEach((material) => {
            if (
              material instanceof THREE.MeshStandardMaterial ||
              material instanceof THREE.ShaderMaterial
            ) {
              material.wireframe = this.isWireframeMode;
            }
          });
        }
      }
    });
  }
}

export default SceneManager;
