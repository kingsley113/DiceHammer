import * as THREE from "three";
import * as CANNON from "cannon-es";
import { MapControls } from "three/examples/jsm/controls/OrbitControls.js";

const canvas = document.querySelector("#canvas");
const rollBtn = document.querySelector(".roll");
const container = document.querySelector(".content");

let renderer, camera, scene, orbit, diceMesh, physicsWorld;

const params = {
  diceCount: 5,
  gravityStrength: 50,
  diceRestitution: 0.5, // dice 'bounciness'
  diceThrowForce: 10,
  dimpleRadius: 0.12,
  dimpleDepth: 0.1,
  segments: 50,
  edgeRadius: 0.07,
  pauseSimulation: false,
};

const diceArray = [];

// testing geometry for debugging
const testGeometry = new THREE.BoxGeometry(1, 1, 1);
const testMaterial = new THREE.MeshStandardMaterial({
  color: 0x44aa88,
});
const testCube = new THREE.Mesh(testGeometry, testMaterial);
testCube.castShadow = true;

initPhysics();
initScene();

// SCENE SETUP*****************************************************************
function initScene() {
  renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    canvas,
  });

  renderer.setClearColor("#fff1e6");
  renderer.shadowMap.enabled = true; //enable the shadows for the scene, disabled by default

  camera = new THREE.PerspectiveCamera(
    45,
    canvas.clientWidth / canvas.clientHeight,
    0.1,
    300
  );

  camera.position.set(0, 0.5, 4).multiplyScalar(7); //use this to set x, y, z axis

  scene = new THREE.Scene();

  scene.add(testCube);
  // *************

  // LIGHTING******************************************************************
  // const dirLight = new THREE.DirectionalLight(0xffffff, 1);
  // dirLight.position.set(-1, 2, 4);
  // scene.add(dirLight);

  const topLight = new THREE.DirectionalLight(0xffffff, 1);
  topLight.position.set(10, 15, 0);
  topLight.castShadow = true;
  topLight.shadow.mapSize.width = 2048;
  topLight.shadow.mapSize.height = 2048;
  topLight.shadow.camera.near = 5;
  topLight.shadow.camera.far = 400;
  scene.add(topLight);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  // ORBIT*********************************************************************
  orbit = new MapControls(camera, canvas);
  orbit.enableDamping = true;
  orbit.dampingFactor = 0.025;

  createFloor();

  render();
}

// PHYSICS SETUP***************************************************************
function initPhysics() {
  physicsWorld = new CANNON.World({
    allowSleep: true,
    gravity: new CANNON.Vec3(0, -params.gravityStrength, 0),
  });
  physicsWorld.defaultContactMaterial.restitution = params.diceRestitution;
}

// FLOOR***********************************************************************
function createFloor() {
  // Visible Floor
  const floorGeom = new THREE.PlaneGeometry(1000, 1000);
  const floorMat = new THREE.ShadowMaterial({ opacity: 0.1 });

  const floor = new THREE.Mesh(floorGeom, floorMat);
  floor.receiveShadow = true;
  floor.position.y = -7;
  floor.rotation.x = -0.5 * Math.PI;
  scene.add(floor);

  // Physics Floor
  const floorBody = new CANNON.Body({
    type: CANNON.Body.STATIC,
    shape: new CANNON.Plane(),
  });
  floorBody.position.copy(floor.position);
  floorBody.quaternion.copy(floor.quaternion);
  physicsWorld.addBody(floorBody);
}

// RENDER**********************************************************************
function render(time) {
  time *= 0.001;

  testCube.rotation.x = time;
  testCube.rotation.y = time;

  renderer.render(scene, camera);

  if (resizeRendererToDisplaySize(renderer)) {
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
    console.log("needs resizing");
  }

  orbit.update(); //call update after everytime we change position of camera

  requestAnimationFrame(render);
}
requestAnimationFrame(render);

function resizeRendererToDisplaySize(renderer) {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const needResize = canvas.width !== width || canvas.height !== height;
  if (needResize) {
    renderer.setSize(width, height, false);
  }
  return needResize;
}

function updateSceneSize() {
  camera.aspect = canvas.clientWidth / canvas.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);
}
