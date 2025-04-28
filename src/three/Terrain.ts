import * as THREE from "three";

export class Terrain {
  private mesh: THREE.Mesh;
  private uniforms: {
    time: { value: number };
    noiseScale: { value: number };
    heightScale: { value: number };
    noiseStrength: { value: number };
    sandColor: { value: THREE.Color };
    sandColor2: { value: THREE.Color };
    sandColor3: { value: THREE.Color };
    sandColor4: { value: THREE.Color };
    sandTexture: { value: THREE.Texture };
    shadowMap: { value: THREE.Texture };
    shadowMatrix: { value: THREE.Matrix4 };
    lightDirection: { value: THREE.Vector3 };
    fogColor: { value: THREE.Color };
    fogDensity: { value: number };
  };

  constructor() {
    // Create terrain geometry with more segments
    const geometry = new THREE.PlaneGeometry(128, 128, 2048, 2048);
    geometry.rotateX(-Math.PI / 2);

    // Create shader uniforms with adjusted values
    this.uniforms = {
      time: { value: 0 },
      heightScale: { value: 10.0 },
      noiseScale: { value: 0.02 },
      noiseStrength: { value: 0.8 },
      sandColor: { value: new THREE.Color(0xf4d03f) },
      sandColor2: { value: new THREE.Color(0xf1c40f) },
      sandColor3: { value: new THREE.Color(0xf39c12) },
      sandColor4: { value: new THREE.Color(0xe67e22) },
      sandTexture: { value: new THREE.Texture() },
      shadowMap: { value: new THREE.Texture() },
      shadowMatrix: { value: new THREE.Matrix4() },
      lightDirection: { value: new THREE.Vector3(1, 1, 1) },
      fogColor: { value: new THREE.Color(0x87ceeb) },
      fogDensity: { value: 0.01 },
    };

    // Load sand texture
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load("/textures/sand.jpg", (texture) => {
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(20, 20);
      texture.minFilter = THREE.LinearMipMapLinearFilter;
      texture.magFilter = THREE.LinearFilter;
      this.uniforms.sandTexture.value = texture;
    });

    // Create shader material
    const material = new THREE.ShaderMaterial({
      uniforms: {
        ...this.uniforms,
        shadowMap: { value: new THREE.Texture() },
        shadowMatrix: { value: new THREE.Matrix4() },
        lightDirection: { value: new THREE.Vector3(1, 1, 1) },
        fogColor: { value: new THREE.Color(0x87ceeb) },
        fogDensity: { value: 0.01 },
      },
      vertexShader: `
        uniform float time;
        uniform float noiseScale;
        uniform float heightScale;
        uniform float noiseStrength;
        uniform mat4 shadowMatrix;
        
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying float vHeight;
        varying vec2 vUv;
        varying vec4 vShadowCoord;
        varying float vFogDepth;
        
        // Improved noise function
        float random(vec2 st) {
          return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
        }
        
        float noise(vec2 st) {
          vec2 i = floor(st);
          vec2 f = fract(st);
          
          float a = random(i);
          float b = random(i + vec2(1.0, 0.0));
          float c = random(i + vec2(0.0, 1.0));
          float d = random(i + vec2(1.0, 1.0));
          
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
        }
        
        float fbm(vec2 st) {
          float value = 0.0;
          float amplitude = 0.5;
          float frequency = 1.0;
          
          for (int i = 0; i < 4; i++) {
            value += amplitude * noise(st * frequency);
            st *= 2.0;
            amplitude *= 0.5;
            frequency *= 2.0;
          }
          return value;
        }
        
        void main() {
          vec3 pos = position;
          
          // Calculate distance from center
          float distFromCenter = length(pos.xz);
          float maxDist = 50.0; // Half of the plane size
          
          // Generate height using multiple octaves of noise
          vec2 noisePos = pos.xz * noiseScale;
          float height = fbm(noisePos) * heightScale;
          
          // Add some variation based on position
          height += sin(pos.x * 0.1) * cos(pos.z * 0.1) * 0.2;
          
          // Create a gradual slope towards the ocean
          float slopeFactor = smoothstep(0.0, maxDist, distFromCenter);
          height = mix(height, -5.0, slopeFactor); // Sink to -5 units below sea level
          
          // Apply height to position
          pos.y += height;
          
          // Calculate normal
          vec2 eps = vec2(0.01, 0.0);
          float hL = fbm(noisePos - eps.xy) * heightScale;
          float hR = fbm(noisePos + eps.xy) * heightScale;
          float hD = fbm(noisePos - eps.yx) * heightScale;
          float hU = fbm(noisePos + eps.yx) * heightScale;
          
          // Adjust normals for the slope
          vec3 normal = normalize(vec3(hL - hR, 2.0, hD - hU));
          normal.y += slopeFactor * 0.5; // Flatten normals near the ocean
          normal = normalize(normal);
          
          vNormal = normal;
          vPosition = pos;
          vHeight = height;
          
          // Map UVs to world space coordinates
          vUv = pos.xz * 1.1;
          
          vShadowCoord = shadowMatrix * vec4(pos, 1.0);
          
          // Calculate model-view position for fog
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          vFogDepth = -mvPosition.z;
          
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform sampler2D sandTexture;
        uniform sampler2D shadowMap;
        uniform vec3 lightDirection;
        uniform vec3 fogColor;
        uniform float fogDensity;
        
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying float vHeight;
        varying vec2 vUv;
        varying vec4 vShadowCoord;
        varying float vFogDepth;
        
        float getShadow() {
          vec3 shadowCoord = vShadowCoord.xyz / vShadowCoord.w;
          
          // Check if the fragment is outside the shadow map
          if (shadowCoord.z < 0.0 || shadowCoord.z > 1.0) {
            return 1.0;
          }
          
          shadowCoord = shadowCoord * 0.5 + 0.5;
          
          float shadow = 0.0;
          float bias = 0.001;
          
          // PCF shadow sampling with larger kernel for softer shadows
          vec2 texelSize = 1.0 / vec2(4096.0, 4096.0);
          for(int x = -2; x <= 2; x++) {
            for(int y = -2; y <= 2; y++) {
              float depth = texture2D(shadowMap, shadowCoord.xy + vec2(x, y) * texelSize).r;
              shadow += shadowCoord.z - bias > depth ? 0.0 : 1.0;
            }
          }
          shadow /= 25.0;
          
          // Make shadows more subtle and vary based on sun angle
          float sunAngle = dot(lightDirection, vec3(0.0, 1.0, 0.0));
          float shadowStrength = mix(0.5, 0.8, sunAngle);
          
          // Add self-shadowing based on normal and light direction
          float selfShadow = max(0.0, dot(vNormal, lightDirection));
          shadow = mix(shadowStrength, 1.0, shadow * selfShadow);
          
          return shadow;
        }
        
        void main() {
          // Sample sand texture
          vec4 sandColor = texture2D(sandTexture, vUv);
          
          // Add some color variation based on height
          float heightFactor = smoothstep(0.0, 1.0, vHeight / 2.0);
          vec3 color = mix(sandColor.rgb, sandColor.rgb * 0.8, heightFactor);
          
          // Add some ambient occlusion based on normal
          float ao = dot(vNormal, vec3(0.0, 1.0, 0.0)) * 0.5 + 0.5;
          color *= ao;
          
          // Calculate shadow
          float shadow = getShadow();
          
          // Add some specular highlights based on sun angle
          vec3 lightDir = normalize(lightDirection);
          float sunAngle = dot(lightDir, vec3(0.0, 1.0, 0.0));
          float spec = pow(max(dot(reflect(-lightDir, vNormal), normalize(vPosition)), 0.0), 32.0);
          color += spec * 0.1 * max(0.0, sunAngle);
          
          // Apply shadow more subtly
          color *= shadow;
          
          // Ensure minimum brightness
          color = max(color, vec3(0.3));
          
          // Apply fog
          float fogFactor = 1.0 - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
          color = mix(color, fogColor, fogFactor);
          
          gl_FragColor = vec4(color, 1.0);
        }
      `,
    });

    // Create mesh
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.y = 0;
    this.mesh.receiveShadow = true;
    this.mesh.castShadow = true;

    // Configure shadow properties
    this.mesh.customDepthMaterial = new THREE.MeshDepthMaterial({
      depthPacking: THREE.RGBADepthPacking,
      map: this.uniforms.sandTexture.value,
      alphaTest: 0.5,
    });
  }

