import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Plus, X, Bell, Globe2, Sun, Moon, AlarmClock,
  Trash2, Volume2, VolumeX, Search, Radio, Pin, Copy, Check,
  Timer as TimerIcon, Play, Pause, RotateCcw, Flag, ArrowUpDown, Sparkles,
  Star, GripVertical, ChevronLeft, ChevronRight, CalendarDays,
  Cloud, CloudRain, CloudSnow, CloudFog, CloudDrizzle, CloudLightning, MapPinned
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Reference data                                                     */
/* ------------------------------------------------------------------ */

const TIMEZONES = [
  { tz: 'America/Los_Angeles', city: 'Los Angeles', region: 'USA', lat: 34.05, lon: -118.24 },
  { tz: 'America/Denver', city: 'Denver', region: 'USA', lat: 39.74, lon: -104.99 },
  { tz: 'America/Chicago', city: 'Chicago', region: 'USA', lat: 41.88, lon: -87.63 },
  { tz: 'America/New_York', city: 'New York', region: 'USA', lat: 40.71, lon: -74.01 },
  { tz: 'America/Sao_Paulo', city: 'Sao Paulo', region: 'Brazil', lat: -23.55, lon: -46.63 },
  { tz: 'Atlantic/Reykjavik', city: 'Reykjavik', region: 'Iceland', lat: 64.15, lon: -21.94 },
  { tz: 'Europe/London', city: 'London', region: 'UK', lat: 51.51, lon: -0.13 },
  { tz: 'Europe/Paris', city: 'Paris', region: 'France', lat: 48.85, lon: 2.35 },
  { tz: 'Europe/Berlin', city: 'Berlin', region: 'Germany', lat: 52.52, lon: 13.40 },
  { tz: 'Europe/Moscow', city: 'Moscow', region: 'Russia', lat: 55.76, lon: 37.62 },
  { tz: 'Africa/Cairo', city: 'Cairo', region: 'Egypt', lat: 30.04, lon: 31.24 },
  { tz: 'Africa/Johannesburg', city: 'Johannesburg', region: 'South Africa', lat: -26.20, lon: 28.05 },
  { tz: 'Asia/Dubai', city: 'Dubai', region: 'UAE', lat: 25.20, lon: 55.27 },
  { tz: 'Asia/Kolkata', city: 'Mumbai', region: 'India', lat: 19.08, lon: 72.88 },
  { tz: 'Asia/Dhaka', city: 'Dhaka', region: 'Bangladesh', lat: 23.81, lon: 90.41 },
  { tz: 'Asia/Bangkok', city: 'Bangkok', region: 'Thailand', lat: 13.76, lon: 100.50 },
  { tz: 'Asia/Shanghai', city: 'Shanghai', region: 'China', lat: 31.23, lon: 121.47 },
  { tz: 'Asia/Tokyo', city: 'Tokyo', region: 'Japan', lat: 35.68, lon: 139.65 },
  { tz: 'Asia/Seoul', city: 'Seoul', region: 'South Korea', lat: 37.57, lon: 126.98 },
  { tz: 'Australia/Perth', city: 'Perth', region: 'Australia', lat: -31.95, lon: 115.86 },
  { tz: 'Australia/Sydney', city: 'Sydney', region: 'Australia', lat: -33.87, lon: 151.21 },
  { tz: 'Pacific/Auckland', city: 'Auckland', region: 'New Zealand', lat: -36.85, lon: 174.76 },
  { tz: 'Pacific/Honolulu', city: 'Honolulu', region: 'USA', lat: 21.31, lon: -157.86 },
].map((z, i) => ({ id: `${z.tz}-${i}`, ...z }));

const DEFAULT_IDS = [
  'America/New_York-3', 'Europe/London-6', 'Asia/Kolkata-13', 'Asia/Tokyo-17', 'Australia/Sydney-20',
];

const WEEKDAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

/* ------------------------------------------------------------------ */
/*  Time helpers                                                       */
/* ------------------------------------------------------------------ */

function zonedNow(date, tz) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', weekday: 'short',
  }).formatToParts(date);
  const m = {};
  parts.forEach(p => { m[p.type] = p.value; });
  return new Date(Date.UTC(
    Number(m.year), Number(m.month) - 1, Number(m.day),
    Number(m.hour), Number(m.minute), Number(m.second), date.getMilliseconds()
  ));
}

function offsetLabel(date, tz) {
  try {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'shortOffset' }).formatToParts(date);
    const p = parts.find(x => x.type === 'timeZoneName');
    return p ? p.value.replace('GMT', 'UTC') : 'UTC';
  } catch { return 'UTC'; }
}

function offsetMinutes(label) {
  const m = /UTC([+-])(\d{1,2})(?::(\d{2}))?/.exec(label);
  if (!m) return 0;
  const sign = m[1] === '-' ? -1 : 1;
  return sign * (Number(m[2]) * 60 + Number(m[3] || 0));
}

function pad(n) { return String(n).padStart(2, '0'); }

function greetingFor(hour) {
  if (hour < 5) return 'Quiet hours';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 21) return 'Good evening';
  return 'Winding down';
}

