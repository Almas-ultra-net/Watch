// ─── گزینه‌های سفارشی‌سازی ساعت ─────────────────────────────────────────────
// تمام برچسب‌ها فارسی است و این فایل تنها منبع حقیقت (single source of truth)
// برای رابط کاربری و صحنهٔ سه‌بعدی است.

export const CASE_MATERIALS = [
  {
    id: 'gold',
    label: 'طلا',
    color: 0xd4af37,
    metalness: 1.0,
    roughness: 0.22,
    swatch: '#d4af37',
  },
  {
    id: 'silver',
    label: 'نقره',
    color: 0xc9cdd4,
    metalness: 1.0,
    roughness: 0.18,
    swatch: '#c9cdd4',
  },
  {
    id: 'copper',
    label: 'مس',
    color: 0xb87333,
    metalness: 1.0,
    roughness: 0.28,
    swatch: '#b87333',
  },
  {
    id: 'rose-gold',
    label: 'رزگلد',
    color: 0xd68f7e,
    metalness: 1.0,
    roughness: 0.22,
    swatch: '#e0a08e',
  },
  {
    id: 'steel',
    label: 'استیل',
    color: 0x9aa3ad,
    metalness: 0.95,
    roughness: 0.3,
    swatch: '#9aa3ad',
  },
];

export const DIAL_STYLES = [
  { id: 'black', label: 'مشکی', base: '#101216', ray: '#3a3f4a', text: '#e8ecf4', swatch: '#101216' },
  { id: 'white', label: 'سفید', base: '#eef0f4', ray: '#c9cdd4', text: '#16181d', swatch: '#eef0f4' },
  { id: 'blue', label: 'آبی', base: '#12314f', ray: '#2e6da3', text: '#e8ecf4', swatch: '#12314f' },
  { id: 'green', label: 'سبز', base: '#0f3126', ray: '#2e8a5e', text: '#e8ecf4', swatch: '#0f3126' },
  { id: 'silver', label: 'نقره‌ای', base: '#b9bdc4', ray: '#e2e5ea', text: '#16181d', swatch: '#b9bdc4' },
];

export const HAND_STYLES = [
  { id: 'modern', label: 'مدرن', hint: 'میله‌های پهن با نوار لومینوس' },
  { id: 'classic', label: 'کلاسیک', hint: 'بورِگه با حلقه و نوک تیز' },
  { id: 'minimal', label: 'مینیمال', hint: 'سوزنی ظریف و ساده' },
];

export const HAND_COLORS = [
  { id: 'match-case', label: 'همرنگ بدنه' },
  { id: 'steel', label: 'فولادی', color: 0xc9cdd4 },
  { id: 'gold', label: 'طلایی', color: 0xd4af37 },
  { id: 'black', label: 'مشکی', color: 0x1c1f24 },
];

export const STRAP_TYPES = [
  { id: 'leather', label: 'چرم', hint: 'دوخت و بافت چرم طبیعی' },
  { id: 'bracelet', label: 'متالیک', hint: 'حلقه‌های فلزی متصل' },
  { id: 'elastic', label: 'فلکسیبل', hint: 'بند پارچه‌ای ناتوی کشسان' },
];

export const STRAP_COLORS = {
  leather: [
    { id: 'brown', label: 'قهوه‌ای', color: '#6b3f23' },
    { id: 'black', label: 'مشکی', color: '#1e2126' },
    { id: 'tan', label: 'عسلی', color: '#b98a54' },
    { id: 'burgundy', label: 'زرشکی', color: '#5d1f2a' },
  ],
  bracelet: [
    { id: 'steel', label: 'استیل', color: '#c9cdd4', metal: true },
    { id: 'gold', label: 'طلا', color: '#d4af37', metal: true },
    { id: 'copper', label: 'مس', color: '#b87333', metal: true },
  ],
  elastic: [
    { id: 'navy', label: 'سرمه‌ای', color: '#1d2f4e' },
    { id: 'olive', label: 'زیتونی', color: '#4a5238' },
    { id: 'charcoal', label: 'زغالی', color: '#26282d' },
    { id: 'crimson', label: 'لاکی', color: '#7e2430' },
  ],
};

export const STRAP_LENGTHS = [
  { id: 'short', label: 'کوتاه', count: 5 },
  { id: 'standard', label: 'استاندارد', count: 7 },
  { id: 'long', label: 'بلند', count: 9 },
];

export const STRAP_SHAPES = [
  { id: 'curved', label: 'منحنی', hint: 'حلقه‌شونده دور مچ' },
  { id: 'flat', label: 'صاف', hint: 'کشیده و باز برای نمایش' },
];

// نام فارسی اجزای ساعت برای راهنمای شناور (hover tooltip)
export const PART_LABELS = {
  hands: { label: 'عقربه‌ها', hint: 'از بخش «سبک عقربه‌ها» تغییر دهید' },
  bezel: { label: 'لبهٔ صفحه (بزل)', hint: 'جنس بدنه را عوض کنید' },
  markers: { label: 'نشانگرهای ساعت', hint: 'تزئینات صفحه' },
  crown: { label: 'تاج تنظیم', hint: 'تزئینات کناری بدنه' },
  dial: { label: 'صفحهٔ ساعت', hint: 'رنگ صفحه را عوض کنید' },
  strap: { label: 'بند ساعت', hint: 'نوع، رنگ و طول بند را عوض کنید' },
  case: { label: 'بدنهٔ ساعت', hint: 'جنس بدنه را عوض کنید' },
  crystal: { label: 'شیشهٔ ساعت', hint: 'شیشهٔ محافظ صفحه' },
};

export function findCaseMaterial(id) {
  return CASE_MATERIALS.find((m) => m.id === id) || CASE_MATERIALS[0];
}

export function findDial(id) {
  return DIAL_STYLES.find((d) => d.id === id) || DIAL_STYLES[0];
}

export function findHandColor(id, caseMat) {
  if (id === 'match-case') {
    return { id, label: 'همرنگ بدنه', color: caseMat ? caseMat.color : 0xc9cdd4, metalness: 1, roughness: 0.2 };
  }
  const c = HAND_COLORS.find((h) => h.id === id) || HAND_COLORS[1];
  return { ...c, metalness: 1, roughness: 0.25 };
}

export const DEFAULT_CONFIG = {
  caseMaterial: 'silver',
  dial: 'black',
  handStyle: 'modern',
  handColor: 'match-case',
  strapType: 'leather',
  strapColor: 'brown',
  strapLength: 'standard',
  strapShape: 'curved',
};
