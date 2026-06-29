// N2 — Noticias estilo "Desarrollos recientes" (Perplexity Finance) — V3
// Banner resumen semanal + filtros por categoría + panel lateral

const { useState: useStateN2 } = React;

const tagBg = {
  amber:   'bg-amber-100 text-amber-700 border-amber-200',
  rose:    'bg-rose-100 text-rose-700 border-rose-200',
  emerald: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  sky:     'bg-sky-100 text-sky-700 border-sky-200',
  violet:  'bg-violet-100 text-violet-700 border-violet-200',
};

// Map categoria → accent bar color for hero
const categoriaBar = {
  'Demanda':        'bg-rose-500',
  'Infraestructura':'bg-emerald-500',
  'Obras':          'bg-emerald-500',
  'Regulación':     'bg-violet-500',
  'Urbanismo':      'bg-sky-500',
};

function NewsV2() {
  const D = window.NEWS_DATA;
  const [filtro, setFiltro] = useStateN2('Todas');

  const categorias = ['Todas', ...Array.from(new Set(D.items.map(n => n.categoria)))];
  const filtered = filtro === 'Todas' ? D.items : D.items.filter(n => n.categoria === filtro);

  const recientes = filtered.slice(0, 6);
  const resto = filtered.slice(6);

  const heroBar = categoriaBar[D.destacada.categoria] || 'bg-amber-500';

  return (
    <div className="bg-white font-sans">

      {/* SECTION HEADER */}
      <div className="max-w-6xl mx-auto px-8 pt-16 pb-4">
        <div className="flex items-end justify-between border-b border-slate-200 pb-5">
          <div>
            <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400 font-bold mb-2">
              03 · Pulso del mercado
            </p>
            <h2 className="text-4xl font-bold text-slate-900 tracking-tight" style={{ textWrap: 'balance' }}>
              Lo que hoy mueve precios en Madrid.
            </h2>
          </div>
          <p className="text-xs text-slate-500">Actualizado {D.actualizado}</p>
        </div>
      </div>

      {/* SEMANA BANNER */}
      <div className="max-w-6xl mx-auto px-8 mt-4">
        <div className="flex items-center gap-6 bg-emerald-50 border border-emerald-100 rounded-xl px-6 py-3">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-emerald-700 tabular-nums">{D.semanaResumen.publicadas}</span>
            <span className="text-xs text-emerald-600">noticias esta semana</span>
          </div>
          <span className="text-emerald-200 text-sm">·</span>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-emerald-700 tabular-nums">{D.semanaResumen.distritosCubiertos}</span>
            <span className="text-xs text-emerald-600">distritos cubiertos</span>
          </div>
          <span className="text-emerald-200 text-sm">·</span>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-emerald-600">Movimiento medio</span>
            <span className="text-xs font-bold text-emerald-700 tabular-nums">{D.semanaResumen.movimientoMedio}</span>
          </div>
          <span className="flex-1" />
          <span className="text-[10px] uppercase tracking-[0.18em] text-emerald-600 font-bold">
            Edición {D.actualizado}
          </span>
        </div>
      </div>

      {/* HERO */}
      <div className="max-w-6xl mx-auto px-8 mt-6">
        <NewsV2Hero d={D.destacada} heroBar={heroBar} />
      </div>

      {/* FILTROS POR CATEGORÍA */}
      <div className="max-w-6xl mx-auto px-8 mt-10">
        <div className="flex items-center gap-2 flex-wrap">
          {categorias.map(cat => (
            <button
              key={cat}
              onClick={() => setFiltro(cat)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                filtro === cat
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400 hover:text-slate-900'
              }`}
            >
              {cat}
            </button>
          ))}
          {filtro !== 'Todas' && (
            <span className="text-[11px] text-slate-400 ml-1">
              {filtered.length} {filtered.length === 1 ? 'noticia' : 'noticias'}
            </span>
          )}
        </div>
      </div>

      {/* CARDS */}
      <div className="max-w-6xl mx-auto px-8 mt-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-semibold text-slate-700 tracking-tight">
            {filtro === 'Todas' ? 'Desarrollos recientes' : filtro}
          </h3>
          <p className="text-xs text-slate-400">Actualizado {D.actualizado}</p>
        </div>

        {recientes.length > 0 ? (
          <div className="grid grid-cols-3 gap-5">
            {recientes.map((n, i) => (
              <NewsV2Card key={i} n={n} />
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-32 bg-slate-50 border border-slate-200 rounded-2xl">
            <p className="text-sm text-slate-400">Sin noticias en esta categoría</p>
          </div>
        )}
      </div>

      {/* MÁS ESTA SEMANA */}
      {resto.length > 0 && (
        <div className="max-w-6xl mx-auto px-8 mt-16 pb-20">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-semibold text-slate-700 tracking-tight">Más esta semana</h3>
          </div>
          <ul className="border-t border-slate-200">
            {resto.map((n, i) => (
              <li
                key={i}
                onClick={() => window.navTo && window.navTo('/noticia')}
                className="border-b border-slate-200 py-4 flex items-baseline gap-5 group cursor-pointer"
              >
                <span className="text-[11px] font-mono tabular-nums text-slate-400 w-12 flex-shrink-0">{n.fecha}</span>
                <div className="flex-1">
                  <p className={`text-[10px] uppercase tracking-[0.18em] font-bold mb-1 ${tagBg[n.tag] ? tagBg[n.tag].split(' ')[1] : 'text-slate-500'}`}>
                    {n.categoria}{n.distrito ? ` · ${n.distrito}` : ''}
                  </p>
                  <h4 className="text-[15px] font-semibold text-slate-900 leading-snug group-hover:text-emerald-700 transition-colors" style={{ textWrap: 'balance' }}>
                    {n.titulo}
                  </h4>
                </div>
                <span className="text-[12px] text-slate-400 w-32 text-right flex-shrink-0">{n.fuente}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {resto.length === 0 && <div className="pb-20" />}
    </div>
  );
}

// ── HERO ─────────────────────────────────────────────────────────────
function NewsV2Hero({ d, heroBar }) {
  const bar = heroBar || 'bg-amber-500';
  const accentDot = bar.replace('bg-', 'bg-').replace('500', '400');

  return (
    <div className="relative bg-stone-50 border border-slate-200 rounded-3xl overflow-hidden">
      <div className={`absolute top-0 left-0 bottom-0 w-1.5 ${bar}`} />

      <div className="relative grid grid-cols-12 gap-10 p-10 pl-12">
        <div className="col-span-7">
          <div className="flex items-center gap-3 mb-6">
            <span className="inline-block w-6 h-px bg-slate-900" />
            <span className="text-[10px] uppercase tracking-[0.28em] font-bold text-slate-900">
              Destacada hoy
            </span>
            <span className="text-slate-300 text-[10px]">·</span>
            <span className={`text-[10px] uppercase tracking-[0.18em] font-bold ${tagBg[d.tag] ? tagBg[d.tag].split(' ')[1] : 'text-slate-700'}`}>
              {d.categoria}
            </span>
            {d.distrito && (
              <>
                <span className="text-slate-300 text-[10px]">·</span>
                <span className="text-[10px] uppercase tracking-[0.12em] text-slate-500 font-semibold">
                  {d.distrito}
                </span>
              </>
            )}
          </div>

          <h3
            className="text-[2.6rem] font-bold text-slate-900 tracking-[-0.02em] leading-[1.05] mb-6"
            style={{ textWrap: 'balance' }}
          >
            {d.titulo}
          </h3>

          <p className="text-slate-600 text-[15.5px] leading-relaxed max-w-xl">
            {d.resumen}
          </p>

          <div className="flex items-center gap-5 mt-8">
            <button
              onClick={() => window.navTo && window.navTo('/noticia')}
              className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-5 py-2.5 rounded-lg text-sm"
            >
              Leer cobertura completa →
            </button>
            <div className="flex items-center gap-3 text-[12px] text-slate-500">
              <span className="font-semibold text-slate-700">{d.fuente}</span>
              <span className="text-slate-300">·</span>
              <span className="font-mono tabular-nums">{d.fecha} · {d.hora}</span>
            </div>
          </div>
        </div>

        <div className="col-span-5 flex flex-col justify-center">
          <p className="text-[10px] uppercase tracking-[0.22em] text-slate-400 font-bold mb-4">
            Impacto en el mercado
          </p>
          <div className="space-y-2.5">
            {d.metricas.map((m, i) => (
              <div
                key={i}
                className="bg-white border border-slate-200 rounded-xl px-5 py-3.5 flex items-center justify-between relative overflow-hidden"
              >
                <span className={`absolute left-0 top-0 bottom-0 w-0.5 ${bar}`} />
                <span className="text-[12px] text-slate-500">{m.label}</span>
                <div className="flex items-baseline gap-2.5">
                  <span className="text-lg font-bold text-slate-900 tabular-nums">{m.valor}</span>
                  <span className={`text-[12px] font-bold tabular-nums ${m.up ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {m.delta}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── CARD ─────────────────────────────────────────────────────────────
function NewsV2Card({ n }) {
  return (
    <div
      onClick={() => window.navTo && window.navTo('/noticia')}
      className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-emerald-400 hover:shadow-sm transition-all cursor-pointer group"
    >
      <div className="flex items-center gap-2.5 mb-4">
        <span className={`inline-block text-[10px] uppercase tracking-[0.15em] font-bold px-2 py-0.5 rounded border ${tagBg[n.tag] || tagBg.amber}`}>
          {n.categoria}
        </span>
        <span className="text-[11px] text-slate-400 font-mono tabular-nums">{n.fecha} · {n.hora}</span>
      </div>

      <h4
        className="text-[17px] font-bold text-slate-900 tracking-tight leading-snug mb-3 group-hover:text-emerald-700 transition-colors"
        style={{ textWrap: 'balance' }}
      >
        {n.titulo}
      </h4>

      <p
        className="text-[13.5px] text-slate-600 leading-relaxed mb-5"
        style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
      >
        {n.resumen}
      </p>

      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
        <div>
          <p className="text-[10px] uppercase tracking-[0.15em] text-slate-400 font-semibold">Impacto</p>
          <p className="text-sm font-bold text-slate-900 tabular-nums mt-0.5">{n.impacto}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-[0.15em] text-slate-400 font-semibold">Fuente</p>
          <p className="text-[12px] font-semibold text-slate-700 mt-0.5">{n.fuente}</p>
        </div>
      </div>
    </div>
  );
}

// ── SIDE PANEL ──────────────────────────────────────────────────────
function NewsV2Side({ D }) {
  const predicciones = [
    { q: 'Subida media Madrid > +1 %',  yes: 71, delta: '+8' },
    { q: 'BCE recorta tipos en julio',  yes: 64, delta: '+3' },
    { q: 'San Blas mantiene #1 movers', yes: 58, delta: '-4' },
    { q: 'Salamanca > 10.500 €/m²',    yes: 41, delta: '+2' },
    { q: 'Zonas tensionadas en 2026',   yes:  9, delta: '-1' },
  ];

  return (
    <div className="space-y-5 sticky top-6">
      {/* Predicción */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-1">
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400 font-bold">
            ¿Qué pasará en Julio?
          </p>
          <span className="text-[10px] uppercase tracking-[0.12em] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded px-2 py-0.5">
            Vota
          </span>
        </div>
        <h3 className="text-base font-bold text-slate-900 mb-5">Mercado de predicción</h3>

        <div className="space-y-3.5">
          {predicciones.map((p, i) => (
            <div key={i} className="group cursor-pointer">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[13px] text-slate-700 leading-tight pr-2">{p.q}</p>
                <div className="flex items-baseline gap-1.5 flex-shrink-0">
                  <span className="text-[13px] font-bold text-slate-900 tabular-nums">{p.yes}%</span>
                  <span className={`text-[10px] font-bold tabular-nums ${p.delta.startsWith('-') ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {p.delta.startsWith('-') ? '↓' : '↑'}{p.delta.replace('-', '').replace('+', '')}
                  </span>
                </div>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 group-hover:bg-emerald-600 transition-colors"
                  style={{ width: `${p.yes}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
          <p className="text-[11px] text-slate-400">128 lectores votaron</p>
          <a className="text-[11px] font-semibold text-emerald-700 cursor-pointer hover:underline underline-offset-4">
            Dejar mi voto →
          </a>
        </div>
      </div>

    </div>
  );
}

// ── ICONS ────────────────────────────────────────────────────────────
function NewsV2Icon({ name }) {
  const common = 'w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0';
  if (name === 'compare') {
    return (
      <div className={`${common} bg-emerald-50 border border-emerald-100`}>
        <svg className="w-5 h-5 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 4v16m0-16l-3 3m3-3l3 3M17 20V4m0 16l-3-3m3 3l3-3" />
        </svg>
      </div>
    );
  }
  if (name === 'bell') {
    return (
      <div className={`${common} bg-amber-50 border border-amber-100`}>
        <svg className="w-5 h-5 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0a3 3 0 11-6 0" />
        </svg>
      </div>
    );
  }
  return (
    <div className={`${common} bg-sky-50 border border-sky-100`}>
      <svg className="w-5 h-5 text-sky-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 7h6M9 11h6M9 15h3M5 4h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5a1 1 0 011-1z" />
      </svg>
    </div>
  );
}

window.NewsV2 = NewsV2;
window.NewsV2Icon = NewsV2Icon;
