import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import {
  makeMetalMaterial,
  makeDialMaterial,
  makeLeatherMaterial,
  makeElasticMaterial,
  makeBraceletMaterial,
  makeCrystalMaterial,
  makeHandMaterial,
  makeLumeMaterial,
} from './materials.js';
import { createKnurlBump, cachedTexture } from './textures.js';

// ─── ساخت مدل ساعت ─────────────────────────────────────────────────────────
// ساعت روی محور صفحه رو به +Z ساخته می‌شود (صفحه رو به بیننده، عدد ۱۲ بالا،
// تاج تنظیم سمت راست +X) و بند در صفحهٔ YZ دور مچ فرضی می‌پیچد.

function tagPart(object, partId) {
  object.traverse((child) => {
    if (child.isMesh) child.userData.part = partId;
  });
  return object;
}

function disposeGroup(group) {
  group.traverse((child) => {
    if (child.isMesh) {
      child.geometry.dispose();
      const mats = Array.isArray(child.material) ? child.material : [child.material];
      mats.forEach((m) => m.dispose());
    }
  });
}

// ── بدنه، بزل، تاج و شاخک‌ها ────────────────────────────────────────────────
export function buildCase(caseDef) {
  const group = new THREE.Group();
  const bodyMat = makeMetalMaterial(caseDef);
  const bezelMat = makeMetalMaterial(caseDef, { roughnessMul: 0.55 });
  const crownMat = makeMetalMaterial(caseDef, { roughnessMul: 0.8 });

  // بدنهٔ اصلی با پروفیل گرد (Lathe)
  const profile = [
    [0.0, -0.55],
    [0.9, -0.55],
    [1.66, -0.4],
    [2.03, -0.08],
    [2.11, 0.2],
    [2.02, 0.36],
    [1.8, 0.42],
    [1.56, 0.42],
  ].map(([r, h]) => new THREE.Vector2(r, h));
  const bodyGeo = new THREE.LatheGeometry(profile, 72);
  bodyGeo.rotateX(Math.PI / 2); // محور چرخش از Y به Z
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // بزل (حلقهٔ لبهٔ صفحه) — کمی بیرون‌زده از بدنه مثل ساعت واقعی
  const bezelGeo = new THREE.TorusGeometry(1.98, 0.13, 24, 96);
  const bezel = new THREE.Mesh(bezelGeo, bezelMat);
  bezel.position.z = 0.44;
  bezel.castShadow = true;
  group.add(bezel);
  tagPart(bezel, 'bezel');

  // دیوارهٔ داخلی صفحه (رهوت)
  const rehautGeo = new THREE.CylinderGeometry(1.6, 1.6, 0.24, 64, 1, true);
  rehautGeo.rotateX(Math.PI / 2);
  const rehaut = new THREE.Mesh(rehautGeo, bezelMat);
  rehaut.position.z = 0.3;
  group.add(rehaut);
  tagPart(rehaut, 'bezel');

  // تاج تنظیم با دندانه‌ها
  const crown = new THREE.Group();
  const crownCylGeo = new THREE.CylinderGeometry(0.17, 0.17, 0.22, 28);
  crownCylGeo.rotateZ(Math.PI / 2); // محور در راستای X
  const crownMat2 = crownMat.clone();
  crownMat2.bumpMap = cachedTexture('knurl', createKnurlBump);
  crownMat2.bumpScale = 0.6;
  const crownCyl = new THREE.Mesh(crownCylGeo, crownMat2);
  crown.add(crownCyl);
  const crownCapGeo = new THREE.SphereGeometry(0.13, 20, 16);
  const crownCap = new THREE.Mesh(crownCapGeo, crownMat);
  crownCap.position.x = 0.13;
  crown.add(crownCap);
  crown.position.set(2.2, 0, 0);
  crown.traverse((c) => {
    if (c.isMesh) c.castShadow = true;
  });
  group.add(crown);
  tagPart(crown, 'crown');

  // شاخک‌های اتصال بند (چهار گوشه)
  const lugGeo = new RoundedBoxGeometry(0.3, 0.8, 0.38, 3, 0.1);
  const lugPositions = [
    [-0.94, 1.98, -0.1, -0.4],
    [0.94, 1.98, -0.1, -0.4],
    [-0.94, -1.98, -0.1, 0.4],
    [0.94, -1.98, -0.1, 0.4],
  ];
  lugPositions.forEach(([x, y, z, rx]) => {
    const lug = new THREE.Mesh(lugGeo, bodyMat);
    lug.position.set(x, y, z);
    lug.rotation.x = rx;
    lug.castShadow = true;
    group.add(lug);
  });

  tagPart(group, 'case');
  tagPart(bezel, 'bezel');
  tagPart(rehaut, 'bezel');
  tagPart(crown, 'crown');
  return group;
}

