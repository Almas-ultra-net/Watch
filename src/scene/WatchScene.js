import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { buildCase, buildDial, buildMarkers, buildCrystal, buildHands, buildStrap, disposeGroup } from './watchBuilder.js';
import { timeToAngles, clamp } from '../utils/time.js';
import { findCaseMaterial, findDial, findHandColor } from '../config/options.js';
import { HIGHLIGHT_INTENSITY } from './materials.js';
import { invalidateTexture } from './textures.js';

const CAMERA_HOME = new THREE.Vector3(4.6, 2.6, 9.6);
const CAMERA_TARGET = new THREE.Vector3(0, 0, -0.3);

export class WatchScene {
  constructor(container, callbacks = {}) {
    this.container = container;
    this.callbacks = callbacks;
    this.config = null;
    this.hoverPart = null;
    this.pointer = new THREE.Vector2(-10, -10);
    this.pointerClient = { x: 0, y: 0 };
    this.pointerInside = false;
    this.frameCount = 0;
    this.lastFPS_time = performance.now();
    this.partMaterials = new Map();
    this.xrSession = null;
    this.hitTestSource = null;
    this.arPlaced = false;
    this.cameraPreview = null;
    this.savedTransform = null;
    this.disposed = false;

    this.initRenderer();
    this.initScene();
    this.initWatchRoot();
    this.bindEvents();
    this.renderer.setAnimationLoop(this.tick);
  }

