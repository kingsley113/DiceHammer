/*
import * as THREE from "three";
import * as CANNON from "cannon-es";
import {
  MapControls,
  OrbitControls,
} from "three/examples/jsm/controls/OrbitControls.js";
import * as BufferGeometryUtils from "three/examples/jsm/utils/BufferGeometryUtils";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"; //needed for 3d model import
*/

import * as THREE from "https://unpkg.com/three@0.150.1/build/three.module.js";
import * as CANNON from "https://unpkg.com/cannon-es@0.20.0/dist/cannon-es.js";
import {
  MapControls,
  OrbitControls,
} from "https://unpkg.com/three@0.150.1/examples/jsm/controls/OrbitControls.js";
import * as BufferGeometryUtils from "https://unpkg.com/three@0.150.1/examples/jsm/utils/BufferGeometryUtils";
import { GLTFLoader } from "https://unpkg.com/three@0.150.1/examples/jsm/loaders/GLTFLoader.js"; //needed for 3d model import

import CannonDebugger from "cannon-es-debugger";
import { Vec3 } from "cannon-es";

// DICE TRAY MODEL*************************************************************
const trayUrl = new URL("../assets/diceTray.glb", import.meta.url);

// UI ELEMENTS*****************************************************************
const canvas = document.querySelector("#canvas");
const scoreResult = document.querySelector("#score-result");
const loadText = document.querySelector("#load-progress-text");
const helpModal = document.querySelector("#help-modal-container");

const rollBtn = document.querySelector(".roll");
const decreaseDiceBtn = document.querySelector("#dice-decrease");
const increaseDiceBtn = document.querySelector("#dice-increase");
const decreaseDiceBtnx5 = document.querySelector("#dice-decrease-5");
const increaseDiceBtnx5 = document.querySelector("#dice-increase-5");
const diceCounter = document.querySelector("#dice-count");
const rerollSelectedDiceBtn = document.querySelector("#reroll-selected-dice");
const selectCockedDiceBtn = document.querySelector("#select-cocked-dice");
const deselectDiceBtn = document.querySelector("#deselect-dice");
const select1sBtn = document.querySelector("#select-1s");
const select2sBtn = document.querySelector("#select-2s");
const select3sBtn = document.querySelector("#select-3s");
const select4sBtn = document.querySelector("#select-4s");
const select5sBtn = document.querySelector("#select-5s");
const select6sBtn = document.querySelector("#select-6s");

const roll1UpBtn = document.querySelector("#roll-1up");
const roll2UpBtn = document.querySelector("#roll-2up");
const roll3UpBtn = document.querySelector("#roll-3up");
const roll4UpBtn = document.querySelector("#roll-4up");
const roll5UpBtn = document.querySelector("#roll-5up");
const roll6UpBtn = document.querySelector("#roll-6up");

const rollSelectedDiceBtn = document.querySelector("#roll-selected-dice");

const d1RollCount = document.querySelector("#d1-count");
const d2RollCount = document.querySelector("#d2-count");
const d3RollCount = document.querySelector("#d3-count");
const d4RollCount = document.querySelector("#d4-count");
const d5RollCount = document.querySelector("#d5-count");
const d6RollCount = document.querySelector("#d6-count");
const d1RunTotal = document.querySelector("#d1-run-total");
const d2RunTotal = document.querySelector("#d2-run-total");
const d3RunTotal = document.querySelector("#d3-run-total");
const d4RunTotal = document.querySelector("#d4-run-total");
const d5RunTotal = document.querySelector("#d5-run-total");
const d6RunTotal = document.querySelector("#d6-run-total");
const totalScore = document.querySelector("#total-score-text");

const helpBtn = document.querySelector("#help-btn");

rollBtn.addEventListener("click", throwDice);

decreaseDiceBtn.addEventListener("click", removeDice);
increaseDiceBtn.addEventListener("click", addDice);
decreaseDiceBtnx5.addEventListener("click", (e) => {
  removeNDice(5);
});
increaseDiceBtnx5.addEventListener("click", (e) => {
  addNDice(5);
});
rerollSelectedDiceBtn.addEventListener("click", rerollSelectedDice);
selectCockedDiceBtn.addEventListener("click", selectCockedDice);
deselectDiceBtn.addEventListener("click", deselectAllDice);

