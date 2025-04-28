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
  private isWireframeMode: boolean = false;

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
    // Add terrain
    this.terrain = new Terrain();
    this.scene.add(this.terrain.getMesh());

    // Add lights
    const { ambientLight, directionalLight, shadowLight } = createLights();
    this.ambientLight = ambientLight;
    this.directionalLight = directionalLight;
    this.shadowLight = shadowLight;
    this.scene.add(ambientLight, directionalLight, shadowLight);

    // Update terrain material with shadow information
    const terrainMesh = this.terrain.getMesh();
    if (terrainMesh.material instanceof THREE.ShaderMaterial) {
      terrainMesh.material.uniforms.shadowMap.value =
        directionalLight.shadow.map;
      terrainMesh.material.uniforms.shadowMatrix.value =
        directionalLight.shadow.matrix;
      terrainMesh.material.uniforms.lightDirection.value =
        directionalLight.position.clone().normalize();
    }

    // Create rock formations
    this.createRockFormations();

    // Create sand dunes
    this.createSandDunes();

    // Create palm trees
    this.createPalmTrees();
  }

  private createRockFormations(): void {
    // Create a group for rock formations
    const rockGroup = new THREE.Group();

    // Create different rock sizes and shapes
    const rockPositions = [
      { x: 10, y: 0, z: -8, scale: 2 },
      { x: -12, y: 0, z: 5, scale: 1.5 },
      { x: 8, y: 0, z: 12, scale: 2.5 },
      { x: -15, y: 0, z: -10, scale: 3 },
    ];

    rockPositions.forEach((pos) => {
      // Create a rock using a dodecahedron for a more natural look
      const geometry = new THREE.DodecahedronGeometry(pos.scale, 1);
      const material = new THREE.MeshStandardMaterial({
        color: 0x888888,
        roughness: 0.9,
        metalness: 0.1,
      });

      const rock = new THREE.Mesh(geometry, material);
      rock.position.set(pos.x, pos.y, pos.z);
      rock.castShadow = true;
      rock.receiveShadow = true;

      // Add some random rotation for natural look
      rock.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );

      rockGroup.add(rock);
    });

    this.scene.add(rockGroup);
  }

  private createSandDunes(): void {
    // Create a group for sand dunes
    const duneGroup = new THREE.Group();

    // Create different dune sizes and positions
    const dunePositions = [
      { x: 15, y: 0, z: 0, scale: 5 },
      { x: -20, y: 0, z: -15, scale: 7 },
      { x: 0, y: 0, z: 20, scale: 6 },
      { x: -10, y: 0, z: -25, scale: 4 },
    ];

    dunePositions.forEach((pos) => {
      // Create a dune using a sphere with modified geometry
      const geometry = new THREE.SphereGeometry(
        pos.scale,
        32,
        32,
        0,
        Math.PI * 2,
        0,
        Math.PI / 2
      );
      const material = new THREE.MeshStandardMaterial({
        color: 0xf4d03f,
        roughness: 0.9,
        metalness: 0.0,
      });

      const dune = new THREE.Mesh(geometry, material);
      dune.position.set(pos.x, pos.y, pos.z);
      dune.rotation.x = -Math.PI / 2; // Rotate to lay flat
      dune.castShadow = true;
      dune.receiveShadow = true;

      // Add some random rotation for natural look
      dune.rotation.z = Math.random() * Math.PI * 2;

      duneGroup.add(dune);
    });

    this.scene.add(duneGroup);
  }

  private createPalmTrees(): void {
    // Create a group for palm trees
    const palmGroup = new THREE.Group();

    // Create different palm tree positions
    const palmPositions = [
      { x: 5, y: 0, z: -15 },
      { x: -8, y: 0, z: 10 },
      { x: 12, y: 0, z: 8 },
      { x: -15, y: 0, z: -5 },
    ];

    palmPositions.forEach((pos) => {
      // Create trunk
      const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.3, 3, 8);
      const trunkMaterial = new THREE.MeshStandardMaterial({
        color: 0x8b4513,
        roughness: 0.9,
      });
      const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
      trunk.position.set(pos.x, 1.5, pos.z);
      trunk.castShadow = true;
      trunk.receiveShadow = true;

      // Create leaves
      const leavesGeometry = new THREE.ConeGeometry(1.5, 3, 8);
      const leavesMaterial = new THREE.MeshStandardMaterial({
        color: 0x228b22,
        roughness: 0.9,
      });
      const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
      leaves.position.set(pos.x, 4, pos.z);
      leaves.castShadow = true;
      leaves.receiveShadow = true;

      palmGroup.add(trunk);
      palmGroup.add(leaves);
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

      // Update terrain fog uniforms
      const terrainMesh = this.terrain.getMesh();
      if (terrainMesh.material instanceof THREE.ShaderMaterial) {
        terrainMesh.material.uniforms.fogDensity.value = density;
      }
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

    // Update terrain fog uniforms
    const terrainMesh = this.terrain.getMesh();
    if (terrainMesh.material instanceof THREE.ShaderMaterial) {
      terrainMesh.material.uniforms.fogColor.value.setHex(fogColor);
      terrainMesh.material.uniforms.fogDensity.value = fogDensity;
    }

    // Update shadow light to match sun position
    this.shadowLight.position.copy(this.directionalLight.position);
    this.shadowLight.intensity = isDay ? 1.5 : 0.2;

    // Update shadow camera frustum based on sun position
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

    // Update terrain shadow uniforms
    const terrainMesh = this.terrain.getMesh();
    if (terrainMesh.material instanceof THREE.ShaderMaterial) {
      terrainMesh.material.uniforms.shadowMap.value =
        this.directionalLight.shadow.map;
      terrainMesh.material.uniforms.shadowMatrix.value =
        this.directionalLight.shadow.matrix;
      terrainMesh.material.uniforms.lightDirection.value =
        this.directionalLight.position.clone().normalize();
    }

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
