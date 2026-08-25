import * as THREE from 'three';

// ─── بافت‌های رویه‌ای (Procedural Textures) ────────────────────────────────
// همهٔ بافت‌ها با Canvas تولید می‌شوند تا هیچ فایل تصویری خارجی لازم نباشد
// و بارگذاری صفحه فوق‌سریع بماند.

function createCanvas(w, h) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  return { canvas, ctx: canvas.getContext('2d') };
}

function canvasTexture(canvas, repeatX = 1, repeatY = 1) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.anisotropy = 4;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** صفحهٔ ساعت با افکت سان‌بورست، ریل‌راه دقیقه، برند و عدد ۱۲ */
export function createDialTexture(style) {
  const S = 1024;
  const { canvas, ctx } = createCanvas(S, S);
  const cx = S / 2;
  const cy = S / 2;

  // زمینه با گرادیان شعاعی (افکت سان‌بورست)
  const grad = ctx.createRadialGradient(cx, cy * 0.82, S * 0.05, cx, cy, S * 0.5);
  grad.addColorStop(0, style.ray);
  grad.addColorStop(0.55, style.base);
  grad.addColorStop(1, style.base);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, S, S);

  // پرتوهای ظریف سان‌بورست
  ctx.save();
  ctx.translate(cx, cy);
  ctx.globalAlpha = 0.055;
  for (let i = 0; i < 120; i++) {
    ctx.rotate((Math.PI * 2) / 120);
    ctx.fillStyle = i % 2 ? style.ray : style.text;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(S * 0.5, -S * 0.012);
    ctx.lineTo(S * 0.5, S * 0.012);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // حلقهٔ ریل‌راه دقیقه
  ctx.strokeStyle = style.text;
  ctx.globalAlpha = 0.85;
  ctx.lineWidth = 5;
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * Math.PI * 2;
    const long = i % 5 === 0;
    const r1 = long ? S * 0.4 : S * 0.405;
    const r2 = S * 0.43;
    ctx.globalAlpha = long ? 0.9 : 0.45;
    ctx.beginPath();
    ctx.moveTo(cx + Math.sin(a) * r1, cy - Math.cos(a) * r1);
    ctx.lineTo(cx + Math.sin(a) * r2, cy - Math.cos(a) * r2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // برند
  ctx.fillStyle = style.text;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `600 ${S * 0.058}px Vazirmatn, Tahoma, sans-serif`;
  ctx.fillText('الماس', cx, cy - S * 0.16);
  ctx.font = `400 ${S * 0.03}px Vazirmatn, Tahoma, sans-serif`;
  ctx.globalAlpha = 0.7;
  ctx.fillText('ساعت‌سازِ سه‌بعدی', cx, cy - S * 0.105);
  ctx.fillText('automatic', cx, cy + S * 0.13);
  ctx.globalAlpha = 1;

  return canvasTexture(canvas);
}

/** بافت چرم: دانه‌های نامنظم + دوخت دور لبه */
export function createLeatherTexture(hex) {
  const S = 512;
  const { canvas, ctx } = createCanvas(S, S);
  ctx.fillStyle = hex;
  ctx.fillRect(0, 0, S, S);

  // دانه‌بندی چرم با نقطه‌های تصادفی
  for (let i = 0; i < 5200; i++) {
    const x = Math.random() * S;
    const y = Math.random() * S;
    const r = Math.random() * 2.4 + 0.4;
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.12)';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  // چین‌های ظریف
  for (let i = 0; i < 40; i++) {
    ctx.strokeStyle = 'rgba(0,0,0,0.08)';
    ctx.lineWidth = Math.random() * 1.4;
    ctx.beginPath();
    const y = Math.random() * S;
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(S * 0.3, y + 12, S * 0.6, y - 12, S, y + 6);
    ctx.stroke();
  }
  // دوخت کناره‌ها (در راستای طول بند تکرار می‌شود)
  ctx.setLineDash([12, 9]);
  ctx.lineWidth = 4;
  ctx.strokeStyle = 'rgba(232,220,190,0.85)';
  ctx.beginPath();
  ctx.moveTo(S * 0.08, 0);
  ctx.lineTo(S * 0.08, S);
  ctx.moveTo(S * 0.92, 0);
  ctx.lineTo(S * 0.92, S);
  ctx.stroke();
  ctx.setLineDash([]);

  const map = canvasTexture(canvas);
  // بامپ‌مپ خشونت سطح چرم
  const { canvas: bumpCanvas, ctx: bctx } = createCanvas(S, S);
  bctx.fillStyle = '#808080';
  bctx.fillRect(0, 0, S, S);
  for (let i = 0; i < 4200; i++) {
    const x = Math.random() * S;
    const y = Math.random() * S;
    const r = Math.random() * 2.2 + 0.5;
    const g = Math.floor(Math.random() * 90 + 90);
    bctx.fillStyle = `rgb(${g},${g},${g})`;
    bctx.beginPath();
    bctx.arc(x, y, r, 0, Math.PI * 2);
    bctx.fill();
  }
  return { map, bumpMap: canvasTexture(bumpCanvas) };
}

/** بافت پارچه‌ای ناتو (فلکسیبل): بافت جناغی + راه‌راه */
export function createElasticTexture(hex) {
  const S = 512;
  const { canvas, ctx } = createCanvas(S, S);
  ctx.fillStyle = hex;
  ctx.fillRect(0, 0, S, S);

  // بافت جناغی (herringbone)
  const band = S / 32;
  for (let row = 0; row < 32; row++) {
    for (let col = 0; col < 32; col++) {
      const x = col * band;
      const y = row * band;
      const dir = (row + col) % 2 === 0;
      ctx.fillStyle = dir ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.16)';
      ctx.beginPath();
      if (dir) {
        ctx.moveTo(x, y + band);
        ctx.lineTo(x + band, y);
        ctx.lineTo(x + band, y + band * 0.5);
        ctx.lineTo(x, y + band * 1.5);
      } else {
        ctx.moveTo(x, y);
        ctx.lineTo(x + band, y + band);
        ctx.lineTo(x + band, y + band * 1.5);
        ctx.lineTo(x, y + band * 0.5);
      }
      ctx.closePath();
      ctx.fill();
    }
  }
  // راه‌راه‌های تزئینی ناتو
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(S * 0.30, 0, S * 0.05, S);
  ctx.fillRect(S * 0.65, 0, S * 0.05, S);
  ctx.fillStyle = 'rgba(255,255,255,0.28)';
  ctx.fillRect(S * 0.38, 0, S * 0.04, S);
  ctx.fillRect(S * 0.58, 0, S * 0.04, S);

  return { map: canvasTexture(canvas) };
}

/** برآمدگی‌های تاج تنظیم برای بامپ‌مپ */
export function createKnurlBump() {
  const S = 128;
  const { canvas, ctx } = createCanvas(S, S);
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, S, S);
  for (let x = 0; x < S; x += 8) {
    ctx.fillStyle = '#c8c8c8';
    ctx.fillRect(x, 0, 4, S);
    ctx.fillStyle = '#404040';
    ctx.fillRect(x + 4, 0, 4, S);
  }
  const t = new THREE.CanvasTexture(canvas);
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(4, 1);
  return t;
}

const cache = new Map();

export function cachedTexture(key, factory) {
  if (!cache.has(key)) cache.set(key, factory());
  return cache.get(key);
}

/** باطل‌کردن نسخهٔ کش‌شده (مثلاً برای بازترسیم پس از بارگذاری فونت) */
export function invalidateTexture(keyPrefix) {
  [...cache.keys()].forEach((k) => {
    if (k.startsWith(keyPrefix)) cache.delete(k);
  });
}

export function clearTextureCache() {
  cache.forEach((v) => {
    const list = Array.isArray(v) ? v : [v];
    list.forEach((t) => t.dispose && t.dispose());
  });
  cache.clear();
}
