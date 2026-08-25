import * as THREE from 'three';
import { createDialTexture, createLeatherTexture, createElasticTexture, cachedTexture } from './textures.js';

// ─── کارخانهٔ مواد PBR ──────────────────────────────────────────────────────
// هر فراخوانی نمونهٔ جدیدی می‌سازد تا افکت درخشش (emissive) هر جزء
// مستقل از بقیه باشد.

export const HIGHLIGHT_COLOR = new THREE.Color(0x6fd2ff);
export const HIGHLIGHT_INTENSITY = 0.75;

/** فلز پرداخت‌شده برای بدنه، بزل، تاج و... */
export function makeMetalMaterial(def, opts = {}) {
  const mat = new THREE.MeshPhysicalMaterial({
    color: def.color,
    metalness: def.metalness ?? 1,
    roughness: (def.roughness ?? 0.25) * (opts.roughnessMul ?? 1),
    clearcoat: 0.55,
    clearcoatRoughness: 0.25,
    envMapIntensity: 1.1,
    emissive: HIGHLIGHT_COLOR,
    emissiveIntensity: 0,
  });
  return mat;
}

/** صفحهٔ ساعت با بافت سان‌بورست رویه‌ای */
export function makeDialMaterial(style) {
  const map = cachedTexture(`dial:${style.id}`, () => createDialTexture(style));
  return new THREE.MeshStandardMaterial({
    map,
    roughness: 0.38,
    metalness: 0.3,
    emissive: HIGHLIGHT_COLOR,
    emissiveIntensity: 0,
  });
}

/** چرم با بافت دانه‌ای و بامپ‌مپ */
export function makeLeatherMaterial(colorDef) {
  const { map, bumpMap } = cachedTexture(`leather:${colorDef.color}`, () =>
    createLeatherTexture(colorDef.color)
  );
  return new THREE.MeshStandardMaterial({
    map,
    bumpMap,
    bumpScale: 1.4,
    roughness: 0.82,
    metalness: 0,
    emissive: HIGHLIGHT_COLOR,
    emissiveIntensity: 0,
  });
}

/** پارچهٔ فلکسیبل (ناتو) با بافت جناغی */
export function makeElasticMaterial(colorDef) {
  const { map } = cachedTexture(`elastic:${colorDef.color}`, () => createElasticTexture(colorDef.color));
  return new THREE.MeshStandardMaterial({
    map,
    roughness: 0.95,
    metalness: 0,
    emissive: HIGHLIGHT_COLOR,
    emissiveIntensity: 0,
  });
}

/** لینک‌های فلزی بند متالیک */
export function makeBraceletMaterial(colorDef) {
  return new THREE.MeshPhysicalMaterial({
    color: colorDef.color,
    metalness: colorDef.metal ? 1 : 0.2,
    roughness: 0.24,
    clearcoat: 0.4,
    emissive: HIGHLIGHT_COLOR,
    emissiveIntensity: 0,
  });
}

/** شیشهٔ یاقوتی با انکسار (transmission) */
export function makeCrystalMaterial() {
  return new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0,
    roughness: 0.04,
    transmission: 0.96,
    thickness: 0.12,
    ior: 1.52,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    transparent: true,
    opacity: 0.985,
    envMapIntensity: 1.3,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
}

/** عقربه‌ها؛ همیشه کمی درخشندگی بیشتری برای خوانایی دارند */
export function makeHandMaterial(def) {
  return new THREE.MeshPhysicalMaterial({
    color: def.color,
    metalness: def.metalness ?? 1,
    roughness: (def.roughness ?? 0.22) * 0.9,
    clearcoat: 0.7,
    emissive: HIGHLIGHT_COLOR,
    emissiveIntensity: 0,
  });
}

/** نوار لومینوس روی عقربه و نشانگرها — درخشش دائمی، نباید با hover محو شود */
export function makeLumeMaterial() {
  const mat = new THREE.MeshStandardMaterial({
    color: 0xe9f5d8,
    emissive: 0xbdf59a,
    emissiveIntensity: 0.55,
    roughness: 0.6,
  });
  mat.userData.keepEmissive = true;
  return mat;
}
