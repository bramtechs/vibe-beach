import * as THREE from "three";

export function createSkybox(): THREE.Texture {
  const loader = new THREE.TextureLoader();
  const texture = loader.load("/textures/autumn.jpeg");
  texture.mapping = THREE.EquirectangularReflectionMapping;
  return texture;
}
