// Shared design tokens + UI primitives for Pulse
const T = {
  bg: '#0E0E10',
  card: '#1A1A1E',
  cardElev: '#222227',
  border: 'rgba(255,255,255,0.08)',
  borderStrong: 'rgba(255,255,255,0.14)',
  text: '#FFFFFF',
  textSub: 'rgba(255,255,255,0.6)',
  textMuted: 'rgba(255,255,255,0.42)',
  orange: '#FF5A1F',
  orangeSoft: 'rgba(255,90,31,0.16)',
  orangeDim: 'rgba(255,90,31,0.45)',
  blue: '#3B82F6',
  green: '#22C55E',
  red: '#EF4444',
};

// Card container
const Card = ({ children, style = {}, padded = true, onClick }) => (
  <div onClick={onClick} style={{
    background: T.card,
    border: `1px solid ${T.border}`,
    borderRadius: 16,
    padding: padded ? 16 : 0,
    cursor: onClick ? 'pointer' : 'default',
    ...style,
  }}>{children}</div>
);

// Tiny inline label
const Label = ({ children, style = {} }) => (
  <div style={{
    fontSize: 11, fontWeight: 500, letterSpacing: '0.06em',
    textTransform: 'uppercase', color: T.textSub, ...style,
  }}>{children}</div>
);

// Big number with optional unit
const Stat = ({ value, unit, size = 28, color = T.text, weight = 600 }) => (
  <div style={{
    display: 'flex', alignItems: 'baseline', gap: 4,
    fontVariantNumeric: 'tabular-nums',
    color, fontWeight: weight, fontSize: size, lineHeight: 1,
    letterSpacing: '-0.02em',
  }}>
    <span>{value}</span>
    {unit && <span style={{ fontSize: size * 0.45, fontWeight: 500, color: T.textSub, letterSpacing: 0 }}>{unit}</span>}
  </div>
);

// Activity icon disc (uses Icon)
const ActivityDisc = ({ type, size = 36, active = false }) => {
  const map = { Run: 'run', Ride: 'ride', Lift: 'lift', Swim: 'swim', Other: 'other' };
  return (
    <div style={{
      width: size, height: size, borderRadius: size / 2,
      background: active ? T.orange : 'rgba(255,255,255,0.06)',
      border: `1px solid ${active ? T.orange : T.border}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      <Icon name={map[type] || 'other'} size={size * 0.5} color={active ? '#0E0E10' : '#fff'} strokeWidth={2}/>
    </div>
  );
};

// Bottom tab bar
const TabBar = ({ active, onChange }) => {
  const tabs = [
    { id: 'home', label: 'Home', icon: 'home' },
    { id: 'log', label: 'Log', icon: 'plus' },
    { id: 'feed', label: 'Feed', icon: 'feed' },
    { id: 'profile', label: 'Profile', icon: 'profile' },
  ];
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      paddingBottom: 22, paddingTop: 8,
      background: 'linear-gradient(to top, rgba(14,14,16,1) 60%, rgba(14,14,16,0))',
      borderTop: `1px solid ${T.border}`,
      backdropFilter: 'blur(20px)',
      display: 'flex', justifyContent: 'space-around', alignItems: 'center',
      zIndex: 30,
    }}>
      {tabs.map(t => {
        const on = active === t.id;
        const isLog = t.id === 'log';
        return (
          <button key={t.id} onClick={() => onChange(t.id)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: 3, padding: '4px 12px',
            color: on ? T.orange : T.textMuted,
            transition: 'color 0.15s',
          }}>
            {isLog ? (
              <div style={{
                width: 36, height: 36, borderRadius: 12,
                background: on ? T.orange : 'rgba(255,255,255,0.06)',
                border: `1px solid ${on ? T.orange : T.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon name="plus" size={22} color={on ? '#0E0E10' : '#fff'} strokeWidth={2.25}/>
              </div>
            ) : (
              <Icon name={t.icon} size={24} color={on ? T.orange : T.textMuted} strokeWidth={on ? 2 : 1.75}/>
            )}
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.02em' }}>{t.label}</div>
          </button>
        );
      })}
    </div>
  );
};

// Weekly bar chart
const WeeklyBars = ({ data, height = 60, todayIdx = 5 }) => {
  const max = Math.max(...data, 1);
  const days = ['M','T','W','T','F','S','S'];
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: height + 18 }}>
      {data.map((v, i) => {
        const h = v === 0 ? 4 : Math.max(8, (v / max) * height);
        const isToday = i === todayIdx;
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', height, width: '100%', justifyContent: 'center' }}>
              <div style={{
                width: '100%', height: h, borderRadius: 4,
                background: v === 0 ? 'rgba(255,255,255,0.06)' :
                  isToday ? T.orange : 'rgba(255,90,31,0.55)',
                boxShadow: isToday ? '0 0 12px rgba(255,90,31,0.4)' : 'none',
              }}/>
            </div>
            <div style={{
              fontSize: 10, fontWeight: 600, letterSpacing: '0.05em',
              color: isToday ? T.orange : T.textMuted,
            }}>{days[i]}</div>
          </div>
        );
      })}
    </div>
  );
};