// ── صفحهٔ ساعت ─────────────────────────────────────────────────────────────
export function buildDial(dialStyle) {
  const geo = new THREE.CircleGeometry(1.58, 96);
  const mesh = new THREE.Mesh(geo, makeDialMaterial(dialStyle));
  mesh.position.z = 0.36;
  mesh.userData.part = 'dial';
  return mesh;
}

// ── نشانگرهای ساعت (ایندکس‌های فلزی) ────────────────────────────────────────
export function buildMarkers(caseDef) {
  const group = new THREE.Group();
  const mat = makeMetalMaterial(caseDef, { roughnessMul: 0.7 });
  const lume = makeLumeMaterial();
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    const isTwelve = i === 0;
    const offsets = isTwelve ? [-0.09, 0.09] : [0];
    offsets.forEach((off) => {
      const geo = new RoundedBoxGeometry(0.09, 0.3, 0.05, 2, 0.02);
      const marker = new THREE.Mesh(geo, mat);
      marker.position.set(Math.sin(angle) * 1.22 + Math.cos(angle) * off, Math.cos(angle) * 1.22 - Math.sin(angle) * off, 0.39);
      marker.rotation.z = -angle;
      group.add(marker);
      const lumeGeo = new THREE.BoxGeometry(0.05, 0.22, 0.012);
      const lumeMesh = new THREE.Mesh(lumeGeo, lume);
      lumeMesh.position.copy(marker.position);
      lumeMesh.position.z += 0.03;
      lumeMesh.rotation.z = -angle;
      group.add(lumeMesh);
    });
  }
  tagPart(group, 'markers');
  return group;
}

// ── شیشهٔ یاقوتی ────────────────────────────────────────────────────────────
export function buildCrystal() {
  const r = 1.56;
  const h = 0.14;
  const R = (r * r + h * h) / (2 * h);
  const theta = Math.asin(r / R);
  const geo = new THREE.SphereGeometry(R, 64, 20, 0, Math.PI * 2, 0, theta);
  geo.rotateX(Math.PI / 2); // قله از +Y به +Z
  geo.translate(0, 0, 0.62 - R);
  const mesh = new THREE.Mesh(geo, makeCrystalMaterial());
  mesh.renderOrder = 10;
  mesh.userData.part = 'crystal';
  return mesh;
}

