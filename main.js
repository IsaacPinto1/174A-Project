import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Audio, AudioLoader, AudioListener } from 'three';

// ---- Camera Position and Target ----
const CAMERA_POS_X = 0;
const CAMERA_POS_Y = 5;
const CAMERA_POS_Z = 10;

const CAMERA_TARGET_X = 0;
const CAMERA_TARGET_Y = 0;
const CAMERA_TARGET_Z = 0;

// ---- Set Up Scene, Camera, Renderer ----
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x328dbf);
let clock = new THREE.Clock();

// ---- Camera ----
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(CAMERA_POS_X, CAMERA_POS_Y, CAMERA_POS_Z);

// ---- Renderer ----
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

// ---- Controls ----
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(CAMERA_TARGET_X, CAMERA_TARGET_Y, CAMERA_TARGET_Z);
controls.update();

// ---- Lighting ----
const ambientLight = new THREE.AmbientLight(0x505050);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
directionalLight.position.set(5, 10, 5).normalize();
scene.add(directionalLight);


// ---- Audio Listener ----
const listener = new AudioListener();
camera.add(listener);

// ------------------------
//          Sounds
//-----------------------
const audioLoader = new AudioLoader();

const bgSound = new Audio(listener);
audioLoader.load('/sounds/bg.mp3', (buffer) => {
    bgSound.setBuffer(buffer);
    bgSound.setLoop(false);
    bgSound.setVolume(0.5);
    // bgSound.play();
});

const coinSound = new Audio(listener);
audioLoader.load('/sounds/coin-2.mp3', (buffer) => {
    coinSound.setBuffer(buffer);
    coinSound.setLoop(false);
    coinSound.setVolume(0.5);
});

const powerUpSound = new Audio(listener);
audioLoader.load('/sounds/powerUp.mp3', (buffer) => {
    powerUpSound.setBuffer(buffer);
    powerUpSound.setLoop(false);
    powerUpSound.setVolume(0.7);
});

const gameOverSound = new Audio(listener);
audioLoader.load('/sounds/gameOver.mp3', (buffer) => {
    gameOverSound.setBuffer(buffer);
    gameOverSound.setLoop(false);
    gameOverSound.setVolume(0.8);
});

const logBreakSound = new Audio(listener);
audioLoader.load('/sounds/logBreak.mp3', (buffer) => {
    logBreakSound.setBuffer(buffer);
    logBreakSound.setLoop(false);
    logBreakSound.setVolume(0.5);
});

function playSound(sound) {
  if (sound.isPlaying) {
      sound.stop();
  }
  sound.play();
}

// ------------------------
//          Game/physics VALUES
//-----------------------

//---Physics---
const GRAVITY = -0.004;         // Much weaker gravity for floating effect
const WATER_RESISTANCE = 0.98;  // Slows down movement over time

//---Player---
const INITIAL_VELOCITY = 0.15; 
const MAX_ANGLE = Math.PI / 4; // 45 degrees in radians
const MOVEMENT_SPEED = 0.05;    // Slower horizontal movement for underwater feel
const MAX_JUMPS = 3; // For mid-way jumps

//---Objects------
const STARTING_OBSTACLE_VELOCITY = 0.05;
let obstacle_velocity = STARTING_OBSTACLE_VELOCITY;
const COIN_VELOCITY = 0.1;
const PUP_VELOCITY = 0.05
const GROUND_LENGTH = 40;

// ---- Game Variables ----
let stage = 1;
let movingLog = false;
let poweredUP = false;
let poweredUPStart = null;
let speedBoost = false;
let speedBoostStart = null;


// ---- Tadpole (Player) Properties ----
let playerX = 0;
let playerY = 1;
let playerZ = 2;
let velocityY = 0;
let score = 0;
let gameOn = true;
let jumpsRemaining = MAX_JUMPS;

// ---- Get Score and Game Over Elements ----
const scoreElement = document.getElementById('score');
const stageElement = document.getElementById('stage');
const gameOverElement = document.getElementById('gameOver');
const powerElement = document.getElementById('power');
const speedBoostElement = document.getElementById('speedBoost');

//-----Textures for ground-----------
//NOTES: Add Sliding Floor Texture??
const textureLoader = new THREE.TextureLoader();
const groundBase = textureLoader.load('/images/Sand_007_basecolor.jpg');
const groundNormal = textureLoader.load('/images/Sand_007_normal.jpg');

const logSideTexture = textureLoader.load('/images/wood_texture.jpg');
const logTipTexture = textureLoader.load('images/log_tip.jpg');

const coinTexture = textureLoader.load('images/coin.jpg');

//----Texture for chest--------
const chestTexture = textureLoader.load('images/Wood_027_basecolor.jpg');
const chestNormal = textureLoader.load('images/Wood_027_normal.jpg');