select1sBtn.addEventListener("click", (e) => {
  selectNDiceNumber(1);
});
select2sBtn.addEventListener("click", (e) => {
  selectNDiceNumber(2);
});
select3sBtn.addEventListener("click", (e) => {
  selectNDiceNumber(3);
});
select4sBtn.addEventListener("click", (e) => {
  selectNDiceNumber(4);
});
select5sBtn.addEventListener("click", (e) => {
  selectNDiceNumber(5);
});
select6sBtn.addEventListener("click", (e) => {
  selectNDiceNumber(6);
});

roll1UpBtn.addEventListener("click", (e) => {
  rollNPlusDice(1);
});
roll2UpBtn.addEventListener("click", (e) => {
  rollNPlusDice(2);
});
roll3UpBtn.addEventListener("click", (e) => {
  rollNPlusDice(3);
});
roll4UpBtn.addEventListener("click", (e) => {
  rollNPlusDice(4);
});
roll5UpBtn.addEventListener("click", (e) => {
  rollNPlusDice(5);
});
roll6UpBtn.addEventListener("click", (e) => {
  rollNPlusDice(6);
});

rollSelectedDiceBtn.addEventListener("click", rollSelectedDice);

helpBtn.addEventListener("click", toggleHelpModal);

// PARAMETERS******************************************************************
let renderer, camera, scene, orbit, diceMesh, physicsWorld;
let cannonDebugger;

const params = {
  diceCount: 20,
  gravityStrength: 80,
  diceRestitution: 0.45, // dice 'bounciness'
  diceThrowForce: 10,
  dimpleRadius: 0.16,
  dimpleDepth: 0.1,
  segments: 50,
  edgeRadius: 0.1,
  isPaused: true,
  // diceSurfaceColor: 0xeeeeee,
  diceSurfaceColor: 0xf0edc7,
  diceDimpleColor: 0x000000,
  diceSelectedColor: 0xe0115f,
  trayColor: 0xff0000,
  diceSpawnHeight: 30,
};

const trayParams = {
  trayWidth: 30.5,
  trayHeight: 20.5,
  trayDepth: 3,
};

let diceArray = [];
let rollResults = [0, 0, 0, 0, 0, 0];

const selectedDice = new Set();
const mousePosition = new THREE.Vector2();
const rayCaster = new THREE.Raycaster();

initPhysics();
initScene();

// SCENE SETUP*****************************************************************
function initScene() {
  renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    canvas,
  });

  renderer.setClearColor(0x04011c, 0);

  // renderer.setClearColor("#fff1e6");
  renderer.shadowMap.enabled = true; //enable the shadows for the scene, disabled by default
  // renderer.toneMapping = THREE.ACESFilmicToneMapping;
  // renderer.toneMapping = THREE.ReinhardToneMapping;
  renderer.toneMapping = THREE.LinearToneMapping;
  // renderer.toneMapping = THREE.CineonToneMapping;
  // renderer.toneMappingExposure = 1.5;
  renderer.outputEncoding = THREE.sRGBEncoding;

  camera = new THREE.PerspectiveCamera(
    18,
    canvas.clientWidth / canvas.clientHeight,
    0.1,
    3000
  );

  camera.position.set(0, 12, 5).multiplyScalar(7); //use this to set x, y, z axis

  scene = new THREE.Scene();

  // LIGHTING******************************************************************
  createLights();

  // ORBIT*********************************************************************
  // orbit = new MapControls(camera, canvas);
  orbit = new OrbitControls(camera, canvas);
  orbit.enableDamping = true;
  orbit.dampingFactor = 0.025;
  orbit.enableZoom = false;
  orbit.enablePan = false;
  orbit.maxAzimuthAngle = 0.01 * Math.PI;
  orbit.minAzimuthAngle = -0.01 * Math.PI;
  orbit.maxPolarAngle = 0.12 * Math.PI;
  orbit.minPolarAngle = 0.1 * Math.PI;

  // createFloor();
  createDiceTray();

  // Create the dice
  diceMesh = createDiceMesh();
  for (let i = 0; i < params.diceCount; i++) {
    diceArray.push(createDice());
    addDiceEvents(diceArray[i]);
  }

  renderer.domElement.addEventListener("click", selectDice, false);

  // throwDice();

  // Debugging
  // cannonDebugger = new CannonDebugger(scene, physicsWorld);

  updateLoadingSplashScreen(0);
  loadDiceTrayModel();

  render();
  updateDiceCountUI();
  showRollResults();
}

