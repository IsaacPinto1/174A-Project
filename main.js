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
    bgSound.play();
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
const MOVEMENT_SPEED = 0.05;    // Slower horizontal movement for underwater feel
const MAX_JUMPS = 3; // For mid-way jumps

//---Objects------
const STARTING_OBSTACLE_VELOCITY = 0.10;
let obstacle_velocity = STARTING_OBSTACLE_VELOCITY;
const COIN_VELOCITY = 0.1;
const PUP_VELOCITY = 0.05
const GROUND_LENGTH = 40;

// ---- Game Variables ----
let stage = 1;
let movingLog = false;
let poweredUP = false;
let poweredUPStart = null;


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

//-----Textures for ground-----------
//NOTES: Add Sliding Floor Texture??
const textureLoader = new THREE.TextureLoader();
const groundBase = textureLoader.load('/images/Sand_007_basecolor.jpg');
const groundNormal = textureLoader.load('/images/Sand_007_normal.jpg');

const logSideTexture = textureLoader.load('/images/wood_texture.jpg');
const logTipTexture = textureLoader.load('images/log_tip.jpg');

const coinTexture = textureLoader.load('images/coin.jpg');
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
//const coinMaterial = new THREE.MeshPhongMaterial({ color: 0xFFD700, specular: 0xFFFFFF, shininess: 200});
const coinMaterial = new THREE.MeshPhongMaterial({map: coinTexture});
let coin = new THREE.Mesh(coinGeometry, coinMaterial);
coin.rotation.x = Math.PI / 2;
scene.add(coin);


// ---- Power-up ----
const pUPGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.1, 32);
const pUPMaterial = new THREE.MeshPhongMaterial({ color: 0xFF0000, specular: 0xFFFFFF, shininess: 200});
let pUP = new THREE.Mesh(pUPGeometry, pUPMaterial);
pUP.rotation.x = Math.PI / 2;
pUP.position.z = 15;
scene.add(pUP);


// ---- Obstacle Texture ----
logSideTexture.wrapS = THREE.RepeatWrapping; //Horizontal Wrap
logSideTexture.wrapT = THREE.RepeatWrapping;
logSideTexture.repeat.set(2, 10);

// ---- Obstacle ----
const obstacleGeometry = new THREE.CylinderGeometry(0.5, 0.5, 15, 32);

const endObstacleMaterial = new THREE.MeshPhongMaterial({ map: logTipTexture});
const sideObstacleMaterial = new THREE.MeshPhongMaterial({map: logSideTexture});
let obstacle = new THREE.Mesh(obstacleGeometry, [sideObstacleMaterial, endObstacleMaterial, endObstacleMaterial]);
obstacle.rotation.z = Math.PI / 2;

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
function respawnToken(obj) {

    let zspawn = -(Math.random()*(17-13)+13);
    obj.position.set(
        (Math.random() - 0.5) * 10,  // Random X position
        1,                           // Fixed Y position
        zspawn              // Fixed initial Z position
    );
}

function respawnObstacle() {
    obstacle.visible = true;
    if(!movingLog){
        obstacle.position.set(
            (Math.random() - 0.5) * 10,  // Random X position
            1,                           // Fixed Y position
            INITIAL_SPAWN_Z - 5          // Fixed initial Z position, slightly behind coin
        );
    } else{
        obstacle.position.set(
            (Math.random() - 0.5) * 10,  // Random X position
            Math.random()*(5-0.5)+0.5,                           // Fixed Y position
            INITIAL_SPAWN_Z - 5          // Fixed initial Z position, slightly behind coin
        );
    }
}

// ---- Check for Collision with Tadpole ----
function checkCollision(obj) {
  if (obj === coin || obj === pUP) {
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
    score = 90;
    stage = 1;
    playerX = 0;
    playerY = 1;
    velocityY = 0;
    jumpsRemaining = MAX_JUMPS;
    gameOn = true;
    poweredUP = false;
    obstacle_velocity = STARTING_OBSTACLE_VELOCITY;
    movingLog = false;
    
    gameOverElement.style.display = 'none';
    powerElement.style.display = 'none';
    scoreElement.innerHTML = `Score: ${score}`;
    stageElement.innerHTML = `Stage: ${stage}`;
    
    // Reset object positions with fixed Z values
    respawnToken(coin);
    respawnObstacle();
    pUP.position.z = 15;
    
    tadpole.position.set(playerX, playerY, playerZ);

    //Restart Background Music if ended
    if (!bgSound.isPlaying) {
      bgSound.play();
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


// ---- Main Animation Loop ----
function animate() {
    requestAnimationFrame(animate);
    if (!gameOn) return;

    let time = clock.getElapsedTime();

    animateTail(time);
    animateBody(time);
    animateTadpoleBobbing(time);
    animateRippleEffect(time);
    animateTadpoleTilting();
    
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
    coin.position.z += obstacle_velocity;// COIN_VELOCITY;
    coin.rotation.z = time% 2*Math.PI;
    
    pUP.position.z += PUP_VELOCITY // PUP_VELOCITY;
    pUP.rotation.z = (time+1.234)%2*Math.PI;

    obstacle.position.z += obstacle_velocity;

    if(movingLog){
        animateLog()
    }

    // Check collisions
    if (checkCollision(coin)) {
        score += 10;
        playSound(coinSound);
        if(score%50 == 0){
            stage +=1;
            stageElement.innerHTML = `Stage: ${stage}`;
            obstacle_velocity = obstacle_velocity + 0.02;
            speed= obstacle_velocity*0.4;
        }
        if(score > 99){
            movingLog = true;
        }
        if(score % 100 == 0){
            respawnToken(pUP);
        }
        scoreElement.innerHTML = `Score: ${score}`;
        respawnToken(coin);
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
        console.log(poweredUP);
        if(time-poweredUPStart >= 10){
            poweredUP = false;
            powerElement.style.display = 'none'
        }
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
            obstacle.visible = false;

            // Log Breaking Sound
            if (!logBreakSound.isPlaying) {
              playSound(logBreakSound, 1000); //1 sec only
            }
        }
    }

    // Respawn objects when they pass the player
    if (coin.position.z > 10) respawnToken(coin);
    if (obstacle.position.z > 10) respawnObstacle();

    //animate partcles
    animateParticles()
    animateGround()

    renderer.render(scene, camera);
}

// ---- Initial Setup ----
respawnToken(coin);    // Initial coin spawn
respawnObstacle(); // Initial obstacle spawn
animate();        // Start game loop
