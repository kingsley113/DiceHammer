import * as THREE from "three";
import * as CANNON from "cannon-es";
import {
  MapControls,
  OrbitControls,
} from "three/examples/jsm/controls/OrbitControls.js";
import * as BufferGeometryUtils from "three/examples/jsm/utils/BufferGeometryUtils";

import CannonDebugger from "cannon-es-debugger";

// UI Elements*****************************************************************
const canvas = document.querySelector("#canvas");
const rollBtn = document.querySelector(".roll");
const container = document.querySelector(".content");
const scoreResult = document.querySelector("#score-result");

const decreaseDiceBtn = document.querySelector("#dice-decrease");
const increaseDiceBtn = document.querySelector("#dice-increase");
const diceCounter = document.querySelector("#dice-count");

let renderer, camera, scene, orbit, diceMesh, physicsWorld;
let cannonDebugger;

const params = {
  diceCount: 10,
  gravityStrength: 50,
  diceRestitution: 0.5, // dice 'bounciness'
  diceThrowForce: 10,
  dimpleRadius: 0.12,
  dimpleDepth: 0.1,
  segments: 50,
  edgeRadius: 0.07,
  pauseSimulation: false,
  diceSurfaceColor: 0xeeeeee,
  diceDimpleColor: 0x000000,
  trayColor: 0xff0000,
};

const trayParams = {
  trayWidth: 30,
  trayHeight: 20,
  trayDepth: 3,
};

const diceArray = [];

// TODO: create these functions
rollBtn.addEventListener("click", throwDice);
decreaseDiceBtn.addEventListener("click", removeDice);
increaseDiceBtn.addEventListener("click", addDice);

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
    18,
    canvas.clientWidth / canvas.clientHeight,
    0.1,
    300
  );

  camera.position.set(0, 12, 5).multiplyScalar(7); //use this to set x, y, z axis

  scene = new THREE.Scene();

  // LIGHTING******************************************************************

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
  // orbit = new MapControls(camera, canvas);
  orbit = new OrbitControls(camera, canvas);
  orbit.enableDamping = true;
  orbit.dampingFactor = 0.025;
  orbit.enableZoom = false;
  orbit.enablePan = false;
  orbit.maxAzimuthAngle = 0.02 * Math.PI;
  orbit.minAzimuthAngle = -0.02 * Math.PI;
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

  throwDice();

  // Debugging
  // cannonDebugger = new CannonDebugger(scene, physicsWorld);

  render();
  updateDiceCountUI();
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
  trayBottom.receiveShadow = true;

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

  const trayWall2 = trayWall1.clone();
  trayWall2.position.z += trayParams.trayHeight;
  trayWall2.rotation.y = Math.PI;

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

  const trayWall4 = trayWall3.clone();
  trayWall4.position.x += trayParams.trayWidth;
  trayWall4.rotation.y += Math.PI;

  scene.add(trayBottom);
  scene.add(trayWall1);
  scene.add(trayWall2);
  scene.add(trayWall3);
  scene.add(trayWall4);

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

// DICE MODEL******************************************************************
function createDiceMesh() {
  const boxMaterialOuter = new THREE.MeshStandardMaterial({
    color: params.diceSurfaceColor,
  });
  const boxMaterialInner = new THREE.MeshStandardMaterial({
    color: params.diceDimpleColor,
    roughness: 0,
    metalness: 1,
    side: THREE.DoubleSide,
  });

  const diceMesh = new THREE.Group();
  const innerMesh = new THREE.Mesh(createInnerGeometry(), boxMaterialInner);
  const outerMesh = new THREE.Mesh(createDiceGeometry(), boxMaterialOuter);
  outerMesh.castShadow = true;
  diceMesh.add(innerMesh, outerMesh);
  // diceMesh.add(innerMesh);

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
        showRollResults(1);
      } else if (isHalfPi(euler.x)) {
        showRollResults(4);
      } else if (isMinusHalfPi(euler.x)) {
        showRollResults(3);
      } else if (isPiOrMinusPi(euler.x)) {
        showRollResults(6);
      } else {
        //landed on edge => wait untill falling on side
        dice.body.allowSleep = true;
      }
    } else if (isHalfPi(euler.z)) {
      showRollResults(2);
    } else if (isMinusHalfPi(euler.z)) {
      showRollResults(5);
    } else {
      //landed on edge => wait untill falling on side
      dice.body.allowSleep = true;
    }
  });
}

// RESULTS REPORTING***************************************
function showRollResults(score) {
  if (scoreResult.innerHTML === "") {
    scoreResult.innerHTML += score;
  } else {
    scoreResult.innerHTML += ", " + score;
  }
}

function clearRollResults() {
  scoreResult.innerHTML = "";
}

// RENDER**********************************************************************
function render(time) {
  physicsWorld.fixedStep();

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

// THROW DICE******************************************************************
function throwDice() {
  // pause = false;
  clearRollResults();

  diceArray.forEach((d, dIdx) => {
    // reset velocity of previous throw
    d.body.velocity.setZero();
    d.body.angularVelocity.setZero();

    // set initial position
    d.body.position = new CANNON.Vec3(
      -trayParams.trayWidth / 2 + 1,
      dIdx * 2.5 + 20,
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
  });
}

// UI & Gameplay***************************************************************

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

function updateDiceCountUI() {
  diceCounter.innerHTML = `Total Dice: ${params.diceCount}`;
}
