// Stylized cartogram of Madrid's 21 districts.
// Renders each district as a circle, positioned roughly correctly geographically.
// Size and color are parametrizable per variant.

window.DISTRITO_POSITIONS = {
  'fuencarral-el-pardo': { x: 38, y: 18 },
  'barajas':             { x: 82, y: 24 },
  'tetuan':              { x: 48, y: 33 },
  'chamartin':           { x: 60, y: 33 },
  'hortaleza':           { x: 72, y: 33 },
  'moncloa-aravaca':     { x: 33, y: 44 },
  'chamberi':            { x: 48, y: 44 },
  'salamanca':           { x: 60, y: 44 },
  'ciudad-lineal':       { x: 72, y: 46 },
  'san-blas-canillejas': { x: 84, y: 44 },
  'centro':              { x: 48, y: 54 },
  'retiro':              { x: 60, y: 55 },
  'latina':              { x: 35, y: 60 },
  'arganzuela':          { x: 48, y: 64 },
  'carabanchel':         { x: 40, y: 70 },
  'usera':               { x: 50, y: 72 },
  'puente-de-vallecas':  { x: 62, y: 70 },
  'moratalaz':           { x: 72, y: 62 },
  'vicalvaro':           { x: 82, y: 60 },
  'villaverde':          { x: 52, y: 84 },
  'villa-de-vallecas':   { x: 74, y: 78 },
};

// Mini sparkline generator — fake but trend-consistent monthly history.
window.makeSparkline = (currentPrice, varAnualPct, months = 12) => {
  if (currentPrice == null) return [];
  const varMonthly = (varAnualPct ?? 0) / 100 / 12;
  return Array.from({ length: months }, (_, i) => {
    const factor = Math.pow(1 + varMonthly, i - (months - 1));
    // small noise so the line isn't perfectly smooth
    const noise = 1 + (Math.sin(i * 1.7 + currentPrice * 0.01) * 0.005);
    return Math.round(currentPrice * factor * noise);
  });
};

// Tiny inline sparkline component.
function Sparkline({ values, width = 80, height = 22, stroke = 'currentColor', fill = 'none', strokeWidth = 1.5, showDot = true }) {
  if (!values || values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(1, max - min);
  const step = width / (values.length - 1);
  const pts = values.map((v, i) => [i * step, height - 2 - ((v - min) / range) * (height - 4)]);
  const d = pts.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(' ');
  const last = pts[pts.length - 1];
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block', overflow: 'visible' }}>
      <path d={d} fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      {showDot && <circle cx={last[0]} cy={last[1]} r={2} fill={stroke} />}
    </svg>
  );
}
window.Sparkline = Sparkline;

