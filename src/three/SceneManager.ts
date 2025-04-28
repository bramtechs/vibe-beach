import * as THREE from "three";
import FirstPersonController from "./FirstPersonController";
import { createLights } from "./LightingSystem";
import { createSkybox } from "./Skybox";
import { SandTrailManager } from "./SandTrails";
import { Ocean } from "./Ocean";
import { Terrain } from "./Terrain";
import { Lighthouse } from "./Lighthouse";
import { Clouds } from "./Clouds";
import { BeachFurniture } from "./BeachFurniture";
import seedrandom from "seedrandom";

class SceneManager {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private clock: THREE.Clock;
  private terrain!: Terrain;
  private controller!: FirstPersonController;
  private sandTrailManager!: SandTrailManager;
  private ocean!: Ocean;
  private lighthouse!: Lighthouse;
  private clouds!: Clouds;
  private ambientLight!: THREE.AmbientLight;
  private directionalLight!: THREE.DirectionalLight;
  private shadowLight!: THREE.DirectionalLight;
  private timeOfDay: number = 12; // Default to noon
  private isWireframeMode: boolean = false;
  private animationFrameId: number | null = null;
  private readonly TERRAIN_BASE_HEIGHT = 1; // Base height for the terrain
  private beachFurniture!: BeachFurniture;

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
    this.sandTrailManager = new SandTrailManager(this.scene, this.terrain);

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
    this.terrain = new Terrain(
      this.scene,
      this.camera,
      this.TERRAIN_BASE_HEIGHT
    );

    // Add lighthouse to the center of the island
    this.lighthouse = new Lighthouse(this.scene);
    const lighthouseHeight = this.terrain.getHeightAt(0, 0);
    this.lighthouse.setPosition(0, lighthouseHeight - 1, 0); // Lower the lighthouse by 2 units

    // Update terrain uniforms with lighting information
    this.terrain.updateUniforms(
      directionalLight.position.clone().normalize(),
      new THREE.Color(0x87ceeb),
      0.01
    );

    // Create rock formations
    this.createRockFormations();

    // Create palm trees
    this.createPalmTrees();

    // Create beach furniture
    this.createBeachFurniture();

