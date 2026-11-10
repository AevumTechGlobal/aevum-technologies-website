import * as THREE from '../node_modules/three/build/three.module.js';

const goldEmblemUrl = new URL('../assets/images/aevum-emblem-gold.png', import.meta.url).href;
const earthMapUrl = new URL('../assets/images/earth-map.svg', import.meta.url).href;

const EARTH_RADIUS = 1.6;
const CITY_COORDINATES = [
  [51.5, -0.1],
  [40.7, -74],
  [37.6, -122.4],
  [19.1, 72.9],
  [35.7, 139.7],
  [1.3, 103.8],
  [-33.9, 151.2],
  [25.2, 55.3],
  [30, 31.2],
  [-23.5, -46.6],
  [48.9, 2.4],
  [55.8, 37.6],
  [39.9, 116.4],
  [-1.3, 36.8],
];

function makeCloudTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Unable to create the atmospheric texture.');

  let seed = 7381;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };

  for (let cluster = 0; cluster < 92; cluster += 1) {
    const centerX = random() * canvas.width;
    const centerY = random() * canvas.height;
    const spreadX = 12 + random() * 48;
    const spreadY = 5 + random() * 22;
    const puffs = 8 + Math.floor(random() * 15);
    for (let puff = 0; puff < puffs; puff += 1) {
      const x = centerX + (random() - 0.5) * spreadX;
      const y = centerY + (random() - 0.5) * spreadY;
      const radiusX = 2 + random() * 8;
      const radiusY = 1 + random() * 3;
      context.beginPath();
      context.ellipse(x, y, radiusX, radiusY, random() * Math.PI, 0, Math.PI * 2);
      context.fillStyle = `rgba(222, 222, 208, ${0.08 + random() * 0.18})`;
      context.fill();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function coordinatesToVector(latitude, longitude, radius = EARTH_RADIUS) {
  const lat = THREE.MathUtils.degToRad(latitude);
  const lon = THREE.MathUtils.degToRad(longitude);
  return new THREE.Vector3(
    -radius * Math.cos(lat) * Math.sin(lon),
    radius * Math.sin(lat),
    radius * Math.cos(lat) * Math.cos(lon),
  );
}

function createConnection(start, end, parent) {
  const from = coordinatesToVector(start[0], start[1]);
  const to = coordinatesToVector(end[0], end[1]);
  const points = [];
  const steps = 52;
  const lift = from.distanceTo(to) * 0.12 + 0.08;

  for (let index = 0; index <= steps; index += 1) {
    const progress = index / steps;
    const point = from.clone().lerp(to, progress).normalize();
    point.multiplyScalar(EARTH_RADIUS + Math.sin(progress * Math.PI) * lift);
    points.push(point);
  }

  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const halo = new THREE.Line(
    geometry,
    new THREE.LineBasicMaterial({
      color: 0xb77b28,
      transparent: true,
      opacity: 0.18,
      depthWrite: false,
    }),
  );
  const line = new THREE.Line(
    geometry,
    new THREE.LineBasicMaterial({
      color: 0xf3bd4f,
      transparent: true,
      opacity: 0.78,
      depthWrite: false,
    }),
  );
  halo.scale.setScalar(1.012);
  parent.add(halo, line);
}

function createLightEarthTexture(image) {
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth || image.width;
  canvas.height = image.naturalHeight || image.height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Unable to create the light-theme Earth texture.');

  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;
  for (let index = 0; index < pixels.length; index += 4) {
    if (pixels[index + 3] === 0) continue;
    const luminance = pixels[index] * 0.3 + pixels[index + 1] * 0.59 + pixels[index + 2] * 0.11;
    if (luminance < 45) {
      pixels[index] = 62 + luminance * 0.3;
      pixels[index + 1] = 82 + luminance * 0.4;
      pixels[index + 2] = 62 + luminance * 0.26;
    } else if (luminance < 110) {
      pixels[index] = 146 + luminance * 0.2;
      pixels[index + 1] = 125 + luminance * 0.17;
      pixels[index + 2] = 92 + luminance * 0.12;
    }
  }
  context.putImageData(imageData, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createStars(scene) {
  let seed = 4401;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
  const positions = new Float32Array(420 * 3);
  const colors = new Float32Array(420 * 3);
  for (let index = 0; index < 420; index += 1) {
    const distance = 7 + random() * 9;
    const theta = random() * Math.PI * 2;
    const phi = Math.acos(2 * random() - 1);
    positions[index * 3] = distance * Math.sin(phi) * Math.cos(theta);
    positions[index * 3 + 1] = distance * Math.cos(phi);
    positions[index * 3 + 2] = -distance * Math.sin(phi) * Math.sin(theta);
    const warmth = random() > 0.72 ? 1 : 0.72;
    colors[index * 3] = warmth;
    colors[index * 3 + 1] = warmth * 0.78;
    colors[index * 3 + 2] = warmth * 0.44;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const points = new THREE.Points(
    geometry,
    new THREE.PointsMaterial({
      size: 0.018,
      vertexColors: true,
      transparent: true,
      opacity: 0.72,
      sizeAttenuation: true,
      depthWrite: false,
    }),
  );
  scene.add(points);
  return points;
}

function createEnergyField(scene) {
  const glowCanvas = document.createElement('canvas');
  glowCanvas.width = 256;
  glowCanvas.height = 128;
  const context = glowCanvas.getContext('2d');
  if (!context) return;

  const gradient = context.createRadialGradient(128, 64, 3, 128, 64, 126);
  gradient.addColorStop(0, 'rgba(255, 226, 151, 0.94)');
  gradient.addColorStop(0.13, 'rgba(244, 183, 74, 0.49)');
  gradient.addColorStop(0.45, 'rgba(177, 101, 19, 0.14)');
  gradient.addColorStop(1, 'rgba(77, 42, 8, 0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, 256, 128);

  const texture = new THREE.CanvasTexture(glowCanvas);
  const glow = new THREE.Mesh(
    new THREE.PlaneGeometry(3.9, 1.6),
    new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  glow.position.set(0, -1.78, 0.45);
  scene.add(glow);

  const rings = new THREE.Group();
  rings.position.set(0, -1.76, 0.35);
  for (const [radius, opacity] of [[0.72, 0.68], [1.02, 0.42], [1.36, 0.25], [1.7, 0.14]]) {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(radius, radius + 0.008, 96),
      new THREE.MeshBasicMaterial({
        color: 0xf1ba4d,
        transparent: true,
        opacity,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    ring.scale.y = 0.22;
    rings.add(ring);
  }
  scene.add(rings);
}

function showFallback(canvas, fallback, error) {
  if (error) console.warn('Using the static Earth fallback:', error.message);
  if (canvas instanceof HTMLCanvasElement) canvas.hidden = true;
  if (fallback instanceof HTMLElement) fallback.hidden = false;
}

export function createEarthScene({ canvas, fallback, stage, reducedMotion }) {
  if (!(canvas instanceof HTMLCanvasElement) || !(stage instanceof HTMLElement)) {
    showFallback(canvas, fallback, new Error('The Earth scene is missing its canvas or display region.'));
    return;
  }

  const isMobile = window.matchMedia('(max-width: 760px)').matches;
  const isLowPower = isMobile || (navigator.hardwareConcurrency > 0 && navigator.hardwareConcurrency <= 4);
  const probeCanvas = document.createElement('canvas');
  const webgl = probeCanvas.getContext('webgl2');
  webgl?.getExtension('WEBGL_lose_context')?.loseContext();
  if (!webgl) {
    showFallback(canvas, fallback, new Error('WebGL is not available in this browser.'));
    return;
  }

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: !isLowPower,
      powerPreference: 'default',
    });
  } catch (error) {
    showFallback(canvas, fallback, error);
    return;
  }

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(39, 1, 0.1, 80);
  camera.position.set(0, 0.06, 7.6);

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isLowPower ? 1.15 : 1.5));
  renderer.setSize(stage.clientWidth, stage.clientHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.22;
  renderer.setClearColor(0x000000, 0);

  const ambient = new THREE.AmbientLight(0xa6a5a0, 1.25);
  const keyLight = new THREE.DirectionalLight(0xffcf76, 4.1);
  keyLight.position.set(-4, 3.5, 5);
  const rimLight = new THREE.PointLight(0xe89530, 22, 8);
  rimLight.position.set(2.4, -0.2, -2.7);
  const frontLight = new THREE.PointLight(0xffe0a0, 10, 7);
  frontLight.position.set(0.8, 1.6, 4.2);
  scene.add(ambient, keyLight, rimLight, frontLight);

  const earth = new THREE.Group();
  scene.add(earth);
  const planetMaterial = new THREE.MeshStandardMaterial({
    color: 0xe4d2a4,
    roughness: 0.78,
    metalness: 0.1,
  });
  const planet = new THREE.Mesh(
    new THREE.SphereGeometry(EARTH_RADIUS, isLowPower ? 80 : 112, isLowPower ? 56 : 80),
    planetMaterial,
  );
  earth.add(planet);
  const cloudTexture = makeCloudTexture();
  const clouds = new THREE.Mesh(
    new THREE.SphereGeometry(EARTH_RADIUS * 1.006, isLowPower ? 56 : 80, isLowPower ? 40 : 56),
    new THREE.MeshBasicMaterial({
      map: cloudTexture,
      transparent: true,
      opacity: 0.24,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  );
  earth.add(clouds);
  let lightEarthTexture;
  let updateEarthTheme = () => {};
  let releaseScene = () => {};
  const earthTexture = new THREE.TextureLoader().load(
    earthMapUrl,
    (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
      planetMaterial.map = texture;
      planetMaterial.bumpMap = texture;
      planetMaterial.bumpScale = 0.025;
      planetMaterial.needsUpdate = true;
      updateEarthTheme();
      stage.classList.add('is-ready');
      if (fallback instanceof HTMLElement) {
        window.setTimeout(() => {
          fallback.hidden = true;
        }, reducedMotion.matches ? 0 : 350);
      }
    },
    undefined,
    (error) => {
      releaseScene();
      showFallback(canvas, fallback, error);
    },
  );

  const atmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(EARTH_RADIUS * 1.035, isLowPower ? 56 : 80, isLowPower ? 40 : 64),
    new THREE.ShaderMaterial({
      uniforms: {
        uAtmosphereColor: { value: new THREE.Color(0xff9e4a) },
        uAtmosphereOpacity: { value: 0.54 },
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * viewMatrix * worldPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 uAtmosphereColor;
        uniform float uAtmosphereOpacity;
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vec3 viewDirection = normalize(cameraPosition - vPosition);
          float rim = pow(1.0 - max(dot(normalize(vNormal), viewDirection), 0.0), 2.7);
          gl_FragColor = vec4(uAtmosphereColor, rim * uAtmosphereOpacity);
        }
      `,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    }),
  );
  earth.add(atmosphere);
  const lightPreference = window.matchMedia('(prefers-color-scheme: light)');
  updateEarthTheme = () => {
    const light = lightPreference.matches;
    if (light && earthTexture.image?.complete && (earthTexture.image.naturalWidth || earthTexture.image.width)) {
      lightEarthTexture ??= createLightEarthTexture(earthTexture.image);
      planetMaterial.map = lightEarthTexture;
      planetMaterial.color.setHex(0xffffff);
      ambient.color.setHex(0xded1ba);
      ambient.intensity = 1.62;
      keyLight.color.setHex(0xfff1d4);
      keyLight.intensity = 3.8;
      rimLight.color.setHex(0xdf9d49);
      rimLight.intensity = 14;
      frontLight.color.setHex(0xfff0c2);
      frontLight.intensity = 11;
      clouds.material.opacity = 0.18;
      atmosphere.material.uniforms.uAtmosphereColor.value.setHex(0xe5a14b);
      atmosphere.material.uniforms.uAtmosphereOpacity.value = 0.46;
      starField.material.opacity = 0.2;
    } else if (!light) {
      planetMaterial.map = earthTexture;
      planetMaterial.color.setHex(0xe4d2a4);
      ambient.color.setHex(0xa6a5a0);
      ambient.intensity = 1.25;
      keyLight.color.setHex(0xffcf76);
      keyLight.intensity = 4.1;
      rimLight.color.setHex(0xe89530);
      rimLight.intensity = 22;
      frontLight.color.setHex(0xffe0a0);
      frontLight.intensity = 10;
      clouds.material.opacity = 0.24;
      atmosphere.material.uniforms.uAtmosphereColor.value.setHex(0xff9e4a);
      atmosphere.material.uniforms.uAtmosphereOpacity.value = 0.54;
      starField.material.opacity = 0.72;
    }
    planetMaterial.needsUpdate = true;
  };
  lightPreference.addEventListener('change', updateEarthTheme);

  const locations = CITY_COORDINATES.map((coordinates) => coordinatesToVector(...coordinates));
  for (let index = 0; index < locations.length; index += 1) {
    if (index % 2 === 0) {
      const destination = (index * 5 + 3) % locations.length;
      createConnection(CITY_COORDINATES[index], CITY_COORDINATES[destination], earth);
    }
  }

  const pointMaterial = new THREE.MeshBasicMaterial({
    color: 0xffd66f,
    transparent: true,
    opacity: 0.98,
  });
  const pointGeometry = new THREE.SphereGeometry(0.019, 10, 8);
  const networkNodes = [];
  for (const position of locations) {
    const point = new THREE.Mesh(pointGeometry, pointMaterial);
    point.position.copy(position.clone().multiplyScalar(1.006));
    earth.add(point);
    networkNodes.push({ point, phase: networkNodes.length * 1.7 });
  }

  const orbitGroup = new THREE.Group();
  orbitGroup.rotation.set(0.42, 0.12, -0.36);
  for (const [radius, tube, tilt] of [[1.82, 0.004, 0.18], [2.05, 0.0025, -0.3], [2.24, 0.002, 0.42]]) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(radius, tube, 5, 180),
      new THREE.MeshBasicMaterial({
        color: 0xd5a044,
        transparent: true,
        opacity: 0.22,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    ring.rotation.set(tilt, 0.12, 0);
    orbitGroup.add(ring);
  }
  scene.add(orbitGroup);

  const starField = createStars(scene);
  createEnergyField(scene);
  updateEarthTheme();

  const emblemTexture = new THREE.TextureLoader().load(goldEmblemUrl);
  emblemTexture.colorSpace = THREE.SRGBColorSpace;
  const emblem = new THREE.Mesh(
    new THREE.PlaneGeometry(0.74, 0.86),
    new THREE.MeshBasicMaterial({
      map: emblemTexture,
      transparent: true,
      opacity: 0.96,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  );
  emblem.position.set(0, 0, EARTH_RADIUS + 0.12);
  scene.add(emblem);

  const mediaQuery = window.matchMedia('(max-width: 760px)');
  const tabletQuery = window.matchMedia('(min-width: 761px) and (max-width: 1100px)');
  const resize = () => {
    const width = Math.max(stage.clientWidth, 1);
    const height = Math.max(stage.clientHeight, 1);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.position.z = mediaQuery.matches ? 7.2 : tabletQuery.matches ? 9 : 7.6;
    camera.updateProjectionMatrix();
    earth.scale.setScalar(mediaQuery.matches ? 0.88 : tabletQuery.matches ? 0.94 : 1);
    orbitGroup.scale.setScalar(mediaQuery.matches ? 0.88 : tabletQuery.matches ? 0.94 : 1);
  };
  resize();
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(stage);
  mediaQuery.addEventListener('change', resize);
  tabletQuery.addEventListener('change', resize);

  let pointerX = 0;
  let pointerY = 0;
  let pointerTargetX = 0;
  let pointerTargetY = 0;
  let pointerMotion = 0;
  let pointerMotionTarget = 0;
  const onPointerMove = (event) => {
    if (mediaQuery.matches || reducedMotion.matches) return;
    const bounds = stage.getBoundingClientRect();
    pointerTargetX = ((event.clientX - bounds.left) / bounds.width - 0.5) * 0.08;
    pointerTargetY = ((event.clientY - bounds.top) / bounds.height - 0.5) * 0.055;
    pointerMotionTarget = Math.min(1, Math.hypot(event.movementX, event.movementY) / 32);
  };
  const onPointerLeave = () => {
    pointerTargetX = 0;
    pointerTargetY = 0;
    pointerMotionTarget = 0;
  };
  stage.addEventListener('pointermove', onPointerMove);
  stage.addEventListener('pointerleave', onPointerLeave);

  let visible = true;
  let frame = 0;
  let previousTime = 0;
  let lastRenderTime = 0;
  const visibilityObserver = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible && !document.hidden && !frame) frame = requestAnimationFrame(animate);
  });
  visibilityObserver.observe(stage);

  const animate = (time) => {
    frame = 0;
    if (!visible || document.hidden) return;
    const renderInterval = isLowPower ? 1000 / 30 : 1000 / 45;
    if (lastRenderTime && time - lastRenderTime < renderInterval) {
      frame = requestAnimationFrame(animate);
      return;
    }
    const delta = previousTime ? Math.min((time - previousTime) / 1000, 0.05) : 0;
    previousTime = time;
    lastRenderTime = time;
    if (!reducedMotion.matches) {
      pointerMotion += (pointerMotionTarget - pointerMotion) * 0.08;
      pointerMotionTarget *= 0.94;
      earth.rotation.y += delta * (0.1 + pointerMotion * 0.12);
      orbitGroup.rotation.y += delta * 0.018;
      clouds.rotation.y += delta * 0.006;
      pointerX += (pointerTargetX - pointerX) * 0.025;
      pointerY += (pointerTargetY - pointerY) * 0.025;
      earth.rotation.x = pointerY;
      earth.rotation.z = pointerX;
      starField.rotation.y += delta * 0.001;
      for (const { point, phase } of networkNodes) {
        const pulse = 1 + (Math.sin(time / 650 + phase) + 1) * 0.12;
        point.scale.setScalar(pulse);
      }
    }
    renderer.render(scene, camera);
    if (reducedMotion.matches) return;
    frame = requestAnimationFrame(animate);
  };

  const onMotionPreferenceChange = () => {
    if (reducedMotion.matches) {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      renderer.render(scene, camera);
    } else if (visible && !document.hidden && !frame) {
      previousTime = 0;
      frame = requestAnimationFrame(animate);
    }
  };

  const onVisibilityChange = () => {
    previousTime = 0;
    lastRenderTime = 0;
    if (document.hidden) {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
    } else if (visible && !frame) {
      frame = requestAnimationFrame(animate);
    }
  };
  releaseScene = () => {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    resizeObserver.disconnect();
    visibilityObserver.disconnect();
    mediaQuery.removeEventListener('change', resize);
    tabletQuery.removeEventListener('change', resize);
    stage.removeEventListener('pointermove', onPointerMove);
    stage.removeEventListener('pointerleave', onPointerLeave);
    document.removeEventListener('visibilitychange', onVisibilityChange);
    reducedMotion.removeEventListener('change', onMotionPreferenceChange);
    lightPreference.removeEventListener('change', updateEarthTheme);
    renderer.dispose();
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh || object instanceof THREE.Points || object instanceof THREE.Line) {
        object.geometry.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material) => material.dispose());
      }
    });
    earthTexture.dispose();
    lightEarthTexture?.dispose();
    cloudTexture.dispose();
    emblemTexture.dispose();
  };
  document.addEventListener('visibilitychange', onVisibilityChange);
  reducedMotion.addEventListener('change', onMotionPreferenceChange);
  frame = requestAnimationFrame(animate);

  return releaseScene;
}