// Sparkline
const Sparkline = ({ data, width = 80, height = 24, color = T.orange }) => {
  const max = Math.max(...data), min = Math.min(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
};

// Segmented control (pills)
const Segmented = ({ options, value, onChange, accent = T.orange, size = 'md' }) => {
  const pad = size === 'sm' ? '6px 12px' : '10px 16px';
  const fs = size === 'sm' ? 12 : 13;
  return (
    <div style={{
      display: 'flex', gap: 4, padding: 4,
      background: 'rgba(255,255,255,0.04)',
      border: `1px solid ${T.border}`,
      borderRadius: 999,
    }}>
      {options.map(opt => {
        const v = typeof opt === 'string' ? opt : opt.value;
        const l = typeof opt === 'string' ? opt : opt.label;
        const on = v === value;
        return (
          <button key={v} onClick={() => onChange(v)} style={{
            flex: 1, padding: pad, borderRadius: 999, border: 'none',
            background: on ? accent : 'transparent',
            color: on ? '#0E0E10' : T.textSub,
            fontSize: fs, fontWeight: 600, letterSpacing: '-0.005em',
            cursor: 'pointer', transition: 'all 0.18s',
            fontFamily: 'inherit',
          }}>{l}</button>
        );
      })}
    </div>
  );
};

// Mini map route SVG (stylized polyline on dark)
const MiniRoute = ({ width = 80, height = 60, seed = 1 }) => {
  // deterministic squiggle
  const rng = (n) => Math.sin(seed * 9.7 + n * 2.3) * 0.5 + 0.5;
  const pts = [];
  const N = 12;
  for (let i = 0; i < N; i++) {
    const x = 6 + (i / (N-1)) * (width - 12);
    const y = 8 + rng(i) * (height - 16);
    pts.push(`${x},${y}`);
  }
  return (
    <svg width={width} height={height} style={{ borderRadius: 8, background: '#0A0A0C', display: 'block' }}>
      <defs>
        <pattern id={`grid-${seed}`} width="10" height="10" patternUnits="userSpaceOnUse">
          <path d="M10 0H0V10" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5"/>
        </pattern>
      </defs>
      <rect width={width} height={height} fill={`url(#grid-${seed})`}/>
      <polyline points={pts.join(' ')} fill="none" stroke={T.orange} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx={pts[0].split(',')[0]} cy={pts[0].split(',')[1]} r="2" fill="#fff"/>
      <circle cx={pts[N-1].split(',')[0]} cy={pts[N-1].split(',')[1]} r="2" fill={T.orange}/>
    </svg>
  );
};

// Full-bleed map banner (workout detail)
const RouteBanner = ({ height = 200 }) => (
  <div style={{
    height, position: 'relative', overflow: 'hidden',
    background: 'radial-gradient(ellipse at 30% 40%, #1a1a22 0%, #0A0A0C 70%)',
  }}>
    <svg width="100%" height={height} viewBox="0 0 390 200" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0 }}>
      <defs>
        <pattern id="map-grid" width="22" height="22" patternUnits="userSpaceOnUse">
          <path d="M22 0H0V22" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.6"/>
        </pattern>
        <pattern id="map-grid-2" width="110" height="110" patternUnits="userSpaceOnUse">
          <path d="M110 0H0V110" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.8"/>
        </pattern>
        <linearGradient id="route-glow" x1="0" x2="1">
          <stop offset="0" stopColor="#FF5A1F" stopOpacity="0.3"/>
          <stop offset="1" stopColor="#FF5A1F" stopOpacity="1"/>
        </linearGradient>
      </defs>
      <rect width="390" height="200" fill="url(#map-grid)"/>
      <rect width="390" height="200" fill="url(#map-grid-2)"/>
      {/* faux roads */}
      <path d="M-10 60 Q 80 50, 160 70 T 400 80" stroke="rgba(255,255,255,0.06)" strokeWidth="6" fill="none"/>
      <path d="M-10 140 Q 100 130, 200 150 T 400 145" stroke="rgba(255,255,255,0.06)" strokeWidth="6" fill="none"/>
      <path d="M70 -10 Q 80 90, 60 200" stroke="rgba(255,255,255,0.05)" strokeWidth="4" fill="none"/>
      <path d="M280 -10 Q 290 90, 270 200" stroke="rgba(255,255,255,0.05)" strokeWidth="4" fill="none"/>
      {/* route */}
      <path d="M40 160 C 80 140, 90 80, 140 70 S 220 110, 250 80 S 320 50, 350 90"
            fill="none" stroke="#FF5A1F" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"
            filter="drop-shadow(0 0 6px rgba(255,90,31,0.5))"/>
      {/* start / end */}
      <circle cx="40" cy="160" r="6" fill="#fff" stroke="#0E0E10" strokeWidth="2"/>
      <circle cx="350" cy="90" r="6" fill="#FF5A1F" stroke="#0E0E10" strokeWidth="2"/>
    </svg>
    <div style={{
      position: 'absolute', top: 12, right: 12,
      padding: '4px 8px', borderRadius: 6,
      background: 'rgba(14,14,16,0.7)', backdropFilter: 'blur(8px)',
      fontSize: 10, fontWeight: 600, letterSpacing: '0.06em',
      color: T.textSub, textTransform: 'uppercase',
    }}>Route</div>
  </div>
);