    // Add clouds
    this.clouds = new Clouds();
    this.scene.add(this.clouds.getCloudGroup());
  }

  private createRockFormations(): void {
    // Create a group for rock formations
    const rockGroup = new THREE.Group();

    // Island parameters
    const ISLAND_RADIUS = 40.0;
    const SHORELINE_WIDTH = 8.0; // Width of the shoreline area
    const SHORELINE_START = ISLAND_RADIUS - SHORELINE_WIDTH;
    const NUM_CLUSTERS = 24; // Total number of rock clusters

    // Create a seeded random number generator
    const rng = seedrandom("beach-rocks-42"); // Fixed seed for consistent results

    // Generate cluster centers using seeded random
    const clusterCenters = [];
    for (let i = 0; i < NUM_CLUSTERS; i++) {
      // Generate random angle and distance from center
      const angle = rng() * Math.PI * 2;

      // Bias towards shoreline by using a power function
      const distance = SHORELINE_START + rng() * SHORELINE_WIDTH * 0.5; // Mostly in shoreline area

      // Calculate position
      const x = Math.cos(angle) * distance;
      const z = Math.sin(angle) * distance;

      clusterCenters.push({ x, y: 0, z });
    }

    // For each cluster center, create multiple smaller rocks
    clusterCenters.forEach((center) => {
      // Check if the cluster center is within the island radius
      const distanceFromCenter = Math.sqrt(
        center.x * center.x + center.z * center.z
      );
      if (distanceFromCenter > ISLAND_RADIUS) return;

      // Create 5-8 rocks per cluster
      const numRocks = Math.floor(rng() * 4) + 5;

      for (let i = 0; i < numRocks; i++) {
        // Random offset from cluster center (0.5 to 2 units)
        const offsetX = (rng() - 0.5) * 3;
        const offsetZ = (rng() - 0.5) * 3;

        // Calculate final position
        const x = center.x + offsetX;
        const z = center.z + offsetZ;

        // Check if the rock is within the island radius
        const rockDistanceFromCenter = Math.sqrt(x * x + z * z);
        if (rockDistanceFromCenter > ISLAND_RADIUS) continue;

        // Get terrain height at this position
        const height = this.terrain.getHeightAt(x, z);

        // Adjust scale and placement probability based on distance from shoreline
        const distanceFromShoreline = Math.abs(
          rockDistanceFromCenter - SHORELINE_START
        );
        const shorelineProbability = Math.max(
          0,
          1 - distanceFromShoreline / SHORELINE_WIDTH
        );

        // Skip rock placement with lower probability as we move away from shoreline
        if (rng() > shorelineProbability) continue;

        // Smaller rocks further from shoreline
        const scale = 0.3 + rng() * 0.5 * shorelineProbability;

        // Create a rock using a dodecahedron
        const geometry = new THREE.DodecahedronGeometry(scale, 1);
        const material = new THREE.MeshStandardMaterial({
          color: 0x888888,
          roughness: 0.9,
          metalness: 0.1,
        });

        const rock = new THREE.Mesh(geometry, material);
        rock.position.set(x, height, z);
        rock.castShadow = true;
        rock.receiveShadow = true;

        // Add some random rotation for natural look
        rock.rotation.set(rng() * Math.PI, rng() * Math.PI, rng() * Math.PI);

        rockGroup.add(rock);
      }
    });

    this.scene.add(rockGroup);
  }

  private createPalmTrees(): void {
    // Create a group for palm trees
    const palmGroup = new THREE.Group();

    // Create a seeded random number generator
    const rng = seedrandom("beach-island-42"); // Fixed seed for consistent results

    // Island parameters
    const ISLAND_RADIUS = 40.0;
    const MIN_DISTANCE_FROM_CENTER = 3.0; // Reduced from 5.0 to allow more trees near center
    const NUM_TREES = 60; // Increased from 30 to 60 trees
    const TREE_DENSITY_FACTOR = 0.8; // Factor to control tree density (lower = more clustered)

    // Generate tree positions using seeded random
    for (let i = 0; i < NUM_TREES; i++) {
      // Generate random angle and distance from center with density variation
      const angle = rng() * Math.PI * 2;
      const normalizedDistance = rng(); // 0 to 1
      const distance =
        MIN_DISTANCE_FROM_CENTER +
        Math.pow(normalizedDistance, TREE_DENSITY_FACTOR) *
          (ISLAND_RADIUS - MIN_DISTANCE_FROM_CENTER);

      // Calculate position
      const x = Math.cos(angle) * distance;
      const z = Math.sin(angle) * distance;

      // Create trunk with segments for a more natural look
      const trunkHeight = 4 + (rng() - 0.5) * 0.5; // Add slight height variation
      const trunkRadius = 0.15 + (rng() - 0.5) * 0.02; // Make trunk thinner
      const trunkSegments = 8;
      const segmentHeight = trunkHeight / 12; // Create 12 segments for the trunk

      // Create trunk material
      const trunkMaterial = new THREE.MeshStandardMaterial({
        color: 0x8b4513,
        roughness: 0.9,
        bumpScale: 0.1,
      });

      // Create trunk segments
      const trunkGroup = new THREE.Group();
      for (let i = 0; i < 12; i++) {
        // Vary the radius slightly for each segment
        const segmentRadius = trunkRadius * (1 + (rng() - 0.5) * 0.1);
        const segmentGeometry = new THREE.CylinderGeometry(
          segmentRadius,
          segmentRadius * 1.1, // Slightly wider at bottom of each segment
          segmentHeight,
          trunkSegments
        );

        const segment = new THREE.Mesh(segmentGeometry, trunkMaterial);
        segment.position.y = i * segmentHeight + segmentHeight / 2;
        segment.castShadow = true;
        segment.receiveShadow = true;

        // Add slight rotation to each segment for more natural look
        segment.rotation.y = (rng() - 0.5) * 0.1;

        trunkGroup.add(segment);
      }

      // Create fronds
      const frondGroup = new THREE.Group();
      const numFronds = 8 + Math.floor(rng() * 4); // Vary number of fronds
      const frondLength = 2 + (rng() - 0.5) * 0.4; // Vary frond length
      const frondWidth = 0.8 + (rng() - 0.5) * 0.2; // Vary frond width

      for (let j = 0; j < numFronds; j++) {
        // Create a more realistic palm leaf shape
        const leafShape = new THREE.Shape();
        const segments = 8;
        const width = frondWidth;
        const length = frondLength;

        // Start at the base
        leafShape.moveTo(0, 0);

        // Create the main spine of the leaf
        for (let i = 1; i <= segments; i++) {
          const t = i / segments;
          const x = t * length;
          const y = width * (1 - t * 0.8) * Math.sin(t * Math.PI); // Curved shape
          leafShape.lineTo(x, y);
        }

        // Create the other side of the leaf
        for (let i = segments; i >= 0; i--) {
          const t = i / segments;
          const x = t * length;
          const y = -width * (1 - t * 0.8) * Math.sin(t * Math.PI); // Curved shape
          leafShape.lineTo(x, y);
        }

        // Create the leaflet geometry
        const leafGeometry = new THREE.ShapeGeometry(leafShape);
        const leafMaterial = new THREE.MeshStandardMaterial({
          color: 0x228b22,
          side: THREE.DoubleSide,
          roughness: 0.9,
        });

        const leaf = new THREE.Mesh(leafGeometry, leafMaterial);

        // Position and rotate frond relative to the trunk top
        const frondAngle = (j / numFronds) * Math.PI * 2;
        const radius = 0.5 + rng() * 0.2; // Vary frond spread

        // Create a more natural arrangement
        const tiltAngle = Math.PI / 4 + (rng() - 0.5) * 0.3; // Base tilt plus variation
        const droopAmount = (rng() - 0.5) * 0.2; // Slight droop variation

        leaf.position.set(
          Math.cos(frondAngle) * radius,
          trunkHeight,
          Math.sin(frondAngle) * radius
        );

        // Add more natural rotation
        leaf.rotation.x = tiltAngle + droopAmount;
        leaf.rotation.z = (rng() - 0.5) * 0.3; // Slight twist
        leaf.rotation.y = frondAngle;

        // Scale the leaf to make it more proportional
        leaf.scale.set(1, 1, 0.1); // Make it thin

        // Add some leaflets to make it more palm-like
        const numLeaflets = 5 + Math.floor(rng() * 3);
        for (let k = 0; k < numLeaflets; k++) {
          const leaflet = leaf.clone();
          const leafletT = k / (numLeaflets - 1);
          const leafletAngle = ((leafletT - 0.5) * Math.PI) / 2; // Spread leaflets

          leaflet.position.x += Math.sin(leafletAngle) * 0.5;
          leaflet.position.y += Math.cos(leafletAngle) * 0.5;
          leaflet.rotation.x += leafletAngle * 0.5;
          leaflet.scale.multiplyScalar(0.8 + rng() * 0.4); // Vary size

          frondGroup.add(leaflet);
        }

        frondGroup.add(leaf);
      }

      // Create a group for the entire tree
      const treeGroup = new THREE.Group();
      treeGroup.add(trunkGroup);
      treeGroup.add(frondGroup);

      // Position the tree at the calculated position
      const height = this.terrain.getHeightAt(x, z);
      treeGroup.position.set(x, height, z);

      // Add some random rotation around Y axis
      treeGroup.rotation.y = rng() * Math.PI * 2;

      palmGroup.add(treeGroup);
    }

    this.scene.add(palmGroup);
  }

  private createBeachFurniture(): void {
    this.beachFurniture = new BeachFurniture(this.scene, this.terrain);

    // Create a seeded random number generator
    const rng = seedrandom("beach-furniture-42");

    // Island parameters
    const ISLAND_RADIUS = 40.0;
    const SHORELINE_WIDTH = 8.0;
    const SHORELINE_START = ISLAND_RADIUS - SHORELINE_WIDTH;
    const NUM_CHAIRS = 20; // Number of beach chairs
    const UMBRELLA_PROBABILITY = 0.4; // 40% chance of an umbrella with each chair

    // Place chairs around the shoreline
    for (let i = 0; i < NUM_CHAIRS; i++) {
      // Generate random angle and distance from center
      const angle = rng() * Math.PI * 2;
      const distance = SHORELINE_START + rng() * SHORELINE_WIDTH * 0.5;

      // Calculate position
      const x = Math.cos(angle) * distance;
      const z = Math.sin(angle) * distance;

      // Get terrain height at this position
      const height = this.terrain.getHeightAt(x, z);

      // Create chair
      const chairPosition = new THREE.Vector3(x, height, z);
      // Face directly away from the center (towards the ocean)
      const chairRotation = angle;
      this.beachFurniture.createBeachChair(chairPosition, chairRotation);

      // Sometimes add an umbrella
      if (rng() < UMBRELLA_PROBABILITY) {
        // Place umbrella slightly behind the chair
        const umbrellaOffset = new THREE.Vector3(
          -Math.sin(angle) * 0.5,
          0,
          Math.cos(angle) * 0.5
        );
        const umbrellaPosition = chairPosition.clone().add(umbrellaOffset);
        this.beachFurniture.createUmbrella(umbrellaPosition, chairRotation);
      }
    }
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
    const fogColor = isDay ? 0xcccccc : 0x666666;
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
    this.animationFrameId = requestAnimationFrame(this.animate);

    const deltaTime = this.clock.getDelta();

    // Update controller
    this.controller.update(deltaTime);

    // Update sand trails
    this.sandTrailManager.update(deltaTime, this.camera.position);

    // Update ocean
    this.ocean.update(deltaTime);

    // Update clouds
    this.clouds.update(deltaTime);

    // Render scene
    this.renderer.render(this.scene, this.camera);
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
    this.sandTrailManager.dispose();

    // Dispose renderer
    this.renderer.dispose();
  }

  private setupPositionSaving(): void {
    // Save position every 5 seconds
    setInterval(() => {
      this.controller.savePosition();
    }, 1000);

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