  // ── راه‌اندازی ───────────────────────────────────────────────────────────
  initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.xr.enabled = true;
    this.renderer.domElement.classList.add('scene-canvas');
    this.container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(
      38,
      this.container.clientWidth / this.container.clientHeight,
      0.01,
      100
    );
    this.camera.position.copy(CAMERA_HOME);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.copy(CAMERA_TARGET);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.minDistance = 4;
    this.controls.maxDistance = 24;
    this.controls.rotateSpeed = 0.85;
    this.controls.zoomSpeed = 0.9;
    this.controls.saveState();
  }

  initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0e1117);

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.pmrem = pmrem;
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environmentIntensity = 0.85;

    // نور اصلی برای سایه + نور محیطی ملایم
    this.keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
    this.keyLight.position.set(5, 8, 7);
    this.keyLight.castShadow = true;
    this.keyLight.shadow.mapSize.set(1024, 1024);
    this.keyLight.shadow.camera.left = -7;
    this.keyLight.shadow.camera.right = 7;
    this.keyLight.shadow.camera.top = 7;
    this.keyLight.shadow.camera.bottom = -7;
    this.keyLight.shadow.camera.far = 40;
    this.keyLight.shadow.bias = -0.0005;
    this.scene.add(this.keyLight);

    this.fillLight = new THREE.DirectionalLight(0xbfd4ff, 0.5);
    this.fillLight.position.set(-6, -3, 5);
    this.scene.add(this.fillLight);

    this.ambient = new THREE.AmbientLight(0xffffff, 0.25);
    this.scene.add(this.ambient);

    // زمین نامرئی فقط برای دریافت سایه
    this.ground = new THREE.Mesh(
      new THREE.CircleGeometry(14, 48).rotateX(-Math.PI / 2),
      new THREE.ShadowMaterial({ opacity: 0.3 })
    );
    this.ground.position.y = -4.4;
    this.ground.receiveShadow = true;
    this.scene.add(this.ground);

    // حلقهٔ نشانگر AR (reticle)
    this.reticle = new THREE.Mesh(
      new THREE.RingGeometry(0.07, 0.09, 32).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0x6fd2ff, transparent: true, opacity: 0.9 })
    );
    this.reticle.visible = false;
    this.reticle.matrixAutoUpdate = false;
    this.scene.add(this.reticle);
  }

  initWatchRoot() {
    this.watchRoot = new THREE.Group();
    this.scene.add(this.watchRoot);
    this.parts = { case: null, dial: null, markers: null, crystal: null, hands: null, strap: null };
  }

  bindEvents() {
    this._onPointerMove = (e) => {
      const rect = this.renderer.domElement.getBoundingClientRect();
      this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      this.pointerClient = { x: e.clientX, y: e.clientY };
      this.pointerInside = true;
    };
    this._onPointerLeave = () => {
      this.pointerInside = false;
      this.setHover(null);
    };
    this.renderer.domElement.addEventListener('pointermove', this._onPointerMove);
    this.renderer.domElement.addEventListener('pointerleave', this._onPointerLeave);

    this._ro = new ResizeObserver(() => this.resize());
    this._ro.observe(this.container);
  }

  resize() {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    if (!w || !h) return;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  // ── ساخت و به‌روزرسانی ساعت بر اساس پیکربندی ─────────────────────────────
  setConfig(config) {
    const prev = this.config;
    this.config = { ...config };
    const caseDef = findCaseMaterial(config.caseMaterial);
    const dialStyle = findDial(config.dial);
    const handColorDef = findHandColor(config.handColor, caseDef);
    const strapColorDef =
      config.strapColorDef ??
      { color: '#6b3f23', metal: false, ...(config.strapColorExtra || {}) };

    const rebuild = (key, builder, partKey) => {
      if (this.parts[partKey]) {
        this.watchRoot.remove(this.parts[partKey]);
        disposeGroup(this.parts[partKey]);
        this.parts[partKey] = null;
      }
      const built = builder();
      this.parts[partKey] = built;
      this.watchRoot.add(built);
      void key;
    };

    const caseChanged = !prev || prev.caseMaterial !== config.caseMaterial;
    const dialChanged = !prev || prev.dial !== config.dial;
    const handsChanged =
      !prev || prev.handStyle !== config.handStyle || prev.handColor !== config.handColor || caseChanged;
    const strapChanged =
      !prev ||
      prev.strapType !== config.strapType ||
      prev.strapColor !== config.strapColor ||
      prev.strapLength !== config.strapLength ||
      prev.strapShape !== config.strapShape ||
      caseChanged;

    if (caseChanged) rebuild('case', () => buildCase(caseDef), 'case');
    if (caseChanged) rebuild('markers', () => buildMarkers(caseDef), 'markers');
    if (dialChanged) rebuild('dial', () => buildDial(dialStyle), 'dial');
    if (handsChanged) rebuild('hands', () => buildHands(config.handStyle, handColorDef), 'hands');
    if (!prev || !this.parts.crystal) rebuild('crystal', () => buildCrystal(), 'crystal');
    if (strapChanged)
      rebuild('strap', () =>
        buildStrap({
          type: config.strapType,
          colorDef: strapColorDef,
          lengthCount: config.strapLengthCount,
          shape: config.strapShape,
          caseDef,
        }),
        'strap'
      );

    this.collectPartMaterials();
    this.updateGroundPosition();
  }

  collectPartMaterials() {
    this.partMaterials = new Map();
    this.watchRoot.traverse((child) => {
      if (child.isMesh && child.userData.part) {
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        if (!this.partMaterials.has(child.userData.part)) {
          this.partMaterials.set(child.userData.part, new Set());
        }
        const set = this.partMaterials.get(child.userData.part);
        mats.forEach((m) => set.add(m));
      }
    });
  }

  updateGroundPosition() {
    const box = new THREE.Box3().setFromObject(this.watchRoot);
    if (!box.isEmpty() && Number.isFinite(box.min.y)) {
      this.ground.position.y = Math.min(-3.4, box.min.y - 0.5);
    }
  }

  // ── درخشش اجزا هنگام نزدیک‌شدن نشانگر ماوس ────────────────────────────────
  setHover(partId) {
    if (this.hoverPart === partId) return;
    this.hoverPart = partId;
    this.renderer.domElement.style.cursor = partId ? 'pointer' : 'grab';
    this.callbacks.onHover?.(partId);
  }

  raycastHover() {
    if (!this.pointerInside || this.xrSession) return;
    this.raycaster = this.raycaster || new THREE.Raycaster();
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObject(this.watchRoot, true);
    let part = null;
    for (const hit of hits) {
      if (hit.object.userData.part) {
        part = hit.object.userData.part;
        break;
      }
    }
    this.setHover(part);
    if (part) this.callbacks.onHoverMove?.(part, this.pointerClient.x, this.pointerClient.y);
  }

  updateHighlight() {
    this.partMaterials.forEach((mats, partId) => {
      const target = partId === this.hoverPart ? HIGHLIGHT_INTENSITY : 0;
      mats.forEach((m) => {
        if (m.userData?.keepEmissive) return;
        m.emissiveIntensity += (target - m.emissiveIntensity) * 0.14;
      });
    });
  }

  /** بازترسیم بافت صفحه پس از بارگذاری کامل فونت فارسی */
  refreshDial() {
    if (!this.parts.dial) return;
    this.watchRoot.remove(this.parts.dial);
    disposeGroup(this.parts.dial);
    invalidateTexture(`dial:${this.config?.dial}`);
    this.parts.dial = buildDial(findDial(this.config?.dial));
    this.watchRoot.add(this.parts.dial);
    this.collectPartMaterials();
  }

  // ── حلقهٔ رندر ────────────────────────────────────────────────────────────
  tick = (time, frame) => {
    if (this.disposed) return;
    this.frameCount++;
    const now = performance.now();
    if (now - this.lastFPS_time >= 1000) {
      this.callbacks.onFPS?.(this.frameCount);
      this.frameCount = 0;
      this.lastFPS_time = now;
    }

    if (frame && this.xrSession) this.onXRFrame(frame);

    // حرکت صاف عقربه‌ها بر اساس زمان واقعی
    if (this.parts.hands) {
      const { hour, minute, second } = this.parts.hands.userData.hands;
      const a = timeToAngles(new Date());
      hour.rotation.z = -a.hour;
      minute.rotation.z = -a.minute;
      second.rotation.z = -a.second;
    }

    this.raycastHover();
    this.updateHighlight();
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };

  // ── دوربین ────────────────────────────────────────────────────────────────
  resetCamera() {
    this.controls.reset();
    this.camera.position.copy(CAMERA_HOME);
    this.controls.target.copy(CAMERA_TARGET);
    this.controls.saveState();
    this.controls.update();
  }

  setTheme(dark) {
    if (this.cameraPreview || this.xrSession) {
      this.pendingTheme = dark;
      return;
    }
    this.scene.background = new THREE.Color(dark ? 0x0e1117 : 0xdde3ec);
    this.ground.material.opacity = dark ? 0.3 : 0.22;
    this.keyLight.intensity = dark ? 2.4 : 2.1;
    this.fillLight.intensity = dark ? 0.5 : 0.7;
  }

  // ── WebXR AR ──────────────────────────────────────────────────────────────
  async supportsAR() {
    try {
      if (!('xr' in navigator) || !navigator.xr?.isSessionSupported) return false;
      return await navigator.xr.isSessionSupported('immersive-ar');
    } catch {
      return false;
    }
  }

  async enterAR(overlayEl) {
    const ok = await this.supportsAR();
    if (!ok) throw new Error('WEBXR_NOT_SUPPORTED');

    const session = await navigator.xr.requestSession('immersive-ar', {
      requiredFeatures: ['hit-test'],
      optionalFeatures: ['dom-overlay'],
      domOverlay: { root: overlayEl },
    });
    this.xrSession = session;
    this.arPlaced = false;

    // ذخیرهٔ وضعیت صحنه و آماده‌سازی برای AR
    this.savedTransform = {
      position: this.watchRoot.position.clone(),
      quaternion: this.watchRoot.quaternion.clone(),
      scale: this.watchRoot.scale.clone(),
      background: this.scene.background,
      groundY: this.ground.position.y,
    };
    this.scene.background = null;
    this.ground.visible = false;
    this.watchRoot.visible = false;
    this.setHover(null);

    this.renderer.xr.setReferenceSpaceType('local');
    await this.renderer.xr.setSession(session);

    const viewerSpace = await session.requestReferenceSpace('viewer');
    this.hitTestSource = session.requestHitTestSource
      ? await session.requestHitTestSource({ space: viewerSpace })
      : null;

    session.addEventListener('select', () => {
      if (this.reticle.visible) {
        this.watchRoot.visible = true;
        const pos = new THREE.Vector3();
        const quat = new THREE.Quaternion();
        const scl = new THREE.Vector3();
        this.reticle.matrix.decompose(pos, quat, scl);
        this.watchRoot.position.copy(pos);
        this.watchRoot.quaternion.copy(quat);
        // صفحه رو به بیرون از سطح و ۱۲ به سمت بالا
        const qTilt = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0));
        this.watchRoot.quaternion.multiply(qTilt);
        if (!this.arPlaced) {
          this.watchRoot.scale.setScalar(0.01); // مقیاس واقعی: ۱ واحد = ۱ سانتی‌متر
          this.arPlaced = true;
        }
        this.callbacks.onARPlaced?.();
      }
    });

    session.addEventListener('end', () => this.onARSessionEnd());
    this.callbacks.onARStateChange?.('active');
  }

  onXRFrame(frame) {
    if (!this.hitTestSource) return;
    const refSpace = this.renderer.xr.getReferenceSpace();
    const hits = frame.getHitTestResults(this.hitTestSource);
    if (hits.length > 0) {
      const pose = hits[0].getPose(refSpace);
      if (pose) {
        this.reticle.visible = true;
        this.reticle.matrix.fromArray(pose.transform.matrix);
      }
    } else {
      this.reticle.visible = false;
    }
  }

  rotateARWatch(delta) {
    if (this.xrSession && this.arPlaced) this.watchRoot.rotateZ(delta);
  }

  scaleARWatch(factor) {
    if (this.xrSession && this.arPlaced) {
      const s = clamp(this.watchRoot.scale.x * factor, 0.004, 0.04);
      this.watchRoot.scale.setScalar(s);
    }
  }

  onARSessionEnd() {
    this.xrSession = null;
    this.hitTestSource?.cancel?.();
    this.hitTestSource = null;
    this.arPlaced = false;
    this.reticle.visible = false;
    this.watchRoot.visible = true;
    if (this.savedTransform) {
      this.watchRoot.position.copy(this.savedTransform.position);
      this.watchRoot.quaternion.copy(this.savedTransform.quaternion);
      this.watchRoot.scale.copy(this.savedTransform.scale);
      this.scene.background = this.cameraPreview ? null : this.savedTransform.background;
      this.ground.position.y = this.savedTransform.groundY;
    }
    this.ground.visible = !this.cameraPreview;
    this.savedTransform = null;
    this.renderer.xr.setSession(null);
    this.callbacks.onARStateChange?.('idle');
    if (this.pendingTheme !== undefined) {
      this.setTheme(this.pendingTheme);
      this.pendingTheme = undefined;
    }
  }

  exitAR() {
    this.xrSession?.end().catch(() => this.onARSessionEnd());
  }

  // ── پیش‌نمایش جایگزین با دوربین (وقتی WebXR در دسترس نیست) ────────────────
  async startCameraPreview(videoEl) {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' },
      audio: false,
    });
    videoEl.srcObject = stream;
    await videoEl.play();
    this.cameraPreview = {
      stream,
      background: this.scene.background,
      groundY: this.ground.position.y,
    };
    this.scene.background = null;
    this.ground.visible = false;
  }

  stopCameraPreview() {
    if (!this.cameraPreview) return;
    this.cameraPreview.stream.getTracks().forEach((t) => t.stop());
    this.scene.background = this.cameraPreview.background;
    this.ground.visible = true;
    this.cameraPreview = null;
  }

  // ── پاک‌سازی ──────────────────────────────────────────────────────────────
  dispose() {
    this.disposed = true;
    this.renderer.setAnimationLoop(null);
    this._ro?.disconnect();
    this.renderer.domElement.removeEventListener('pointermove', this._onPointerMove);
    this.renderer.domElement.removeEventListener('pointerleave', this._onPointerLeave);
    Object.values(this.parts).forEach((p) => p && disposeGroup(p));
    this.scene.environment?.dispose();
    this.pmrem?.dispose();
    this.controls.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
