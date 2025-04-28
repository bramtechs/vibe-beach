import * as THREE from "three";

class SandTrail {
  private mesh: THREE.Mesh;
  private lifetime: number;
  private currentTime: number;

  constructor(position: THREE.Vector3, size: number) {
    // Create a small plane for the trail
    const geometry = new THREE.PlaneGeometry(size, size);
    const material = new THREE.MeshStandardMaterial({
      color: 0xc2a482, // Slightly darker sand color
      transparent: true,
      opacity: 0.8,
      roughness: 0.9,
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.rotation.x = -Math.PI / 2; // Rotate to be horizontal
    this.mesh.position.copy(position);
    this.mesh.position.y = 0.01; // Place just above the ground level

    this.lifetime = 5; // Trail lasts for 5 seconds
    this.currentTime = 0;
  }

  public update(delta: number): boolean {
    this.currentTime += delta;
    const progress = this.currentTime / this.lifetime;

    // Fade out the trail
    if (this.mesh.material instanceof THREE.MeshStandardMaterial) {
      this.mesh.material.opacity = 0.8 * (1 - progress);
    }

    // Return true if the trail should be removed
    return progress >= 1;
  }

  public getMesh(): THREE.Mesh {
    return this.mesh;
  }
}

export class SandTrailManager {
  private trails: SandTrail[] = [];
  private scene: THREE.Scene;
  private lastTrailPosition: THREE.Vector3 | null = null;
  private readonly minDistance = 0.5; // Minimum distance between trails

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  public update(delta: number, playerPosition: THREE.Vector3): void {
    // Create a position at ground level (y = 0)
    const groundPosition = new THREE.Vector3(
      playerPosition.x,
      0,
      playerPosition.z
    );

    // Check if we should create a new trail
    if (
      !this.lastTrailPosition ||
      this.lastTrailPosition.distanceTo(groundPosition) >= this.minDistance
    ) {
      this.createTrail(groundPosition);
      this.lastTrailPosition = groundPosition.clone();
    }

    // Update and remove expired trails
    this.trails = this.trails.filter((trail) => {
      const shouldRemove = trail.update(delta);
      if (shouldRemove) {
        this.scene.remove(trail.getMesh());
      }
      return !shouldRemove;
    });
  }

  private createTrail(position: THREE.Vector3): void {
    const trail = new SandTrail(position, 0.3); // 0.3 units wide trail
    this.scene.add(trail.getMesh());
    this.trails.push(trail);
  }

  public dispose(): void {
    // Remove all trails from the scene
    this.trails.forEach((trail) => {
      this.scene.remove(trail.getMesh());
    });
    this.trails = [];
  }
}
