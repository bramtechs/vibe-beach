import * as THREE from "three";
import { Terrain } from "./Terrain";

export class BeachChairs {
  private chairs: THREE.Group;
  private scene: THREE.Scene;
  private terrain: Terrain;

  constructor(scene: THREE.Scene, terrain: Terrain) {
    this.scene = scene;
    this.terrain = terrain;
    this.chairs = new THREE.Group();
    this.createBeachChairs();
  }

  private createBeachChairs(): void {
    // Create a group to hold all chairs
    const chairGroup = new THREE.Group();

    // Create chair material
    const chairMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a75ff, // Blue color for the chairs
      roughness: 0.7,
      metalness: 0.2,
    });

    // Create chair frame material
    const frameMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff, // White color for the frame
      roughness: 0.3,
      metalness: 0.8,
    });

    // Create multiple chairs
    const chairPositions = [
      { x: -5, z: -5 },
      { x: -3, z: -5 },
      { x: -1, z: -5 },
      { x: 1, z: -5 },
      { x: 3, z: -5 },
      { x: 5, z: -5 },
    ];

    chairPositions.forEach((pos) => {
      const chair = this.createSingleChair(chairMaterial, frameMaterial);
      // Get the terrain height at this position and add a small offset
      const height = this.terrain.getHeightAt(pos.x, pos.z) + 0.1; // Add 0.1 units to ensure above ground
      chair.position.set(pos.x, height, pos.z);
      // Add random rotation between -30 and 30 degrees
      const randomRotation = ((Math.random() - 0.5) * Math.PI) / 3; // ±30 degrees in radians
      chair.rotation.y = Math.PI / 2 + randomRotation; // Base rotation (facing ocean) plus random rotation
      chairGroup.add(chair);
    });

    // Add the chair group to the scene
    this.scene.add(chairGroup);
    this.chairs = chairGroup;
  }

  private createSingleChair(
    chairMaterial: THREE.Material,
    frameMaterial: THREE.Material
  ): THREE.Group {
    const chair = new THREE.Group();

    // Create chair back
    const backGeometry = new THREE.BoxGeometry(1.2, 0.8, 0.05);
    const back = new THREE.Mesh(backGeometry, chairMaterial);
    back.position.set(0, 0.4, 0.3);
    back.rotation.x = -Math.PI / 4; // Tilt back slightly
    chair.add(back);

    // Create chair seat
    const seatGeometry = new THREE.BoxGeometry(1.2, 0.05, 0.8);
    const seat = new THREE.Mesh(seatGeometry, chairMaterial);
    seat.position.set(0, 0, 0);
    chair.add(seat);

    // Create chair legs
    const legGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.3, 8);
    const legPositions = [
      { x: -0.5, z: -0.3 },
      { x: 0.5, z: -0.3 },
      { x: -0.5, z: 0.3 },
      { x: 0.5, z: 0.3 },
    ];

    legPositions.forEach((pos) => {
      const leg = new THREE.Mesh(legGeometry, frameMaterial);
      leg.position.set(pos.x, -0.15, pos.z);
      chair.add(leg);
    });

    // Create chair armrests
    const armrestGeometry = new THREE.BoxGeometry(0.05, 0.1, 0.8);
    const leftArmrest = new THREE.Mesh(armrestGeometry, frameMaterial);
    leftArmrest.position.set(-0.6, 0.2, 0);
    chair.add(leftArmrest);

    const rightArmrest = new THREE.Mesh(armrestGeometry, frameMaterial);
    rightArmrest.position.set(0.6, 0.2, 0);
    chair.add(rightArmrest);

    return chair;
  }

  public dispose(): void {
    this.scene.remove(this.chairs);
    this.chairs.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        if (Array.isArray(object.material)) {
          object.material.forEach((material) => material.dispose());
        } else {
          object.material.dispose();
        }
      }
    });
  }
}