// PHYSICS SETUP***************************************************************
function initPhysics() {
  physicsWorld = new CANNON.World({
    allowSleep: true,
    gravity: new CANNON.Vec3(0, -params.gravityStrength, 0),
  });
  physicsWorld.defaultContactMaterial.restitution = params.diceRestitution;
}

// START THE SCENE*************************************************************
function startScene() {
  params.isPaused = false;
  throwDice();
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

// LIGHTING********************************************************************
function createLights() {
  const topLight = new THREE.DirectionalLight(0xffffff, 0.1);
  topLight.position.set(0, 15, 0);
  topLight.castShadow = true;
  topLight.shadow.radius = 2;
  topLight.shadow.blurSamples = 25;
  topLight.shadow.mapSize.width = 2048;
  topLight.shadow.mapSize.height = 2048;
  topLight.shadow.camera.near = 5;
  topLight.shadow.camera.far = 400;
  topLight.shadow.camera.top = trayParams.trayHeight / 2 + 1;
  topLight.shadow.camera.bottom = -trayParams.trayHeight / 2 - 1;
  topLight.shadow.camera.left = -trayParams.trayWidth / 2 - 1;
  topLight.shadow.camera.right = trayParams.trayWidth / 2 + 1;
  // scene.add(topLight);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.05);
  // scene.add(ambientLight);

  const pointLightTemplate = new THREE.SpotLight(0xffffff, 0.25);
  // pointLightTemplate.position.set(-25, 20, -25);
  pointLightTemplate.castShadow = true;
  pointLightTemplate.shadow.radius = 3;
  pointLightTemplate.shadow.blurSamples = 20;
  pointLightTemplate.shadow.mapSize.width = 2048;
  pointLightTemplate.shadow.mapSize.height = 2048;
  pointLightTemplate.shadow.camera.near = 5;
  pointLightTemplate.shadow.camera.far = 400;
  // pointLightTemplate.shadow.camera.top = trayParams.trayHeight / 2 + 1;
  // pointLightTemplate.shadow.camera.bottom = -trayParams.trayHeight / 2 - 1;
  // pointLightTemplate.shadow.camera.left = -trayParams.trayWidth / 2 - 1;
  // pointLightTemplate.shadow.camera.right = trayParams.trayWidth / 2 + 1;
  pointLightTemplate.shadow.camera.top = 30;
  pointLightTemplate.shadow.camera.bottom = -30;
  pointLightTemplate.shadow.camera.left = -30;
  pointLightTemplate.shadow.camera.right = 30;

  const pointLightCool1 = pointLightTemplate.clone(); // Top Left
  pointLightCool1.color = new THREE.Color(0x3300ff);
  pointLightCool1.position.set(-20, 30, -25); // x, z, y
  scene.add(pointLightCool1);

  const pointLightCool2 = pointLightTemplate.clone(); // Center Left
  pointLightCool2.color = new THREE.Color(0x29105e);
  pointLightCool2.position.set(-25, 30, 0);
  scene.add(pointLightCool2);

  const pointLightCool3 = pointLightTemplate.clone(); // Bottom Left
  pointLightCool3.color = new THREE.Color(0x1d63ff);
  pointLightCool3.position.set(-20, 30, 25);
  scene.add(pointLightCool3);

  const pointLightWarm1 = pointLightTemplate.clone(); // Top Right
  pointLightWarm1.color = new THREE.Color(0xff721f);
  pointLightWarm1.position.set(20, 30, -25);
  scene.add(pointLightWarm1);

  const pointLightWarm2 = pointLightTemplate.clone(); // Center Right
  pointLightWarm2.color = new THREE.Color(0xffd600);
  pointLightWarm2.position.set(25, 30, 0);
  scene.add(pointLightWarm2);

  const pointLightWarm3 = pointLightTemplate.clone(); // Bottom Right
  pointLightWarm3.color = new THREE.Color(0xff4915);
  pointLightWarm3.position.set(20, 30, 25);
  scene.add(pointLightWarm3);

  const pLightHelper = new THREE.PointLightHelper(pointLightCool1);
  scene.add(pLightHelper);
  const pLightHelper2 = new THREE.PointLightHelper(pointLightCool2);
  scene.add(pLightHelper2);
  const pLightHelper5 = new THREE.PointLightHelper(pointLightCool3);
  scene.add(pLightHelper5);
  const pLightHelper3 = new THREE.PointLightHelper(pointLightWarm1);
  scene.add(pLightHelper3);
  const pLightHelper4 = new THREE.PointLightHelper(pointLightWarm2);
  scene.add(pLightHelper4);
  const pLightHelper6 = new THREE.PointLightHelper(pointLightWarm3);
  scene.add(pLightHelper6);
}

// DICE TRAY*******************************************************************
function createDiceTray() {
  // Visible Meshes
  const trayMaterial = new THREE.MeshStandardMaterial({
    color: params.trayColor,
    // wireframe: true,
    side: THREE.DoubleSide,
  });

  const trayBottomGeometry = new THREE.PlaneGeometry(
    trayParams.trayWidth,
    trayParams.trayHeight
  );
  const trayBottom = new THREE.Mesh(trayBottomGeometry, trayMaterial);
  trayBottom.position.set(0, -trayParams.trayDepth, 0);
  trayBottom.rotation.x = -0.5 * Math.PI;
  // trayBottom.receiveShadow = true;
  trayBottom.name = "tray";

  const trayWallGeometry1 = new THREE.PlaneGeometry(
    trayParams.trayWidth,
    trayParams.trayDepth
  );
  const trayWall1 = new THREE.Mesh(trayWallGeometry1, trayMaterial);
  trayWall1.position.set(
    0,
    -trayParams.trayDepth / 2,
    -trayParams.trayHeight / 2
  );
  trayWall1.receiveShadow = true;
  trayWall1.name = "tray";

  const trayWall2 = trayWall1.clone();
  trayWall2.position.z += trayParams.trayHeight;
  trayWall2.rotation.y = Math.PI;
  trayWall2.name = "tray";

  const trayWallGeometry3 = new THREE.PlaneGeometry(
    trayParams.trayHeight,
    trayParams.trayDepth
  );
  const trayWall3 = new THREE.Mesh(trayWallGeometry3, trayMaterial);
  trayWall3.position.set(
    -trayParams.trayWidth / 2,
    -trayParams.trayDepth / 2,
    0
  );
  trayWall3.rotation.y = 0.5 * Math.PI;
  trayWall3.receiveShadow = true;
  trayWall3.name = "tray";

  const trayWall4 = trayWall3.clone();
  trayWall4.position.x += trayParams.trayWidth;
  trayWall4.rotation.y += Math.PI;
  trayWall4.name = "tray";

  // scene.add(trayBottom);
  // scene.add(trayWall1);
  // scene.add(trayWall2);
  // scene.add(trayWall3);
  // scene.add(trayWall4);

  // Physics Bodies
  const trayFloorBody = new CANNON.Body({
    type: CANNON.Body.STATIC,
    shape: new CANNON.Plane(),
  });
  trayFloorBody.position.copy(trayBottom.position);
  trayFloorBody.quaternion.copy(trayBottom.quaternion);

  const traySide1Body = new CANNON.Body({
    type: CANNON.Body.STATIC,
    shape: new CANNON.Plane(),
  });
  traySide1Body.position.copy(trayWall1.position);
  traySide1Body.quaternion.copy(trayWall1.quaternion);

  const traySide2Body = new CANNON.Body({
    type: CANNON.Body.STATIC,
    shape: new CANNON.Plane(),
  });
  traySide2Body.position.copy(trayWall2.position);
  traySide2Body.quaternion.copy(trayWall2.quaternion);

  const traySide3Body = new CANNON.Body({
    type: CANNON.Body.STATIC,
    shape: new CANNON.Plane(),
  });
  traySide3Body.position.copy(trayWall3.position);
  traySide3Body.quaternion.copy(trayWall3.quaternion);

  const traySide4Body = new CANNON.Body({
    type: CANNON.Body.STATIC,
    shape: new CANNON.Plane(),
  });
  traySide4Body.position.copy(trayWall4.position);
  traySide4Body.quaternion.copy(trayWall4.quaternion);

  physicsWorld.addBody(traySide1Body);
  physicsWorld.addBody(traySide2Body);
  physicsWorld.addBody(traySide3Body);
  physicsWorld.addBody(traySide4Body);
  physicsWorld.addBody(trayFloorBody);
}

function loadDiceTrayModel() {
  const loader = new GLTFLoader();

  loader.load(
    trayUrl.href,
    function (gltf) {
      const model = gltf.scene;
      model.position.set(0, -4.5, 0);
      scene.add(model);
      model.traverse(function (object) {
        if (object.isMesh) {
          object.material.shading = THREE.SmoothShading;
          object.castShadow = true;
          object.receiveShadow = true;
          object.material.side = THREE.FrontSide;
        }
      });
      setTimeout(startScene, 50);
    },
    function (xhr) {
      //loading
      // console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
      updateLoadingSplashScreen((xhr.loaded / xhr.total) * 100);
    },
    function (error) {
      console.error(error);
    }
  );
}

// DICE MODEL******************************************************************
function createDiceMesh() {
  const boxMaterialOuter = new THREE.MeshStandardMaterial({
    color: params.diceSurfaceColor,
    roughness: 0.0,
    metalness: 0.05,
  });
  const boxMaterialInner = new THREE.MeshStandardMaterial({
    color: params.diceDimpleColor,
    roughness: 0,
    metalness: 0,
    side: THREE.DoubleSide,
  });

  const diceMesh = new THREE.Group();
  const innerMesh = new THREE.Mesh(createInnerGeometry(), boxMaterialInner);
  const outerMesh = new THREE.Mesh(
    createDiceGeometry(),
    boxMaterialOuter.clone()
  );
  outerMesh.castShadow = true;
  outerMesh.receiveShadow = true;
  outerMesh.name = "diceSurface";

  diceMesh.name = "dice";
  diceMesh.add(innerMesh, outerMesh);

  diceMesh.receiveShadow = true;

  return diceMesh;
}

function createDice() {
  const mesh = diceMesh.clone();
  scene.add(mesh);

  const body = new CANNON.Body({
    mass: 1,
    shape: new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5)),
    sleepTimeLimit: 0.3,
  });
  physicsWorld.addBody(body);

  // Set starting position off screen
  body.position = new CANNON.Vec3(0, params.diceSpawnHeight, 0);
  mesh.position.copy(body.position);
  //

  return { mesh, body };
}

