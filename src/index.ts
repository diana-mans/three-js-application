import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

// Создаем сцену
const scene = new THREE.Scene();
// scene.background = new THREE.Color(0xaaaaaa); // Устанавливаем цвет фона

// Создаем камеру
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(20, 5, 0); // Смотрим на персонажа сбоку

// Создаем рендерер и добавляем его в DOM
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Добавляем управление камерой
const controls = new OrbitControls(camera, renderer.domElement);
controls.update();

// Увеличиваем яркость существующих источников света
const light1 = new THREE.DirectionalLight(0xffffff, 3); // Увеличиваем интенсивность до 3
light1.position.set(5, 5, 5).normalize();
scene.add(light1);

const light2 = new THREE.AmbientLight(0x404040, 3); // Увеличиваем интенсивность до 3
scene.add(light2);

const light3 = new THREE.PointLight(0xffffff, 3); // Увеличиваем интенсивность до 3
light3.position.set(-5, -5, -5);
scene.add(light3);

// Добавляем новый источник света сзади
const light4 = new THREE.DirectionalLight(0xffffff, 2.5); // Интенсивность 2.5
light4.position.set(0, -5, -10).normalize();
scene.add(light4);

// Загрузка текстуры
const textureLoader = new THREE.TextureLoader();
const texture = textureLoader.load(
  'assets/running-animation/textures/farmer_test_3_default_baseColor.png',
  () => {
    console.log('Texture loaded successfully');
  },
);

// Загрузка модели GLTF
const loader = new GLTFLoader();
loader.load(
  'assets/running-animation/scene.gltf',
  (gltf) => {
    console.log('Model loaded successfully');

    const model = gltf.scene;

    // Устанавливаем позицию модели (если требуется)
    model.position.set(0, -5, 0);

    // Устанавливаем масштаб модели (если требуется)
    model.scale.set(0.05, 0.05, 0.05);

    // Проверяем видимость всех дочерних объектов модели и обновление материалов
    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        console.log('Found mesh:', child.name);
        console.log('Material before update:', child.material);

        if (Array.isArray(child.material)) {
          child.material.forEach((material) => {
            material.map = texture;
            material.needsUpdate = true;
          });
        } else {
          child.material.map = texture;
          child.material.needsUpdate = true;
        }

        console.log('Material after update:', child.material);
        console.log('Child visibility:', child.visible);
      }
    });

    scene.add(model);

    // Настраиваем анимацию (если есть)
    const mixer = new THREE.AnimationMixer(model);
    if (gltf.animations.length > 0) {
      gltf.animations.forEach((clip) => {
        mixer.clipAction(clip).play();
      });
    }

    // Анимация сцены
    function animate() {
      requestAnimationFrame(animate);

      // Обновление микшера анимации
      mixer.update(0.01);

      controls.update(); // Обновление управления камерой

      renderer.render(scene, camera);
    }
    animate();
  },
  undefined,
  (error) => {
    console.error('An error happened during loading the model:', error);
  },
);

// Обработка изменения размеров окна
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