// ---- Plane Geometry for Ground ----
const groundObjects = []
function setPosition(ground, yRotation, xPosition,yPosition, zPosition){ 
    ground.rotation.x = -Math.PI / 2;
    ground.rotation.y= yRotation;
    ground.position.y = yPosition;
    ground.position.x = xPosition;
    ground.position.z = zPosition;
    scene.add(ground)
    groundObjects.push(ground)
}
//GROUND: two banks that move and reset when behind camera
const groundGeometry = new THREE.PlaneGeometry(20, GROUND_LENGTH);
//const groundMaterial = new THREE.MeshPhongMaterial({ color: 0x808080 });
const groundMaterial = new THREE.MeshStandardMaterial({ map: groundBase, normalMap: groundNormal });
const floor = new THREE.Mesh(groundGeometry, groundMaterial);
setPosition(floor, 0, 0, 0,0)

const floor2 = new THREE.Mesh(groundGeometry, groundMaterial);
setPosition(floor2, 0, 0, 0, -1*GROUND_LENGTH + 2* obstacle_velocity)

//SideBanks
const leftBank = new THREE.Mesh(groundGeometry, groundMaterial);
setPosition(leftBank, -0.3, 19, 3, 0)
const left2Bank = new THREE.Mesh(groundGeometry, groundMaterial);
setPosition(left2Bank, -0.3, 19, 3,  -1*GROUND_LENGTH + 2*obstacle_velocity)

const rightBank = new THREE.Mesh(groundGeometry, groundMaterial);
setPosition(rightBank, 0.3, -19, 3, 0)
const right2Bank = new THREE.Mesh(groundGeometry, groundMaterial);
setPosition(right2Bank, 0.3, -19, 3,  -1*GROUND_LENGTH + 2*obstacle_velocity)


// ---- Tadpole Geometry ----
const tadpole = new THREE.Group(); 

const headGeometry = new THREE.SphereGeometry(0.25, 16, 16);
const headMaterial = new THREE.MeshPhongMaterial({ 
  color: 0x93DC5C });

const head = new THREE.Mesh(headGeometry, headMaterial);


// Eye 
const eyeGeometry = new THREE.SphereGeometry(0.1, 16, 16);
const eyeMaterial = new THREE.MeshPhongMaterial({ 
  color: 0xffffff });

const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);

leftEye.position.set(0.2, 0.15, -0.1);
rightEye.position.set(-0.2, 0.15, -0.1);

// Pupil 
const pupilGeometry = new THREE.SphereGeometry(0.1 , 16, 16);
const pupilMaterial = new THREE.MeshPhongMaterial({ 
  color: 0x010101 });
const leftPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
const rightPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
leftPupil.position.set(0, 0, -0.02);
rightPupil.position.set(0, 0, -0.02);

leftEye.add(leftPupil);
rightEye.add(rightPupil);

// Tail 
const tailGeometry = new THREE.CylinderGeometry(0.05, 0.15, 1.5, 16, 1); 
const tailMaterial = new THREE.MeshPhongMaterial({ color: 0x93DC5C });
const tail = new THREE.Mesh(tailGeometry, tailMaterial);
tail.position.set(0, 0, 0.7); 
tail.rotation.x = Math.PI / 2;   

head.add(leftEye);
head.add(rightEye);
head.add(tail);

tadpole.add(head);

scene.add(tadpole);


// ---- Coin  ----
const coinGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.1, 32);
const coinMaterial = new THREE.MeshPhongMaterial({map: coinTexture});
let coin = new THREE.Mesh(coinGeometry, coinMaterial);
coin.rotation.x = Math.PI / 2;
coin.position.y=1;
scene.add(coin);


// ---- Power-up ----
const pUPGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.1, 32);
const pUPMaterial = new THREE.MeshPhongMaterial({ color: 0xFF0000, specular: 0xFFFFFF, shininess: 200});
let pUP = new THREE.Mesh(pUPGeometry, pUPMaterial);
pUP.rotation.x = Math.PI / 2;
pUP.position.z = 15;
pUP.position.y=1;
scene.add(pUP);


//--Speed Boost----
const boostDuration = 3000; // Duration of the boost in milliseconds
const boostMultiplier = 2;  // Speed multiplier

const speedBoostGeometry = new THREE.SphereGeometry(0.3, 16, 16);
const speedBoostMaterial = new THREE.MeshStandardMaterial({ color: 0x800080, emissive: 0x6a0dad });
let speedBoostOrb = new THREE.Mesh(speedBoostGeometry, speedBoostMaterial);
speedBoostOrb.position.z = 15;
speedBoostOrb.position.y = 1;
scene.add(speedBoostOrb);



//-----Treasure Chest(Score Doubler)------
const treasureChest = new THREE.Group();

// Create the base (rectangular hexahedron)
const chestBaseGeometry = new THREE.BoxGeometry(2, 1, 1); // Width, Height, Depth
const chestMaterial = new THREE.MeshStandardMaterial({ map: chestTexture, normalMap: chestNormal, color: 0x8B4513, }); // Brown color
const base = new THREE.Mesh(chestBaseGeometry, chestMaterial);
base.position.y = 0.5; // Raise it so it aligns with the lid