function createDiceGeometry() {
  let diceGeometry = new THREE.BoxGeometry(
    1,
    1,
    1,
    params.segments,
    params.segments,
    params.segments
  );

  const positionAttr = diceGeometry.attributes.position;
  const subCubeHalfSize = 0.5 - params.edgeRadius;

  for (let i = 0; i < positionAttr.count; i++) {
    let position = new THREE.Vector3().fromBufferAttribute(positionAttr, i);

    const subCube = new THREE.Vector3(
      Math.sign(position.x),
      Math.sign(position.y),
      Math.sign(position.z)
    ).multiplyScalar(subCubeHalfSize);

    const addition = new THREE.Vector3().subVectors(position, subCube);

    // Modify the vertices
    if (
      Math.abs(position.x) > subCubeHalfSize &&
      Math.abs(position.y) > subCubeHalfSize &&
      Math.abs(position.z) > subCubeHalfSize
    ) {
      // position is close to box corner vertex
      addition.normalize().multiplyScalar(params.edgeRadius);
      position = subCube.add(addition);
    } else if (
      Math.abs(position.x) > subCubeHalfSize &&
      Math.abs(position.y) > subCubeHalfSize
    ) {
      // position is close to edge and parallel with Z axis
      addition.z = 0;
      addition.normalize().multiplyScalar(params.edgeRadius);
      position.x = subCube.x + addition.x;
      position.y = subCube.y + addition.y;
    } else if (
      Math.abs(position.x) > subCubeHalfSize &&
      Math.abs(position.z) > subCubeHalfSize
    ) {
      // position is close to edge and parallel with y axis
      addition.y = 0;
      addition.normalize().multiplyScalar(params.edgeRadius);
      position.x = subCube.x + addition.x;
      position.z = subCube.z + addition.z;
    } else if (
      Math.abs(position.y) > subCubeHalfSize &&
      Math.abs(position.z) > subCubeHalfSize
    ) {
      // position is close to edge and parallel with x axis
      addition.x = 0;
      addition.normalize().multiplyScalar(params.edgeRadius);
      position.y = subCube.y + addition.y;
      position.z = subCube.z + addition.z;
    }

    // Add the dimples into the dice faces
    const dimpleWave = (v) => {
      v = (1 / params.dimpleRadius) * v;
      v = Math.PI * Math.max(-1, Math.min(1, v));
      return params.dimpleDepth * (Math.cos(v) + 1);
    };
    const dimple = (pos) => dimpleWave(pos[0]) * dimpleWave(pos[1]);

    const offset = 0.23;

    if (position.y === 0.5) {
      position.y -= dimple([position.x, position.z]);
    } else if (position.x === 0.5) {
      position.x -= dimple([position.y + offset, position.z + offset]);
      position.x -= dimple([position.y - offset, position.z - offset]);
    } else if (position.z === 0.5) {
      position.z -= dimple([position.x - offset, position.y + offset]);
      position.z -= dimple([position.x, position.y]);
      position.z -= dimple([position.x + offset, position.y - offset]);
    } else if (position.z === -0.5) {
      position.z += dimple([position.x + offset, position.y + offset]);
      position.z += dimple([position.x + offset, position.y - offset]);
      position.z += dimple([position.x - offset, position.y + offset]);
      position.z += dimple([position.x - offset, position.y - offset]);
    } else if (position.x === -0.5) {
      position.x += dimple([position.y + offset, position.z + offset]);
      position.x += dimple([position.y + offset, position.z - offset]);
      position.x += dimple([position.y, position.z]);
      position.x += dimple([position.y - offset, position.z + offset]);
      position.x += dimple([position.y - offset, position.z - offset]);
    } else if (position.y === -0.5) {
      position.y += dimple([position.x + offset, position.z + offset]);
      position.y += dimple([position.x + offset, position.z]);
      position.y += dimple([position.x + offset, position.z - offset]);
      position.y += dimple([position.x - offset, position.z + offset]);
      position.y += dimple([position.x - offset, position.z]);
      position.y += dimple([position.x - offset, position.z - offset]);
    }

    positionAttr.setXYZ(i, position.x, position.y, position.z);
  }

  // Update Normals
  diceGeometry.deleteAttribute("normal");
  diceGeometry.deleteAttribute("uv");
  diceGeometry = BufferGeometryUtils.mergeVertices(diceGeometry);

  diceGeometry.computeVertexNormals();

  return diceGeometry;
}

