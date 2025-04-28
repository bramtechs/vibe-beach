import * as THREE from "three";

export function createLights(renderer: THREE.WebGLRenderer): {
  ambientLight: THREE.AmbientLight;
  directionalLight: THREE.DirectionalLight;
  shadowLight: THREE.DirectionalLight;
} {
  // Create ambient light for general scene illumination
  const ambientLight = new THREE.AmbientLight(0x4040ff, 0.8);

  // Create directional light for shadows and directional illumination
  const directionalLight = new THREE.DirectionalLight(0xffffff, 4.5);
  directionalLight.position.set(10, 20, 10);
  directionalLight.castShadow = true;

  // Configure shadow properties for better quality
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  directionalLight.shadow.camera.near = 0.5;
  directionalLight.shadow.camera.far = 50;
  directionalLight.shadow.camera.left = -20;
  directionalLight.shadow.camera.right = 20;
  directionalLight.shadow.camera.top = 20;
  directionalLight.shadow.camera.bottom = -20;
  directionalLight.shadow.bias = -0.0005;

  const shadowLight = new THREE.DirectionalLight(0xffffff, 1.5);
  // opposite of directionalLight
  shadowLight.position.set(
    -directionalLight.position.x,
    -directionalLight.position.y,
    -directionalLight.position.z
  );
  shadowLight.castShadow = true;

  return { ambientLight, directionalLight, shadowLight };
}