//Clasp
const claspGeometry = new THREE.BoxGeometry(0.4, 0.2, 0.2);
const claspMatieral = new THREE.MeshStandardMaterial({color: 0xFFD700});
const clasp = new THREE.Mesh(claspGeometry, claspMatieral);
clasp.position.set(0, 0.9, 0.6);

// Create the lid (cylinder)
const chestLidGeometry = new THREE.CylinderGeometry(0.5, 0.5, 2, 32, 1, false, 0, Math.PI); // Half-cylinder
const lid = new THREE.Mesh(chestLidGeometry, chestMaterial);
lid.rotation.z = Math.PI / 2; // Rotate the cylinder to face forward
lid.position.set(0, 1, 0); // Position it on top of the base

//Edges
const edgeGeometry = new THREE.BoxGeometry(2.05, 0.1, 1.05);
const edge = new THREE.Mesh(edgeGeometry, claspMatieral);
edge.position.y = 1;
treasureChest.add(edge);
const edge2Geometry = new THREE.BoxGeometry(0.1, 1, 1.05);
const edge2 = new THREE.Mesh(edge2Geometry, claspMatieral);
edge2.position.y = 0.5;
edge2.position.x = 0.25;
treasureChest.add(edge2);
const edge3 = new THREE.Mesh(edge2Geometry, claspMatieral);
edge3.position.y = 0.5;
edge3.position.x = 0.75;
treasureChest.add(edge3);
const edge4 = new THREE.Mesh(edge2Geometry, claspMatieral);
edge4.position.y = 0.5;
edge4.position.x = -0.25;
treasureChest.add(edge4);
const edge5 = new THREE.Mesh(edge2Geometry, claspMatieral);
edge5.position.y = 0.5;
edge5.position.x = -0.75;
treasureChest.add(edge5);


// Add the base and lid to the treasure chest group
treasureChest.add(base);
treasureChest.add(lid);
treasureChest.add(clasp);
scene.add(treasureChest);
treasureChest.position.z = 20;
treasureChest.position.y = -0.15;
treasureChest.rotation.z = Math.PI / 10; // Rotate by 45 degrees (in radians)
// Factory function to create a volcano
function createVolcano(position) {
    const volcano = new THREE.Group();

    // --- Volcano Base ---
    const volcanoGeometry = new THREE.CylinderGeometry(0.5, 2, 1, 32, 1, true); // Open cylinder
    const volcanoMaterial = new THREE.MeshPhongMaterial({ 
        map: textureLoader.load('images/volcano.jpg'),
        normalMap: textureLoader.load('images/volcano_normal.jpg'),
        side: THREE.DoubleSide // Render both sides for the rim
    });
    const volcanoBase = new THREE.Mesh(volcanoGeometry, volcanoMaterial);

    // --- Lava Surface ---
    const circleGeometry = new THREE.CircleGeometry(0.9, 32); // Radius matches cylinder's radius
    const circleMaterial = new THREE.MeshStandardMaterial({
        map: textureLoader.load('images/lava.png'),
        normalMap: textureLoader.load('images/lava_normal.png'),
    });
    const lavaSurface = new THREE.Mesh(circleGeometry, circleMaterial);
    lavaSurface.rotation.x = -Math.PI / 2; // Rotate to lie flat
    lavaSurface.position.y = 0.2; // Position the lava

    // --- Fumes ---
    const fumesCount = 500;
    const fumes = new THREE.BufferGeometry();
    const fumePositions = new Float32Array(fumesCount * 3);

    for (let i = 0; i < fumesCount; i++) {
        fumePositions[i * 3] = Math.random() * 2 - 1;  // X position
        fumePositions[i * 3 + 1] = Math.random() * 10; // Y position
        fumePositions[i * 3 + 2] = Math.random() * 2 - 1; // Z position
    }
    fumes.setAttribute('position', new THREE.BufferAttribute(fumePositions, 3));

    const fumeMaterial = new THREE.PointsMaterial({
        color: 0xFFA500,
        size: 0.1,
        transparent: true,
        opacity: 0.5,
    });
    const fumeSystem = new THREE.Points(fumes, fumeMaterial);

    // Add components to the volcano group
    volcano.add(volcanoBase);
    volcano.add(lavaSurface);
    volcano.add(fumeSystem);

    // Position the volcano
    volcano.position.set(position.x, position.y, position.z);

    return volcano;
}

// Create an array of volcanoes
const volcanoes = [];
const volcanoPositions = [
    { x: 0, y: 0, z: 15 },
    { x: 5, y: 0, z: 15 },
    { x: -5, y: 0, z: 15 },
    { x: 10, y: 0, z: 15 },
    { x: 10, y: 0, z: 15 },
    { x: 10, y: 0, z: 15 },
    { x: 10, y: 0, z: 15 }
];

