import * as THREE from "three";

class FirstPersonController {
  private camera: THREE.PerspectiveCamera;
  private scene: THREE.Scene;

  // Movement state
  private moveForward = false;
  private moveBackward = false;
  private moveLeft = false;
  private moveRight = false;
  private canJump = true;

  // Physics
  private velocity = new THREE.Vector3();
  private direction = new THREE.Vector3();
  private verticalVelocity = 0;

  // Controller settings
  private readonly movementSpeed = 5.0;
  private readonly jumpHeight = 10.0;
  private readonly gravity = 30.0;

  // Mouse control
  private isPointerLocked = false;
  private euler = new THREE.Euler(0, 0, 0, "YXZ");
  private mouseSensitivity = 0.002;

  // Player height
  private readonly playerHeight = 1.7;

  constructor(camera: THREE.PerspectiveCamera, scene: THREE.Scene) {
    this.camera = camera;
    this.scene = scene;

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
        case "Space":
          if (this.canJump) {
            this.verticalVelocity = this.jumpHeight;
            this.canJump = false;
          }
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
      }
    };

    // Add event listeners
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);
  }

  public update(delta: number): void {
    // Only update if pointer is locked
    if (!this.isPointerLocked) return;

    // Apply gravity
    this.verticalVelocity -= this.gravity * delta;

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

    // Apply vertical movement (gravity/jumping)
    const moveY = this.verticalVelocity * delta;

    // Move camera
    this.camera.position.x += moveX;
    this.camera.position.z += moveZ;
    this.camera.position.y += moveY;

    // Floor collision detection
    if (this.camera.position.y < this.playerHeight) {
      this.camera.position.y = this.playerHeight;
      this.verticalVelocity = 0;
      this.canJump = true;
    }
  }

  public dispose(): void {
    // Clean up event listeners if needed
    document.exitPointerLock();
  }
}

export default FirstPersonController;
