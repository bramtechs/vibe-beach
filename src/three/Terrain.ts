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
  };

  constructor() {
    // Create terrain geometry
    const geometry = new THREE.PlaneGeometry(2000, 2000, 512, 512);
    geometry.rotateX(-Math.PI / 2);

    // Create shader uniforms with adjusted values
    this.uniforms = {
      time: { value: 0 },
      heightScale: { value: 20.0 },
      noiseScale: { value: 0.01 },
      noiseStrength: { value: 0.8 },
      sandColor: { value: new THREE.Color(0xf4d03f) },
      sandColor2: { value: new THREE.Color(0xf1c40f) },
      sandColor3: { value: new THREE.Color(0xf39c12) },
      sandColor4: { value: new THREE.Color(0xe67e22) },
      sandTexture: { value: new THREE.Texture() },
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
      uniforms: this.uniforms,
      vertexShader: `
        uniform float time;
        uniform float noiseScale;
        uniform float heightScale;
        uniform float noiseStrength;
        
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying float vHeight;
        varying vec2 vUv;
        
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
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D sandTexture;
        
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying float vHeight;
        varying vec2 vUv;
        
        void main() {
          // Sample sand texture
          vec4 sandColor = texture2D(sandTexture, vUv);
          
          // Add some color variation based on height
          float heightFactor = smoothstep(0.0, 1.0, vHeight / 2.0);
          vec3 color = mix(sandColor.rgb, sandColor.rgb * 0.8, heightFactor);
          
          // Add some ambient occlusion based on normal
          float ao = dot(vNormal, vec3(0.0, 1.0, 0.0)) * 0.5 + 0.5;
          color *= ao;
          
          // Add some specular highlights
          vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
          float spec = pow(max(dot(reflect(-lightDir, vNormal), normalize(vPosition)), 0.0), 32.0);
          color += spec * 0.1;
          
          gl_FragColor = vec4(color, 1.0);
        }
      `,
    });

    // Create mesh
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.y = 0;
    this.mesh.receiveShadow = true;
    this.mesh.castShadow = true;
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