for (const pos of volcanoPositions) {
    const volcano = createVolcano(pos);
    volcanoes.push(volcano);
    scene.add(volcano); // Add each volcano to the scene
}

let enableVolcano = false;


//------Gold Gained-------
let goldGained = 10;

//------Water fog---------
scene.fog = new THREE.Fog(0x328dbf, -2, 33); // Dark blue fog color for underwater effect
const fogAmbientLight = new THREE.AmbientLight(0x334d5c, 0.6); // Soft blue ambient light
scene.add(ambientLight);

const fogDirectionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight.position.set(5, 10, 5);
scene.add(directionalLight);

// ---- Obstacle Texture ----
logSideTexture.wrapS = THREE.RepeatWrapping; //Horizontal Wrap
logSideTexture.wrapT = THREE.RepeatWrapping;
logSideTexture.repeat.set(2, 10);

// ---- Obstacle ----

// Custom ShaderMaterial for the side of the log
const logSideMaterial = new THREE.ShaderMaterial({
    uniforms: {
        uTime: { value: 0.0 },
        uDissolveProgress: { value: 0.0 },
        uTexture: { value: logSideTexture },
        
        // Pass scene fog parameters to the shader
        fogColor: { value: new THREE.Color() }, // Scene fog color
        fogNear: { value: 1.0 }, // Scene fog near distance
        fogFar: { value: 100.0 }, // Scene fog far distance
        fogDensity: { value: 0.05 }, // Scene fog density
    },
    vertexShader: `
        uniform float uTime;
        uniform float uDissolveProgress;

        varying vec3 vPosition;
        varying vec2 vUv;
        varying float vFogDepth;

        // Simple noise function
        float random(vec3 p) {
            return fract(sin(dot(p.xyz, vec3(12.9898, 78.233, 45.164))) * 43758.5453);
        }

        void main() {
            vUv = uv;
            vPosition = position;

            // Noise-based displacement
            float noise = random(position * 2.0 + uTime);
            float dissolveEffect = smoothstep(0.0, 1.0, uDissolveProgress);
            vec3 newPosition = position + normal * noise * dissolveEffect;

            // Fog depth calculation
            vFogDepth = length(modelViewMatrix * vec4(newPosition, 1.0));

            gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
        }
    `,
    fragmentShader: `
        uniform float uDissolveProgress;
        uniform sampler2D uTexture;
        uniform vec3 fogColor;
        uniform float fogNear;
        uniform float fogFar;
        uniform float fogDensity;

        varying vec3 vPosition;
        varying vec2 vUv;
        varying float vFogDepth;

        float random(vec3 p) {
            return fract(sin(dot(p.xyz, vec3(12.9898, 78.233, 45.164))) * 43758.5453);
        }

        float getFogFactor(float depth) {
            float fogFactor;
            if (fogDensity > 0.0) {
                // Exponential fog
                fogFactor = exp(-fogDensity * depth);
                return clamp(fogFactor, 0.0, 1.0);
            } else {
                // Linear fog
                fogFactor = smoothstep(fogNear, fogFar, depth);
                return fogFactor;
            }
        }

        void main() {
            float noise = random(vPosition);
            if (noise < uDissolveProgress) {
                discard;
            }

            vec4 textureColor = texture2D(uTexture, vUv);
            float fogFactor = getFogFactor(vFogDepth);

            // Mix texture color with scene fog color
            vec4 finalColor = mix(vec4(fogColor, 1.0), textureColor, fogFactor);

            gl_FragColor = finalColor;
        }
    `,
});

// Update uniforms with the scene’s fog parameters
logSideMaterial.uniforms.fogColor.value = scene.fog.color;
logSideMaterial.uniforms.fogNear.value = scene.fog.near;
logSideMaterial.uniforms.fogFar.value = scene.fog.far;

if (scene.fog instanceof THREE.FogExp2) {
    logSideMaterial.uniforms.fogDensity.value = scene.fog.density;
} else {
    logSideMaterial.uniforms.fogDensity.value = 0.035; // No density if it's linear fog
}

// Use the original CylinderGeometry
const obstacleGeometry = new THREE.CylinderGeometry(0.5, 0.5, 15, 32);

// Apply textures to the cylinder
const obstacle = new THREE.Mesh(obstacleGeometry, [
    logSideMaterial, // Side material with shader
    new THREE.MeshPhongMaterial({ map: logTipTexture }), // Ends with texture
    new THREE.MeshPhongMaterial({ map: logTipTexture }), // Ends with texture
]);

obstacle.rotation.z = Math.PI / 2;
scene.add(obstacle);

//----Particles in water---

const particleCount = 300;
const particles = new THREE.BufferGeometry();
const positions = new Float32Array(particleCount * 3);

for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 20;  // X position
    positions[i * 3 + 1] = (Math.random() - 0.5) * 10; // Y position
    positions[i * 3 + 2] = (Math.random() - 0.5) * 20; // Z position
}
particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));

