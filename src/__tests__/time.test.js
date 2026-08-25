import { describe, it, expect } from 'vitest';
import { timeToAngles, toPersianDigits, formatPersianTime } from '../utils/time.js';

describe('timeToAngles', () => {
  it('ساعت ۳:۰۰ دقیقه — عقربه ساعت روی ۹۰ درجه', () => {
    const a = timeToAngles(new Date(2026, 0, 1, 15, 0, 0, 0));
    expect(a.hour).toBeCloseTo(Math.PI / 2, 5);
    expect(a.minute).toBeCloseTo(0, 5);
    expect(a.second).toBeCloseTo(0, 5);
  });

  it('ساعت ۶:۰۰ — عقربه‌ها روی ۱۸۰ درجه', () => {
    const a = timeToAngles(new Date(2026, 0, 1, 6, 0, 0, 0));
    expect(a.hour).toBeCloseTo(Math.PI, 5);
    expect(a.minute).toBeCloseTo(0, 5);
  });

  it('۱۲:۳۰ — عقربهٔ دقیقه ۱۸۰ درجه و ساعت بین ۱۲ و ۱', () => {
    const a = timeToAngles(new Date(2026, 0, 1, 0, 30, 0, 0));
    expect(a.minute).toBeCloseTo(Math.PI, 5);
    expect(a.hour).toBeCloseTo((0.5 / 12) * Math.PI * 2, 5);
  });

  it('حرکت پیوسته: میلی‌ثانیه هم در زاویه لحاظ می‌شود', () => {
    const t1 = timeToAngles(new Date(2026, 0, 1, 12, 0, 0, 0));
    const t2 = timeToAngles(new Date(2026, 0, 1, 12, 0, 0, 500));
    expect(t2.second).toBeGreaterThan(t1.second);
    expect(t2.second).toBeCloseTo(Math.PI * 2 * (0.5 / 60), 5);
  });

  it('دامنهٔ کامل دور: ۱۲:۰۰:۰۰ برابر ۰ (یا ۲π)', () => {
    const a = timeToAngles(new Date(2026, 0, 1, 12, 0, 0, 0));
    expect(a.hour % (Math.PI * 2)).toBeCloseTo(0, 5);
  });
});

describe('toPersianDigits', () => {
  it('اعداد لاتین به فارسی تبدیل می‌شوند', () => {
    expect(toPersianDigits('12:34:56')).toBe('۱۲:۳۴:۵۶');
    expect(toPersianDigits(60)).toBe('۶۰');
  });

  it('کاراکترهای غیر عددی دست‌نخورده می‌مانند', () => {
    expect(toPersianDigits('fps: 59/60!')).toBe('fps: ۵۹/۶۰!');
  });
});

describe('formatPersianTime', () => {
  it('زمان با ارقام فارسی و صفر پیشوند قالب‌بندی می‌شود', () => {
    expect(formatPersianTime(new Date(2026, 0, 1, 9, 5, 3))).toBe('۰۹:۰۵:۰۳');
  });
});
