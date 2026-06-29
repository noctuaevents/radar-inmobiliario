// D2 — Distritos · Cards ricas con sparkline + KPIs
// Foco: comparar de un vistazo, pero con peso visual.
// Cada card: ranking grande, nombre, sparkline 12m, precio, 3 KPIs en fila, color encoded en borde.

const { useState: useStateD2, useMemo: useMemoD2 } = React;

function DistritosV2() {
  const D = window.HOME_DATA;
  const all = D.distritos;

  const madridAvg = useMemoD2(() => ({
    precio: Math.round(all.reduce((a, d) => a + d.precioMedio, 0) / all.length),
    var:    all.reduce((a, d) => a + d.varAnual, 0) / all.length,
    rent:   all.reduce((a, d) => a + d.rent, 0) / all.length,
  }), [all]);

  const [filter, setFilter] = useStateD2('todos');
  const [sort, setSort] = useStateD2('ranking');

  const filtered = useMemoD2(() => {
    let f = [...all];
    if (filter === 'caros')    f = f.filter((d) => d.precioMedio > madridAvg.precio);
    if (filter === 'baratos')  f = f.filter((d) => d.precioMedio < madridAvg.precio);
    if (filter === 'sube')     f = f.filter((d) => d.varAnual > madridAvg.var);
    if (filter === 'rentable') f = f.filter((d) => d.rent > madridAvg.rent);

    if (sort === 'ranking')      f.sort((a, b) => a.ranking - b.ranking);
    if (sort === 'precio')       f.sort((a, b) => b.precioMedio - a.precioMedio);
    if (sort === 'variacion')    f.sort((a, b) => b.varAnual - a.varAnual);
    if (sort === 'rentabilidad') f.sort((a, b) => b.rent - a.rent);
    if (sort === 'transacciones') f.sort((a, b) => b.tx - a.tx);
    return f;
  }, [all, filter, sort, madridAvg]);

  return (
    <div className="bg-stone-50 min-h-full font-sans">
      {/* HEADER */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-8 py-12">
          <div className="grid grid-cols-12 gap-8 items-end">
            <div className="col-span-7">
              <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400 font-bold mb-3">
                Catálogo · 21 distritos
              </p>
              <h1 className="text-5xl font-bold text-slate-900 tracking-tight leading-[1.05] mb-3" style={{ textWrap: 'balance' }}>
                Los 21 distritos<br/>de Madrid.
              </h1>
              <p className="text-slate-500 text-base max-w-md">
                Cada distrito tiene su histórico, su precio medio, su rentabilidad y su trayectoria. Compáralos.
              </p>
            </div>
            <div className="col-span-5 grid grid-cols-3 gap-5">
              <BigStat label="Más caro" value="Salamanca" sub="10.189 €/m²" />
              <BigStat label="Mayor subida" value="San Blas" sub="+32,8 %" highlight />
              <BigStat label="Más accesible" value="Villaverde" sub="3.002 €/m²" />
            </div>
          </div>
        </div>
      </div>

      {/* FILTERS */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-8 py-4 flex items-center gap-3 flex-wrap">
          <span className="text-[10px] uppercase tracking-[0.18em] text-slate-400 font-bold mr-2">Filtrar</span>
          {[
            ['todos',    'Todos'],
            ['caros',    'Sobre media'],
            ['baratos',  'Bajo media'],
            ['sube',     'Mayor subida'],
            ['rentable', 'Más rentables'],
          ].map(([k, label]) => (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                filter === k ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
              }`}
            >
              {label}
            </button>
          ))}

          <div className="ml-auto flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-[0.18em] text-slate-400 font-bold">Ordenar</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none hover:border-slate-400"
            >
              <option value="ranking">Ranking oficial</option>
              <option value="precio">Precio €/m² ↓</option>
              <option value="variacion">Variación 12m ↓</option>
              <option value="rentabilidad">Rentabilidad ↓</option>
              <option value="transacciones">Transacciones ↓</option>
            </select>
          </div>
        </div>
      </div>

      {/* GRID */}
      <div className="max-w-6xl mx-auto px-8 py-10">
        <p className="text-xs text-slate-500 mb-5">{filtered.length} distritos · ordenados por <span className="text-slate-700 font-semibold">{({ ranking:'ranking', precio:'precio', variacion:'variación', rentabilidad:'rentabilidad', transacciones:'transacciones' })[sort]}</span></p>
        <div className="grid grid-cols-3 gap-5">
          {filtered.map((d, i) => (
            <DistritoRichCard key={d.slug} d={d} idx={i} madridAvg={madridAvg} />
          ))}
        </div>
      </div>
    </div>
  );
}

function BigStat({ label, value, sub, highlight }) {
  return (
    <div className={highlight ? 'border-l-2 border-emerald-500 pl-4' : 'border-l-2 border-slate-200 pl-4'}>
      <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400 font-bold mb-1.5">{label}</p>
      <p className={`text-lg font-bold leading-tight ${highlight ? 'text-emerald-700' : 'text-slate-900'}`}>{value}</p>
      <p className="text-xs text-slate-500 tabular-nums mt-0.5">{sub}</p>
    </div>
  );
}

// Deterministic sparkline 12 puntos derivado de varAnual
function makeSpark(varAnual, basePrecio) {
  const points = [];
  const monthlyGrowth = varAnual / 100 / 12;
  // Add gentle noise per point
  for (let i = 0; i < 12; i++) {
    const factor = Math.pow(1 + monthlyGrowth, i - 11);
    const noise = 1 + Math.sin(i * 1.7 + basePrecio * 0.001) * 0.012;
    points.push(basePrecio * factor * noise);
  }
  return points;
}

function DistritoRichCard({ d, idx, madridAvg }) {
  const spark = makeSpark(d.varAnual, d.precioMedio);
  const min = Math.min(...spark); const max = Math.max(...spark);
  const range = max - min || 1;
  const w = 200; const h = 44;
  const path = spark.map((p, i) => {
    const x = (i / (spark.length - 1)) * w;
    const y = h - ((p - min) / range) * h;
    return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(' ');
  const lastX = w;
  const lastY = h - ((spark[spark.length - 1] - min) / range) * h;

  const isUp = d.varAnual >= 0;
  const accentColor = isUp ? 'emerald' : 'rose';
  const sparkStroke = isUp ? '#059669' : '#e11d48';

  return (
    <a className="group cursor-pointer bg-white border border-slate-200 rounded-2xl p-5 hover:border-emerald-400 hover:shadow-sm transition-all block relative overflow-hidden">
      {/* Top row */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold mb-1">
            Ranking #{d.ranking}
          </p>
          <h3 className="text-xl font-bold text-slate-900 group-hover:text-emerald-700 transition-colors leading-tight" style={{ textWrap: 'balance' }}>{d.nombre}</h3>
        </div>
        <div className={`text-xs font-bold tabular-nums px-2 py-1 rounded-md ${isUp ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
          {isUp ? '↑' : '↓'} {Math.abs(d.varAnual).toFixed(1)} %
        </div>
      </div>

      {/* Sparkline */}
      <svg viewBox={`0 0 ${w + 6} ${h + 6}`} className="w-full h-10 my-2 overflow-visible">
        <defs>
          <linearGradient id={`gd-${d.slug}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={sparkStroke} stopOpacity="0.18"/>
            <stop offset="100%" stopColor={sparkStroke} stopOpacity="0"/>
          </linearGradient>
        </defs>
        <path d={`${path} L ${w} ${h} L 0 ${h} Z`} fill={`url(#gd-${d.slug})`} />
        <path d={path} fill="none" stroke={sparkStroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={lastX} cy={lastY} r="2.6" fill={sparkStroke} />
      </svg>

      {/* Precio */}
      <div className="mt-3 mb-4">
        <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400 font-bold mb-0.5">Precio medio</p>
        <p className="text-3xl font-bold text-slate-900 tabular-nums leading-none">
          {d.precioMedio.toLocaleString('es-ES')} <span className="text-base font-medium text-slate-400">€/m²</span>
        </p>
      </div>

      {/* KPIs row */}
      <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-100">
        <KpiMini label="Alquiler" value={d.alquilerM2.toFixed(1) + ' €'} />
        <KpiMini label="Rent. bruta" value={d.rent.toFixed(2) + ' %'} accent={d.rent > madridAvg.rent ? 'text-emerald-700' : 'text-slate-700'} />
        <KpiMini label="Trans. 12m" value={d.tx.toLocaleString('es-ES')} />
      </div>
    </a>
  );
}

function KpiMini({ label, value, accent }) {
  return (
    <div>
      <p className="text-[9px] uppercase tracking-[0.15em] text-slate-400 font-bold mb-0.5">{label}</p>
      <p className={`text-sm font-bold tabular-nums ${accent || 'text-slate-700'}`}>{value}</p>
    </div>
  );
}

window.DistritosV2 = DistritosV2;
