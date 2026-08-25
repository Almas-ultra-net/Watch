// تست دود مدل سه‌بعدی: همهٔ ترکیب‌های سفارشی‌سازی بدون خطا ساخته می‌شوند و
// هندسه‌های سالم (اعداد متناهی، مثلث غیرخالی، برچسب جزء) دارند.
// «document» با یک بوم noop بازسازی می‌شود چون Node محیط بوم ندارد.
import { describe, beforeAll, it, expect, vi } from 'vitest';

const noop = () => {};

function installCanvasMock() {
  const makeCanvas = () => {
    const ctx = new Proxy(
      {},
      {
        get: (t, prop) => {
          if (prop === 'canvas') return canvas;
          if (prop === 'createLinearGradient' || prop === 'createRadialGradient' || prop === 'createConicGradient')
            return () => ({ addColorStop: noop });
          if (prop === 'measureText') return () => ({ width: 10 });
          if (prop === 'getImageData') return () => ({ data: new Uint8ClampedArray(4) });
          if (typeof prop === 'string') return noop;
          return undefined;
        },
        set: () => true,
      }
    );
    const canvas = {
      width: 0,
      height: 0,
      style: {},
      addEventListener: noop,
      getContext: () => ctx,
    };
    return canvas;
  };
  vi.stubGlobal('document', {
    createElement: (tag) => makeCanvas(),
    createElementNS: (_ns, _tag) => makeCanvas(),
    fonts: { ready: Promise.resolve() },
  });
}

beforeAll(installCanvasMock);

async function loadBuilder() {
  const builder = await import('../scene/watchBuilder.js');
  return builder;
}

describe('ساخت مدل ساعت', () => {
  it('همهٔ ترکیب‌های جنس/صفحه/عقربه/بند بدون خطا ساخته می‌شوند', async () => {
    const {
      buildCase,
      buildDial,
      buildMarkers,
      buildCrystal,
      buildHands,
      buildStrap,
    } = await loadBuilder();
    const { CASE_MATERIALS, DIAL_STYLES, HAND_STYLES, STRAP_TYPES, STRAP_COLORS, STRAP_LENGTHS, STRAP_SHAPES } =
      await import('../config/options.js');

    for (const caseMat of CASE_MATERIALS) {
      const caseGroup = buildCase(caseMat);
      expect(caseGroup.children.length).toBeGreaterThan(4);
    }
    for (const dial of DIAL_STYLES) {
      expect(buildDial(dial).userData.part).toBe('dial');
    }
    for (const handStyle of HAND_STYLES) {
      const hands = buildHands(handStyle.id, { color: 0xc9cdd4, metalness: 1, roughness: 0.2 });
      const { hour, minute, second } = hands.userData.hands;
      expect(hour && minute && second).toBeTruthy();
    }
    expect(buildCrystal().userData.part).toBe('crystal');

    for (const type of STRAP_TYPES) {
      for (const color of STRAP_COLORS[type.id]) {
        for (const len of STRAP_LENGTHS) {
          for (const shape of STRAP_SHAPES) {
            const strap = buildStrap({
              type: type.id,
              colorDef: color,
              lengthCount: len.count,
              shape: shape.id,
              caseDef: CASE_MATERIALS[0],
            });
            expect(strap.children.length).toBeGreaterThan(0);
          }
        }
      }
    }
  });

  it('هندسه‌ها اعداد متناهی و مثلث معتبر دارند', async () => {
    const { buildCase, buildDial, buildMarkers, buildCrystal, buildHands, buildStrap } = await loadBuilder();
    const { CASE_MATERIALS } = await import('../config/options.js');
    const groups = [
      buildCase(CASE_MATERIALS[0]),
      buildDial({ id: 'x', base: '#000', ray: '#222', text: '#eee' }),
      buildMarkers(CASE_MATERIALS[0]),
      buildCrystal(),
      buildHands('modern', { color: 0xc9cdd4 }),
      buildStrap({ type: 'leather', colorDef: { color: '#6b3f23' }, lengthCount: 7, shape: 'curved', caseDef: CASE_MATERIALS[0] }),
    ];
    let meshCount = 0;
    groups.forEach((g) => {
      g.traverse((child) => {
        if (!child.isMesh) return;
        meshCount++;
        const pos = child.geometry.getAttribute('position');
        expect(pos, 'هندسه باید موقعیت رأس داشته باشد').toBeTruthy();
        let finite = true;
        for (let i = 0; i < pos.array.length; i++) if (!Number.isFinite(pos.array[i])) finite = false;
        expect(finite, 'همهٔ مختصات باید متناهی باشند').toBe(true);
        expect(pos.count).toBeGreaterThan(2);
        child.geometry.computeBoundingBox();
        expect(child.geometry.boundingBox).toBeTruthy();
        expect(child.material).toBeTruthy();
      });
    });
    expect(meshCount).toBeGreaterThan(30);
  });

  it('بند منحنی دور مچ می‌پیچد (عمق z منفی پیدا می‌کند)', async () => {
    const { buildStrap } = await loadBuilder();
    const { CASE_MATERIALS } = await import('../config/options.js');
    const strap = buildStrap({
      type: 'bracelet',
      colorDef: { color: '#c9cdd4', metal: true },
      lengthCount: 9,
      shape: 'curved',
      caseDef: CASE_MATERIALS[0],
    });
    strap.updateMatrixWorld(true);
    const box = new (await import('three')).Box3().setFromObject(strap);
    expect(box.min.z).toBeLessThan(-2); // پیچش به پشت ساعت
    expect(box.max.y).toBeGreaterThan(2); // ادامه از شاخک‌ها
  });
});