const particleMaterial = new THREE.PointsMaterial({
    color: 0x99ddee,
    size: 0.1,
    transparent: true,
    opacity: 0.5,
});
const particleSystem = new THREE.Points(particles, particleMaterial);
scene.add(particleSystem);



// ---- Initial Spawn Positions ----
const INITIAL_SPAWN_Z = -15;  // Fixed initial spawn Z position for objects

// ---- Player Movement and Control Variables ----
let moveLeft = false;
let moveRight = false;

// ---- Event Listeners for Controls ----
window.addEventListener('keydown', (event) => {
  if (gameOn) {
      switch (event.key) {
          case 'a':
          case 'ArrowLeft':
              moveLeft = true;
              break;
          case 'd':
          case 'ArrowRight':
              moveRight = true;
              break;
          case 'j':
          case ' ':
              if (jumpsRemaining > 0) {
                  velocityY = INITIAL_VELOCITY;  // Gentler upward movement
                  jumpsRemaining--;
              }
              break;
      }
  } else {
      // Only allow restart when game is over
      if (event.key === 'r') {
          restartGame();
      }
  }
});

window.addEventListener('keyup', (event) => {
  switch (event.key) {
      case 'a':
      case 'ArrowLeft':
          moveLeft = false;
          break;
      case 'd':
      case 'ArrowRight':
          moveRight = false;
          break;
  }
});

// ---- TadPole Body Animate ----
function animateTail(time) {
  const tailWagSpeed = 8; // Faster wagging
  const tailWagAmplitude = 0.4; // More pronounced wagging
  tail.rotation.y = Math.sin(time * tailWagSpeed) * tailWagAmplitude;
  tail.rotation.z = Math.cos(time * tailWagSpeed) * 0.1; // Slight Z-axis twist
}


function animateBody(time) {
  const bodyWaveSpeed = 8; // Match the tail speed
  const bodyWaveAmplitude = 0.15; // Subtle sway

  // Rotate the head in the opposite direction of the tail
  head.rotation.y = -Math.sin(time * bodyWaveSpeed) * bodyWaveAmplitude;

  // Slight tilt for the entire tadpole
  tadpole.rotation.y = Math.sin(time * bodyWaveSpeed) * (bodyWaveAmplitude / 2);
}

function animateTadpoleBobbing(time) {
  const baseBobbingSpeed = 3; // Faster vertical oscillation
  const baseBobbingAmplitude = 0.2; // Larger bounce
  const dynamicBobbing = jumpsRemaining < MAX_JUMPS ? 0.4 : 0; // Higher bounce when jumping

  const bobbingOffset = Math.sin(time * baseBobbingSpeed) * (baseBobbingAmplitude + dynamicBobbing);
  const newY = playerY + bobbingOffset;
  tadpole.position.set(playerX, newY, playerZ);
}

function animateRippleEffect(time) {
  const rippleSpeed = 8;
  const rippleAmplitude = 0.4;

  // Ripple starts at the tail and moves toward the head
  tail.rotation.y = Math.sin(time * rippleSpeed) * rippleAmplitude;
  head.rotation.y = Math.sin(time * rippleSpeed - Math.PI / 2) * (rippleAmplitude / 2); // Slight delay
}

function animateTadpoleTilting() {
  const tiltAngle = 0.5; // Larger tilt angle for dramatic effect
  if (moveLeft) {
      tadpole.rotation.z = tiltAngle; // Tilt left
  } else if (moveRight) {
      tadpole.rotation.z = -tiltAngle; // Tilt right
  } else {
      tadpole.rotation.z *= 0.8; // Smoothly return to neutral
  }
}



// ---- Respawn Functions with Fixed Z Position ----
function respawnToken(obj, zmin = 13, zmax = 17) {
    // Ensure zmax is not less than the default lower bound
    if (zmax < zmin) {
        console.warn(`zmax (${zmax}) is less than the default lower bound (${lowerBound}). Using default range.`);
        zmax = zmin+1;
    }

    let zspawn = -(Math.random() * (zmax - zmin) + zmin);
    obj.position.set(
        (Math.random() - 0.5) * 10,  // Random X position
        obj.position.y,                           // Fixed Y position
        zspawn                       // Random Z position
    );
}


function respawnObstacle() {
    obstacle.visible = true;
    dissolving = false;
    dissolveProgress = 0.0;
    obstacle.position.set(
        (Math.random() - 0.5) * 8,  // Random X position
        1,                           // Fixed Y position
        INITIAL_SPAWN_Z - 5          // Fixed initial Z position, slightly behind coin
    )
}

// ---- Check volcano collision ----
function checkVolcanoCollision() {
    for (const volcano of volcanoes) {
        const tadpoleX = tadpole.position.x;
        const tadpoleZ = tadpole.position.z;
        const volcanoX = volcano.position.x;
        const volcanoZ = volcano.position.z;

        // Calculate horizontal distance (ignore Y-axis)
        const horizontalDistance = Math.sqrt(
            (tadpoleX - volcanoX) ** 2 + (tadpoleZ - volcanoZ) ** 2
        );

        // Volcano cylinder radius (adjust to your volcano's size)
        const volcanoRadius = 1; 

        // Check if within radius
        if (horizontalDistance < volcanoRadius) {
            return true;
        }
    }
    return false;
}



