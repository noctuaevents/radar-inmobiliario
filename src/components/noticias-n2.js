// N2 — Noticias, piel de prensa económica.
// Papel crema, serifa (Georgia vía className="font-serif"), filetes, acento teja único.
// Colores y tipografía especial van por inline style: el CSS de Tailwind está
// precompilado y no incluye clases nuevas (ver plan de rediseño, Global Constraints).

const { useState: useStateN2 } = React;

window.PRENSA = {
  papel:        '#faf6ef',
  superficie:   '#fffdf8',
  filete:       '#d6d3d1',
  fileteFuerte: '#1c1917',
  tinta:        '#1c1917',
  cuerpo:       '#44403c',
  secundario:   '#57534e',
  meta:         '#78716c',
  teja:         '#9a3412',
  sube:         '#047857',
  baja:         '#be123c',
};

function NewsV2() {
  const P = window.PRENSA;
  const D = window.NEWS_DATA;
  const [filtro, setFiltro] = useStateN2('Todas');

  const sinDestacada = D.items.filter(n => n.titulo !== D.destacada.titulo);
  const categorias = ['Todas', ...Array.from(new Set(sinDestacada.map(n => n.categoria)))];
  const filtered = filtro === 'Todas' ? sinDestacada : sinDestacada.filter(n => n.categoria === filtro);

  const recientes = filtered.slice(0, 6);
  const resto = filtered.slice(6);

  return (
    <div style={{ background: P.papel }}>

      {/* MANCHETA */}
      <div className="max-w-6xl mx-auto px-8 pt-16 pb-4">
        <div
          className="flex items-end justify-between pb-3"
          style={{ borderBottom: `2px solid ${P.fileteFuerte}` }}
        >
          <p
            className="font-serif text-[1.4rem]"
            style={{ fontStyle: 'italic', color: P.teja }}
          >
            Pulso del mercado
          </p>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em]" style={{ color: P.meta }}>
            Edición {D.actualizado} · Madrid
          </p>
        </div>
      </div>

      {/* BANNER SEMANAL */}
      <div className="max-w-6xl mx-auto px-8">
        <div
          className="flex items-center gap-3 font-mono text-[11px] pb-3"
          style={{ color: P.meta, borderBottom: `1px solid ${P.filete}` }}
        >
          <span><b style={{ color: P.teja }}>{D.semanaResumen.publicadas}</b> {D.semanaResumen.publicadas === 1 ? 'noticia' : 'noticias'} esta semana</span>
          <span>·</span>
          <span><b style={{ color: P.teja }}>{D.semanaResumen.distritosCubiertos}</b> {D.semanaResumen.distritosCubiertos === 1 ? 'distrito cubierto' : 'distritos cubiertos'}</span>
          <span>·</span>
          <span>movimiento medio <b style={{ color: P.teja }}>{D.semanaResumen.movimientoMedio}</b></span>
        </div>
      </div>

      {/* HERO */}
      <div className="max-w-6xl mx-auto px-8 mt-8">
        <NewsV2Hero d={D.destacada} />
      </div>

      {/* FILTROS */}
      <div className="max-w-6xl mx-auto px-8 mt-10">
        <div className="flex items-center gap-5 flex-wrap">
          {categorias.map(cat => {
            const active = filtro === cat;
            return (
              <span
                key={cat}
                onClick={() => setFiltro(cat)}
                className="font-serif text-[14px] cursor-pointer"
                style={{
                  color: active ? P.teja : P.secundario,
                  fontStyle: active ? 'normal' : 'italic',
                  fontWeight: active ? 700 : 400,
                  borderBottom: active ? `2px solid ${P.teja}` : '2px solid transparent',
                  paddingBottom: '2px',
                }}
              >
                {cat}
              </span>
            );
          })}
          {filtro !== 'Todas' && (
            <span className="font-mono text-[11px]" style={{ color: P.meta }}>
              {filtered.length} {filtered.length === 1 ? 'noticia' : 'noticias'}
            </span>
          )}
        </div>
      </div>

      {/* GRID */}
      <div className="max-w-6xl mx-auto px-8 mt-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-mono text-[11px] uppercase tracking-[0.18em]" style={{ color: P.meta }}>
            {filtro === 'Todas' ? 'Desarrollos recientes' : filtro}
          </h3>
          <p className="font-mono text-[11px]" style={{ color: P.meta }}>Actualizado {D.actualizado}</p>
        </div>

        {recientes.length > 0 ? (
          <div className="grid grid-cols-3 gap-5">
            {recientes.map((n, i) => (
              <NewsV2Card key={i} n={n} />
            ))}
          </div>
        ) : (
          <div
            className="flex items-center justify-center"
            style={{ height: '8rem', background: P.superficie, border: `1px solid ${P.filete}` }}
          >
            <p className="font-serif text-[14px]" style={{ color: P.meta, fontStyle: 'italic' }}>Sin noticias en esta categoría</p>
          </div>
        )}
      </div>

      {/* MÁS ESTA SEMANA */}
      {resto.length > 0 && (
        <div className="max-w-6xl mx-auto px-8 mt-16 pb-20">
          <h3 className="font-mono text-[11px] uppercase tracking-[0.18em] mb-5" style={{ color: P.meta }}>
            Más esta semana
          </h3>
          <ul style={{ borderTop: `2px solid ${P.fileteFuerte}` }}>
            {resto.map((n, i) => (
              <li
                key={i}
                onClick={() => window.navTo && window.navTo('/noticia/' + n.slug)}
                className="flex items-baseline gap-5 py-4 cursor-pointer"
                style={{ borderBottom: `1px solid ${P.filete}` }}
              >
                <span className="font-mono text-[11px] tabular-nums flex-shrink-0" style={{ width: '3rem', color: P.teja }}>
                  {n.fecha}
                </span>
                <div className="flex-1">
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] mb-1" style={{ color: P.teja }}>
                    {n.categoria}{n.distrito ? ` · ${n.distrito}` : ''}
                  </p>
                  <h4
                    className="font-serif text-[15px] font-bold hover:underline"
                    style={{ color: P.tinta, textWrap: 'balance' }}
                  >
                    {n.titulo}
                  </h4>
                </div>
                <span className="font-mono text-[12px] text-right flex-shrink-0" style={{ width: '8rem', color: P.meta }}>
                  {n.fuente}
                </span>
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
function NewsV2Hero({ d }) {
  const P = window.PRENSA;
  return (
    <div style={{ paddingBottom: '1.5rem', borderBottom: `2px solid ${P.fileteFuerte}` }}>
      <div className="grid grid-cols-12 gap-10">
        <div className="col-span-7">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] mb-4" style={{ color: P.teja }}>
            {d.fecha} · {d.categoria}{d.distrito ? ` · ${d.distrito}` : ''} · {d.fuente}
          </p>

          <h3
            className="font-serif text-[2.6rem] font-bold leading-[1.05] tracking-[-0.02em] mb-5"
            style={{ color: P.tinta, textWrap: 'balance' }}
          >
            {d.titulo}
          </h3>

          <p
            className="font-serif text-[15.5px] leading-relaxed max-w-xl mb-6"
            style={{ color: P.cuerpo, fontStyle: 'italic' }}
          >
            {d.resumen}
          </p>

          <div className="flex items-center gap-5">
            <button
              onClick={() => window.navTo && window.navTo('/noticia/' + d.slug)}
              className="font-semibold px-5 py-2.5 text-sm"
              style={{ background: P.tinta, color: P.papel }}
            >
              Leer cobertura completa →
            </button>
            <span className="font-mono text-[12px]" style={{ color: P.meta }}>
              {d.fuente} · {d.fecha} · {d.hora}
            </span>
          </div>
        </div>

        <div className="col-span-5 flex flex-col justify-center gap-4">
          {d.imagen && (
            <div>
              <div
                style={{ aspectRatio: '16/9', border: `1px solid ${P.filete}`, overflow: 'hidden', background: P.superficie }}
              >
                <img
                  src={d.imagen}
                  alt={d.titulo}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={e => { e.currentTarget.parentElement.parentElement.style.display = 'none'; }}
                />
              </div>
              <p className="font-serif text-[11px] mt-1.5" style={{ color: P.meta, fontStyle: 'italic' }}>
                Tarjeta de datos · {d.fuente}
              </p>
            </div>
          )}
          {d.metricas && d.metricas.length > 0 && (
            <div>
              {d.metricas.map((m, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-2"
                  style={{ borderBottom: i < d.metricas.length - 1 ? `1px solid ${P.filete}` : 'none' }}
                >
                  <span className="font-serif text-[12px]" style={{ color: P.secundario }}>{m.label}</span>
                  <div className="flex items-baseline gap-2.5">
                    <span className="font-mono text-[15px] font-bold" style={{ color: P.tinta }}>{m.valor}</span>
                    {m.delta && (
                      <span className={`font-mono text-[12px] font-bold tabular-nums ${m.up ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {m.delta}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── CARD ─────────────────────────────────────────────────────────────
function NewsV2Card({ n }) {
  const P = window.PRENSA;
  return (
    <div
      onClick={() => window.navTo && window.navTo('/noticia/' + n.slug)}
      className="cursor-pointer"
      style={{ background: P.superficie, border: `1px solid ${P.filete}` }}
    >
      {n.imagen && (
        <div style={{ aspectRatio: '16/9', overflow: 'hidden', borderBottom: `1px solid ${P.filete}` }}>
          <img
            src={n.imagen}
            alt={n.titulo}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={e => { e.currentTarget.parentElement.style.display = 'none'; }}
          />
        </div>
      )}

      <div className="p-5">
        <div className="flex items-center gap-2.5 mb-4">
          <span className="font-mono text-[10px] uppercase tracking-[0.15em]" style={{ color: P.teja }}>
            {n.categoria}
          </span>
          <span className="font-mono text-[11px] tabular-nums" style={{ color: P.meta }}>{n.fecha} · {n.hora}</span>
        </div>

        <h4
          className="font-serif text-[17px] font-bold leading-snug mb-3 hover:underline"
          style={{ color: P.tinta, textWrap: 'balance' }}
        >
          {n.titulo}
        </h4>

        <p
          className="font-serif text-[13.5px] leading-relaxed mb-5"
          style={{ color: P.secundario, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
        >
          {n.resumen}
        </p>

        <div className="flex items-center justify-between pt-4" style={{ borderTop: `1px solid ${P.filete}` }}>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.15em]" style={{ color: P.meta }}>Impacto</p>
            <p className="font-mono text-sm font-bold tabular-nums mt-0.5" style={{ color: P.tinta }}>{n.impacto}</p>
          </div>
          <div className="text-right">
            <p className="font-mono text-[10px] uppercase tracking-[0.15em]" style={{ color: P.meta }}>Fuente</p>
            <p className="font-mono text-[12px] font-semibold mt-0.5" style={{ color: P.secundario }}>{n.fuente}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── ICONS (sin cambios — consumido por home-variation-d.js Herramientas) ──
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