// Renders a stylized cartogram of Madrid as positioned dots.
// Size scales with `sizeKey`, color encodes `colorKey` against a scale.
function MadridCartogram({
  distritos,
  width = 600,
  height = 500,
  sizeKey = 'precioMedio',
  colorKey = 'varAnual',
  // colorScale: function(value) -> css color
  colorScale,
  labelStrategy = 'top-and-hover', // 'all' | 'top-and-hover' | 'none'
  // for outline-only style (terminal):
  variant = 'filled', // 'filled' | 'outline' | 'glow'
  highlight = null,    // slug to highlight
  background = 'transparent',
  showLabelsFor = 5,   // how many top districts to label by default
  fontFamily = 'inherit',
}) {
  const positions = window.DISTRITO_POSITIONS;
  const sizeValues = distritos.map((d) => d[sizeKey] ?? 0);
  const sMin = Math.min(...sizeValues), sMax = Math.max(...sizeValues);

  // size range in px; scale viewBox-relative
  const rMin = 14, rMax = 38;
  const scaleR = (v) => rMin + ((v - sMin) / Math.max(1, sMax - sMin)) * (rMax - rMin);

  // default emerald color scale
  const defaultColor = (v) => {
    if (v == null) return '#cbd5e1';
    const t = Math.max(0, Math.min(1, (v - 0) / 35));
    // interpolate between slate-300 and emerald-500
    const c1 = [203, 213, 225];
    const c2 = [16, 185, 129];
    const r = Math.round(c1[0] + (c2[0] - c1[0]) * t);
    const g = Math.round(c1[1] + (c2[1] - c1[1]) * t);
    const b = Math.round(c1[2] + (c2[2] - c1[2]) * t);
    return `rgb(${r},${g},${b})`;
  };
  const cs = colorScale || defaultColor;

  // Pick top N by sizeKey for labelling
  const labelled = new Set(
    [...distritos]
      .sort((a, b) => (b[sizeKey] ?? 0) - (a[sizeKey] ?? 0))
      .slice(0, showLabelsFor)
      .map((d) => d.slug)
  );

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid meet"
      width={width}
      height={height}
      style={{ background, display: 'block', fontFamily }}
    >
      {/* very faint reference shape — a soft polygon to suggest the city footprint */}
      <defs>
        <radialGradient id="cartogram-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(16,185,129,0.06)" />
          <stop offset="100%" stopColor="rgba(16,185,129,0)" />
        </radialGradient>
      </defs>
      <circle cx="55" cy="55" r="42" fill="url(#cartogram-glow)" />

      {/* light connecting lines between adjacent dots for terminal/editorial feel */}
      {variant !== 'glow' && (
        <g opacity={variant === 'outline' ? 0.18 : 0.10} stroke="currentColor" strokeWidth="0.15" fill="none">
          {Object.entries(positions).map(([slug, p]) => {
            return Object.entries(positions)
              .filter(([s2, p2]) => s2 > slug)
              .map(([s2, p2]) => {
                const dx = p.x - p2.x, dy = p.y - p2.y;
                const d = Math.hypot(dx, dy);
                if (d > 16) return null;
                return <line key={slug + s2} x1={p.x} y1={p.y} x2={p2.x} y2={p2.y} />;
              });
          })}
        </g>
      )}

      {/* district nodes */}
      {distritos.map((d) => {
        const pos = positions[d.slug];
        if (!pos) return null;
        const r = scaleR(d[sizeKey] ?? sMin) / 6; // svg units (viewBox 100)
        const color = cs(d[colorKey]);
        const isHi = highlight === d.slug;
        const showLabel = labelStrategy === 'all' || (labelStrategy !== 'none' && labelled.has(d.slug));
        return (
          <g key={d.slug} transform={`translate(${pos.x},${pos.y})`}>
            {variant === 'glow' && (
              <circle r={r * 1.5} fill={color} opacity={0.25} />
            )}
            {variant === 'outline' ? (
              <circle r={r} fill="none" stroke={color} strokeWidth={isHi ? 1.4 : 0.8} />
            ) : (
              <circle r={r} fill={color} stroke={isHi ? '#0f172a' : 'rgba(0,0,0,0.10)'} strokeWidth={isHi ? 0.9 : 0.3} />
            )}
            {showLabel && (
              <text
                y={r + 2.2}
                textAnchor="middle"
                fontSize="2.1"
                fontWeight="600"
                fill="currentColor"
                style={{ pointerEvents: 'none' }}
              >
                {d.nombre.length > 14 ? d.nombre.slice(0, 12) + '…' : d.nombre}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
window.MadridCartogram = MadridCartogram;

// Formatters
window.fmt = {
  euro: (n) => n == null ? '—' : n.toLocaleString('es-ES') + ' €',
  euroM2: (n) => n == null ? '—' : n.toLocaleString('es-ES') + ' €/m²',
  pct: (n, opts = {}) => {
    if (n == null) return '—';
    const sign = n > 0 ? '+' : '';
    return `${sign}${n.toFixed(opts.decimals ?? 1)}%`;
  },
  num: (n) => n == null ? '—' : n.toLocaleString('es-ES'),
};

// ─── REAL GEO MAP (uses public/madrid-distritos.geojson) ────────────

// Normalize district names: lower, strip accents, hyphenate
function normalizeStr(s) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[-\s]+/g, '-');
}
const GEO_NAME_ALIAS = { 'san-blas': 'san-blas-canillejas' };

// Compute projected path strings + bbox + centroids ONCE per page.
// Mercator-ish (cos-lat correction) — good enough for Madrid scale.
function buildMadridGeoCache() {
  if (window.__madridGeoCache) return window.__madridGeoCache;
  const geo = window.MADRID_GEOJSON;
  if (!geo) return null;

  // 1) bbox
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const f of geo.features) {
    const g = f.geometry;
    const polys = g.type === 'Polygon' ? [g.coordinates] : g.coordinates;
    for (const poly of polys) {
      for (const ring of poly) {
        for (const pt of ring) {
          if (pt[0] < minX) minX = pt[0];
          if (pt[0] > maxX) maxX = pt[0];
          if (pt[1] < minY) minY = pt[1];
          if (pt[1] > maxY) maxY = pt[1];
        }
      }
    }
  }
  const meanLat = (minY + maxY) / 2;
  const cosLat = Math.cos(meanLat * Math.PI / 180);
  const lngRange = (maxX - minX) * cosLat;
  const latRange = maxY - minY;
  const W = 1000;
  const H = Math.round(W * latRange / lngRange);

  const proj = (lng, lat) => {
    const x = ((lng - minX) * cosLat / lngRange) * W;
    const y = ((maxY - lat) / latRange) * H;
    return [x, y];
  };

  const districts = geo.features.map((f) => {
    const g = f.geometry;
    const polys = g.type === 'Polygon' ? [g.coordinates] : g.coordinates;
    let d = '';
    let cx = 0, cy = 0, n = 0;
    for (const poly of polys) {
      for (const ring of poly) {
        for (let i = 0; i < ring.length; i++) {
          const [x, y] = proj(ring[i][0], ring[i][1]);
          d += (i === 0 ? 'M' : 'L') + x.toFixed(1) + ',' + y.toFixed(1);
          cx += x; cy += y; n++;
        }
        d += 'Z';
      }
    }
    const norm = normalizeStr(f.properties.name);
    const slug = GEO_NAME_ALIAS[norm] ?? norm;
    return {
      slug,
      name: f.properties.name,
      d,
      cx: cx / n,
      cy: cy / n,
    };
  });

  const cache = { viewBox: { w: W, h: H }, districts };
  window.__madridGeoCache = cache;
  return cache;
}

// Continuous color scale: slate-100 → emerald-600, with red for negative
function defaultGeoColor(v) {
  if (v == null) return '#e2e8f0';        // slate-200 (no data)
  if (v < 0) return '#fb7185';            // rose-400
  const t = Math.min(1, v / 35);
  // slate-100 (#f1f5f9) → emerald-600 (#059669)
  const c1 = [241, 245, 249];
  const c2 = [5, 150, 105];
  const r = Math.round(c1[0] + (c2[0] - c1[0]) * t);
  const g = Math.round(c1[1] + (c2[1] - c1[1]) * t);
  const b = Math.round(c1[2] + (c2[2] - c1[2]) * t);
  return `rgb(${r},${g},${b})`;
}

function MadridGeoMap({
  distritos,
  width = '100%',
  height = 600,
  colorFn,
  labelsFor = 'top-3',  // 'all' | 'top-3' | 'none' | array of slugs
  highlight = null,
  background = 'transparent',
  showHover = true,
}) {
  const [hovered, setHovered] = React.useState(null);
  const cache = buildMadridGeoCache();
  if (!cache) {
    return (
      <div style={{ width, height, display: 'grid', placeItems: 'center', color: '#94a3b8', fontSize: 12 }}>
        Cargando mapa…
      </div>
    );
  }
  const { viewBox, districts: feats } = cache;
  const distMap = new Map(distritos.map((d) => [d.slug, d]));
  const color = colorFn || defaultGeoColor;

  // Decide which slugs to label
  let labelSet = new Set();
  if (labelsFor === 'all') {
    labelSet = new Set(feats.map((f) => f.slug));
  } else if (Array.isArray(labelsFor)) {
    labelSet = new Set(labelsFor);
  } else if (labelsFor === 'top-3') {
    const sorted = [...distritos]
      .sort((a, b) => (b.varAnual ?? 0) - (a.varAnual ?? 0))
      .slice(0, 3)
      .map((d) => d.slug);
    labelSet = new Set(sorted);
  }

  return (
    <div style={{ position: 'relative', width, background }}>
      <svg
        viewBox={`0 0 ${viewBox.w} ${viewBox.h}`}
        width="100%"
        height={height}
        preserveAspectRatio="xMidYMid meet"
        style={{ display: 'block' }}
      >
        {feats.map((f) => {
          const d = distMap.get(f.slug);
          const fill = d ? color(d.varAnual) : '#e2e8f0';
          const isHi = highlight === f.slug;
          const isHovered = hovered && hovered.slug === f.slug;
          return (
            <path
              key={f.slug}
              d={f.d}
              fill={fill}
              fillOpacity={isHovered ? 0.82 : 1}
              stroke="#ffffff"
              strokeWidth={isHi ? 2.4 : 1.2}
              style={{ cursor: d ? 'pointer' : 'default', transition: 'fill-opacity 0.12s' }}
              onMouseEnter={showHover && d ? () => setHovered({ slug: f.slug, ...d, cx: f.cx, cy: f.cy }) : undefined}
              onMouseLeave={showHover ? () => setHovered(null) : undefined}
            />
          );
        })}
        {/* Labels */}
        {feats.map((f) => {
          if (!labelSet.has(f.slug)) return null;
          const d = distMap.get(f.slug);
          if (!d) return null;
          return (
            <g key={f.slug + '-l'} transform={`translate(${f.cx},${f.cy})`} style={{ pointerEvents: 'none' }}>
              <text
                textAnchor="middle"
                fontSize="16"
                fontWeight="700"
                fill="#0f172a"
                style={{ paintOrder: 'stroke', stroke: '#ffffff', strokeWidth: 4, strokeLinejoin: 'round' }}
              >
                {d.nombre}
              </text>
              <text
                y={18}
                textAnchor="middle"
                fontSize="14"
                fontWeight="600"
                fill="#047857"
                style={{ paintOrder: 'stroke', stroke: '#ffffff', strokeWidth: 4, strokeLinejoin: 'round' }}
              >
                +{(d.varAnual ?? 0).toFixed(1)}%
              </text>
            </g>
          );
        })}
      </svg>

      {/* Hover tooltip */}
      {showHover && hovered && (
        <div
          style={{
            position: 'absolute',
            left: `calc(${(hovered.cx / viewBox.w) * 100}% + 12px)`,
            top: `calc(${(hovered.cy / viewBox.h) * 100}% - 4px)`,
            transform: 'translateY(-100%)',
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: 10,
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            padding: '10px 12px',
            pointerEvents: 'none',
            zIndex: 10,
            minWidth: 160,
          }}
        >
          <p style={{ fontWeight: 700, color: '#0f172a', fontSize: 13, marginBottom: 2 }}>
            {hovered.nombre}
          </p>
          <p style={{ color: '#64748b', fontSize: 12, fontVariantNumeric: 'tabular-nums', marginBottom: 1 }}>
            {hovered.precioMedio.toLocaleString('es-ES')} €/m²
          </p>
          <p style={{
            color: (hovered.varAnual ?? 0) >= 0 ? '#047857' : '#e11d48',
            fontWeight: 600, fontSize: 12, fontVariantNumeric: 'tabular-nums',
          }}>
            {(hovered.varAnual ?? 0) >= 0 ? '+' : ''}{(hovered.varAnual ?? 0).toFixed(1)}% interanual
          </p>
        </div>
      )}
    </div>
  );
}
window.MadridGeoMap = MadridGeoMap;