// ---- Check for Collision with Tadpole ----
function checkCollision(obj) {
  if (obj === coin || obj === pUP || (speedBoostOrb && obj === speedBoostOrb)) {
      // For coin, keep using sphere collision (distance-based)
      const distance = tadpole.position.distanceTo(obj.position);
      return distance < 0.6;
  } else if (obj === obstacle) {
      // For obstacle, use box collision detection
      const tadpoleX = tadpole.position.x;
      const tadpoleY = tadpole.position.y;
      const tadpoleZ = tadpole.position.z;
      
      // Get obstacle boundaries
      const obstacleHalfWidth = 7.5;  // Half of obstacle width (15/2)
      const obstacleHalfHeight = 0.25; // Half of obstacle height (0.5/2)
      const obstacleHalfDepth = 0.25;  // Half of obstacle depth (0.5/2)
      
      // Check if tadpole is within obstacle bounds
      return (
          Math.abs(tadpoleX - obstacle.position.x) < obstacleHalfWidth + 0.5 && // Add tadpole radius (0.5)
          Math.abs(tadpoleY - obstacle.position.y) < obstacleHalfHeight + 0.5 &&
          Math.abs(tadpoleZ - obstacle.position.z) < obstacleHalfDepth + 0.5
      );
    }  else if (obj === treasureChest) {
        const tadpoleX = tadpole.position.x;
        const tadpoleY = tadpole.position.y;
        const tadpoleZ = tadpole.position.z;
    
        // Define treasure chest boundaries (assuming centered at its position)
        const chestHalfWidth = 0.9;  // Half of chest width (2 / 2)
        const chestHalfHeight = 0.9; // Half of chest height (1 / 2)
        const chestHalfDepth = 0.5;  // Half of chest depth (1 / 2)
    
        // Check if the tadpole is within the bounds of the treasure chest
        return (
            Math.abs(tadpoleX - treasureChest.position.x) < chestHalfWidth + 0.5 && // Add tadpole radius (0.5)
            Math.abs(tadpoleY - treasureChest.position.y) < chestHalfHeight + 0.5 &&
            Math.abs(tadpoleZ - treasureChest.position.z) < chestHalfDepth + 0.5
        );
    }
  
  return false;
}
// ---- Restart Game Function ----
function restartGame() {
    respawnObstacle(); //Do this first so restart doesnt glitch
    for(const volcano of volcanoes){
        volcano.position.z = 15;
    }
    score = 0;
    stage = 1;
    playerX = 0;
    playerY = 1;
    velocityY = 0;
    jumpsRemaining = MAX_JUMPS;
    gameOn = true;
    poweredUP = false;
    speedBoost = false;
    speedBoostStart = null;
    obstacle_velocity = STARTING_OBSTACLE_VELOCITY;
    movingLog = false;
    
    gameOverElement.style.display = 'none';
    powerElement.style.display = 'none';
    scoreElement.innerHTML = `Score: ${score}`;
    stageElement.innerHTML = `Stage: ${stage}`;
    
    // Reset object positions with fixed Z values
    respawnToken(coin);
    respawnToken(speedBoostOrb, 40, 400);
    respawnToken(TreasureChest,100, 500);
    pUP.position.z = 15;
    
    tadpole.position.set(playerX, playerY, playerZ);

    //Restart Background Music if ended
    if (!bgSound.isPlaying) {
      //bgSound.play();
    }
}

// ---- Blob Effect ----

const blobGeometry = new THREE.SphereGeometry(1.4, 30, 30); // Slightly larger than tadpole's head
const blobMaterial = new THREE.MeshStandardMaterial({
    color: 0x93dc5c,
    transparent: true,
    opacity: 0.5,
    emissive: 0x93dc5c,
    emissiveIntensity: 0.8
});
const blob = new THREE.Mesh(blobGeometry, blobMaterial);
blob.visible = false; // Initially hidden
tadpole.add(blob); // Attach the blob to the tadpole

// ---- Animate Blob ----
function animateBlob(time) {
    if (poweredUP) {
        blob.visible = true;
        // Pulse effect: scale and opacity variation
        const scale = 1 + 0.1 * Math.sin(time * 5); // Oscillates between 1 and 1.1
        blob.scale.set(scale, scale, scale);
        blobMaterial.opacity = 0.5 + 0.3 * Math.sin(time * 5); // Oscillates between 0.5 and 0.8
    } else {
        blob.visible = false;
    }
}

