import * as THREE from "three";
import { Terrain } from "./Terrain";
import SceneManager from "./SceneManager";

class FirstPersonController {
  private camera: THREE.PerspectiveCamera;
  private scene: THREE.Scene;
  private terrain: Terrain;
  private sceneManager: SceneManager;

  // Movement state
  private moveForward = false;
  private moveBackward = false;
  private moveLeft = false;
  private moveRight = false;
  private moveUp = false;
  private moveDown = false;
  private canJump = true;
  private isFlyMode = false;

  // Physics
  private velocity = new THREE.Vector3();
  private direction = new THREE.Vector3();
  private verticalVelocity = 0;

  // Controller settings
  private readonly movementSpeed = 5.0;
  private readonly jumpHeight = 10.0;
  private readonly gravity = 30.0;
  private readonly flySpeed = 5.0;

  // Mouse control
  private isPointerLocked = false;
  private euler = new THREE.Euler(0, 0, 0, "YXZ");
  private mouseSensitivity = 0.002;

  // Player height
  private readonly playerHeight = 1.7;

  constructor(
    camera: THREE.PerspectiveCamera,
    scene: THREE.Scene,
    terrain: Terrain,
    sceneManager: SceneManager
  ) {
    this.camera = camera;
    this.scene = scene;
    this.terrain = terrain;
    this.sceneManager = sceneManager;

    // Initialize controllers
    this.initPointerLock();
    this.initKeyboardControls();
  }

  private initPointerLock(): void {
    const onPointerLockChange = (): void => {
      this.isPointerLocked = document.pointerLockElement === document.body;
    };

    const onPointerLockError = (): void => {
      console.error("Pointer lock error");
    };

    // Setup event listeners for pointer lock
    document.addEventListener("pointerlockchange", onPointerLockChange, false);
    document.addEventListener("pointerlockerror", onPointerLockError, false);

    // Request pointer lock on click
    document.body.addEventListener("click", () => {
      if (!this.isPointerLocked) {
        document.body.requestPointerLock();
      }
    });

    // Mouse movement event
    document.addEventListener("mousemove", (event) => {
      if (this.isPointerLocked) {
        // Update camera rotation based on mouse movement
        this.euler.setFromQuaternion(this.camera.quaternion);

        // Apply mouse sensitivity and update rotation
        this.euler.y -= event.movementX * this.mouseSensitivity;
        this.euler.x -= event.movementY * this.mouseSensitivity;

        // Clamp vertical look to prevent over-rotation
        this.euler.x = Math.max(
          -Math.PI / 2,
          Math.min(Math.PI / 2, this.euler.x)
        );

        // Apply rotation to camera
        this.camera.quaternion.setFromEuler(this.euler);
      }
    });
  }

  private initKeyboardControls(): void {
    const onKeyDown = (event: KeyboardEvent): void => {
      switch (event.code) {
        case "KeyW":
          this.moveForward = true;
          break;
        case "KeyS":
          this.moveBackward = true;
          break;
        case "KeyA":
          this.moveLeft = true;
          break;
        case "KeyD":
          this.moveRight = true;
          break;
        case "KeyQ":
          if (this.isFlyMode) this.moveDown = true;
          break;
        case "KeyE":
          if (this.isFlyMode) this.moveUp = true;
          break;
        case "Space":
          if (this.canJump && !this.isFlyMode) {
            this.verticalVelocity = this.jumpHeight;
            this.canJump = false;
          }
          break;
        case "KeyF":
          this.isFlyMode = !this.isFlyMode;
          if (this.isFlyMode) {
            this.verticalVelocity = 0;
            this.canJump = false;
          } else {
            this.moveUp = false;
            this.moveDown = false;
          }
          break;
        case "KeyT":
          // Toggle wireframe mode
          this.sceneManager.toggleWireframeMode();
          break;
      }
    };

    const onKeyUp = (event: KeyboardEvent): void => {
      switch (event.code) {
        case "KeyW":
          this.moveForward = false;
          break;
        case "KeyS":
          this.moveBackward = false;
          break;
        case "KeyA":
          this.moveLeft = false;
          break;
        case "KeyD":
          this.moveRight = false;
          break;
        case "KeyQ":
          this.moveDown = false;
          break;
        case "KeyE":
          this.moveUp = false;
          break;
      }
    };

    // Add event listeners
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);
  }

  public update(delta: number): void {
    // Only update if pointer is locked
    if (!this.isPointerLocked) return;

    if (!this.isFlyMode) {
      // Apply gravity in walk mode
      //this.verticalVelocity -= this.gravity * delta;
    } else {
      // Handle vertical movement in fly mode
      const verticalMove =
        (Number(this.moveUp) - Number(this.moveDown)) * this.flySpeed * delta;
      this.camera.position.y += verticalMove;
    }

    // Calculate horizontal movement direction
    this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
    this.direction.x = Number(this.moveLeft) - Number(this.moveRight);
    this.direction.normalize();

    // Update velocity based on direction
    this.velocity.z = this.direction.z * this.movementSpeed * delta;
    this.velocity.x = this.direction.x * this.movementSpeed * delta;

    // Convert movement to camera direction
    const cameraDirection = new THREE.Vector3();
    this.camera.getWorldDirection(cameraDirection);
    cameraDirection.y = 0;
    cameraDirection.normalize();

    // Calculate forward and right vectors
    const right = new THREE.Vector3()
      .crossVectors(new THREE.Vector3(0, 1, 0), cameraDirection)
      .normalize();

    // Apply movement in camera direction
    const moveX =
      this.velocity.x * right.x + this.velocity.z * cameraDirection.x;
    const moveZ =
      this.velocity.x * right.z + this.velocity.z * cameraDirection.z;

    // Apply vertical movement (gravity/jumping or flying)
    const moveY = this.isFlyMode ? 0 : this.verticalVelocity * delta;

    // Move camera
    this.camera.position.x += moveX;
    this.camera.position.z += moveZ;
    this.camera.position.y += moveY;

    // Reset vertical velocity after applying it
    if (!this.isFlyMode) {
      this.verticalVelocity = 0;
    }
  }

  public dispose(): void {
    // Clean up event listeners if needed
    document.exitPointerLock();
  }

  public savePosition(): void {
    const position = {
      x: this.camera.position.x,
      y: this.camera.position.y,
      z: this.camera.position.z,
      rotation: {
        x: this.euler.x,
        y: this.euler.y,
        z: this.euler.z,
      },
    };
    localStorage.setItem("cameraPosition", JSON.stringify(position));
  }

  public loadPosition(): void {
    const savedPosition = localStorage.getItem("cameraPosition");
    if (savedPosition) {
      const position = JSON.parse(savedPosition);
      this.camera.position.set(position.x, position.y, position.z);
      this.euler.set(
        position.rotation.x,
        position.rotation.y,
        position.rotation.z
      );
      this.camera.quaternion.setFromEuler(this.euler);
    }
  }

  public resetPosition(): void {
    // Reset to initial position (0, 1.7, 0) which is human eye level
    this.camera.position.set(0, 1.7, 0);
    this.camera.rotation.set(0, 0, 0);
    this.euler.set(0, 0, 0);
    this.camera.quaternion.setFromEuler(this.euler);
    this.verticalVelocity = 0;
  }
}

export default FirstPersonController;
