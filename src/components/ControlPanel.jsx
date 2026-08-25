import React from 'react';
import {
  CASE_MATERIALS,
  DIAL_STYLES,
  HAND_STYLES,
  HAND_COLORS,
  STRAP_TYPES,
  STRAP_COLORS,
  STRAP_LENGTHS,
  STRAP_SHAPES,
} from '../config/options.js';

function Section({ title, hint, children }) {
  return (
    <section className="section">
      <h3>
        <span className="dot" />
        {title}
      </h3>
      {hint && <p className="section-hint">{hint}</p>}
      <div className="chip-grid">{children}</div>
    </section>
  );
}

function Chip({ selected, onClick, label, swatch, metal }) {
  return (
    <button
      type="button"
      className={`chip${selected ? ' selected' : ''}`}
      onClick={onClick}
      role="radio"
      aria-checked={selected}
    >
      {swatch && <span className={`swatch${metal ? ' metal' : ''}`} style={{ '--sw': swatch, background: metal ? undefined : swatch }} />}
      {label}
    </button>
  );
}

export default function ControlPanel({ config, onChange }) {
  const strapColors = STRAP_COLORS[config.strapType] || [];
  const handStyle = HAND_STYLES.find((h) => h.id === config.handStyle);

  return (
    <aside className="panel" aria-label="تنظیمات سفارشی‌سازی ساعت">
      <Section title="جنس بدنه" hint="مواد PBR با بازتاب واقعی فلز">
        {CASE_MATERIALS.map((m) => (
          <Chip
            key={m.id}
            selected={config.caseMaterial === m.id}
            onClick={() => onChange({ caseMaterial: m.id })}
            label={m.label}
            swatch={m.swatch}
            metal
          />
        ))}
      </Section>

      <Section title="رنگ صفحه" hint="پیش‌نمایش زنده با افکت سان‌بورست">
        {DIAL_STYLES.map((d) => (
          <Chip
            key={d.id}
            selected={config.dial === d.id}
            onClick={() => onChange({ dial: d.id })}
            label={d.label}
            swatch={d.swatch}
          />
        ))}
      </Section>

      <Section title="سبک عقربه‌ها" hint={handStyle?.hint}>
        {HAND_STYLES.map((h) => (
          <Chip
            key={h.id}
            selected={config.handStyle === h.id}
            onClick={() => onChange({ handStyle: h.id })}
            label={h.label}
          />
        ))}
      </Section>

      <Section title="رنگ عقربه‌ها">
        {HAND_COLORS.map((h) => (
          <Chip
            key={h.id}
            selected={config.handColor === h.id}
            onClick={() => onChange({ handColor: h.id })}
            label={h.id === 'match-case' ? 'همرنگ بدنه' : h.label}
            swatch={h.id === 'match-case' ? undefined : `#${h.color.toString(16).padStart(6, '0')}`}
            metal={h.id !== 'match-case'}
          />
        ))}
      </Section>

      <Section title="نوع بند">
        {STRAP_TYPES.map((t) => (
          <Chip
            key={t.id}
            selected={config.strapType === t.id}
            onClick={() => onChange({ strapType: t.id })}
            label={t.label}
          />
        ))}
      </Section>

      <Section title="رنگ بند">
        {strapColors.map((c) => (
          <Chip
            key={c.id}
            selected={config.strapColor === c.id}
            onClick={() => onChange({ strapColor: c.id })}
            label={c.label}
            swatch={c.metal ? c.color : c.color}
            metal={c.metal}
          />
        ))}
      </Section>

      <Section title="طول بند" hint="کوتاه، استاندارد یا بلند">
        {STRAP_LENGTHS.map((l) => (
          <Chip
            key={l.id}
            selected={config.strapLength === l.id}
            onClick={() => onChange({ strapLength: l.id })}
            label={l.label}
          />
        ))}
      </Section>

      <Section title="شکل بند" hint={STRAP_SHAPES.find((s) => s.id === config.strapShape)?.hint}>
        {STRAP_SHAPES.map((s) => (
          <Chip
            key={s.id}
            selected={config.strapShape === s.id}
            onClick={() => onChange({ strapShape: s.id })}
            label={s.label}
          />
        ))}
      </Section>
    </aside>
  );
}