function fmtStopwatch(ms) {
  const cs = Math.floor((ms % 1000) / 10);
  const s = Math.floor(ms / 1000) % 60;
  const m = Math.floor(ms / 60000) % 60;
  const h = Math.floor(ms / 3600000);
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}.${pad(cs)}` : `${pad(m)}:${pad(s)}.${pad(cs)}`;
}

function fmtCountdown(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const s = total % 60;
  const m = Math.floor(total / 60) % 60;
  const h = Math.floor(total / 3600);
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

/* ------------------------------------------------------------------ */
/*  Split-flap digit display — each character re-triggers a flip       */
/*  animation only when its own value changes (keyed remount trick).   */
/* ------------------------------------------------------------------ */

function FlipDigits({ text, className = '' }) {
  return (
    <span className={`wc-flip-row ${className}`}>
      {text.split('').map((ch, i) => (
        <span key={`${i}-${ch}`} className={ch === ':' ? 'wc-flip-colon' : 'wc-flip-char'}>
          {ch}
        </span>
      ))}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Smoothly animates a numeric value toward its latest target         */
/* ------------------------------------------------------------------ */

function useCountUp(target, duration = 500) {
  const [display, setDisplay] = useState(target);
  const prevRef = useRef(target);
  useEffect(() => {
    if (target == null || Number.isNaN(target)) return;
    const start = prevRef.current ?? target;
    const t0 = performance.now();
    let raf;
    const step = (t) => {
      const p = Math.min(1, (t - t0) / duration);
      setDisplay(start + (target - start) * p);
      if (p < 1) raf = requestAnimationFrame(step);
      else prevRef.current = target;
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return display ?? target;
}

/* ------------------------------------------------------------------ */
/*  localStorage persistence                                           */
/*  Falls back silently to in-memory state if storage is unavailable   */
/*  (e.g. inside Claude.ai's sandboxed artifact preview). Works        */
/*  normally once this project is built and served for real.           */
/* ------------------------------------------------------------------ */

function useStickyState(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const raw = window.localStorage.getItem(key);
      return raw !== null ? JSON.parse(raw) : initialValue;
    } catch {
      return initialValue;
    }
  });
  useEffect(() => {
    try { window.localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable */ }
  }, [key, value]);
  return [value, setValue];
}

/* ------------------------------------------------------------------ */
/*  Weather (Open-Meteo — free, keyless, CORS-enabled)                 */
/* ------------------------------------------------------------------ */

function weatherIcon(code) {
  if (code === 0) return Sun;
  if ([1, 2, 3].includes(code)) return Cloud;
  if ([45, 48].includes(code)) return CloudFog;
  if ([51, 53, 55, 56, 57].includes(code)) return CloudDrizzle;
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return CloudRain;
  if ([71, 73, 75, 77, 85, 86].includes(code)) return CloudSnow;
  if ([95, 96, 99].includes(code)) return CloudLightning;
  return Cloud;
}

function useWeather(clocks) {
  const [data, setData] = useState({}); // id -> { tempC, code, loading, error }

  useEffect(() => {
    const missing = clocks.filter(c => !data[c.id]);
    if (missing.length === 0) return;
    missing.forEach(async (c) => {
      setData(prev => ({ ...prev, [c.id]: { loading: true } }));
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${c.lat}&longitude=${c.lon}&current_weather=true`;
        const res = await fetch(url);
        const json = await res.json();
        const cw = json.current_weather;
        setData(prev => ({ ...prev, [c.id]: { tempC: cw.temperature, code: cw.weathercode, loading: false } }));
      } catch {
        setData(prev => ({ ...prev, [c.id]: { loading: false, error: true } }));
      }
    });
  }, [clocks]); // eslint-disable-line react-hooks/exhaustive-deps

  // periodic refresh every 20 minutes
  useEffect(() => {
    const id = setInterval(() => setData({}), 20 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  return data;
}

/* ------------------------------------------------------------------ */
/*  Analog clock — brass instrument face                               */
/* ------------------------------------------------------------------ */

function AnalogClock({ h, m, s, ms, accent }) {
  const hourAngle = ((h % 12) + m / 60) * 30;
  const minAngle = (m + s / 60) * 6;
  const secAngle = (s + ms / 1000) * 6;

  const ticks = [];
  for (let i = 0; i < 60; i++) {
    const angle = i * 6;
    const major = i % 5 === 0;
    const r1 = major ? 76 : 82;
    const r2 = 88;
    const rad = (angle - 90) * (Math.PI / 180);
    ticks.push(
      <line
        key={i}
        x1={100 + r1 * Math.cos(rad)} y1={100 + r1 * Math.sin(rad)}
        x2={100 + r2 * Math.cos(rad)} y2={100 + r2 * Math.sin(rad)}
        stroke={major ? 'var(--face-tick-major)' : 'var(--face-tick-minor)'}
        strokeWidth={major ? 2 : 1}
        strokeLinecap="round"
      />
    );
  }

  return (
    <svg viewBox="0 0 200 200" className="wc-face">
      <defs>
        <radialGradient id={`dial-${accent}`} cx="35%" cy="30%" r="80%">
          <stop offset="0%" stopColor="var(--dial-hi)" />
          <stop offset="100%" stopColor="var(--dial-lo)" />
        </radialGradient>
        <filter id={`glow-${accent}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <circle cx="100" cy="100" r="96" fill="none" stroke="var(--face-rim)" strokeWidth="2.5" className="wc-face-rim" />
      <circle cx="100" cy="100" r="90" fill={`url(#dial-${accent})`} />
      {ticks}

      <line x1="100" y1="100" x2="100" y2="52"
        stroke="var(--hand-hour)" strokeWidth="5" strokeLinecap="round"
        transform={`rotate(${hourAngle} 100 100)`} />
      <line x1="100" y1="100" x2="100" y2="32"
        stroke="var(--hand-minute)" strokeWidth="3.5" strokeLinecap="round"
        transform={`rotate(${minAngle} 100 100)`} />

      {/* comet trail — faint echoes of the second hand's recent sweep */}
      {[18, 12, 7, 3].map((back, i) => {
        const trailAngle = secAngle - back;
        const rad = (trailAngle - 90) * (Math.PI / 180);
        return (
          <circle
            key={i}
            cx={100 + 76 * Math.cos(rad)} cy={100 + 76 * Math.sin(rad)}
            r={1.6 - i * 0.25} fill="var(--accent)" opacity={0.28 - i * 0.06}
          />
        );
      })}

      <g className="wc-second-hand" transform={`rotate(${secAngle} 100 100)`} filter={`url(#glow-${accent})`}>
        <line x1="100" y1="114" x2="100" y2="24" stroke="var(--accent)" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="100" cy="24" r="2.4" fill="var(--accent)" />
      </g>

      <circle cx="100" cy="100" r="5.5" fill="var(--face-rim)" />
      <circle cx="100" cy="100" r="2.4" fill="var(--accent)" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Day / night ring                                                   */
/* ------------------------------------------------------------------ */

function DayNightRing({ hour, minute }) {
  const frac = (hour + minute / 60) / 24;
  const angle = frac * 360;
  const gradient = `conic-gradient(
    from 0deg,
    var(--night) 0deg 90deg,
    var(--dawn) 90deg 105deg,
    var(--day) 105deg 255deg,
    var(--dusk) 255deg 270deg,
    var(--night) 270deg 360deg
  )`;
  return (
    <div className="wc-ring" style={{ background: gradient }}>
      <div className="wc-ring-marker" style={{ transform: `rotate(${angle}deg)` }}>
        <span className="wc-ring-dot" />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Clock card                                                         */
/* ------------------------------------------------------------------ */

function ClockCard({
  entry, now, format24h, onRemove, onPinHome, onCopy, onToggleFavorite,
  isHome, isFavorite, isRemoving, index, weather, onFocus,
  draggable, onDragStart, onDragEnter, onDragEnd, isDropTarget,
}) {
  const cardRef = useRef(null);
  const z = zonedNow(now, entry.tz);
  const h = z.getUTCHours(), m = z.getUTCMinutes(), s = z.getUTCSeconds(), ms = z.getUTCMilliseconds();
  const displayH = format24h ? h : (h % 12 === 0 ? 12 : h % 12);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const dateStr = `${WEEKDAY[z.getUTCDay()]}, ${MONTH[z.getUTCMonth()]} ${z.getUTCDate()}`;
  const WIcon = weather && !weather.loading && !weather.error ? weatherIcon(weather.code) : null;
  const animatedTemp = useCountUp(weather && !weather.loading && !weather.error ? weather.tempC : null);
  const timeStr = `${pad(displayH)}:${pad(m)}:${pad(s)}`;

  const handleMove = (e) => {
    const rect = cardRef.current.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * 100;
    const py = ((e.clientY - rect.top) / rect.height) * 100;
    cardRef.current.style.setProperty('--mx', `${px}%`);
    cardRef.current.style.setProperty('--my', `${py}%`);
    cardRef.current.style.setProperty('--rx', `${((py - 50) / 50) * -4}deg`);
    cardRef.current.style.setProperty('--ry', `${((px - 50) / 50) * 4}deg`);
  };
  const handleLeave = () => {
    if (!cardRef.current) return;
    cardRef.current.style.setProperty('--rx', `0deg`);
    cardRef.current.style.setProperty('--ry', `0deg`);
  };

  return (
    <div
      ref={cardRef}
      className={`wc-card ${isHome ? 'wc-card-home' : ''} ${isRemoving ? 'wc-card-exit' : 'wc-card-enter'} ${isDropTarget ? 'wc-card-drop-target' : ''}`}
      style={{ animationDelay: `${index * 55}ms` }}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      draggable={draggable}
      onDragStart={() => onDragStart(entry.id)}
      onDragEnter={() => onDragEnter(entry.id)}
      onDragEnd={onDragEnd}
      onDragOver={(e) => e.preventDefault()}
    >
      <span className="wc-card-glow" />
      <span className="wc-card-glow-mask" />
      <span className="wc-card-spotlight" />
      <DayNightRing hour={h} minute={m} />

      {draggable && (
        <span className="wc-drag-handle" title="Drag to reorder">
          <GripVertical size={13} />
        </span>
      )}

      <div className="wc-card-actions">
        <button className={`wc-mini-btn ${isFavorite ? 'wc-mini-btn-fav' : ''}`} onClick={() => onToggleFavorite(entry.id)} title="Favorite">
          <Star size={12} fill={isFavorite ? 'currentColor' : 'none'} />
        </button>
        <button className="wc-mini-btn" onClick={() => onPinHome(entry.id)} title="Set as home">
          <Pin size={12} />
        </button>
        <button className="wc-mini-btn" onClick={() => onCopy(entry, `${pad(displayH)}:${pad(m)}:${pad(s)}${!format24h ? ' ' + ampm : ''}`)} title="Copy time">
          <Copy size={12} />
        </button>
        <button className="wc-mini-btn wc-mini-btn-danger" onClick={() => onRemove(entry.id)} title="Remove">
          <X size={12} />
        </button>
      </div>

      <div className="wc-card-face" onClick={() => onFocus(entry.id)} title="Expand">
        <AnalogClock h={h} m={m} s={s} ms={ms} accent={entry.id} />
      </div>

      <div className="wc-card-info">
        <div className="wc-card-eyebrow">
          <span>{entry.region}</span>
          <span className="wc-dot-sep">·</span>
          <span>{offsetLabel(now, entry.tz)}</span>
        </div>
        <div className="wc-card-city">
          {entry.city}
          {isHome && <span className="wc-home-tag">HOME</span>}
          {isFavorite && <Star size={11} className="wc-fav-star" fill="currentColor" />}
        </div>
        <div className="wc-card-digital">
          <FlipDigits text={timeStr} />
          {!format24h && <span className="wc-ampm">{ampm}</span>}
        </div>
        <div className="wc-card-date">{dateStr}</div>
        <div className="wc-card-weather">
          {weather?.loading && <span className="wc-weather-loading">fetching weather…</span>}
          {weather?.error && <span className="wc-weather-loading">weather unavailable</span>}
          {WIcon && (
            <span className="wc-weather-chip">
              <WIcon size={13} /> {Math.round(animatedTemp)}°C
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  World meridian strip — stylized timezone map                       */
/* ------------------------------------------------------------------ */

function WorldStrip({ clocks, now, homeId }) {
  const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  const sunLon = -((utcMinutes / 1440) * 360 - 180); // approximate subsolar longitude
  const sunPct = ((sunLon + 180) / 360) * 100;

  const gradient = `linear-gradient(to right,
    var(--night) 0%,
    var(--night) ${Math.max(0, sunPct - 30)}%,
    var(--dawn) ${Math.max(0, sunPct - 18)}%,
    var(--day) ${Math.max(0, sunPct - 8)}%,
    var(--day) ${Math.min(100, sunPct + 8)}%,
    var(--dusk) ${Math.min(100, sunPct + 18)}%,
    var(--night) ${Math.min(100, sunPct + 30)}%,
    var(--night) 100%)`;

  return (
    <div className="wc-strip wc-strip-enter">
      <div className="wc-strip-label"><MapPinned size={13} /> World meridian strip</div>
      <div className="wc-strip-band" style={{ background: gradient }}>
        <div className="wc-strip-sun" style={{ left: `${sunPct}%` }}>
          <span className="wc-strip-sun-core" />
          <span className="wc-strip-sun-pulse" />
          <span className="wc-strip-sun-pulse wc-strip-sun-pulse-2" />
        </div>
        {clocks.map(c => {
          const z = zonedNow(now, c.tz);
          const hour = z.getUTCHours();
          const pct = ((c.lon + 180) / 360) * 100;
          const isDay = hour >= 6 && hour < 18;
          return (
            <div
              key={c.id}
              className={`wc-strip-marker ${c.id === homeId ? 'wc-strip-marker-home' : ''}`}
              style={{ left: `${pct}%` }}
              title={`${c.city} · ${pad(hour)}:${pad(z.getUTCMinutes())}`}
            >
              <span className={`wc-strip-dot ${isDay ? 'wc-strip-dot-day' : 'wc-strip-dot-night'}`} />
              <span className="wc-strip-tag">{c.city}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Ambient background                                                 */
/* ------------------------------------------------------------------ */

function AmbientBackground({ theme }) {
  const stars = useMemo(() => Array.from({ length: 50 }, (_, i) => ({
    id: i,
    top: Math.random() * 100,
    left: Math.random() * 100,
    size: Math.random() * 1.8 + 0.6,
    delay: Math.random() * 6,
    dur: 3 + Math.random() * 4,
  })), []);

  if (theme === 'daylight') {
    return (
      <div className="wc-ambient wc-ambient-day" aria-hidden="true">
        <div className="wc-cloud wc-cloud-a" />
        <div className="wc-cloud wc-cloud-b" />
        <div className="wc-cloud wc-cloud-c" />
      </div>
    );
  }
  return (
    <div className="wc-ambient wc-ambient-night" aria-hidden="true">
      <div className="wc-aurora wc-aurora-a" />
      <div className="wc-aurora wc-aurora-b" />
      <div className="wc-aurora wc-aurora-c" />
      {stars.map(st => (
        <span
          key={st.id}
          className="wc-star"
          style={{
            top: `${st.top}%`, left: `${st.left}%`,
            width: `${st.size}px`, height: `${st.size}px`,
            animationDelay: `${st.delay}s`, animationDuration: `${st.dur}s`,
          }}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Focus overlay — big hero clock, opened by clicking a card's face   */
/* ------------------------------------------------------------------ */

function FocusOverlay({ entry, now, format24h, weather, onClose }) {
  if (!entry) return null;
  const z = zonedNow(now, entry.tz);
  const h = z.getUTCHours(), m = z.getUTCMinutes(), s = z.getUTCSeconds(), ms = z.getUTCMilliseconds();
  const displayH = format24h ? h : (h % 12 === 0 ? 12 : h % 12);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const dateStr = `${WEEKDAY[z.getUTCDay()]}, ${MONTH[z.getUTCMonth()]} ${z.getUTCDate()}, ${z.getUTCFullYear()}`;
  const WIcon = weather && !weather.loading && !weather.error ? weatherIcon(weather.code) : null;

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="wc-focus-scrim" onClick={onClose}>
      <div className="wc-focus-panel" onClick={(e) => e.stopPropagation()}>
        <button className="wc-icon-btn wc-focus-close" onClick={onClose}><X size={16} /></button>
        <div className="wc-focus-face">
          <AnalogClock h={h} m={m} s={s} ms={ms} accent={`focus-${entry.id}`} />
        </div>
        <div className="wc-focus-city">{entry.city}</div>
        <div className="wc-focus-region">{entry.region} · {offsetLabel(now, entry.tz)}</div>
        <div className="wc-focus-digital">
          <FlipDigits text={`${pad(displayH)}:${pad(m)}:${pad(s)}`} />
          {!format24h && <span className="wc-ampm">{ampm}</span>}
        </div>
        <div className="wc-focus-date">{dateStr}</div>
        {WIcon && (
          <span className="wc-weather-chip wc-focus-weather">
            <WIcon size={15} /> {Math.round(weather.tempC)}°C
          </span>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sparkle burst — celebratory particles on alarm / timer completion  */
/* ------------------------------------------------------------------ */

function SparkleBurst({ triggerKey }) {
  const [particles, setParticles] = useState([]);
  useEffect(() => {
    if (!triggerKey) return;
    const arr = Array.from({ length: 20 }, (_, i) => ({
      id: `${triggerKey}-${i}`,
      angle: (i / 20) * 360 + Math.random() * 12,
      dist: 90 + Math.random() * 70,
      delay: Math.random() * 0.12,
    }));
    setParticles(arr);
    const t = setTimeout(() => setParticles([]), 1000);
    return () => clearTimeout(t);
  }, [triggerKey]);

  if (particles.length === 0) return null;
  return (
    <div className="wc-burst" aria-hidden="true">
      {particles.map(p => (
        <span
          key={p.id}
          className="wc-burst-particle"
          style={{ '--ang': `${p.angle}deg`, '--dist': `${p.dist}px`, animationDelay: `${p.delay}s` }}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Add-city menu                                                      */
/* ------------------------------------------------------------------ */

function AddCityMenu({ open, onClose, onAdd, onAddCustom, activeIds, allEntries }) {
  const [query, setQuery] = useState('');
  const [remoteResults, setRemoteResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const localResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    return TIMEZONES.filter(t => !activeIds.includes(t.id))
      .filter(t => !q || t.city.toLowerCase().includes(q) || t.region.toLowerCase().includes(q))
      .slice(0, 6);
  }, [query, activeIds]);

  // worldwide search — Open-Meteo's free, keyless geocoding API covers
  // essentially any populated place on Earth, not just our curated list.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) { setRemoteResults([]); setSearching(false); return; }
    setSearching(true);
    const handle = setTimeout(async () => {
      try {
        const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=8&language=en&format=json`;
        const res = await fetch(url);
        const json = await res.json();
        setRemoteResults(json.results || []);
      } catch {
        setRemoteResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => clearTimeout(handle);
  }, [query]);

  if (!open) return null;

  const pickRemote = (r) => {
    const city = r.name;
    const region = [r.admin1, r.country].filter(Boolean).join(', ') || r.country || '';
    const existing = allEntries.find(e =>
      e.tz === r.timezone && e.city.toLowerCase() === city.toLowerCase()
    );
    if (existing) {
      onAdd(existing.id);
    } else {
      onAddCustom({ tz: r.timezone, city, region, lat: r.latitude, lon: r.longitude });
    }
    setQuery('');
    setRemoteResults([]);
    onClose();
  };

  // dedupe remote results against the curated list already shown above
  const filteredRemote = remoteResults.filter(r =>
    !localResults.some(l => l.tz === r.timezone && l.city.toLowerCase() === r.name.toLowerCase())
  );

  return (
    <div className="wc-popover">
      <div className="wc-popover-search">
        <Search size={14} />
        <input
          autoFocus
          placeholder="Search any city worldwide…"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        {searching && <span className="wc-popover-spinner" />}
      </div>
      <div className="wc-popover-list">
        {localResults.map(t => (
          <button key={t.id} className="wc-popover-item" onClick={() => { onAdd(t.id); setQuery(''); onClose(); }}>
            <span>{t.city}</span>
            <span className="wc-popover-region">{t.region}</span>
          </button>
        ))}

        {filteredRemote.length > 0 && (
          <div className="wc-popover-divider"><Globe2 size={10} /> More places</div>
        )}
        {filteredRemote.map(r => (
          <button key={`${r.id}`} className="wc-popover-item" onClick={() => pickRemote(r)}>
            <span>{r.name}</span>
            <span className="wc-popover-region">{[r.admin1, r.country].filter(Boolean).join(', ')}</span>
          </button>
        ))}

        {localResults.length === 0 && filteredRemote.length === 0 && !searching && (
          <div className="wc-popover-empty">
            {query.trim().length < 2 ? 'Type at least 2 letters to search any city worldwide.' : 'No cities found.'}
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Alarms tab                                                         */
/* ------------------------------------------------------------------ */

function AlarmsTab({ alarms, onAdd, onToggle, onDelete, clocks, now, allEntries }) {
  const [time, setTime] = useState('07:30');
  const [label, setLabel] = useState('');
  const [tzId, setTzId] = useState(clocks[0]?.id || '');

  useEffect(() => { if (!tzId && clocks[0]) setTzId(clocks[0].id); }, [clocks, tzId]);

  const submit = (e) => {
    e.preventDefault();
    if (!time || !tzId) return;
    onAdd({ id: `alarm-${Date.now()}`, time, label: label.trim() || 'Alarm', tzId, enabled: true });
    setLabel('');
  };

  const nextFire = (alarm) => {
    const entry = clocks.find(c => c.id === alarm.tzId) || allEntries.find(c => c.id === alarm.tzId);
    if (!entry) return null;
    const z = zonedNow(now, entry.tz);
    const [hh, mm] = alarm.time.split(':').map(Number);
    let target = new Date(Date.UTC(z.getUTCFullYear(), z.getUTCMonth(), z.getUTCDate(), hh, mm, 0, 0));
    if (target <= z) target = new Date(target.getTime() + 86400000);
    const totalMin = Math.round((target - z) / 60000);
    const hrs = Math.floor(totalMin / 60), mins = totalMin % 60;
    return hrs > 0 ? `in ${hrs}h ${mins}m` : `in ${mins}m`;
  };

  return (
    <>
      <form className="wc-alarm-form" onSubmit={submit}>
        <div className="wc-form-row">
          <input type="time" value={time} onChange={e => setTime(e.target.value)} required />
          <select value={tzId} onChange={e => setTzId(e.target.value)}>
            {clocks.map(c => <option key={c.id} value={c.id}>{c.city}</option>)}
          </select>
        </div>
        <div className="wc-form-row">
          <input
            type="text" placeholder="Label (optional)" value={label}
            onChange={e => setLabel(e.target.value)} maxLength={40}
          />
          <button type="submit" className="wc-btn-primary"><Plus size={15} /> Add</button>
        </div>
      </form>

      <div className="wc-alarm-list">
        {alarms.length === 0 && (
          <div className="wc-empty-state">No alarms set. Add one above to get a chime at that local time.</div>
        )}
        {alarms.map(a => {
          const entry = clocks.find(c => c.id === a.tzId) || allEntries.find(c => c.id === a.tzId);
          return (
            <div key={a.id} className={`wc-alarm-item ${a.enabled ? '' : 'wc-alarm-disabled'}`}>
              <button className="wc-toggle" onClick={() => onToggle(a.id)} aria-label="Toggle alarm">
                <span className="wc-toggle-knob" />
              </button>
              <div className="wc-alarm-body">
                <div className="wc-alarm-time">{a.time} <span className="wc-alarm-city">{entry?.city || '—'}</span></div>
                <div className="wc-alarm-meta">{a.label} · {a.enabled ? nextFire(a) : 'off'}</div>
              </div>
              <button className="wc-icon-btn" onClick={() => onDelete(a.id)}><Trash2 size={14} /></button>
            </div>
          );
        })}
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Stopwatch tab                                                      */
/* ------------------------------------------------------------------ */

function StopwatchTab({ sw, setSw, nowMs }) {
  const live = sw.elapsed + (sw.running ? nowMs - sw.startedAt : 0);

  const start = () => setSw(s => ({ ...s, running: true, startedAt: nowMs }));
  const pause = () => setSw(s => ({ ...s, running: false, elapsed: s.elapsed + (nowMs - s.startedAt) }));
  const reset = () => setSw({ running: false, elapsed: 0, startedAt: 0, laps: [] });
  const lap = () => setSw(s => ({ ...s, laps: [live, ...s.laps] }));

  return (
    <div className="wc-tool-panel">
      <div className="wc-tool-display">{fmtStopwatch(live)}</div>
      <div className="wc-tool-controls">
        {!sw.running ? (
          <button className="wc-btn-primary" onClick={start}><Play size={14} /> {sw.elapsed > 0 ? 'Resume' : 'Start'}</button>
        ) : (
          <button className="wc-btn-primary wc-btn-pause" onClick={pause}><Pause size={14} /> Pause</button>
        )}
        <button className="wc-icon-btn" onClick={lap} disabled={!sw.running} title="Lap"><Flag size={14} /></button>
        <button className="wc-icon-btn" onClick={reset} title="Reset"><RotateCcw size={14} /></button>
      </div>
      {sw.laps.length > 0 && (
        <div className="wc-lap-list">
          {sw.laps.map((l, i) => (
            <div key={i} className="wc-lap-row">
              <span>Lap {sw.laps.length - i}</span>
              <span className="wc-lap-time">{fmtStopwatch(l)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Timer tab                                                          */
/* ------------------------------------------------------------------ */

function TimerTab({ tm, setTm, nowMs }) {
  const [mm, setMm] = useState(5);
  const [ss, setSs] = useState(0);
  const remaining = tm.running ? Math.max(0, tm.remaining - (nowMs - tm.startedAt)) : tm.remaining;
  const pct = tm.duration > 0 ? 1 - remaining / tm.duration : 0;

  const startTimer = () => {
    const duration = tm.remaining > 0 ? tm.remaining : (mm * 60 + ss) * 1000;
    if (duration <= 0) return;
    setTm({ running: true, remaining: duration, duration: tm.duration > 0 ? tm.duration : duration, startedAt: nowMs, done: false });
  };
  const pauseTimer = () => setTm(t => ({ ...t, running: false, remaining: Math.max(0, t.remaining - (nowMs - t.startedAt)) }));
  const resetTimer = () => setTm({ running: false, remaining: 0, duration: 0, startedAt: 0, done: false });

  return (
    <div className="wc-tool-panel">
      <div className="wc-timer-ring-wrap">
        <svg viewBox="0 0 120 120" className="wc-timer-ring">
          <circle cx="60" cy="60" r="52" className="wc-timer-track" />
          <circle
            cx="60" cy="60" r="52" className="wc-timer-progress"
            strokeDasharray={2 * Math.PI * 52}
            strokeDashoffset={2 * Math.PI * 52 * (1 - (tm.duration > 0 ? pct : 0))}
          />
        </svg>
        <div className="wc-timer-readout">{fmtCountdown(remaining)}</div>
      </div>

      {tm.duration === 0 && !tm.running && (
        <div className="wc-form-row">
          <input type="number" min="0" max="59" value={mm} onChange={e => setMm(Number(e.target.value))} />
          <span className="wc-timer-sep">min</span>
          <input type="number" min="0" max="59" value={ss} onChange={e => setSs(Number(e.target.value))} />
          <span className="wc-timer-sep">sec</span>
        </div>
      )}

      <div className="wc-tool-controls">
        {!tm.running ? (
          <button className="wc-btn-primary" onClick={startTimer}><Play size={14} /> {tm.remaining > 0 ? 'Resume' : 'Start'}</button>
        ) : (
          <button className="wc-btn-primary wc-btn-pause" onClick={pauseTimer}><Pause size={14} /> Pause</button>
        )}
        <button className="wc-icon-btn" onClick={resetTimer} title="Reset"><RotateCcw size={14} /></button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Calendar tab                                                       */
/* ------------------------------------------------------------------ */

function CalendarTab({ now, homeEntry }) {
  const homeZ = homeEntry ? zonedNow(now, homeEntry.tz) : now;
  const [cursor, setCursor] = useState(() => ({ y: homeZ.getUTCFullYear(), m: homeZ.getUTCMonth() }));

  const firstOfMonth = new Date(Date.UTC(cursor.y, cursor.m, 1));
  const startDow = firstOfMonth.getUTCDay();
  const daysInMonth = new Date(Date.UTC(cursor.y, cursor.m + 1, 0)).getUTCDate();

  const cells = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const isToday = (d) => d === homeZ.getUTCDate() && cursor.m === homeZ.getUTCMonth() && cursor.y === homeZ.getUTCFullYear();

  const shiftMonth = (delta) => setCursor(c => {
    let m = c.m + delta, y = c.y;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    return { y, m };
  });

  return (
    <div className="wc-tool-panel wc-calendar">
      <div className="wc-cal-head">
        <button className="wc-icon-btn" onClick={() => shiftMonth(-1)}><ChevronLeft size={14} /></button>
        <div className="wc-cal-title">{MONTH[cursor.m]} {cursor.y}</div>
        <button className="wc-icon-btn" onClick={() => shiftMonth(1)}><ChevronRight size={14} /></button>
      </div>
      <div className="wc-cal-sub">Today in {homeEntry?.city || 'home city'}: {WEEKDAY[homeZ.getUTCDay()]}, {MONTH[homeZ.getUTCMonth()]} {homeZ.getUTCDate()}</div>
      <div className="wc-cal-grid wc-cal-grid-head">
        {WEEKDAY.map(d => <div key={d} className="wc-cal-dow">{d}</div>)}
      </div>
      <div className="wc-cal-grid">
        {cells.map((d, i) => (
          <div key={i} className={`wc-cal-cell ${d ? '' : 'wc-cal-cell-empty'} ${d && isToday(d) ? 'wc-cal-cell-today' : ''}`}>
            {d || ''}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Drawer shell (tabs)                                                */
/* ------------------------------------------------------------------ */

function ToolDrawer({ open, onClose, tab, setTab, soundOn, setSoundOn, ...rest }) {
  return (
    <>
      <div className={`wc-scrim ${open ? 'wc-scrim-visible' : ''}`} onClick={onClose} />
      <aside className={`wc-drawer ${open ? 'wc-drawer-open' : ''}`}>
        <div className="wc-drawer-head">
          <div className="wc-drawer-title"><AlarmClock size={16} /> Time Tools</div>
          <div className="wc-drawer-head-actions">
            <button className="wc-icon-btn" onClick={() => setSoundOn(s => !s)} title="Toggle alarm sound">
              {soundOn ? <Volume2 size={15} /> : <VolumeX size={15} />}
            </button>
            <button className="wc-icon-btn" onClick={onClose}><X size={16} /></button>
          </div>
        </div>

        <div className="wc-tabs">
          <button className={`wc-tab ${tab === 'alarms' ? 'wc-tab-active' : ''}`} onClick={() => setTab('alarms')}>
            <Bell size={13} /> Alarms
          </button>
          <button className={`wc-tab ${tab === 'stopwatch' ? 'wc-tab-active' : ''}`} onClick={() => setTab('stopwatch')}>
            <TimerIcon size={13} /> Watch
          </button>
          <button className={`wc-tab ${tab === 'timer' ? 'wc-tab-active' : ''}`} onClick={() => setTab('timer')}>
            <AlarmClock size={13} /> Timer
          </button>
          <button className={`wc-tab ${tab === 'calendar' ? 'wc-tab-active' : ''}`} onClick={() => setTab('calendar')}>
            <CalendarDays size={13} /> Cal
          </button>
        </div>

        <div className="wc-drawer-body">
          {tab === 'alarms' && (
            <AlarmsTab alarms={rest.alarms} onAdd={rest.onAddAlarm} onToggle={rest.onToggleAlarm}
              onDelete={rest.onDeleteAlarm} clocks={rest.clocks} now={rest.now} allEntries={rest.allEntries} />
          )}
          {tab === 'stopwatch' && <StopwatchTab sw={rest.sw} setSw={rest.setSw} nowMs={rest.nowMs} />}
          {tab === 'timer' && <TimerTab tm={rest.tm} setTm={rest.setTm} nowMs={rest.nowMs} />}
          {tab === 'calendar' && <CalendarTab now={rest.now} homeEntry={rest.homeEntry} />}
        </div>
      </aside>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Toast                                                              */
/* ------------------------------------------------------------------ */

function ToastStack({ toasts, onDismiss }) {
  if (toasts.length === 0) return null;
  return (
    <div className="wc-toast-stack">
      {toasts.map(t => (
        <div key={t.key} className={`wc-toast ${t.kind === 'info' ? 'wc-toast-info' : ''}`}>
          <div className="wc-toast-icon">{t.kind === 'info' ? <Check size={16} /> : <Bell size={16} />}</div>
          <div className="wc-toast-body">
            <div className="wc-toast-title">{t.title}</div>
            {t.sub && <div className="wc-toast-sub">{t.sub}</div>}
          </div>
          {t.kind !== 'info' && <button className="wc-btn-ghost" onClick={() => onDismiss(t.key)}>Dismiss</button>}
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Root application                                                   */
/* ------------------------------------------------------------------ */

export default function WorldClockDashboard() {
  const [now, setNow] = useState(new Date());
  const [clockIds, setClockIds] = useStickyState('meridian:clockIds', DEFAULT_IDS);
  const [customCities, setCustomCities] = useStickyState('meridian:customCities', []);
  const [favorites, setFavorites] = useStickyState('meridian:favorites', []);
  const [removingIds, setRemovingIds] = useState(new Set());
  const [format24h, setFormat24h] = useStickyState('meridian:format24h', false);
  const [theme, setTheme] = useStickyState('meridian:theme', 'midnight');
  const [addOpen, setAddOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState('alarms');
  const [sortDir, setSortDir] = useState('default');
  const [favOnly, setFavOnly] = useState(false);
  const [alarms, setAlarms] = useStickyState('meridian:alarms', [
    { id: 'seed-1', time: '08:00', label: 'Morning briefing', tzId: DEFAULT_IDS[0], enabled: true },
  ]);
  const [soundOn, setSoundOn] = useStickyState('meridian:soundOn', true);
  const [toasts, setToasts] = useState([]);
  const [sw, setSw] = useState({ running: false, elapsed: 0, startedAt: 0, laps: [] });
  const [tm, setTm] = useState({ running: false, remaining: 0, duration: 0, startedAt: 0, done: false });
  const [focusedId, setFocusedId] = useState(null);
  const [burstKey, setBurstKey] = useState(0);

  const firedRef = useRef(new Set());
  const timerFiredRef = useRef(false);
  const audioCtxRef = useRef(null);
  const dragIdRef = useRef(null);
  const [dropTargetId, setDropTargetId] = useState(null);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 100);
    return () => clearInterval(id);
  }, []);

  // global ripple effect: any button-like control gets a click ripple for free
  useEffect(() => {
    const RIPPLE_SELECTOR = '.wc-btn, .wc-btn-primary, .wc-icon-btn, .wc-mini-btn, .wc-tab, .wc-btn-ghost';
    const handler = (e) => {
      const el = e.target.closest(RIPPLE_SELECTOR);
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * 1.6;
      const span = document.createElement('span');
      span.className = 'wc-ripple';
      span.style.width = span.style.height = `${size}px`;
      span.style.left = `${e.clientX - rect.left - size / 2}px`;
      span.style.top = `${e.clientY - rect.top - size / 2}px`;
      el.appendChild(span);
      setTimeout(() => span.remove(), 650);
    };
    document.addEventListener('pointerdown', handler);
    return () => document.removeEventListener('pointerdown', handler);
  }, []);

  const allEntries = useMemo(() => [...TIMEZONES, ...customCities], [customCities]);

  const clocks = useMemo(
    () => clockIds.map(id => allEntries.find(t => t.id === id)).filter(Boolean),
    [clockIds, allEntries]
  );

  const weather = useWeather(clocks);

  const visibleClocks = useMemo(
    () => favOnly ? clocks.filter(c => favorites.includes(c.id)) : clocks,
    [clocks, favOnly, favorites]
  );

  const sortedClocks = useMemo(() => {
    if (sortDir === 'default') return visibleClocks;
    const ref = new Date();
    const withOffset = visibleClocks.map(c => ({ c, off: offsetMinutes(offsetLabel(ref, c.tz)) }));
    withOffset.sort((a, b) => sortDir === 'asc' ? a.off - b.off : b.off - a.off);
    return withOffset.map(x => x.c);
  }, [visibleClocks, sortDir]);

  const addClock = useCallback((id) => setClockIds(prev => prev.includes(id) ? prev : [...prev, id]), [setClockIds]);

  const addCustomCity = useCallback((cityData) => {
    const id = `${cityData.tz}-custom-${Date.now()}`;
    setCustomCities(prev => [...prev, { id, ...cityData }]);
    setClockIds(prev => [...prev, id]);
  }, [setCustomCities, setClockIds]);

  const removeClock = useCallback((id) => {
    setRemovingIds(prev => new Set(prev).add(id));
    setTimeout(() => {
      setClockIds(prev => prev.filter(x => x !== id));
      setRemovingIds(prev => { const n = new Set(prev); n.delete(id); return n; });
    }, 220);
  }, [setClockIds]);

  const pinHome = useCallback((id) => setClockIds(prev => [id, ...prev.filter(x => x !== id)]), [setClockIds]);

  const toggleFavorite = useCallback((id) => setFavorites(prev =>
    prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
  ), [setFavorites]);

  // drag-to-reorder (only meaningful in default sort order)
  const handleDragStart = useCallback((id) => { dragIdRef.current = id; }, []);
  const handleDragEnter = useCallback((id) => { if (dragIdRef.current !== id) setDropTargetId(id); }, []);
  const handleDragEnd = useCallback(() => {
    const fromId = dragIdRef.current, toId = dropTargetId;
    if (fromId && toId && fromId !== toId) {
      setClockIds(prev => {
        const arr = [...prev];
        const from = arr.indexOf(fromId), to = arr.indexOf(toId);
        if (from === -1 || to === -1) return prev;
        arr.splice(from, 1);
        arr.splice(to, 0, fromId);
        return arr;
      });
    }
    dragIdRef.current = null;
    setDropTargetId(null);
  }, [dropTargetId, setClockIds]);

  const addAlarm = useCallback((a) => setAlarms(prev => [...prev, a]), [setAlarms]);
  const toggleAlarm = useCallback((id) => setAlarms(prev => prev.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a)), [setAlarms]);
  const deleteAlarm = useCallback((id) => setAlarms(prev => prev.filter(a => a.id !== id)), [setAlarms]);

  const playChime = useCallback(() => {
    if (!soundOn) return;
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();
      const t0 = ctx.currentTime;
      [0, 0.22, 0.44].forEach(offset => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.0001, t0 + offset);
        gain.gain.exponentialRampToValueAtTime(0.18, t0 + offset + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, t0 + offset + 0.2);
        osc.connect(gain).connect(ctx.destination);
        osc.start(t0 + offset);
        osc.stop(t0 + offset + 0.22);
      });
    } catch { /* audio unavailable */ }
  }, [soundOn]);

  const dismissToast = useCallback((key) => setToasts(prev => prev.filter(t => t.key !== key)), []);

  const pushToast = useCallback((toast) => {
    setToasts(prev => [...prev, toast]);
    if (toast.kind === 'info') setTimeout(() => dismissToast(toast.key), 2200);
  }, [dismissToast]);

  const copyTime = useCallback((entry, timeStr) => {
    const text = `${timeStr} — ${entry.city} (${entry.region})`;
    if (navigator.clipboard) navigator.clipboard.writeText(text).catch(() => {});
    pushToast({ key: `copy-${Date.now()}`, kind: 'info', title: 'Copied to clipboard', sub: text });
  }, [pushToast]);

  useEffect(() => {
    alarms.forEach(a => {
      if (!a.enabled) return;
      const entry = allEntries.find(t => t.id === a.tzId);
      if (!entry) return;
      const z = zonedNow(now, entry.tz);
      const hh = pad(z.getUTCHours()), mm2 = pad(z.getUTCMinutes());
      const dayKey = `${z.getUTCFullYear()}-${z.getUTCMonth()}-${z.getUTCDate()}`;
      const fireKey = `${a.id}-${dayKey}-${hh}:${mm2}`;
      if (`${hh}:${mm2}` === a.time && z.getUTCSeconds() === 0 && !firedRef.current.has(fireKey)) {
        firedRef.current.add(fireKey);
        playChime();
        pushToast({ key: fireKey, kind: 'alarm', title: a.label, sub: `${a.time} · ${entry.city}` });
        setBurstKey(Date.now());
      }
    });
  }, [now, alarms, playChime, pushToast, allEntries]);

  useEffect(() => {
    if (!tm.running) { timerFiredRef.current = false; return; }
    const remaining = Math.max(0, tm.remaining - (now.getTime() - tm.startedAt));
    if (remaining <= 0 && !timerFiredRef.current) {
      timerFiredRef.current = true;
      playChime();
      pushToast({ key: `timer-${Date.now()}`, kind: 'alarm', title: 'Timer complete', sub: 'Countdown reached zero' });
      setBurstKey(Date.now());
      setTm({ running: false, remaining: 0, duration: 0, startedAt: 0, done: true });
    }
  }, [now, tm, playChime, pushToast]);

  const activeAlarmCount = alarms.filter(a => a.enabled).length;
  const homeEntry = clocks[0];
  const homeHour = homeEntry ? zonedNow(now, homeEntry.tz).getUTCHours() : now.getHours();
  const canDrag = sortDir === 'default' && !favOnly;

  return (
    <div className={`wc-app wc-theme-${theme}`}>
      <style>{CSS}</style>
      <AmbientBackground theme={theme} />

      <header className="wc-header wc-header-enter">
        <div className="wc-brand">
          <Radio size={18} className="wc-brand-icon" />
          <div>
            <div className="wc-brand-title">MERIDIAN</div>
            <div className="wc-brand-sub">
              <Sparkles size={11} className="wc-brand-sub-icon" />
              {greetingFor(homeHour)}{homeEntry ? ` in ${homeEntry.city}` : ''}
            </div>
          </div>
        </div>

        <div className="wc-header-controls">
          <div className="wc-add-wrap">
            <button className="wc-btn" onClick={() => setAddOpen(o => !o)}>
              <Plus size={15} /> Add city
            </button>
            <AddCityMenu
              open={addOpen} onClose={() => setAddOpen(false)}
              onAdd={addClock} onAddCustom={addCustomCity}
              activeIds={clockIds} allEntries={allEntries}
            />
          </div>

          <button className={`wc-btn wc-btn-icon ${favOnly ? 'wc-btn-active' : ''}`} onClick={() => setFavOnly(f => !f)} title="Show favorites only">
            <Star size={15} fill={favOnly ? 'currentColor' : 'none'} />
          </button>

          <button
            className="wc-btn wc-btn-icon"
            onClick={() => setSortDir(d => d === 'default' ? 'asc' : d === 'asc' ? 'desc' : 'default')}
            title="Sort by offset"
          >
            <ArrowUpDown size={15} />
            {sortDir !== 'default' && <span className="wc-sort-tag">{sortDir === 'asc' ? 'W→E' : 'E→W'}</span>}
          </button>

          <button className="wc-btn wc-btn-toggle" onClick={() => setFormat24h(f => !f)}>
            {format24h ? '24H' : '12H'}
          </button>

          <button className="wc-btn wc-btn-icon" onClick={() => setTheme(t => t === 'midnight' ? 'daylight' : 'midnight')} title="Toggle theme">
            {theme === 'midnight' ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          <button className="wc-btn wc-btn-alarm" onClick={() => setDrawerOpen(true)}>
            <Bell size={15} />
            Tools
            {(activeAlarmCount > 0 || sw.running || tm.running) && <span className="wc-badge">{activeAlarmCount || '•'}</span>}
          </button>
        </div>
      </header>

      {clocks.length > 0 && <WorldStrip clocks={clocks} now={now} homeId={clockIds[0]} />}

      <main className="wc-grid">
        {sortedClocks.length === 0 && (
          <div className="wc-empty-grid">
            <Globe2 size={28} />
            <p>{favOnly ? 'No favorites yet — star a city to pin it here.' : (<>No cities on the board. Use <strong>Add city</strong> to bring a timezone online.</>)}</p>
          </div>
        )}
        {sortedClocks.map((entry, i) => (
          <ClockCard
            key={entry.id}
            entry={entry}
            now={now}
            format24h={format24h}
            onRemove={removeClock}
            onPinHome={pinHome}
            onCopy={copyTime}
            onToggleFavorite={toggleFavorite}
            isHome={entry.id === clockIds[0]}
            isFavorite={favorites.includes(entry.id)}
            isRemoving={removingIds.has(entry.id)}
            index={i}
            weather={weather[entry.id]}
            draggable={canDrag}
            onDragStart={handleDragStart}
            onDragEnter={handleDragEnter}
            onDragEnd={handleDragEnd}
            isDropTarget={dropTargetId === entry.id}
            onFocus={setFocusedId}
          />
        ))}
      </main>

      <ToolDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        tab={drawerTab}
        setTab={setDrawerTab}
        soundOn={soundOn}
        setSoundOn={setSoundOn}
        alarms={alarms}
        onAddAlarm={addAlarm}
        onToggleAlarm={toggleAlarm}
        onDeleteAlarm={deleteAlarm}
        clocks={clocks}
        now={now}
        sw={sw}
        setSw={setSw}
        tm={tm}
        setTm={setTm}
        nowMs={now.getTime()}
        homeEntry={homeEntry}
        allEntries={allEntries}
      />

      <ToastStack toasts={toasts} onDismiss={dismissToast} />
      <SparkleBurst triggerKey={burstKey} />
      {focusedId && (
        <FocusOverlay
          entry={clocks.find(c => c.id === focusedId)}
          now={now}
          format24h={format24h}
          weather={weather[focusedId]}
          onClose={() => setFocusedId(null)}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap');

.wc-app {
  --bg-void: #060a14;
  --surface: #0e1524;
  --surface-raised: #131c30;
  --border: rgba(201,161,92,0.16);
  --brass: #c9a15c;
  --accent: #c9a15c;
  --cyan: #4fd8d0;
  --alarm-red: #e2585b;
  --text-primary: #e9ecf3;
  --text-muted: #7c879c;
  --dial-hi: #1c2740;
  --dial-lo: #0c1220;
  --face-rim: #c9a15c;
  --face-tick-major: #c9a15c;
  --face-tick-minor: rgba(201,161,92,0.35);
  --hand-hour: #e9ecf3;
  --hand-minute: #e9ecf3;
  --night: #0a1120;
  --dawn: #7a5a3a;
  --day: #e3b56a;
  --dusk: #7a4a4a;
  --clock-face: 148px;
  --clock-ring: 168px;

  position: relative;
  min-height: 100vh;
  background:
    radial-gradient(ellipse at 20% -10%, rgba(201,161,92,0.08), transparent 55%),
    radial-gradient(ellipse at 90% 10%, rgba(79,216,208,0.06), transparent 50%),
    var(--bg-void);
  color: var(--text-primary);
  font-family: 'Inter', sans-serif;
  padding: 28px clamp(16px, 4vw, 48px) 64px;
  box-sizing: border-box;
  overflow: hidden;
}

.wc-app.wc-theme-daylight {
  --bg-void: #eef1f6;
  --surface: #ffffff;
  --surface-raised: #f6f4ee;
  --border: rgba(120,90,40,0.14);
  --text-primary: #1c2230;
  --text-muted: #5c6478;
  --dial-hi: #fbf7ee;
  --dial-lo: #e9e1cd;
  --face-rim: #a8813f;
  --face-tick-major: #a8813f;
  --face-tick-minor: rgba(168,129,63,0.4);
  --hand-hour: #23283a;
  --hand-minute: #23283a;
}

.wc-app * { box-sizing: border-box; }

/* ---------- ambient background ---------- */
.wc-ambient { position: absolute; inset: 0; overflow: hidden; pointer-events: none; z-index: 0; }
.wc-star { position: absolute; border-radius: 50%; background: #fff; opacity: 0.15; animation: wc-twinkle ease-in-out infinite; }
@keyframes wc-twinkle { 0%, 100% { opacity: 0.1; transform: scale(0.8); } 50% { opacity: 0.9; transform: scale(1.3); } }
.wc-cloud { position: absolute; border-radius: 50%; background: radial-gradient(circle, rgba(255,255,255,0.55), transparent 70%); filter: blur(6px); animation: wc-drift linear infinite; }
.wc-cloud-a { width: 320px; height: 180px; top: 6%; left: -10%; animation-duration: 70s; }
.wc-cloud-b { width: 240px; height: 140px; top: 40%; left: 60%; animation-duration: 90s; animation-delay: -20s; }
.wc-cloud-c { width: 200px; height: 120px; top: 75%; left: 10%; animation-duration: 80s; animation-delay: -40s; }
@keyframes wc-drift { from { transform: translateX(0); } to { transform: translateX(60px); } }
.wc-aurora { position: absolute; border-radius: 50%; filter: blur(50px); mix-blend-mode: screen; opacity: 0.35; animation: wc-aurora-drift ease-in-out infinite alternate; }
.wc-aurora-a { width: 460px; height: 460px; top: -160px; left: -120px; background: radial-gradient(circle, var(--brass), transparent 65%); animation-duration: 22s; }
.wc-aurora-b { width: 520px; height: 520px; bottom: -220px; right: -160px; background: radial-gradient(circle, var(--cyan), transparent 65%); animation-duration: 26s; animation-delay: -6s; }
.wc-aurora-c { width: 380px; height: 380px; top: 40%; left: 40%; background: radial-gradient(circle, rgba(226,88,91,0.6), transparent 65%); animation-duration: 30s; animation-delay: -12s; }
@keyframes wc-aurora-drift { from { transform: translate(0, 0) scale(1); } to { transform: translate(40px, -30px) scale(1.15); } }
@media (prefers-reduced-motion: reduce) { .wc-star, .wc-cloud, .wc-aurora { animation: none !important; } }

.wc-header, .wc-grid, .wc-drawer, .wc-toast-stack, .wc-scrim, .wc-strip { position: relative; z-index: 2; }

/* ---------- entrances ---------- */
@keyframes wc-fade-down { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
.wc-header-enter { animation: wc-fade-down .5s cubic-bezier(.2,.8,.25,1) both; }
.wc-strip-enter { animation: wc-fade-down .5s cubic-bezier(.2,.8,.25,1) .1s both; }

/* ---------- header ---------- */
.wc-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px; padding-bottom: 22px; margin-bottom: 20px; border-bottom: 1px solid var(--border); }
.wc-brand { display: flex; align-items: center; gap: 10px; }
.wc-brand-icon { color: var(--brass); animation: wc-radio-pulse 3s ease-in-out infinite; }
@keyframes wc-radio-pulse { 0%, 100% { opacity: 0.75; } 50% { opacity: 1; filter: drop-shadow(0 0 4px var(--brass)); } }
.wc-brand-title { font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: 20px; letter-spacing: 0.22em; color: var(--text-primary); }
.wc-brand-sub { font-size: 11.5px; color: var(--text-muted); letter-spacing: 0.03em; margin-top: 2px; display: flex; align-items: center; gap: 4px; }
.wc-brand-sub-icon { color: var(--accent); }

.wc-header-controls { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }

.wc-btn {
  display: inline-flex; align-items: center; gap: 6px; background: var(--surface-raised); color: var(--text-primary);
  border: 1px solid var(--border); border-radius: 8px; padding: 9px 14px; font-size: 13px; font-weight: 500;
  font-family: 'Inter', sans-serif; cursor: pointer; transition: border-color .15s ease, transform .12s ease, box-shadow .15s ease;
}
.wc-btn:hover { border-color: var(--brass); box-shadow: 0 0 0 3px rgba(201,161,92,0.1); transform: translateY(-1px); }
.wc-btn:active { transform: scale(0.96) translateY(0); }
.wc-btn-toggle { font-family: 'JetBrains Mono', monospace; letter-spacing: 0.04em; }
.wc-btn-icon { padding: 9px 10px; position: relative; }
.wc-btn-active { border-color: var(--accent); color: var(--accent); }
.wc-btn-alarm { position: relative; }
.wc-badge { background: var(--accent); color: var(--bg-void); font-size: 10.5px; font-weight: 700; border-radius: 999px; padding: 1px 6px; margin-left: 2px; }
.wc-sort-tag { font-family: 'JetBrains Mono', monospace; font-size: 10px; margin-left: 3px; color: var(--accent); }

.wc-add-wrap { position: relative; }

/* ---------- add-city popover ---------- */
.wc-popover { position: absolute; top: calc(100% + 8px); left: 0; z-index: 40; width: 260px; background: var(--surface-raised); border: 1px solid var(--border); border-radius: 10px; box-shadow: 0 12px 32px rgba(0,0,0,0.4); padding: 10px; animation: wc-pop-in .15s cubic-bezier(.2,.9,.3,1.2); }
@keyframes wc-pop-in { from { opacity: 0; transform: translateY(-6px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
.wc-popover-search { display: flex; align-items: center; gap: 8px; border: 1px solid var(--border); border-radius: 7px; padding: 7px 10px; color: var(--text-muted); margin-bottom: 8px; }
.wc-popover-search input { border: none; background: transparent; outline: none; color: var(--text-primary); font-size: 13px; width: 100%; font-family: 'Inter', sans-serif; }
.wc-popover-list { max-height: 220px; overflow-y: auto; display: flex; flex-direction: column; gap: 2px; }
.wc-popover-item { display: flex; justify-content: space-between; align-items: center; background: transparent; border: none; border-radius: 6px; padding: 8px 8px; cursor: pointer; color: var(--text-primary); font-size: 13px; font-family: 'Inter', sans-serif; text-align: left; transition: background .12s ease, padding-left .12s ease; }
.wc-popover-item:hover { background: rgba(201,161,92,0.14); padding-left: 12px; }
.wc-popover-region { color: var(--text-muted); font-size: 11.5px; }
.wc-popover-empty { color: var(--text-muted); font-size: 12.5px; padding: 8px; line-height: 1.5; }
.wc-popover-spinner {
  width: 12px; height: 12px; border-radius: 50%;
  border: 2px solid var(--border); border-top-color: var(--accent);
  animation: wc-spin 0.7s linear infinite; flex-shrink: 0;
}
.wc-popover-divider {
  display: flex; align-items: center; gap: 5px; font-size: 9.5px; letter-spacing: 0.08em; text-transform: uppercase;
  color: var(--text-muted); font-family: 'JetBrains Mono', monospace; padding: 8px 8px 2px;
}

/* ---------- world strip ---------- */
.wc-strip { margin-bottom: 22px; }
.wc-strip-label { display: flex; align-items: center; gap: 6px; font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--text-muted); font-family: 'JetBrains Mono', monospace; margin-bottom: 8px; }
.wc-strip-band { position: relative; height: 34px; border-radius: 8px; border: 1px solid var(--border); overflow: visible; }
.wc-strip-marker { position: absolute; top: 50%; transform: translate(-50%, -50%); display: flex; flex-direction: column; align-items: center; gap: 2px; cursor: default; }
.wc-strip-dot { width: 8px; height: 8px; border-radius: 50%; border: 2px solid var(--bg-void); box-shadow: 0 0 0 1px rgba(255,255,255,0.3); }
.wc-strip-dot-day { background: var(--accent); }
.wc-strip-dot-night { background: var(--cyan); }
.wc-strip-marker-home .wc-strip-dot { width: 10px; height: 10px; box-shadow: 0 0 8px var(--accent); }
.wc-strip-tag { position: absolute; top: 14px; font-size: 9px; color: var(--text-muted); white-space: nowrap; opacity: 0; transition: opacity .15s ease; font-family: 'JetBrains Mono', monospace; background: var(--surface); padding: 1px 4px; border-radius: 3px; border: 1px solid var(--border); }
.wc-strip-marker:hover .wc-strip-tag { opacity: 1; }

.wc-strip-sun { position: absolute; top: 50%; transform: translate(-50%, -50%); width: 0; height: 0; }
.wc-strip-sun-core { position: absolute; top: 50%; left: 50%; width: 6px; height: 6px; border-radius: 50%; background: #fff; transform: translate(-50%, -50%); box-shadow: 0 0 10px #fff; }
.wc-strip-sun-pulse {
  position: absolute; top: 50%; left: 50%; width: 6px; height: 6px; border-radius: 50%;
  border: 1.5px solid rgba(255,255,255,0.8); transform: translate(-50%, -50%);
  animation: wc-sun-ping 2.4s cubic-bezier(.2,.8,.3,1) infinite;
}
.wc-strip-sun-pulse-2 { animation-delay: 1.2s; }
@keyframes wc-sun-ping {
  0% { width: 6px; height: 6px; opacity: 0.8; }
  100% { width: 30px; height: 30px; opacity: 0; }
}

/* ---------- grid ---------- */
.wc-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(calc(var(--clock-face) + 100px), 1fr)); gap: 18px; }
.wc-empty-grid { grid-column: 1 / -1; display: flex; flex-direction: column; align-items: center; gap: 10px; color: var(--text-muted); padding: 60px 0; text-align: center; }

/* ---------- card ---------- */
.wc-card {
  --mx: 50%; --my: 50%; --rx: 0deg; --ry: 0deg;
  position: relative; background: var(--surface); border: 1px solid var(--border); border-radius: 16px;
  padding: 20px 18px 18px; display: flex; flex-direction: column; align-items: center; gap: 14px; overflow: hidden;
  transform: perspective(800px) rotateX(var(--rx)) rotateY(var(--ry)) translateY(0);
  transition: transform .25s cubic-bezier(.2,.8,.3,1), border-color .2s ease, box-shadow .3s ease;
  will-change: transform;
}
.wc-card:hover { border-color: rgba(201,161,92,0.5); box-shadow: 0 20px 40px -16px rgba(0,0,0,0.55), 0 0 0 1px rgba(201,161,92,0.1); }
.wc-card-home { border-color: rgba(201,161,92,0.4); animation: wc-breathe 4s ease-in-out infinite; }
@keyframes wc-breathe {
  0%, 100% { box-shadow: 0 0 0 0 rgba(201,161,92,0.18); }
  50% { box-shadow: 0 0 0 6px rgba(201,161,92,0.06); }
}
.wc-card-drop-target { border-color: var(--cyan); box-shadow: 0 0 0 2px var(--cyan); }

.wc-card-glow {
  position: absolute; inset: -3px; border-radius: 18px; z-index: 0;
  background: conic-gradient(var(--accent), transparent 22%, var(--cyan) 50%, transparent 72%, var(--accent));
  opacity: 0; transition: opacity .35s ease; animation: wc-spin 5s linear infinite; filter: blur(1px);
}
.wc-card:hover .wc-card-glow { opacity: 0.5; }
.wc-card-glow-mask { position: absolute; inset: 2px; border-radius: 14px; background: var(--surface); z-index: 0; }
@keyframes wc-spin { to { transform: rotate(360deg); } }

.wc-drag-handle { position: absolute; top: 10px; left: 10px; z-index: 5; color: var(--text-muted); cursor: grab; opacity: 0; transition: opacity .15s ease; }
.wc-card:hover .wc-drag-handle { opacity: 0.6; }
.wc-drag-handle:hover { opacity: 1 !important; }

.wc-card-spotlight { position: absolute; inset: 0; pointer-events: none; opacity: 0; background: radial-gradient(220px circle at var(--mx) var(--my), rgba(201,161,92,0.14), transparent 65%); transition: opacity .3s ease; z-index: 1; }
.wc-card:hover .wc-card-spotlight { opacity: 1; }

@keyframes wc-card-enter { from { opacity: 0; transform: translateY(16px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
.wc-card-enter { animation: wc-card-enter .45s cubic-bezier(.2,.8,.25,1) both; }
@keyframes wc-card-exit { from { opacity: 1; transform: scale(1); } to { opacity: 0; transform: scale(0.9) translateY(-6px); } }
.wc-card-exit { animation: wc-card-exit .22s ease-in forwards; pointer-events: none; }

.wc-card-actions { position: absolute; top: 10px; right: 10px; z-index: 5; display: flex; gap: 5px; opacity: 0; transform: translateY(-4px); transition: opacity .18s ease, transform .18s ease; }
.wc-card:hover .wc-card-actions { opacity: 1; transform: translateY(0); }
.wc-mini-btn { background: rgba(0,0,0,0.35); backdrop-filter: blur(4px); border: 1px solid var(--border); border-radius: 999px; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; color: var(--text-muted); cursor: pointer; transition: color .15s ease, border-color .15s ease, transform .12s ease; }
.wc-mini-btn:hover { color: var(--accent); border-color: var(--accent); transform: scale(1.1); }
.wc-mini-btn-danger:hover { color: var(--alarm-red); border-color: var(--alarm-red); }
.wc-mini-btn-fav { color: var(--accent); }

.wc-card-face { position: relative; width: var(--clock-face); height: var(--clock-face); z-index: 2; cursor: pointer; transition: transform .3s ease, width .25s ease, height .25s ease; }
.wc-card:hover .wc-card-face { transform: scale(1.03); }
.wc-face { width: 100%; height: 100%; display: block; }
.wc-face-rim { transition: filter .3s ease; }
.wc-card:hover .wc-face-rim { filter: drop-shadow(0 0 3px var(--accent)); }
.wc-second-hand { transition: filter .2s ease; }
.wc-card:hover .wc-second-hand line { stroke-width: 2.1; }

.wc-ring { position: absolute; top: 12px; left: 50%; transform: translateX(-50%); width: var(--clock-ring); height: var(--clock-ring); border-radius: 50%; padding: 3px; z-index: 1; -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 6px), #000 calc(100% - 5px)); mask: radial-gradient(farthest-side, transparent calc(100% - 6px), #000 calc(100% - 5px)); opacity: 0.85; transition: opacity .3s ease, width .25s ease, height .25s ease; }
.wc-card:hover .wc-ring { opacity: 1; }
.wc-ring-marker { position: absolute; inset: 0; display: flex; justify-content: center; transition: transform .3s ease; }
.wc-ring-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--accent); box-shadow: 0 0 6px var(--accent); margin-top: -2px; }

.wc-card-info { text-align: center; width: 100%; z-index: 2; }
.wc-card-eyebrow { font-size: 10.5px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--text-muted); font-family: 'JetBrains Mono', monospace; display: flex; align-items: center; justify-content: center; gap: 6px; }
.wc-dot-sep { opacity: 0.5; }
.wc-card-city { font-size: 17px; font-weight: 600; margin-top: 4px; display: flex; align-items: center; justify-content: center; gap: 6px; }
.wc-fav-star { color: var(--accent); }
.wc-home-tag { font-size: 9px; font-family: 'JetBrains Mono', monospace; letter-spacing: 0.08em; background: rgba(201,161,92,0.18); color: var(--accent); border: 1px solid var(--border); border-radius: 4px; padding: 2px 5px; }
.wc-card-digital { font-family: 'JetBrains Mono', monospace; font-size: 26px; font-weight: 600; margin-top: 8px; letter-spacing: 0.02em; font-variant-numeric: tabular-nums; perspective: 200px; }
.wc-flip-row { display: inline-flex; }
.wc-flip-char {
  display: inline-block; min-width: 0.62em; text-align: center;
  transform-origin: 50% 60%; animation: wc-flip-in .4s cubic-bezier(.2,.9,.25,1);
}
.wc-flip-colon { display: inline-block; opacity: 0.6; }
@keyframes wc-flip-in {
  0% { transform: rotateX(-100deg); opacity: 0.3; filter: brightness(1.7); }
  55% { transform: rotateX(12deg); }
  100% { transform: rotateX(0deg); opacity: 1; filter: brightness(1); }
}
.wc-ampm { font-size: 12px; color: var(--text-muted); margin-left: 4px; }
.wc-card-date { font-size: 12px; color: var(--text-muted); margin-top: 3px; }
.wc-card-weather { margin-top: 8px; min-height: 18px; }
.wc-weather-chip { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; color: var(--text-primary); background: var(--surface-raised); border: 1px solid var(--border); border-radius: 999px; padding: 2px 8px; }
.wc-weather-loading { font-size: 10.5px; color: var(--text-muted); font-style: italic; }

/* ---------- scrim + drawer ---------- */
.wc-scrim { position: fixed; inset: 0; background: rgba(0,0,0,0.5); opacity: 0; pointer-events: none; transition: opacity .2s ease; z-index: 50; }
.wc-scrim-visible { opacity: 1; pointer-events: auto; }

.wc-drawer { position: fixed; top: 0; right: 0; height: 100%; width: 360px; max-width: 92vw; background: var(--surface); border-left: 1px solid var(--border); z-index: 60; transform: translateX(100%); transition: transform .28s cubic-bezier(.2,.8,.25,1); display: flex; flex-direction: column; padding: 20px; }
.wc-drawer-open { transform: translateX(0); }
.wc-drawer-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
.wc-drawer-title { display: flex; align-items: center; gap: 8px; font-weight: 600; font-size: 15px; }
.wc-drawer-head-actions { display: flex; gap: 6px; }
.wc-icon-btn { background: var(--surface-raised); border: 1px solid var(--border); border-radius: 7px; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; color: var(--text-primary); cursor: pointer; transition: border-color .15s ease, transform .12s ease; }
.wc-icon-btn:hover { border-color: var(--brass); transform: translateY(-1px); }
.wc-icon-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

.wc-tabs { display: flex; gap: 4px; background: var(--surface-raised); border-radius: 9px; padding: 4px; margin-bottom: 16px; }
.wc-tab { flex: 1; display: flex; align-items: center; justify-content: center; gap: 4px; background: transparent; border: none; border-radius: 6px; padding: 8px 4px; color: var(--text-muted); font-size: 11.5px; font-weight: 500; cursor: pointer; font-family: 'Inter', sans-serif; transition: background .15s ease, color .15s ease; }
.wc-tab-active { background: var(--surface); color: var(--accent); box-shadow: 0 1px 3px rgba(0,0,0,0.3); }
.wc-drawer-body { flex: 1; overflow-y: auto; display: flex; flex-direction: column; }

.wc-alarm-form { display: flex; flex-direction: column; gap: 8px; margin-bottom: 18px; }
.wc-form-row { display: flex; gap: 8px; align-items: center; }
.wc-form-row input[type="time"], .wc-form-row select, .wc-form-row input[type="text"], .wc-form-row input[type="number"] { flex: 1; background: var(--surface-raised); border: 1px solid var(--border); border-radius: 7px; padding: 8px 10px; color: var(--text-primary); font-size: 13px; font-family: 'Inter', sans-serif; min-width: 0; transition: border-color .15s ease; }
.wc-form-row input:focus, .wc-form-row select:focus { outline: none; border-color: var(--accent); }
.wc-timer-sep { font-size: 12px; color: var(--text-muted); }
.wc-btn-primary { display: flex; align-items: center; gap: 5px; justify-content: center; background: var(--accent); color: var(--bg-void); border: none; border-radius: 7px; padding: 8px 12px; font-size: 13px; font-weight: 600; cursor: pointer; white-space: nowrap; transition: transform .12s ease, box-shadow .15s ease; }
.wc-btn-primary:hover { box-shadow: 0 4px 14px rgba(201,161,92,0.35); transform: translateY(-1px); }
.wc-btn-pause { background: var(--text-muted); }

.wc-alarm-list { display: flex; flex-direction: column; gap: 8px; overflow-y: auto; flex: 1; }
.wc-empty-state { color: var(--text-muted); font-size: 13px; text-align: center; padding: 30px 10px; line-height: 1.5; }
.wc-alarm-item { display: flex; align-items: center; gap: 10px; background: var(--surface-raised); border: 1px solid var(--border); border-radius: 10px; padding: 10px; transition: border-color .15s ease; }
.wc-alarm-item:hover { border-color: rgba(201,161,92,0.3); }
.wc-alarm-disabled { opacity: 0.5; }
.wc-alarm-body { flex: 1; min-width: 0; }
.wc-alarm-time { font-family: 'JetBrains Mono', monospace; font-size: 15px; font-weight: 600; }
.wc-alarm-city { font-size: 11px; color: var(--text-muted); font-weight: 400; margin-left: 6px; }
.wc-alarm-meta { font-size: 11.5px; color: var(--text-muted); margin-top: 2px; }

.wc-toggle { width: 34px; height: 20px; border-radius: 999px; background: rgba(255,255,255,0.12); border: none; position: relative; cursor: pointer; flex-shrink: 0; transition: background .2s ease; }
.wc-alarm-item:not(.wc-alarm-disabled) .wc-toggle { background: var(--accent); }
.wc-toggle-knob { position: absolute; top: 2px; left: 2px; width: 16px; height: 16px; border-radius: 50%; background: #fff; transition: transform .18s cubic-bezier(.3,1.5,.5,1); }
.wc-alarm-item:not(.wc-alarm-disabled) .wc-toggle-knob { transform: translateX(14px); }

/* ---------- stopwatch / timer ---------- */
.wc-tool-panel { display: flex; flex-direction: column; align-items: center; gap: 18px; padding: 10px 0 20px; }
.wc-tool-display { font-family: 'JetBrains Mono', monospace; font-size: 40px; font-weight: 700; letter-spacing: 0.02em; font-variant-numeric: tabular-nums; }
.wc-tool-controls { display: flex; gap: 8px; align-items: center; }
.wc-lap-list { width: 100%; display: flex; flex-direction: column; gap: 6px; max-height: 180px; overflow-y: auto; }
.wc-lap-row { display: flex; justify-content: space-between; font-size: 12.5px; color: var(--text-muted); background: var(--surface-raised); border: 1px solid var(--border); border-radius: 6px; padding: 6px 10px; }
.wc-lap-time { font-family: 'JetBrains Mono', monospace; color: var(--text-primary); }

.wc-timer-ring-wrap { position: relative; width: 150px; height: 150px; }
.wc-timer-ring { width: 100%; height: 100%; transform: rotate(-90deg); }
.wc-timer-track { fill: none; stroke: var(--border); stroke-width: 6; }
.wc-timer-progress { fill: none; stroke: var(--accent); stroke-width: 6; stroke-linecap: round; transition: stroke-dashoffset .3s linear; }
.wc-timer-readout { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-family: 'JetBrains Mono', monospace; font-size: 24px; font-weight: 700; }

/* ---------- calendar ---------- */
.wc-calendar { width: 100%; align-items: stretch; gap: 10px; }
.wc-cal-head { display: flex; align-items: center; justify-content: space-between; }
.wc-cal-title { font-family: 'JetBrains Mono', monospace; font-weight: 600; font-size: 14px; letter-spacing: 0.04em; }
.wc-cal-sub { font-size: 11.5px; color: var(--text-muted); text-align: center; }
.wc-cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; }
.wc-cal-grid-head { margin-top: 6px; }
.wc-cal-dow { text-align: center; font-size: 10px; color: var(--text-muted); font-family: 'JetBrains Mono', monospace; letter-spacing: 0.05em; }
.wc-cal-cell { aspect-ratio: 1; display: flex; align-items: center; justify-content: center; font-size: 12.5px; border-radius: 6px; background: var(--surface-raised); color: var(--text-primary); }
.wc-cal-cell-empty { background: transparent; }
.wc-cal-cell-today { background: var(--accent); color: var(--bg-void); font-weight: 700; }

/* ---------- toast ---------- */
.wc-toast-stack { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); display: flex; flex-direction: column-reverse; gap: 8px; z-index: 80; width: min(360px, 90vw); }
.wc-toast { display: flex; align-items: center; gap: 10px; background: var(--surface-raised); border: 1px solid var(--accent); border-radius: 10px; padding: 12px 14px; box-shadow: 0 10px 30px rgba(0,0,0,0.4); animation: wc-toast-in .25s cubic-bezier(.2,.8,.3,1.1); }
.wc-toast-info { border-color: var(--cyan); }
@keyframes wc-toast-in { from { opacity: 0; transform: translateY(10px) scale(0.96); } to { opacity: 1; transform: translateY(0) scale(1); } }
.wc-toast-icon { color: var(--accent); flex-shrink: 0; }
.wc-toast-info .wc-toast-icon { color: var(--cyan); }
.wc-toast-body { flex: 1; min-width: 0; }
.wc-toast-title { font-weight: 600; font-size: 13.5px; }
.wc-toast-sub { font-size: 11.5px; color: var(--text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.wc-btn-ghost { background: transparent; border: 1px solid var(--border); border-radius: 6px; padding: 5px 10px; color: var(--text-primary); font-size: 12px; cursor: pointer; white-space: nowrap; transition: border-color .15s ease; }
.wc-btn-ghost:hover { border-color: var(--accent); }

/* ---------- click ripple ---------- */
.wc-btn, .wc-btn-primary, .wc-icon-btn, .wc-mini-btn, .wc-tab, .wc-btn-ghost { position: relative; overflow: hidden; }
.wc-ripple { position: absolute; border-radius: 50%; background: rgba(255,255,255,0.35); transform: scale(0); animation: wc-ripple-anim .65s ease-out; pointer-events: none; }
@keyframes wc-ripple-anim { to { transform: scale(1); opacity: 0; } }

/* ---------- focus overlay ---------- */
.wc-focus-scrim {
  position: fixed; inset: 0; z-index: 90; display: flex; align-items: center; justify-content: center;
  background: rgba(0,0,0,0.6); backdrop-filter: blur(6px); animation: wc-fade-in .2s ease-out;
}
@keyframes wc-fade-in { from { opacity: 0; } to { opacity: 1; } }
.wc-focus-panel {
  position: relative; background: var(--surface); border: 1px solid var(--border); border-radius: 22px;
  padding: 36px 40px 30px; display: flex; flex-direction: column; align-items: center; gap: 10px;
  box-shadow: 0 30px 80px rgba(0,0,0,0.5); animation: wc-focus-in .3s cubic-bezier(.2,.85,.25,1.05);
  max-width: 92vw;
}
@keyframes wc-focus-in { from { opacity: 0; transform: scale(0.85) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
.wc-focus-close { position: absolute; top: 14px; right: 14px; }
.wc-focus-face { width: 260px; height: 260px; margin-bottom: 6px; animation: wc-focus-face-in .5s cubic-bezier(.2,.85,.25,1.1); }
@keyframes wc-focus-face-in { from { transform: rotate(-8deg) scale(0.9); opacity: 0.4; } to { transform: rotate(0) scale(1); opacity: 1; } }
.wc-focus-city { font-size: 24px; font-weight: 700; }
.wc-focus-region { font-size: 12.5px; color: var(--text-muted); font-family: 'JetBrains Mono', monospace; letter-spacing: 0.06em; }
.wc-focus-digital { font-family: 'JetBrains Mono', monospace; font-size: 40px; font-weight: 700; margin-top: 10px; perspective: 240px; }
.wc-focus-date { font-size: 13px; color: var(--text-muted); margin-top: 2px; }
.wc-focus-weather { margin-top: 10px; font-size: 14px; padding: 5px 12px; }

/* ---------- sparkle burst ---------- */
.wc-burst { position: fixed; top: 50%; left: 50%; width: 0; height: 0; z-index: 95; pointer-events: none; }
.wc-burst-particle {
  position: absolute; width: 6px; height: 6px; border-radius: 50%; background: var(--accent);
  box-shadow: 0 0 8px var(--accent); transform: rotate(var(--ang)) translateX(0);
  animation: wc-burst-fly .9s ease-out forwards;
}
.wc-burst-particle:nth-child(3n) { background: var(--cyan); box-shadow: 0 0 8px var(--cyan); }
@keyframes wc-burst-fly { to { transform: rotate(var(--ang)) translateX(var(--dist)); opacity: 0; } }

@media (prefers-reduced-motion: reduce) {
  .wc-card-glow, .wc-card-home, .wc-strip-sun-pulse, .wc-ripple, .wc-burst-particle, .wc-flip-char, .wc-header-enter, .wc-strip-enter {
    animation: none !important;
  }
}

/* ---------- responsive ---------- */
@media (max-width: 640px) {
  .wc-header { flex-direction: column; align-items: flex-start; }
  .wc-header-controls { width: 100%; }
  .wc-btn { flex: 1; justify-content: center; }
  .wc-drawer { width: 100%; max-width: 100%; }
  .wc-card-actions, .wc-drag-handle { opacity: 1; transform: none; }
  .wc-strip-tag { display: none; }
}

@media (prefers-reduced-motion: reduce) {
  .wc-card, .wc-card-face, .wc-ring-marker, .wc-toast, .wc-popover, .wc-tick, .wc-card-enter, .wc-card-exit {
    animation: none !important; transition: none !important;
  }
}
`;