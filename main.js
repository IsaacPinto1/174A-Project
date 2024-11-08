import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { mx_bilerp_0 } from 'three/src/nodes/materialx/lib/mx_noise.js';
import { PI } from 'three/webgpu';


const CAMERA_POS_X = 0;
const CAMERA_POS_Y = 5;
const CAMERA_POS_Z = -7;

const CAMERA_TARGET_X = 0;
const CAMERA_TARGET_Y = 0;
const CAMERA_TARGET_Z = 0;


function translationMatrix(tx, ty, tz) {
	return new THREE.Matrix4().set(
		1, 0, 0, tx,
		0, 1, 0, ty,
		0, 0, 1, tz,
		0, 0, 0, 1
	);
}

function rotationMatrixX(theta) {
    return new THREE.Matrix4().set(
        1, 0, 0, 0,
        0, Math.cos(theta), -Math.sin(theta), 0,
        0, Math.sin(theta), Math.cos(theta), 0,
        0, 0, 0, 1
    );
}

function rotationMatrixY(theta) {
    return new THREE.Matrix4().set(
        Math.cos(theta), 0, Math.sin(theta), 0,
        0, 1, 0, 0,
        -Math.sin(theta), 0, Math.cos(theta), 0,
        0, 0, 0, 1
    );
}

function rotationMatrixZ(theta) {
	return new THREE.Matrix4().set(
		Math.cos(theta), -Math.sin(theta), 0, 0,
		Math.sin(theta),  Math.cos(theta), 0, 0,
		0, 0, 1, 0,
		0, 0, 0, 1
	);
}

function scalingMatrix(sx, sy, sz) {
  return new THREE.Matrix4().set(
    sx, 0, 0, 0,
		0, sy, 0, 0,
		0, 0, sz, 0,
		0, 0, 0, 1
  );
}


const scene = new THREE.Scene();

//THREE.PerspectiveCamera( fov angle, aspect ratio, near depth, far depth );
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 100 );

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

const controls = new OrbitControls(camera, renderer.domElement);
camera.position.set(CAMERA_POS_X, CAMERA_POS_Y, CAMERA_POS_Z);
controls.target.set(CAMERA_TARGET_X, CAMERA_TARGET_Y, CAMERA_TARGET_Z);

// Rendering 3D axis
const createAxisLine = (color, start, end) => {
    const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
    const material = new THREE.LineBasicMaterial({ color: color });
    return new THREE.Line(geometry, material);
};
const xAxis = createAxisLine(0xff0000, new THREE.Vector3(0, 0, 0), new THREE.Vector3(3, 0, 0)); // Red
const yAxis = createAxisLine(0x00ff00, new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 3, 0)); // Green
const zAxis = createAxisLine(0x0000ff, new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 3)); // Blue
scene.add(xAxis);
scene.add(yAxis);
scene.add(zAxis);


