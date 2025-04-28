import * as THREE from "three";

export function createFloor(): THREE.Mesh {
  // Create floor geometry (large plane)
  const floorGeometry = new THREE.PlaneGeometry(40, 40, 20, 20);

  // Create a texture loader
  const textureLoader = new THREE.TextureLoader();

  // Load floor textures
  const floorBaseColor = textureLoader.load("/textures/sand.jpg", (texture) => {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(8, 8);
  });

  // Create floor material
  const floorMaterial = new THREE.MeshStandardMaterial({
    map: floorBaseColor,
    color: 0xd2b48c, // Warm sand color
    roughness: 0.9, // Increased roughness for more natural sand texture
    metalness: 0.1,
  });

  // Create floor mesh
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2; // Rotate to be horizontal
  floor.position.y = 0; // At ground level
  floor.receiveShadow = true;

  return floor;
}
