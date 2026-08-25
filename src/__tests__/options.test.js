import { describe, it, expect } from 'vitest';
import {
  CASE_MATERIALS,
  DIAL_STYLES,
  HAND_STYLES,
  HAND_COLORS,
  STRAP_TYPES,
  STRAP_COLORS,
  STRAP_LENGTHS,
  STRAP_SHAPES,
  PART_LABELS,
  DEFAULT_CONFIG,
  findCaseMaterial,
  findDial,
  findHandColor,
} from '../config/options.js';

describe('پیکربندی گزینه‌ها', () => {
  it('همهٔ شناسه‌ها یکتا هستند', () => {
    const all = [
      CASE_MATERIALS,
      DIAL_STYLES,
      HAND_STYLES,
      HAND_COLORS,
      STRAP_TYPES,
      STRAP_LENGTHS,
      STRAP_SHAPES,
    ];
    all.forEach((group) => {
      const ids = group.map((o) => o.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  it('همهٔ برچسب‌ها فارسی و غیرخالی هستند', () => {
    [
      ...CASE_MATERIALS,
      ...DIAL_STYLES,
      ...HAND_STYLES,
      ...HAND_COLORS,
      ...STRAP_TYPES,
      ...STRAP_LENGTHS,
      ...STRAP_SHAPES,
    ].forEach((o) => {
      expect(o.label).toBeTruthy();
      expect(o.label).toMatch(/[\u0600-\u06FF]/);
    });
  });

  it('مواد فلزی پایه (طلا، نقره، مس) موجود هستند', () => {
    const ids = CASE_MATERIALS.map((m) => m.id);
    expect(ids).toEqual(expect.arrayContaining(['gold', 'silver', 'copper']));
    CASE_MATERIALS.forEach((m) => {
      expect(m.metalness).toBeGreaterThan(0.5);
      expect(m.roughness).toBeLessThan(0.6);
    });
  });

  it('هر نوع بند حداقل یک رنگ دارد و هر رنگ با type سازگار است', () => {
    STRAP_TYPES.forEach((t) => {
      expect(STRAP_COLORS[t.id].length).toBeGreaterThan(0);
      STRAP_COLORS[t.id].forEach((c) => {
        expect(c.color).toMatch(/^#[0-9a-f]{6}$/i);
        expect(c.label).toMatch(/[\u0600-\u06FF]/);
      });
    });
  });

  it('طول بند به تعداد قطعه نگاشت می‌شود (کوتاه < استاندارد < بلند)', () => {
    const [s, st, l] = STRAP_LENGTHS.map((x) => x.count);
    expect(s).toBeLessThan(st);
    expect(st).toBeLessThan(l);
  });

  it('پیکربندی پیش‌فرض به گزینه‌های معتبر اشاره می‌کند', () => {
    expect(CASE_MATERIALS.find((m) => m.id === DEFAULT_CONFIG.caseMaterial)).toBeTruthy();
    expect(DIAL_STYLES.find((d) => d.id === DEFAULT_CONFIG.dial)).toBeTruthy();
    expect(HAND_STYLES.find((h) => h.id === DEFAULT_CONFIG.handStyle)).toBeTruthy();
    expect(STRAP_TYPES.find((t) => t.id === DEFAULT_CONFIG.strapType)).toBeTruthy();
    expect(STRAP_COLORS[DEFAULT_CONFIG.strapType].find((c) => c.id === DEFAULT_CONFIG.strapColor)).toBeTruthy();
    expect(STRAP_LENGTHS.find((l) => l.id === DEFAULT_CONFIG.strapLength)).toBeTruthy();
    expect(STRAP_SHAPES.find((s) => s.id === DEFAULT_CONFIG.strapShape)).toBeTruthy();
  });

  it('توابع جستجو مقدار معتبر برمی‌گردانند', () => {
    expect(findCaseMaterial('ناموجود').id).toBe(CASE_MATERIALS[0].id);
    expect(findDial('blue').id).toBe('blue');
    const matched = findHandColor('match-case', findCaseMaterial('gold'));
    expect(matched.color).toBe(findCaseMaterial('gold').color);
  });

  it('نام فارسی همهٔ اجزای تعاملی ساعت تعریف شده است', () => {
    ['hands', 'bezel', 'markers', 'crown', 'dial', 'strap', 'case', 'crystal'].forEach((part) => {
      expect(PART_LABELS[part].label).toMatch(/[\u0600-\u06FF]/);
    });
  });
});