// ── عقربه‌ها ────────────────────────────────────────────────────────────────
function handShape(style, length, width) {
  const shape = new THREE.Shape();
  if (style === 'modern') {
    shape.moveTo(-width * 0.75, -length * 0.16);
    shape.lineTo(width * 0.75, -length * 0.16);
    shape.lineTo(width, length);
    shape.lineTo(-width, length);
  } else if (style === 'classic') {
    // بورِگه: ساقهٔ باریک، حلقهٔ توخالی و نوک تیز
    const cx = 0;
    const cy = length * 0.72;
    const rOut = length * 0.14;
    shape.moveTo(-width, -length * 0.18);
    shape.lineTo(width, -length * 0.18);
    shape.lineTo(width * 0.7, cy - rOut * 1.7);
    shape.lineTo(cx + rOut * 0.9, cy - rOut * 1.35);
    shape.absarc(cx, cy, rOut, -Math.PI / 2.6, Math.PI * 1.18, false);
    shape.lineTo(width * 0.28, length);
    shape.lineTo(-width * 0.28, length);
    shape.lineTo(-rOut * 0.95, cy + rOut * 0.92);
    shape.absarc(cx, cy, rOut, Math.PI * 0.38, Math.PI + Math.PI / 2.6, false);
    shape.lineTo(-width * 0.7, cy - rOut * 1.7);
    const hole = new THREE.Path();
    hole.absarc(cx, cy, rOut * 0.55, 0, Math.PI * 2, true);
    shape.holes.push(hole);
  } else {
    // مینیمال: سوزن باریک
    shape.moveTo(-width * 0.4, -length * 0.22);
    shape.lineTo(width * 0.4, -length * 0.22);
    shape.lineTo(width * 0.75, length);
    shape.lineTo(-width * 0.75, length);
  }
  shape.closePath();
  return shape;
}

function buildHand(style, length, width, mat, opts = {}) {
  const group = new THREE.Group();
  const geo = new THREE.ExtrudeGeometry(handShape(style, length, width), {
    depth: 0.03,
    bevelEnabled: true,
    bevelThickness: 0.008,
    bevelSize: 0.008,
    bevelSegments: 2,
    curveSegments: 24,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = false;
  group.add(mesh);

  // وزنهٔ تعادل در دم عقربه
  if (style === 'classic' || style === 'modern') {
    const tail = new THREE.Mesh(
      new THREE.CylinderGeometry(width * 1.5, width * 1.5, 0.03, 20).rotateX(Math.PI / 2),
      mat
    );
    tail.position.y = -length * 0.2;
    group.add(tail);
  }

  // نوار لومینوس مدرن
  if (style === 'modern' && !opts.noLume) {
    const lume = new THREE.Mesh(new THREE.BoxGeometry(width * 0.66, length * 0.55, 0.014), makeLumeMaterial());
    lume.position.set(0, length * 0.5, 0.032);
    group.add(lume);
  }
  return group;
}

export function buildHands(handStyle, handColorDef) {
  const group = new THREE.Group();
  const mat = makeHandMaterial(handColorDef);

  const hourHand = buildHand(handStyle, 0.92, 0.115, mat);
  hourHand.position.z = 0.44;
  const minuteHand = buildHand(handStyle, 1.28, 0.085, mat);
  minuteHand.position.z = 0.485;

  // عقربهٔ ثانیه با رنگ لهجه
  const secondMat = new THREE.MeshPhysicalMaterial({
    color: 0xd23c3c,
    metalness: 0.4,
    roughness: 0.3,
    emissive: 0x37090a,
    emissiveIntensity: 0.4,
  });
  secondMat.userData.keepEmissive = true;
  const secondHand = buildHand('minimal', 1.34, 0.032, secondMat, { noLume: true });
  secondHand.position.z = 0.53;

  // کلاهک مرکزی
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.05, 24).rotateX(Math.PI / 2), mat);
  cap.position.z = 0.56;

  group.add(hourHand, minuteHand, secondHand, cap);
  group.userData.hands = { hour: hourHand, minute: minuteHand, second: secondHand };
  tagPart(group, 'hands');
  return group;
}

// ── بند ساعت ───────────────────────────────────────────────────────────────
// مسیر بند: بزیه در صفحهٔ YZ که از شاخک‌ها شروع شده و دور مچ فرضی می‌پیچد.
function strapCurvePoints(side, lengthCount, shape) {
  // side: +1 (بند بالا) / -1 (بند پایین)
  const pts = [];
  if (shape === 'flat') {
    const L = 0.55 + lengthCount * 0.42;
    for (let i = 0; i <= 40; i++) {
      const t = i / 40;
      pts.push(new THREE.Vector3(0, side * (2.02 + t * L), -0.06 - t * L * 0.3));
    }
    return pts;
  }
  const p0 = new THREE.Vector3(0, side * 2.02, -0.06);
  const p1 = new THREE.Vector3(0, side * 3.15, -0.55);
  const p2 = new THREE.Vector3(0, side * 3.4, -2.1);
  const p3 = new THREE.Vector3(0, side * 2.3, -3.4);
  const curve = new THREE.CubicBezierCurve3(p0, p1, p2, p3);
  const tMax = { 5: 0.52, 6: 0.62, 7: 0.78, 8: 0.9, 9: 1.0 }[lengthCount] ?? 0.78;
  for (let i = 0; i <= 48; i++) {
    pts.push(curve.getPoint((i / 48) * tMax));
  }
  return pts;
}

