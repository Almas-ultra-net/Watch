import React, { useEffect, useRef, useState, useCallback } from 'react';
import ControlPanel from './components/ControlPanel.jsx';
import { DEFAULT_CONFIG, PART_LABELS, STRAP_COLORS } from './config/options.js';
import { formatPersianTime, toPersianDigits } from './utils/time.js';

function resolveConfig(cfg) {
  const colors = STRAP_COLORS[cfg.strapType] || STRAP_COLORS.leather;
  const strapColorDef = colors.find((c) => c.id === cfg.strapColor) || colors[0];
  const strapLengthCount = { short: 5, standard: 7, long: 9 }[cfg.strapLength] || 7;
  return { ...cfg, strapColorDef, strapLengthCount };
}

export default function App() {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [theme, setTheme] = useState('dark');
  const [fps, setFps] = useState(0);
  const [tooltip, setTooltip] = useState(null); // { part, x, y }
  const [arState, setArState] = useState('checking'); // checking | supported | unsupported | active
  const [showARMessage, setShowARMessage] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const [loading, setLoading] = useState(true);
  const [arPlacedHint, setArPlacedHint] = useState(false);

  const stageRef = useRef(null);
  const videoRef = useRef(null);
  const arOverlayRef = useRef(null);
  const sceneRef = useRef(null);

  // ساخت صحنه (بارگذاری تأخیری Three.js برای اولین رندر سریع)
  useEffect(() => {
    let scene;
    let cancelled = false;
    (async () => {
      const { WatchScene } = await import('./scene/WatchScene.js');
      if (cancelled || !stageRef.current) return;
      scene = new WatchScene(stageRef.current, {
        onFPS: setFps,
        onHover: (part) => setTooltip((t) => (part ? t : null)),
        onHoverMove: (part, x, y) => setTooltip({ part, x, y }),
        onARStateChange: setArState,
        onARPlaced: () => setArPlacedHint(true),
      });
      sceneRef.current = scene;
      scene.setTheme(theme === 'dark');
      scene.setConfig(resolveConfig(DEFAULT_CONFIG));
      setLoading(false);
      const ok = await scene.supportsAR();
      if (!cancelled) setArState(ok ? 'supported' : 'unsupported');
      // وقتی فونت فارسی آماده شد، بافت صفحه (برند و اعداد) بازترسیم می‌شود
      document.fonts?.ready?.then(() => {
        if (!cancelled && sceneRef.current === scene) sceneRef.current.refreshDial();
      });
    })();
    return () => {
      cancelled = true;
      scene?.dispose();
      sceneRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // اعمال تغییرات پیکربندی روی صحنه
  useEffect(() => {
    sceneRef.current?.setConfig(resolveConfig(config));
  }, [config]);

  // ساعت دیجیتال و تاریخ شمسی
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const updateConfig = useCallback((partial) => {
    setConfig((prev) => {
      const next = { ...prev, ...partial };
      // هنگام تغییر نوع بند، رنگ پیش‌فرضِ همان نوع انتخاب می‌شود
      if (partial.strapType && partial.strapType !== prev.strapType) {
        next.strapColor = STRAP_COLORS[partial.strapType][0].id;
      }
      return next;
    });
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    sceneRef.current?.setTheme(next === 'dark');
  };

  const resetCamera = () => sceneRef.current?.resetCamera();

  const handleAR = async () => {
    const scene = sceneRef.current;
    if (!scene) return;
    if (arState === 'active') {
      scene.exitAR();
      return;
    }
    try {
      setArPlacedHint(false);
      await scene.enterAR(arOverlayRef.current);
    } catch (err) {
      if (err?.message === 'WEBXR_NOT_SUPPORTED' || err?.name === 'NotSupportedError') {
        setArState('unsupported');
      }
      setShowARMessage(true);
    }
  };

  const startCameraPreview = async () => {
    setShowARMessage(false);
    try {
      await sceneRef.current?.startCameraPreview(videoRef.current);
      setPreviewMode(true);
    } catch {
      alert('دسترسی به دوربین ممکن نیست. لطفاً مجوز دوربین را بررسی کنید.');
    }
  };

  const stopCameraPreview = () => {
    sceneRef.current?.stopCameraPreview();
    setPreviewMode(false);
  };

  const dateStr = new Intl.DateTimeFormat('fa-IR', { dateStyle: 'full' }).format(now);
  const partInfo = tooltip?.part ? PART_LABELS[tooltip.part] : null;
  const arActive = arState === 'active';

  return (
    <div className="app" data-theme={theme}>
      <header className="app-header">
        <div className="brand">
          <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="نشان الماس" />
          <span className="title-text">الماس — سازندهٔ ساعت سه‌بعدی</span>
        </div>
        <div className="clock-wrap">
          <span className="fps-badge" title="نرخ فریم رندر">
            {toPersianDigits(fps)} فریم/ثانیه
          </span>
          <span className="clock-date">{dateStr}</span>
          <span className="clock-time">{formatPersianTime(now)}</span>
        </div>
        <div className="header-actions">
          <button className="btn btn-ghost btn-icon" onClick={toggleTheme} title="تغییر حالت روشن/تیره">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button className="btn btn-primary" onClick={handleAR} disabled={arState === 'checking'}>
            <span>⌚</span>
            <span className="btn-label">{arActive ? 'خروج از AR' : 'امتحان روی مچ دست'}</span>
          </button>
        </div>
      </header>

      <div className="app-main">
        <div className="stage" ref={stageRef}>
          <video ref={videoRef} className="camera-video" playsInline muted style={{ display: previewMode ? 'block' : 'none' }} />

          <div className="stage-overlay-ui stage-buttons">
            <button className="btn" onClick={resetCamera} title="بازنشانی دوربین">
              🎯 <span className="btn-label">بازنشانی دوربین</span>
            </button>
            {previewMode && (
              <button className="btn" onClick={stopCameraPreview}>
                ⏹ <span className="btn-label">توقف دوربین</span>
              </button>
            )}
          </div>

          <div className="stage-overlay-ui stage-hint">
            بکشید و بچرخانید • اسکرول یا دو انگشت = بزرگ‌نمایی • ماوس را نزدیک اجزا ببرید
          </div>

          {/* پوشش WebXR (نمایش روی دوربین در حالت AR) */}
          <div className={`ar-overlay${arActive ? ' active' : ''}`} ref={arOverlayRef}>
            <div className="ar-banner">
              {arActive && !arPlacedHint
                ? 'دوربین را آرام روی مچ دست بگیرید؛ با ظاهر شدن حلقهٔ آبی، برای قرار دادن ساعت ضرب بزنید.'
                : 'ساعت روی مچ قرار گرفت! برای جابه‌جایی، جای دیگری را ضرب بزنید.'}
            </div>
            <div className="ar-controls">
              <button className="btn" onClick={() => sceneRef.current?.rotateARWatch(Math.PI / 6)}>
                ↺ چرخش
              </button>
              <button className="btn" onClick={() => sceneRef.current?.rotateARWatch(-Math.PI / 6)}>
                ↻ چرخش
              </button>
              <button className="btn" onClick={() => sceneRef.current?.scaleARWatch(1.15)}>
                ➕ بزرگ‌تر
              </button>
              <button className="btn" onClick={() => sceneRef.current?.scaleARWatch(1 / 1.15)}>
                ➖ کوچک‌تر
              </button>
              <button className="btn btn-primary" onClick={() => sceneRef.current?.exitAR()}>
                خروج از AR
              </button>
            </div>
          </div>

          <div className={`loading-veil${loading ? '' : ' hidden'}`}>
            <div className="spinner" />
            <div>در حال آماده‌سازی کارگاه ساعت‌سازی…</div>
          </div>
        </div>

        <ControlPanel config={config} onChange={updateConfig} />
      </div>

      {partInfo && tooltip && (
        <div
          className="part-tooltip"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          <strong>{partInfo.label}</strong>
          <span>{partInfo.hint}</span>
        </div>
      )}

      {showARMessage && (
        <div className="modal-backdrop" onClick={() => setShowARMessage(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>واقعیت افزوده روی این دستگاه در دسترس نیست</h2>
            <ul>
              <li>حالت «امتحان روی مچ» به WebXR نیاز دارد.</li>
              <li>روی اندروید از Chrome یا Edge (نسخهٔ ۸۱ به بعد) استفاده کنید.</li>
              <li>سایت باید روی HTTPS باز شده باشد.</li>
              <li>روی دسکتاپ معمولاً WebXR-AR فعال نیست؛ می‌توانید از پیش‌نمایش دوربین استفاده کنید.</li>
            </ul>
            <div className="modal-actions">
              <button className="btn" onClick={() => setShowARMessage(false)}>
                بستن
              </button>
              <button className="btn btn-primary" onClick={startCameraPreview}>
                📹 پیش‌نمایش با دوربین
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