function createInnerGeometry() {
  const baseGeometry = new THREE.PlaneGeometry(
    1 - 2 * params.edgeRadius,
    1 - 2 * params.edgeRadius
  );

  const offset = 0.48; //depth of dimple
  return BufferGeometryUtils.mergeBufferGeometries(
    [
      baseGeometry.clone().translate(0, 0, offset),
      baseGeometry.clone().translate(0, 0, -offset),
      baseGeometry
        .clone()
        .rotateX(0.5 * Math.PI)
        .translate(0, -offset, 0),
      baseGeometry
        .clone()
        .rotateX(0.5 * Math.PI)
        .translate(0, offset, 0),
      baseGeometry
        .clone()
        .rotateY(0.5 * Math.PI)
        .translate(-offset, 0, 0),
      baseGeometry
        .clone()
        .rotateY(0.5 * Math.PI)
        .translate(offset, 0, 0),
    ],
    false
  );
}

function addDiceEvents(dice) {
  // Sleep event and checking dice face result
  dice.body.addEventListener("sleep", (e) => {
    dice.body.allowSleep = false;

    const euler = new CANNON.Vec3();
    e.target.quaternion.toEuler(euler);

    const eps = 0.1;
    const isZero = (angle) => Math.abs(angle) < eps;
    const isHalfPi = (angle) => Math.abs(angle - 0.5 * Math.PI) < eps;
    const isMinusHalfPi = (angle) => Math.abs(0.5 * Math.PI + angle) < eps;
    const isPiOrMinusPi = (angle) =>
      Math.abs(Math.PI - angle) < eps || Math.abs(Math.PI + angle) < eps;

    if (isZero(euler.z)) {
      if (isZero(euler.x)) {
        dice.rollResult = 1;
        dice.stable = true;
      } else if (isHalfPi(euler.x)) {
        dice.rollResult = 4;
        dice.stable = true;
      } else if (isMinusHalfPi(euler.x)) {
        dice.rollResult = 3;
        dice.stable = true;
      } else if (isPiOrMinusPi(euler.x)) {
        dice.rollResult = 6;
        dice.stable = true;
      } else {
        //landed on edge => wait untill falling on side
        dice.body.allowSleep = true;
      }
    } else if (isHalfPi(euler.z)) {
      dice.rollResult = 2;
      dice.stable = true;
    } else if (isMinusHalfPi(euler.z)) {
      dice.rollResult = 5;
      dice.stable = true;
    } else {
      //landed on edge => wait untill falling on side
      dice.body.allowSleep = true;
    }

    readRollResults();
  });
}

