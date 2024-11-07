import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { mx_bilerp_0 } from 'three/src/nodes/materialx/lib/mx_noise.js';
import { PI } from 'three/webgpu';


const scene = new THREE.Scene();

//THREE.PerspectiveCamera( fov angle, aspect ratio, near depth, far depth );
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

const controls = new OrbitControls(camera, renderer.domElement);
camera.position.set(0, 5, 10);
controls.target.set(0, 5, 0);

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


// ***** Assignment 2 *****
// Setting up the lights
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


// TODO: Implement wireframe geometry


function translationMatrix(tx, ty, tz) {
	return new THREE.Matrix4().set(
		1, 0, 0, tx,
		0, 1, 0, ty,
		0, 0, 1, tz,
		0, 0, 0, 1
	);
}

function rotationMatrixZ(theta) {
	return new THREE.Matrix4().set(
    Math.cos(theta), -Math.sin(theta), 0, 0,
    Math.sin(theta), Math.cos(theta), 0, 0,
    0,              0,              1, 0,
    0,              0,              0, 1,
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
// TODO: Implement the other transformation functions.


let cubes = [];
let wires = [];
const NUMB_CUBES = 7;
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

// TODO: Transform cubes

let animation_time = 0;
let delta_animation_time;
let rotation_angle;
const clock = new THREE.Clock();

const MAX_ANGLE = 20 * Math.PI/180; // 20 degrees converted to radians
const T = 3 // oscilation persiod in seconds



let still = false;
let wire_vis = false;
window.addEventListener('keydown', onKeyPress); // onKeyPress is called each time a key is pressed
// Function to handle keypress
function onKeyPress(event) {
    switch (event.key) {
        case 's': // Note we only do this if s is pressed.
            still = !still;
            if(still){
              clock.stop();
            } else{
              clock.start();
            }
            break;
        case 'w':
          for (let i = 0; i < NUMB_CUBES; i++){
              wires[i].visible = !wires[i].visible;
              cubes[i].visible = !cubes[i].visible;
          }

        default:
            console.log(`Key ${event.key} pressed`);
    }
}

function animate() {
    
	renderer.render( scene, camera );
    controls.update();

  delta_animation_time = clock.getDelta();
  animation_time += delta_animation_time; 
  if(still){
    rotation_angle = MAX_ANGLE;
  } else{
    rotation_angle = MAX_ANGLE/2+(MAX_ANGLE/2)*Math.sin((2*Math.PI/T)*(animation_time+T/4));
    delta_animation_time = clock.getDelta();
    animation_time += delta_animation_time; 
  };

  const rotate = rotationMatrixZ(rotation_angle);
  const sx = 1
  const sy = 1.5
  const sz = 1
  const translation = translationMatrix(0, 2*l*sy, 0); // Translate 2l units in the y direction
  const to_origin = translationMatrix(l, l*sy, 0);
  //const rotate = rotationMatrixZ(Math.PI*20/180);
  const back_to_start = translationMatrix(-l,-l*sy, 0);
  const scale = scalingMatrix(sx, sy, sz)
  let model_transformation = new THREE.Matrix4(); // model transformation matrix we will update
  
  // Apply transformations
  model_transformation.multiplyMatrices(scale,model_transformation);
  for (let i = 0; i < cubes.length; i++) {
    cubes[i].matrix.identity().multiply(model_transformation)//.multiply(scale);
    wires[i].matrix.identity().multiply(model_transformation)
    //cubes[i].matrix.copy(model_transformation);
    model_transformation.multiplyMatrices(to_origin,model_transformation);
    model_transformation.multiplyMatrices(rotate,model_transformation);
    model_transformation.multiplyMatrices(back_to_start,model_transformation);
    model_transformation.multiplyMatrices(translation,model_transformation);
  }

}
renderer.setAnimationLoop( animate );

// TODO: Add event listener