/** بند پیوسته (چرم / فلکسیبل) به‌صورت تیوب مستطیلی خم‌شده */
function bentBandGeometry(points, width, thickness) {
  const S = new THREE.Vector3(1, 0, 0);
  const hw = width / 2;
  const ht = thickness / 2;
  const rings = points.map((p, i) => {
    const prev = points[Math.max(0, i - 1)];
    const next = points[Math.min(points.length - 1, i + 1)];
    const T = next.clone().sub(prev).normalize();
    const N = new THREE.Vector3().crossVectors(S, T).normalize();
    return { p, T, N };
  });

  // چهار وجه تیوب مستطیلی؛ هر وجه دو گوشه دارد (گوشه‌ها جدا تا لبه‌ها تیز بمانند)
  const faceDefs = [
    { a: [-hw, +ht], b: [+hw, +ht] }, // رویهٔ بیرونی
    { a: [+hw, -ht], b: [-hw, -ht] }, // رویهٔ داخلی
    { a: [+hw, +ht], b: [+hw, -ht] }, // لبهٔ +X
    { a: [-hw, -ht], b: [-hw, +ht] }, // لبهٔ -X
  ];

  const positions = [];
  const uvs = [];
  const indices = [];
  let vTotal = 0;
  const ringLen = [0];
  for (let i = 1; i < points.length; i++) {
    vTotal += points[i].distanceTo(points[i - 1]);
    ringLen.push(vTotal);
  }

  faceDefs.forEach(({ a, b }) => {
    const base = positions.length / 3;
    for (let i = 0; i < rings.length; i++) {
      const { p, N } = rings[i];
      [
        [a[0], a[1], 0],
        [b[0], b[1], 1],
      ].forEach(([sOff, nOff, uCoord]) => {
        positions.push(
          p.x + S.x * sOff + N.x * nOff,
          p.y + S.y * sOff + N.y * nOff,
          p.z + S.z * sOff + N.z * nOff
        );
        uvs.push(uCoord, ringLen[i] * 0.42);
      });
    }
    for (let i = 0; i < rings.length - 1; i++) {
      const r0 = base + i * 2;
      const r1 = r0 + 2;
      // ترتیب رئوس طوری است که نرمال‌ها رو به بیرون باشند
      indices.push(r0, r0 + 1, r1, r1, r0 + 1, r1 + 1);
    }
  });

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

function frameMatrixAt(rings, i) {
  const S = new THREE.Vector3(1, 0, 0);
  const { p, T, N } = rings[i];
  const m = new THREE.Matrix4().makeBasis(S, T, N);
  m.setPosition(p);
  return m;
}

function ringsFromPoints(points) {
  return points.map((p, i) => {
    const prev = points[Math.max(0, i - 1)];
    const next = points[Math.min(points.length - 1, i + 1)];
    const T = next.clone().sub(prev).normalize();
    const N = new THREE.Vector3().crossVectors(S_, T).normalize();
    return { p, T, N };
  });
}
const S_ = new THREE.Vector3(1, 0, 0);

function buildLeatherStrapSide(points, mat, caseDef, isTop) {
  const group = new THREE.Group();
  const band = new THREE.Mesh(bentBandGeometry(points, 1.42, 0.17), mat);
  band.castShadow = true;
  band.receiveShadow = true;
  group.add(band);

  if (isTop) {
    // سگک فلزی انتهای بند بالا
    const rings = ringsFromPoints(points);
    const buckle = new THREE.Mesh(new THREE.TorusGeometry(0.44, 0.055, 14, 32), makeMetalMaterial(caseDef, { roughnessMul: 0.6 }));
    buckle.applyMatrix4(frameMatrixAt(rings, rings.length - 2));
    buckle.scale.set(1.55, 1, 0.5);
    const pin = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.035, 0.9, 12).rotateZ(Math.PI / 2),
      makeMetalMaterial(caseDef, { roughnessMul: 0.6 })
    );
    pin.applyMatrix4(frameMatrixAt(rings, rings.length - 2));
    pin.scale.set(1, 0.35, 1);
    group.add(buckle, pin);
  } else {
    // حلقهٔ نگهدارنده روی بند پایین
    const rings = ringsFromPoints(points);
    const keeper = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.05, 12, 28), mat);
    keeper.applyMatrix4(frameMatrixAt(rings, 3));
    keeper.scale.set(1.5, 1, 0.45);
    group.add(keeper);
  }
  return group;
}

