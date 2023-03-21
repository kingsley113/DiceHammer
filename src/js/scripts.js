import * as THREE from "three";

const canvas = document.querySelector("#canvas");
const rollBtn = document.querySelector(".roll");
const container = document.querySelector(".content");

let renderer, camera, scene;

// const params = {
//   diceCount: 5,
// };

const diceArray = [];

initScene();

function initScene() {
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    canvas,
  });

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor("#fff1e6");

  camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    300
  );

  camera.position.set(0, 0.5, 4).multiplyScalar(7); //use this to set x, y, z axis

  scene = new THREE.Scene();

  const testGeometry = new THREE.BoxGeometry(1, 1, 1);
  const testMaterial = new THREE.MeshBasicMaterial({ color: 0x44aa88 });
  const testCube = new THREE.Mesh(testGeometry, testMaterial);
  scene.add(testCube);

  render();
}

function render() {
  renderer.render(scene, camera);
}