function readRollResults() {
  clearRollResults();

  diceArray.forEach((dice) => {
    if (dice.stable) {
      saveRollResults(dice.rollResult);
    }
  });
}

function calcTotalRollScore() {
  let totalScore = 0;
  for (const [i, roll] of rollResults.entries()) {
    totalScore += (i + 1) * roll;
  }
  return totalScore;
}
// RESULTS REPORTING***************************************
function saveRollResults(n) {
  rollResults[n - 1]++;
  showRollResults();
}

function showRollResults() {
  const rollCountElArr = [
    d1RollCount,
    d2RollCount,
    d3RollCount,
    d4RollCount,
    d5RollCount,
    d6RollCount,
  ];

  const rollRunningTotalElArr = [
    d1RunTotal,
    d2RunTotal,
    d3RunTotal,
    d4RunTotal,
    d5RunTotal,
    d6RunTotal,
  ];

  let runningTotal = 0;

  for (let i = rollResults.length - 1; i >= 0; i--) {
    rollCountElArr[i].innerHTML = rollResults[i];
    runningTotal += rollResults[i];
    rollRunningTotalElArr[i].innerHTML = runningTotal;
  }

  totalScore.innerHTML = calcTotalRollScore();
}

function clearRollResults() {
  rollResults = [0, 0, 0, 0, 0, 0];
}