const pointLight = new THREE.PointLight(0xffffff, 100, 100);
pointLight.position.set(5, 5, 5); // Position the light
scene.add(pointLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(0.5, .0, 1.0).normalize();
scene.add(directionalLight);

const ambientLight = new THREE.AmbientLight(0x505050);  // Soft white light
scene.add(ambientLight);

const phong_material = new THREE.MeshPhongMaterial({
    color: 0x00ff00, // Green color
    shininess: 100   // Shininess of the material
});


// Start here.

const l = 0.5
const positions = new Float32Array([
    // Front face
    -l, -l,  l, // 0
     l, -l,  l, // 1
     l,  l,  l, // 2
    -l,  l,  l, // 3

    // Left face
    -l, -l, -l, // 4
    -l, -l,  l, // 5
    -l,  l,  l, // 6 
    -l,  l, -l, // 7
  
    // Top face
    -l, l, l, //8
    l,l,l, //9
    l,l,-l, // 10
    -l,l,-l, // 11
  
    // Bottom face
    -l,-l,-l, // 12
    l,-l,-l, // 13
    l,-l,l, //14
    -l,-l,l, //15
  
    // Right face
    l, -l, l, // 16
    l, -l,  -l, // 17
    l,  l,  -l, // 18
    l,  l, l, // 19

    // Back face
        l, -l, -l, // 20
      -l, -l, -l, // 21
      -l,  l, -l, // 22
        l,  l, -l, // 23
  ]);
  
const wireframe_vertices = new Float32Array([
  // Front face
      -l, -l, l, // 0
      l, -l, l, // 1
      l, -l, l, // 1
      l, l, l,// 2
      l, l, l, // 2
      -l, l, l, // 3
      -l, l, l, // 3
      -l, -l, l, // 0



  // Left face
  -l, -l, -l, // 4
  -l, -l,  l, // 5
  -l, -l,  l, // 5
  -l,  l,  l, // 6
  -l,  l,  l, // 6  
  -l,  l, -l, // 7
  -l,  l, -l, // 7
  -l, -l, -l, // 4

  // Top face
  -l, l, l, //8
  l,l,l, //9
  l,l,l, //9
  l,l,-l, // 10
  l,l,-l, // 10
  -l,l,-l, // 11
  -l,l,-l, // 11
  -l, l, l, //8

  // Bottom face
  -l,-l,-l, // 12
  l,-l,-l, // 13
  l,-l,-l, // 13
  l,-l,l, //14
  l,-l,l, //14
  -l,-l,l, //15
  -l,-l,l, //15
  -l,-l,-l, // 12

  // Right face
  l, -l, l, // 16
  l, -l,  -l, // 17
  l, -l,  -l, // 17
  l,  l,  -l, // 18
  l,  l,  -l, // 18
  l,  l, l, // 19
  l,  l, l, // 19
  l, -l, l, // 16

  // Back face
      l, -l, -l, // 20
    -l, -l, -l, // 21
    -l, -l, -l, // 21
    -l,  l, -l, // 22
    -l,  l, -l, // 22
      l,  l, -l, // 23
      l,  l, -l, // 23
      l, -l, -l, // 20
]);

  const indices = [
    // Front face
    0, 1, 2,
    0, 2, 3,
  
    // Left face
    4, 5, 6,
    4, 6, 7,
  
    // Top face
    8,9,10,
    8,10,11,
  
    // Bottom face
    12,13,14,
    12,14,15,
  
    // Right face
    16,17,18,
    16,18,19,

    // Back face
    20,21,22,
    20,22,23,
  ];
  
  // Compute normals
  const normals = new Float32Array([
    // Front face
    0, 0, 1,
    0, 0, 1,
    0, 0, 1,
    0, 0, 1,
  
    // Left face
    -1, 0, 0,
    -1, 0, 0,
    -1, 0, 0,
    -1, 0, 0,
  
    // Top face
    0,1,0,
    0,1,0,
    0,1,0,
    0,1,0,
  
    // Bottom face
    0,-1,0,
    0,-1,0,
    0,-1,0,
    0,-1,0,
  
    // Right face
    1,0,0,
    1,0,0,
    1,0,0,
    1,0,0,

    // Back face
    0, 0, -1,
    0, 0, -1,
    0, 0, -1,
    0, 0, -1,
  ]);

const custom_cube_geometry = new THREE.BufferGeometry();
custom_cube_geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
custom_cube_geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
custom_cube_geometry.setIndex(new THREE.BufferAttribute(new Uint16Array(indices), 1));

const wireframe_geometry = new THREE.BufferGeometry();
wireframe_geometry.setAttribute( 'position', new THREE.BufferAttribute( wireframe_vertices, 3 ) );



const planeGeometry = new THREE.PlaneGeometry(20, 20); // 100x100 units, adjust size as needed
const planeMaterial = new THREE.MeshPhongMaterial({
    color: 0x808080, // Grey color
    //roughness: 0.8,  // High roughness for a more matte look
    metalness: 0.0   // No metalness for a simple floor
});

// Create the plane mesh and rotate it to be horizontal
const floor = new THREE.Mesh(planeGeometry, planeMaterial);
floor.rotation.x = -Math.PI / 2; // Rotate to lie flat
floor.position.y = 0; // Set the floor's Y position to 0, or slightly below the cube's start position

// Add shadow properties if using shadows
// Add the floor to the scene
scene.add(floor);




let cubes = [];
let wires = [];
const NUMB_CUBES = 1;
for (let i = 0; i < NUMB_CUBES; i++) {
  let line = new THREE.LineSegments( wireframe_geometry );
	let cube = new THREE.Mesh(custom_cube_geometry, phong_material);
	cube.matrixAutoUpdate = false;
  line.matrixAutoUpdate = false;
  line.visible = false;
	cubes.push(cube);
  wires.push(line);
	scene.add(cube);
  scene.add(line);
}



const clock = new THREE.Clock();
let isJumping = false;
let jumpStartTime = 0;
const GRAVITY = 9.8;         // Custom gravity value, adjust as desired
const jumpVelocity = 5;      // Initial jump velocity in units per second
let currentHeight = 0;       // Current height of the cube

let moveSpeed = 0.03;
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;

let playerX = 0;
let playerY = l;
let playerZ = 0;



let still = false;


window.addEventListener('keydown', onKeyPress); // onKeyPress is called each time a key is pressed
window.addEventListener('keyup', onKeyUp);

function onKeyUp(event){
  switch (event.key) {
    case 'w':
    case 'ArrowUp':
        moveForward = false;
        break;

    case 's':
    case 'ArrowDown':
        moveBackward = false;
        break;

    case 'a':
    case 'ArrowLeft':
        moveLeft = false;
        break;

    case 'd':
    case 'ArrowRight':
        moveRight = false;
        break;
}
}

// Function to handle keypress
function onKeyPress(event) {
    switch (event.key) {
        case 'e':
          for (let i = 0; i < NUMB_CUBES; i++){
              wires[i].visible = !wires[i].visible;
              cubes[i].visible = !cubes[i].visible;
          }
          break;
        case 'j': // Jump with "j"
        case ' ': // Also jump with "Arrow Up"
            if (!isJumping) {
                isJumping = true;
                jumpStartTime = clock.getElapsedTime();
                currentHeight = l; // Reset height to ground level
            }
            break;

        case 'w': // Forward (positive z)
        case 'ArrowUp': // Forward (positive z)
            moveForward = true;
            break;

        case 's': // Backward (negative z)
        case 'ArrowDown': // Backward (negative z)
            moveBackward = true;
            break;

        case 'a': // Left (positive x)
        case 'ArrowLeft': // Left (positive x)
            moveLeft = true;
            break;

        case 'd': // Right (negative x)
        case 'ArrowRight': // Right (negative x)
            moveRight = true;
            break;

        default:
            console.log(`Key ${event.key} pressed`);
    }
}

function animate() {

  // Update X and Z position based on movement flags
  if (moveForward) playerZ += moveSpeed;
  if (moveBackward) playerZ -= moveSpeed;
  if (moveLeft) playerX += moveSpeed;
  if (moveRight) playerX -= moveSpeed;

  // Update Y position based on jump logic
  if (isJumping) {
      let elapsedTime = clock.getElapsedTime() - jumpStartTime;
      let height = l+jumpVelocity*elapsedTime - GRAVITY * Math.pow(elapsedTime, 2) / 2;

      // If the jump is complete (reached or below ground level)
      if (height <= l) {
          isJumping = false;
          playerY = l;
      } else {
          playerY = height;
      }
  }

  // Combine the separate transformations into one matrix

  // Apply the transformations in sequence
  let combinedMatrix = new THREE.Matrix4()
      .multiply(translationMatrix(playerX, playerY, playerZ))

  cubes[0].matrix.copy(combinedMatrix);
  cubes[0].matrixAutoUpdate = false;

  renderer.render(scene, camera);

    
	renderer.render( scene, camera );
  controls.update();



}
renderer.setAnimationLoop( animate );

// TODO: Add event listener