function buildBraceletStrapSide(points, mat) {
  const group = new THREE.Group();
  const rings = ringsFromPoints(points);
  // شمار لینک‌ها بر اساس طول واقعی مسیر تا فاصله‌گذاری همیشه یکنواخت بماند
  let arcLen = 0;
  for (let i = 1; i < points.length; i++) arcLen += points[i].distanceTo(points[i - 1]);
  const nLinks = Math.max(3, Math.round((arcLen - 0.45) / 0.46));
  for (let k = 0; k <= nLinks; k++) {
    const fi = 1 + (k / nLinks) * (points.length - 2.2);
    const i = Math.round(fi);
    if (i < 1 || i > points.length - 2) continue;
    const m = frameMatrixAt(rings, i);
    const center = new THREE.Mesh(new RoundedBoxGeometry(0.74, 0.36, 0.22, 2, 0.06), mat);
    center.applyMatrix4(m);
    center.castShadow = true;
    group.add(center);
    [-1, 1].forEach((side) => {
      const link = new THREE.Mesh(new RoundedBoxGeometry(0.42, 0.32, 0.19, 2, 0.05), mat);
      link.applyMatrix4(m);
      link.position.x += side * 0.62;
      link.castShadow = true;
      group.add(link);
    });
  }
  return group;
}

function buildElasticStrapSide(points, mat, caseDef) {
  const group = new THREE.Group();
  const band = new THREE.Mesh(bentBandGeometry(points, 1.46, 0.1), mat);
  band.castShadow = true;
  band.receiveShadow = true;
  group.add(band);

  const rings = ringsFromPoints(points);
  // حلقه‌های نگهدارندهٔ فلزی سبک ناتو
  [2, Math.floor(points.length * 0.45), points.length - 3].forEach((idx) => {
    if (idx <= 0 || idx >= points.length - 1) return;
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.52, 0.04, 10, 24),
      makeMetalMaterial(caseDef, { roughnessMul: 0.7 })
    );
    ring.applyMatrix4(frameMatrixAt(rings, idx));
    ring.scale.set(1.5, 1, 0.4);
    group.add(ring);
  });
  return group;
}

export function buildStrap({ type, colorDef, lengthCount, shape, caseDef }) {
  const group = new THREE.Group();
  const mat =
    type === 'leather'
      ? makeLeatherMaterial(colorDef)
      : type === 'elastic'
        ? makeElasticMaterial(colorDef)
        : makeBraceletMaterial(colorDef);

  [1, -1].forEach((side) => {
    const points = strapCurvePoints(side, lengthCount, shape);
    if (type === 'bracelet') {
      group.add(buildBraceletStrapSide(points, mat));
    } else if (type === 'leather') {
      group.add(buildLeatherStrapSide(points, mat, caseDef, side === 1));
    } else {
      group.add(buildElasticStrapSide(points, mat, caseDef, side === 1));
    }
  });
  tagPart(group, 'strap');
  return group;
}

export { disposeGroup };