// RENDER**********************************************************************
function render(time) {
  if (!params.isPaused) {
    physicsWorld.fixedStep();
  }

  for (const dice of diceArray) {
    dice.mesh.position.copy(dice.body.position);
    dice.mesh.quaternion.copy(dice.body.quaternion);
  }

  orbit.update(); //call update after everytime we change position of camera

  // cannonDebugger.update();

  // Redraw scene
  updateSceneSize();
  renderer.render(scene, camera);
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
  if (resizeRendererToDisplaySize(renderer)) {
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
  }
}

// UI & Gameplay***************************************************************
// REMOVE AND ADD DICE*********************************************************
function removeDice() {
  if (params.diceCount > 1) {
    params.diceCount--;

    const removedDie = diceArray.pop();
    scene.remove(removedDie.mesh);

    physicsWorld.removeBody(removedDie.body);

    updateDiceCountUI();
  }
}

function addDice() {
  params.diceCount++;
  diceArray.push(createDice());
  addDiceEvents(diceArray.at(-1));
  updateDiceCountUI();
}

function removeNDice(n) {
  for (let i = 0; i < n; i++) {
    removeDice();
  }
}

function addNDice(n) {
  for (let i = 0; i < n; i++) {
    addDice();
  }
}

function removeAllDice() {
  for (const dice of diceArray) {
    scene.remove(dice.mesh);
    physicsWorld.removeBody(dice.body);
  }
  diceArray = [];
  params.diceCount = 0;
  updateDiceCountUI();
}

