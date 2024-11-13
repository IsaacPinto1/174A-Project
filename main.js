import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

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

// ---- Camera ----
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(CAMERA_POS_X, CAMERA_POS_Y, CAMERA_POS_Z);

// ---- Renderer ----
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
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

// ------------------------
//          FINAL VALUES
//-----------------------

//---Physics---
const GRAVITY = -0.004;         // Much weaker gravity for floating effect
const WATER_RESISTANCE = 0.98;  // Slows down movement over time

//---Player---
const INITIAL_VELOCITY = 0.15; 
const MOVEMENT_SPEED = 0.03;    // Slower horizontal movement for underwater feel
const MAX_JUMPS = 3; // For mid-way jumps

//---Objects------
const OBSTACLE_VELOCITY = 0.1;
const COIN_VELOCITY = 0.1;



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
const gameOverElement = document.getElementById('gameOver');

//-----Textures for ground-----------
//NOTES: Add Sliding Floor Texture??
const textureLoader = new THREE.TextureLoader();
const groundBase = textureLoader.load('/images/Sand_007_basecolor.jpg');
const groundNormal = textureLoader.load('/images/Sand_007_normal.jpg');

// ---- Plane Geometry for Ground ----

//GROUND
const groundGeometry = new THREE.PlaneGeometry(20, 40);
//const groundMaterial = new THREE.MeshPhongMaterial({ color: 0x808080 });
const groundMaterial = new THREE.MeshStandardMaterial({ map: groundBase, normalMap: groundNormal });
const floor = new THREE.Mesh(groundGeometry, groundMaterial);
floor.rotation.x = -Math.PI / 2;
floor.position.y = 0;
scene.add(floor);

//SideBanks
const sideGeometry = new THREE.PlaneGeometry(20, 40);
const leftBank = new THREE.Mesh(groundGeometry, groundMaterial);
leftBank.rotation.x = -Math.PI / 2;
leftBank.position.x =19;
leftBank.rotation.y = -0.3; 
leftBank.position.y = 3;
scene.add(leftBank);

const rightBank = new THREE.Mesh(groundGeometry, groundMaterial);
rightBank.rotation.x = -Math.PI / 2;
rightBank.position.x =-19;
rightBank.rotation.y = 0.3; 
rightBank.position.y = 3;
scene.add(rightBank);



// ---- Tadpole Geometry ----
const tadpoleGeometry = new THREE.SphereGeometry(0.5, 16, 16);
const tadpoleMaterial = new THREE.MeshPhongMaterial({ color: 0x008719, specular: 0xFFFFFF, shininess: 10 });
const tadpole = new THREE.Mesh(tadpoleGeometry, tadpoleMaterial);
scene.add(tadpole);

// ---- Coin Geometry ----
const coinGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.1, 32);
const coinMaterial = new THREE.MeshPhongMaterial({ color: 0xFFD700, specular: 0xFFFFFF, shininess: 200});
let coin = new THREE.Mesh(coinGeometry, coinMaterial);
coin.rotation.x = Math.PI / 2;
scene.add(coin);

// ---- Obstacle Geometry ----
const obstacleGeometry = new THREE.BoxGeometry(15, 0.5, 0.5);
const obstacleMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 });
let obstacle = new THREE.Mesh(obstacleGeometry, obstacleMaterial);
scene.add(obstacle);
//------Water fog---------
scene.fog = new THREE.Fog(0x328dbf, -2, 33); // Dark blue fog color for underwater effect
const fogAmbientLight = new THREE.AmbientLight(0x334d5c, 0.6); // Soft blue ambient light
scene.add(ambientLight);

const fogDirectionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight.position.set(5, 10, 5);
scene.add(directionalLight);

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

// ---- Respawn Functions with Fixed Z Position ----
function respawnCoin() {
    coin.position.set(
        (Math.random() - 0.5) * 10,  // Random X position
        1,                           // Fixed Y position
        INITIAL_SPAWN_Z              // Fixed initial Z position
    );
}

function respawnObstacle() {
    obstacle.position.set(
        (Math.random() - 0.5) * 10,  // Random X position
        1,                           // Fixed Y position
        INITIAL_SPAWN_Z - 5          // Fixed initial Z position, slightly behind coin
    );
}

// ---- Check for Collision with Tadpole ----
function checkCollision(obj) {
  if (obj === coin) {
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
  }
  return false;
}
// ---- Restart Game Function ----
function restartGame() {
    score = 0;
    playerX = 0;
    playerY = 1;
    velocityY = 0;
    jumpsRemaining = MAX_JUMPS;
    gameOn = true;
    
    gameOverElement.style.display = 'none';
    scoreElement.innerHTML = `Score: ${score}`;
    
    // Reset object positions with fixed Z values
    respawnCoin();
    respawnObstacle();
    
    tadpole.position.set(playerX, playerY, playerZ);
}

//------Animate Particles----
function animateParticles() {
    const positions = particleSystem.geometry.attributes.position.array;
    for (let i = 0; i < particleCount; i++) {
        positions[i * 3] += (Math.random() - 0.5) * 0.01; // Random X movement
        positions[i * 3 + 1] += (Math.random() - 0.5) * 0.01; // Random Y movement
        positions[i * 3 + 2] += (Math.random() * 0.01 - 0.005) + OBSTACLE_VELOCITY;
        if(positions[i * 3 + 2]>10){
            positions[i * 3 + 2] = -10;
        }
    }
    particleSystem.geometry.attributes.position.needsUpdate = true;
}


// ---- Main Animation Loop ----
function animate() {
    requestAnimationFrame(animate);
    if (!gameOn) return;

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

    // Update tadpole position
    tadpole.position.set(playerX, playerY, playerZ);

    // Move objects
    coin.position.z += COIN_VELOCITY;
    obstacle.position.z += OBSTACLE_VELOCITY;

    // Check collisions
    if (checkCollision(coin)) {
        score += 10;
        scoreElement.innerHTML = `Score: ${score}`;
        respawnCoin();
    }

    if (checkCollision(obstacle) || playerY <= 0.5) {
        gameOn = false;
        gameOverElement.style.display = 'block';
    }

    // Respawn objects when they pass the player
    if (coin.position.z > 5) respawnCoin();
    if (obstacle.position.z > 5) respawnObstacle();

    //animate partcles
    animateParticles()

    renderer.render(scene, camera);
}

// ---- Initial Setup ----
respawnCoin();    // Initial coin spawn
respawnObstacle(); // Initial obstacle spawn
animate();        // Start game loop