//------Animate Particles----
function animateParticles() {
    const positions = particleSystem.geometry.attributes.position.array;
    for (let i = 0; i < particleCount; i++) {
        positions[i * 3] += (Math.random() - 0.5) * 0.01; // Random X movement
        positions[i * 3 + 1] += (Math.random() - 0.5) * 0.01; // Random Y movement
        positions[i * 3 + 2] += (Math.random() * 0.01 - 0.005) + obstacle_velocity;
        if(positions[i * 3 + 2]>10){
            positions[i * 3 + 2] = -10;
        }
    }
    particleSystem.geometry.attributes.position.needsUpdate = true;
}

function animateAllFumes(volcanoes) {
    volcanoes.forEach(volcano => {
        // Get the fume system (assuming it's the last child in each volcano group)
        const fumeSystem = volcano.children.find(child => child.isPoints);
        if (!fumeSystem) return; // Skip if no fume system is found

        // Update the fumes' positions
        const fumePositions = fumeSystem.geometry.attributes.position.array;
        for (let i = 0; i < fumePositions.length / 3; i++) {
            fumePositions[i * 3] += (Math.random() - 0.5) * 0.01; // Random X movement
            fumePositions[i * 3 + 1] += 0.01 + Math.random() * (0.03 - 0.01); // Random upward movement

            if (fumePositions[i * 3 + 1] > 8) { // Reset height when it reaches a threshold
                fumePositions[i * 3 + 1] = 0;
            }
        }
        fumeSystem.geometry.attributes.position.needsUpdate = true;
    });
}




//----Change tadpole color----
function changeTadpoleColor(colorCode = 0x800080 ) {
    const color = new THREE.Color(colorCode); // Purple color

    headMaterial.color.set(color);
    tailMaterial.color.set(color);
    eyeMaterial.color.set(color);
    pupilMaterial.color.set(color);
}


//-----Animate ground----
function animateGround() {
    for( let i = 0; i< groundObjects.length; i++){
        groundObjects[i].position.z += obstacle_velocity;
        if(groundObjects[i].position.z >= GROUND_LENGTH){
            groundObjects[i].position.z = -1*GROUND_LENGTH + 3.5*obstacle_velocity;
        }
    }
}
let speed = obstacle_velocity*0.4;
function animateLog(){
    //change 0.5 to log radius
    if(obstacle.position.y >= 5 || obstacle.position.y <= 0.5){
        speed = -1 * speed;
    }
    obstacle.position.y += speed;
}

function updateTadpoleTilt(verticalVelocity) {
    // Clamp velocity to the range [-INITIAL_VELOCITY, INITIAL_VELOCITY]
    const clampedVelocity = Math.max(Math.min(verticalVelocity, INITIAL_VELOCITY), -INITIAL_VELOCITY);

    // Map velocity to angle (-45 to +45 degrees, in radians)
    const tiltAngle = (clampedVelocity / INITIAL_VELOCITY) * MAX_ANGLE;

    // Update the tadpole's rotation (adjust axis as needed)
    tadpole.rotation.x = tiltAngle;
}

//Making da scene responsive
window.addEventListener('resize', onWindowResize);

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
}


let dissolveProgress = 0.0;
let dissolving = false;