function updateDiceCountUI() {
  diceCounter.innerHTML = params.diceCount;
}

// SELECT DICE*****************************************************************
function selectDie(dice) {
  const surface = dice.mesh.children[1];
  surface.material = surface.material.clone();
  surface.material.color.set(params.diceSelectedColor);
  dice.selected = true;
  selectedDice.add(dice);
}

function deselectDie(dice) {
  const surface = dice.mesh.children[1];
  surface.material.color.set(params.diceSurfaceColor);
  dice.selected = false;
  selectedDice.delete(dice);
}

function selectDice() {
  event.preventDefault();
  mousePosition.x = (event.clientX / window.innerWidth) * 2 - 1;
  mousePosition.y = -(event.clientY / window.innerHeight) * 2 + 1;

  rayCaster.setFromCamera(mousePosition, camera);
  const intersects = rayCaster.intersectObject(scene, true);
  if (intersects.length > 0) {
    // using parent group due to multiple meshes on dice
    const parent = intersects[0].object.parent;

    if (parent.name === "dice" && !parent.selected) {
      for (const entry of diceArray) {
        if (entry.mesh.id === parent.id && !entry.selected) {
          selectDie(entry);
        } else if (entry.mesh.id === parent.id && entry.selected) {
          deselectDie(entry);
        }
      }
    }
  }
}

function selectCockedDice() {
  deselectAllDice();
  diceArray.forEach((dice) => {
    if (!dice.stable) {
      selectDie(dice);
    }
  });
}

function deselectAllDice() {
  diceArray.forEach((dice) => {
    deselectDie(dice);
  });
}

function selectNDiceNumber(n) {
  let allSelected = true;

  diceArray.forEach((dice) => {
    if (dice.rollResult == n && !dice.selected) allSelected = false;
  });

  diceArray.forEach((dice) => {
    if (dice.rollResult == n && !dice.selected) {
      selectDie(dice);
    } else if (allSelected && dice.rollResult == n && dice.selected) {
      deselectDie(dice);
    }
  });
}

// REROLL DICE*******************************************************************
function rerollSelectedDice() {
  const selectedDiceArray = Array.from(selectedDice);

  selectedDiceArray.forEach((d, dIdx) => {
    rollDie(d, dIdx);
  });
}

// NEW ROLL FUNCTIONS************************************************************
function throwDice() {
  clearRollResults();
  showRollResults();

  diceArray.forEach((d, dIdx) => {
    rollDie(d, dIdx);
  });
}

function rollNPlusDice(n) {
  let diceCount = 0;
  for (let i = n - 1; i < rollResults.length; i++) {
    diceCount += rollResults[i];
  }
  removeAllDice();
  addNDice(diceCount);
  throwDice();
}

function rollSelectedDice() {
  removeAllDice();
  addNDice(selectedDice.size);
  throwDice();
}

function rollDie(d, dIdx = 0) {
  // reset stable status
  d.stable = false;
  // reset velocity of previous throw
  d.body.velocity.setZero();
  d.body.angularVelocity.setZero();

  // set initial position
  d.body.position = new CANNON.Vec3(
    -trayParams.trayWidth / 2 + 1,
    dIdx * 2.5 + 10,
    trayParams.trayHeight / 2 - 1
  );
  d.mesh.position.copy(d.body.position);

  // set initial rotation
  d.mesh.rotation.set(
    2 * Math.PI * Math.random(),
    0,
    2 * Math.PI * Math.random()
  );
  d.body.quaternion.copy(d.mesh.quaternion);
  const force = 20 + params.diceThrowForce * Math.random();
  d.body.applyImpulse(
    new CANNON.Vec3(force, -force, force * 0.66), //this determines the throw direction and force
    new CANNON.Vec3(0, 0, 0.2) // shift the point of force application
  );

  // reset sleep state
  d.body.allowSleep = true;
}

function updateLoadingSplashScreen(perc) {
  loadText.innerHTML = `Loading: ${Math.round(perc)}%`;
}

function toggleHelpModal() {
  if (helpModal.style.display === "none") {
    helpModal.style.display = "block";
  } else {
    helpModal.style.display = "none";
  }
}
