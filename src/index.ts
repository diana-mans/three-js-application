import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

// Создаем сцену
const scene = new THREE.Scene();

// Создаем камеру и отдаляем ее
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 10); // Отдаляем камеру и поднимаем выше для лучшего обзора

// Создаем рендерер и добавляем его в DOM
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('model-container')?.appendChild(renderer.domElement);

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
let model: THREE.Group;
const pivot = new THREE.Group(); // Создаем группу для опорной точки

loader.load(
  'assets/running-animation/scene.gltf',
  (gltf) => {
    console.log('Model loaded successfully');

    model = gltf.scene;

    // Устанавливаем масштаб модели (если требуется)
    model.scale.set(0.05, 0.05, 0.05);

    // Определяем центр модели
    const box = new THREE.Box3().setFromObject(model);
    const center = new THREE.Vector3();
    box.getCenter(center);
    box.getSize(center); // Используем размер для корректного позиционирования

    // Создаем объект для смещения оси вращения
    const offset = new THREE.Object3D();
    offset.position.y = -3; // Смещаем ось вращения вверх
    offset.add(model);

    // Сместить модель так, чтобы центр совпадал с осью поворота
    model.position.set(-center.x, -center.y / 2 - 2, -center.z);

    pivot.add(offset);
    scene.add(pivot);

    // Проверяем видимость всех дочерних объектов модели и обновление материалов
    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        console.log('Found mesh:', child.name);
        console.log('Material before update:', child.material);

        if (Array.isArray(child.material)) {
          child.material.forEach((material) => {
            if (material instanceof THREE.MeshStandardMaterial) {
              material.map = texture;
              material.needsUpdate = true;
            }
          });
        } else {
          if (child.material instanceof THREE.MeshStandardMaterial) {
            child.material.map = texture;
            child.material.needsUpdate = true;
          }
        }

        console.log('Material after update:', child.material);
        console.log('Child visibility:', child.visible);
      }
    });

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

let totalRotation = 0;
let touchStartY: number | null = null;
let currentModelContainer: HTMLElement | null = document.getElementById('model-container');

if (currentModelContainer) {
  currentModelContainer.addEventListener('wheel', handleWheel);
}

// Добавляем дополнительные слушатели событий для прокрутки на разных устройствах
window.addEventListener('touchmove', handleTouchMove);
// window.addEventListener('scroll', handleScroll);

let lastScrollY = 0;
let isScrolling = false;

function handleScroll() {
  lastScrollY = window.scrollY || document.documentElement.scrollTop;
  if (!isScrolling) {
    window.requestAnimationFrame(updateRotationOnScroll);
    isScrolling = true;
  }
}

function updateRotationOnScroll() {
  const rotationSpeed = 0.001; // Скорость вращения

  if (currentModelContainer && isElementInViewport(currentModelContainer)) {
    updateRotation(lastScrollY * rotationSpeed);
  }

  isScrolling = false;
}

function handleTouchMove(event: TouchEvent) {
  const touchY = event.touches[0].clientY - event.touches[1]?.clientY || event.touches[0].clientY;
  const rotationSpeed = 0.0005; // Скорость вращения

  if (currentModelContainer && isElementInViewport(currentModelContainer)) {
    event.preventDefault();
    updateRotation(touchY * rotationSpeed);
  }
}

function updateRotation(deltaRotation: number) {
  totalRotation += deltaRotation;

  if (totalRotation >= Math.PI * 4 || totalRotation <= -Math.PI * 4) {
    totalRotation = 4 * Math.PI;

    createNewBlocks();
  }

  pivot.rotation.x = totalRotation;
}

function handleWheel(event: WheelEvent) {
  const deltaY = event.deltaY;
  const rotationSpeed = 0.01; // Скорость вращения

  if (currentModelContainer && isElementInViewport(currentModelContainer)) {
    updateRotation(deltaY * rotationSpeed);
  }
}

function isElementInViewport(el: HTMLElement) {
  const rect = el.getBoundingClientRect();

  console.log(rect.top, rect.bottom);
  return (
    rect.top >= -150 && rect.bottom <= (window.innerHeight || document.documentElement.clientHeight)
  );
  // return true;
}

function createNewBlocks() {
  // Проверка, что полный оборот выполнен перед созданием нового блока
  if (totalRotation === 4 * Math.PI || totalRotation === 0) {
    // Сбрасываем угол поворота для следующего блока
    totalRotation = 0;

    // Создание нового блока контента
    const newContent = document.createElement('div');
    newContent.className = 'content';
    newContent.innerHTML = '<h1>Базовая верстка</h1>';
    document.body.appendChild(newContent);

    // Создание нового блока с моделью
    const newModelContainer = document.createElement('div');
    newModelContainer.id = 'model-container';
    document.body.appendChild(newModelContainer);

    // Добавление нового рендерера
    const newRenderer = new THREE.WebGLRenderer();
    newRenderer.setSize(window.innerWidth, window.innerHeight);
    newModelContainer.appendChild(newRenderer.domElement);

    currentModelContainer = newModelContainer; // Обновляем текущий контейнер модели

    animateNewRenderer(newRenderer);

    // Восстанавливаем обработчик колесика мыши
    setTimeout(() => {
      currentModelContainer?.addEventListener('wheel', handleWheel);
    }, 1000); // Задержка, чтобы дать время загрузиться новому контенту
  }
}

function animateNewRenderer(newRenderer: THREE.WebGLRenderer) {
  function animate() {
    requestAnimationFrame(animate);

    newRenderer.render(scene, camera);
  }
  animate();
}