// ---- Main Animation Loop ----
function animate() {
    requestAnimationFrame(animate);
    if (!gameOn) {
        renderer.render(scene, camera);
        return;
    }
    let time = clock.getElapsedTime();

    animateTail(time);
    animateBody(time);
    animateTadpoleBobbing(time);
    animateRippleEffect(time);
    animateTadpoleTilting();
    animateBlob(time);
    // Apply underwater movement physics
    if (moveLeft) playerX -= MOVEMENT_SPEED;
    if (moveRight) playerX += MOVEMENT_SPEED;

    // Update vertical movement with water resistance
    velocityY += GRAVITY;
    velocityY *= WATER_RESISTANCE;
    playerY += velocityY;

    // Ground collision with gentle bounce
    if (playerY <= 1) {
        playerY = 1;
        velocityY = 0;
        jumpsRemaining = MAX_JUMPS;
    }

    if(dissolveProgress < 1.0 && dissolving){
        dissolveProgress += 0.08; // Increment dissolve
        if (dissolveProgress >= 1.0){
            dissolving = false;
        }
        //if (dissolveProgress > 1.0) dissolveProgress = 0.0; // Reset

    }
    logSideMaterial.uniforms.uTime.value += 0.05; // Update time
    logSideMaterial.uniforms.uDissolveProgress.value = dissolveProgress;

    // Update tadpole position
    updateTadpoleTilt(velocityY);
    tadpole.position.set(playerX, playerY, playerZ);

    // Move objects
    coin.position.z += obstacle_velocity;// COIN_VELOCITY;
    coin.rotation.z = time% 2*Math.PI;
    
    pUP.position.z += PUP_VELOCITY // PUP_VELOCITY;
    pUP.rotation.z = (time+1.234)%2*Math.PI;

    obstacle.position.z += obstacle_velocity;

    speedBoostOrb.position.z += obstacle_velocity;//Speed boost on coin velocity

    treasureChest.position.z += obstacle_velocity;

    if(enableVolcano){
        animateAllFumes(volcanoes)
        for (const volcano of volcanoes) {
            volcano.position.z += obstacle_velocity;
            if(volcano.position.z > 10){
                respawnToken(volcano, 30, 80);
            }
        }
        if(checkVolcanoCollision()){
            if(!poweredUP){
                gameOn = false;
                gameOverElement.style.display = 'block';
                playSound(gameOverSound);
    
    
              // Stop background music
              if (bgSound.isPlaying) {
                bgSound.stop();
              }
            } 
        }
        
    }

    if(movingLog){
        animateLog()
    }

    // Check collisions
    if (checkCollision(coin)) {
        score += goldGained;
        playSound(coinSound);
        if((score%100 >= 50 && (score-goldGained)%100 < 50) || (score%100 >= 0 && (score-goldGained)%100 > 50)){
            stage +=1;
            stageElement.innerHTML = `Stage: ${stage}`;
            obstacle_velocity = obstacle_velocity + 0.02;
            speed= obstacle_velocity*0.4;
        }
        if(score > 99){
            movingLog = true;
        }
        if(score > 174){
            enableVolcano = true;
            for(const volcano in volcanoes){
                volcano.position.z = Math.random()* 60 +20;
            }
        }
        if(score % 100 == 0){
            respawnToken(pUP);
        }
        scoreElement.innerHTML = `Score: ${score}`;
        respawnToken(coin);
    }



    if(checkCollision(speedBoostOrb)){
        speedBoost = true;
        speedBoostStart = time;
        console.log(time)
        obstacle_velocity = obstacle_velocity*2;
        respawnToken(speedBoostOrb, 300, 400);
    }

    if(speedBoost){
        let timeLeft = Math.ceil(speedBoostStart+10-time)
        changeTadpoleColor(0x800080);
        if (time - speedBoostStart >= 8) {
            // Blinking logic for the last 3 seconds
            let elapsedBlinkTime = Math.floor((time - speedBoostStart) * 6) % 2; // Toggles every 0.5 seconds
            if (elapsedBlinkTime === 0) {
                changeTadpoleColor(0x93DC5C); // Alternate color
            } else {
                changeTadpoleColor(0x800080); // Default boosted color
            }
        }
        if(time-speedBoostStart >= 10){
            changeTadpoleColor(0x93DC5C);
            obstacle_velocity = obstacle_velocity/2;
            speedBoost = false;
            console.log(time)
        }
    }

    if (checkCollision(pUP)){
        poweredUP = true;
        poweredUPStart = time;
        pUP.position.z = 15;
        playSound(powerUpSound);
    }

   

    if (poweredUP){
        powerElement.style.display = 'block'
        let timeLeft = Math.ceil(poweredUPStart+10-time)
        powerElement.innerHTML = `Power Up: ${timeLeft}`;
        if(time-poweredUPStart >= 10){
            poweredUP = false;
            powerElement.style.display = 'none'
        }
    }

    if(checkCollision(treasureChest)){
        respawnToken(treasureChest,100, 400);
        score = score += 40;
        if((score%100 >= 50 && (score-40)%100 < 50) || (score%100 >= 0 && (score-40)%100 > 50)){
            stage +=1;
            stageElement.innerHTML = `Stage: ${stage}`;
            obstacle_velocity = obstacle_velocity + 0.02;
            speed= obstacle_velocity*0.4;
        }   
        if(score > 99){
            movingLog = true;
        }  
        if(score > 174){
            enableVolcano = true;
        }
        goldGained = goldGained + 5;   
        scoreElement.innerHTML = `Score: ${score}`;
    }


    if (checkCollision(obstacle)|| playerY <= 0.5) {
        if(!poweredUP){
            gameOn = false;
            gameOverElement.style.display = 'block';
            playSound(gameOverSound);


          // Stop background music
          if (bgSound.isPlaying) {
            bgSound.stop();
          }
        } else{
            dissolving = true;

            // Log Breaking Sound
            if (!logBreakSound.isPlaying) {
                playSound(logBreakSound, 1000); //1 sec only
              }

        }
    }



    // Respawn objects when they pass the player
    if (coin.position.z > 10) respawnToken(coin);
    if (obstacle.position.z > 10) respawnObstacle();
    if (speedBoostOrb.position.z > 10) respawnToken(speedBoostOrb, 40, 400);
    if (treasureChest.position.z > 10) respawnToken(treasureChest,100, 500);

    //animate partcles
    animateParticles()

    animateGround()

    //ensure bounding box follows
    //treasureChestBox.setFromObject(treasureChest);

    renderer.render(scene, camera);
}

// ---- Initial Setup ----
respawnToken(coin);    // Initial coin spawn
respawnToken(speedBoostOrb, 20, 60); // Initial speed boost spawn
respawnObstacle(); // Initial obstacle spawn
animate();        // Start game loop