  public update(delta: number): void {
    this.uniforms.time.value += delta;
  }

  public getMesh(): THREE.Mesh {
    return this.mesh;
  }

  public getHeightAt(x: number, z: number): number {
    // Sample the terrain height using the same noise function as the shader
    const noiseScale = this.uniforms.noiseScale.value;
    const heightScale = this.uniforms.heightScale.value;
    const noiseStrength = this.uniforms.noiseStrength.value;

    // Calculate distance from center
    const distFromCenter = Math.sqrt(x * x + z * z);
    const maxDist = 50.0; // Half of the plane size

    // Generate height using multiple octaves of noise
    const noisePos = new THREE.Vector2(x, z).multiplyScalar(noiseScale);
    let height = this.fbm(noisePos) * heightScale * noiseStrength;

    // Add some variation based on position
    height += Math.sin(x * 0.1) * Math.cos(z * 0.1) * 0.2;

    // Create a gradual slope towards the ocean
    const slopeFactor = this.smoothstep(0.0, maxDist, distFromCenter);
    height = this.mix(height, -5.0, slopeFactor); // Sink to -5 units below sea level

    return height;
  }

  private fbm(pos: THREE.Vector2): number {
    let value = 0.0;
    let amplitude = 0.5;
    let frequency = 1.0;

    for (let i = 0; i < 4; i++) {
      value += amplitude * this.noise(pos.clone().multiplyScalar(frequency));
      pos.multiplyScalar(2.0);
      amplitude *= 0.5;
      frequency *= 2.0;
    }
    return value;
  }

  private noise(pos: THREE.Vector2): number {
    const i = new THREE.Vector2(Math.floor(pos.x), Math.floor(pos.y));
    const f = new THREE.Vector2(pos.x - i.x, pos.y - i.y);

    const a = this.random(i);
    const b = this.random(new THREE.Vector2(i.x + 1, i.y));
    const c = this.random(new THREE.Vector2(i.x, i.y + 1));
    const d = this.random(new THREE.Vector2(i.x + 1, i.y + 1));

    const u = new THREE.Vector2(
      f.x * f.x * (3.0 - 2.0 * f.x),
      f.y * f.y * (3.0 - 2.0 * f.y)
    );

    return this.mix(this.mix(a, b, u.x), this.mix(c, d, u.x), u.y);
  }

  private random(pos: THREE.Vector2): number {
    return (
      (Math.sin(pos.dot(new THREE.Vector2(12.9898, 78.233))) * 43758.5453123) %
      1
    );
  }

  private mix(x: number, y: number, a: number): number {
    return x * (1 - a) + y * a;
  }

  private smoothstep(edge0: number, edge1: number, x: number): number {
    const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
    return t * t * (3 - 2 * t);
  }

  public dispose(): void {
    this.mesh.geometry.dispose();
    if (this.mesh.material instanceof THREE.ShaderMaterial) {
      this.mesh.material.dispose();
    }
    if (this.uniforms.sandTexture.value) {
      this.uniforms.sandTexture.value.dispose();
    }
  }
}