// HR line chart
const HRChart = ({ width = 358, height = 120 }) => {
  // simulated workout HR curve, ~60 samples
  const N = 60;
  const data = [];
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1);
    // warmup, plateau with bumps, surge, cooldown
    let v = 110 + 50 * Math.min(1, t * 4);
    v += Math.sin(t * 12) * 6 + Math.sin(t * 30) * 3;
    if (t > 0.55 && t < 0.7) v += 12; // surge
    if (t > 0.85) v -= 30 * (t - 0.85) * 6.6; // cooldown
    data.push(Math.round(v));
  }
  const min = 90, max = 185;
  const pts = data.map((v, i) => {
    const x = (i / (N - 1)) * width;
    const y = height - ((v - min) / (max - min)) * (height - 12) - 6;
    return [x, y];
  });
  const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  const area = path + ` L ${width} ${height} L 0 ${height} Z`;
  // max HR marker
  const maxIdx = data.indexOf(Math.max(...data));
  const maxPt = pts[maxIdx];
  return (
    <svg width={width} height={height + 22} style={{ display: 'block' }}>
      <defs>
        <linearGradient id="hr-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#FF5A1F" stopOpacity="0.35"/>
          <stop offset="1" stopColor="#FF5A1F" stopOpacity="0"/>
        </linearGradient>
      </defs>
      {/* gridlines */}
      {[0.25, 0.5, 0.75].map((g, i) => (
        <line key={i} x1="0" x2={width} y1={height * g} y2={height * g}
              stroke="rgba(255,255,255,0.05)" strokeDasharray="2 4"/>
      ))}
      <path d={area} fill="url(#hr-fill)"/>
      <path d={path} fill="none" stroke="#FF5A1F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      {/* max marker */}
      <line x1={maxPt[0]} x2={maxPt[0]} y1={maxPt[1]} y2={maxPt[1] - 14} stroke="#FF5A1F" strokeWidth="1" strokeDasharray="2 2"/>
      <circle cx={maxPt[0]} cy={maxPt[1]} r="3.5" fill="#FF5A1F" stroke="#0E0E10" strokeWidth="2"/>
      <text x={maxPt[0]} y={maxPt[1] - 18} textAnchor="middle"
            fill="#FF5A1F" fontSize="10" fontWeight="700"
            style={{ fontVariantNumeric: 'tabular-nums', letterSpacing: '0.04em' }}>MAX {Math.max(...data)}</text>
      {/* x axis */}
      <text x="0" y={height + 16} fill={T.textMuted} fontSize="10" style={{ fontVariantNumeric: 'tabular-nums' }}>0:00</text>
      <text x={width / 2} y={height + 16} fill={T.textMuted} fontSize="10" textAnchor="middle" style={{ fontVariantNumeric: 'tabular-nums' }}>20:00</text>
      <text x={width} y={height + 16} fill={T.textMuted} fontSize="10" textAnchor="end" style={{ fontVariantNumeric: 'tabular-nums' }}>41:00</text>
    </svg>
  );
};

// Avatar (initials)
const Avatar = ({ name, size = 40, color }) => {
  const initials = name.split(/[\s.@_]+/).filter(Boolean).map(s => s[0].toUpperCase()).slice(0, 2).join('');
  // hue from name
  let h = 0; for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  const bg = color || `oklch(0.45 0.12 ${h})`;
  return (
    <div style={{
      width: size, height: size, borderRadius: size / 2,
      background: bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontWeight: 600, fontSize: size * 0.4, letterSpacing: '0.02em',
      flexShrink: 0,
      border: '1px solid rgba(255,255,255,0.08)',
    }}>{initials}</div>
  );
};

Object.assign(window, {
  T, Card, Label, Stat, ActivityDisc, TabBar, WeeklyBars, Sparkline,
  Segmented, MiniRoute, RouteBanner, HRChart, Avatar,
});
