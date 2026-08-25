// تبدیل زمان به زاویهٔ عقربه‌ها — زاویه بر حسب رادیان، در جهت عقربه‌های ساعت از موقعیت ساعت ۱۲
export function timeToAngles(date) {
  const ms = date.getMilliseconds();
  const s = date.getSeconds() + ms / 1000;
  const m = date.getMinutes() + s / 60;
  const h = (date.getHours() % 12) + m / 60;
  return {
    hour: (h / 12) * Math.PI * 2,
    minute: (m / 60) * Math.PI * 2,
    second: (s / 60) * Math.PI * 2,
  };
}

const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

export function toPersianDigits(value) {
  return String(value).replace(/\d/g, (d) => PERSIAN_DIGITS[Number(d)]);
}

export function formatPersianTime(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return toPersianDigits(`${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`);
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
