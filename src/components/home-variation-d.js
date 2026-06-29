// Variation D — Híbrido (C + B), FULL CLARO
// Base: Mapa-first / espacial (C). Toma de B: ticker macro + heatmap denso de distritos.
// Todo en tono claro: bg-white / bg-stone-50 / bg-emerald-50 alternados, acento emerald-600.

function VariationD() {
  const D = window.HOME_DATA;
  const { meta, distritos, masSuben, masBaratos, noticiasDestacadas, macro } = D;

  const spotlight = distritos.find((d) => d.slug === 'san-blas-canillejas');
  const top3Movers = [...distritos].sort((a, b) => b.varAnual - a.varAnual).slice(0, 3);
  const heatmapSorted = [...distritos].sort((a, b) => b.varAnual - a.varAnual);

  const [nlEmail, setNlEmail] = React.useState('');
  const [nlStatus, setNlStatus] = React.useState('idle'); // idle | loading | ok | error

  function handleNlSubmit() {
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nlEmail.trim());
    if (!valid) { setNlStatus('error'); return; }
    setNlStatus('loading');
    // Placeholder: replace with Beehiiv embed URL when ready
    setTimeout(() => { setNlStatus('ok'); }, 800);
  }

  return (
    <div className="bg-stone-50 text-slate-900" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* ── PORTADA — página completa al inicio (P5 · color block) ──── */}
      <section className="relative bg-emerald-600 overflow-hidden flex flex-col" style={{ minHeight: 820 }}>
        {/* halo blanco */}
        <div className="absolute -left-40 top-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-20 pointer-events-none" style={{
          background: 'radial-gradient(circle, white 0%, transparent 65%)',
        }} />
        {/* líneas finas verticales */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.12]" style={{
          backgroundImage: 'linear-gradient(to right, white 1px, transparent 1px)',
          backgroundSize: '160px 100%',
        }} />

        {/* masthead arriba */}
        <div className="relative max-w-6xl mx-auto w-full px-8 pt-10 flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.3em] text-white/70">
          <span className="flex items-center gap-2 font-bold text-white text-sm tracking-normal normal-case">
            <span className="text-white text-xl leading-none">●</span>
            Radar Inmobiliario Madrid
          </span>
          <span className="hidden md:flex items-center gap-4">
            <span>Vol. 12 · Nº 05</span>
            <span className="h-3 w-px bg-white/30" />
            <span>Edición {meta.fecha}</span>
            <span className="h-3 w-px bg-white/30" />
            <span className="flex items-center gap-2 text-white font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              En vivo
            </span>
          </span>
        </div>
        <div className="relative max-w-6xl mx-auto w-full px-8 mt-6"><div className="h-px bg-white/20" /></div>

        {/* cuerpo de la portada */}
        <div className="relative max-w-6xl mx-auto w-full px-8 pt-16 grid grid-cols-12 gap-10 items-start flex-1">
          <div className="col-span-12 md:col-span-8">
            <p className="text-[11px] uppercase tracking-[0.3em] text-white/80 font-bold mb-6 flex items-center gap-3">
              <span className="inline-block w-10 h-px bg-white/50" /> Mapa del mes
            </p>
            <h1 className="text-[100px] md:text-[164px] font-bold tracking-[-0.06em] leading-[0.82] text-white" style={{ textWrap: 'balance' }}>
              Madrid<br />
              sin filtros.
            </h1>
            <p className="text-xl text-white/85 max-w-xl mt-8 leading-relaxed" style={{ textWrap: 'pretty' }}>
              Sin recomendaciones. Sin patrocinios. Solo el precio, el cambio y el porqué — 21 distritos, 131 barrios, cada lunes.
            </p>
          </div>

          {/* Lateral derecho: silueta de Madrid */}
          <div className="col-span-12 md:col-span-4 mt-2 flex items-start justify-center">
            <div className="relative w-full max-w-[360px]">
              <p className="text-center text-[10px] font-mono uppercase tracking-[0.3em] text-white/70 mb-4">El término municipal</p>
              <svg viewBox="0 0 360 360" className="w-full">
                <g transform="translate(180 180)">
                  <path d="M-150,-60 L-100,-130 L-30,-160 L60,-150 L130,-110 L160,-30 L150,60 L100,130 L20,160 L-70,150 L-140,90 L-160,0 Z" fill="rgba(255,255,255,0.08)" stroke="white" strokeWidth="2.5" strokeLinejoin="round" />
                  <path d="M-90,-100 L0,-110 L80,-80 M-80,-30 L0,-40 L100,-10 M-100,40 L0,30 L120,50 M-50,100 L40,90" stroke="white" strokeWidth="0.8" opacity="0.4" fill="none" />
                  <line x1="0" y1="-160" x2="0" y2="160" stroke="white" strokeWidth="0.5" opacity="0.25" />
                  <line x1="-160" y1="0" x2="160" y2="0" stroke="white" strokeWidth="0.5" opacity="0.25" />
                  <circle cx="0" cy="-20" r="5" fill="white" />
                  <circle cx="-50" cy="60" r="3" fill="white" opacity="0.6" />
                  <circle cx="70" cy="40" r="3" fill="white" opacity="0.6" />
                  <circle cx="80" cy="-70" r="3" fill="white" opacity="0.6" />
                  <circle cx="-80" cy="-50" r="3" fill="white" opacity="0.6" />
                </g>
              </svg>
              <p className="text-center text-[10px] font-mono uppercase tracking-[0.3em] text-white/70 mt-2">606 km² · 3,3 M habitantes</p>
            </div>
          </div>
        </div>

        {/* footer portada: scroll hint */}
        <div className="relative max-w-6xl mx-auto w-full px-8 pb-6 pt-10 flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.3em] text-white/60">
          <span>Sigue scrolleando — la web te espera abajo</span>
          <span className="flex items-center gap-2">
            <span>Bajar</span>
            <span className="inline-block w-px h-6 bg-white/40 animate-pulse" />
          </span>
        </div>
      </section>

      {/* ── HEADER ──────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
            <span className="text-emerald-600 text-xl leading-none">●</span>
            <span>Radar Inmobiliario</span>
            <span className="text-emerald-600">Madrid</span>
          </div>
          <nav className="flex items-center gap-6 text-sm text-slate-600">
            <span className="cursor-pointer hover:text-emerald-700" onClick={() => window.navTo && window.navTo('/distritos')}>Distritos</span>
            <span className="cursor-pointer hover:text-emerald-700" onClick={() => window.navTo && window.navTo('/noticias')}>Noticias</span>
            <span className="cursor-pointer hover:text-emerald-700">Comparar</span>
            <span className="cursor-pointer hover:text-emerald-700">Calculadora</span>
            <span className="cursor-pointer hover:text-emerald-700">Rankings</span>
            <span className="cursor-pointer hover:text-emerald-700">Artículos</span>
            <span className="bg-emerald-600 text-white px-3 py-1.5 rounded-md cursor-pointer hover:bg-emerald-500">Newsletter</span>
          </nav>
        </div>
      </header>

      {/* ── TICKER BAR — CLARO ──────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-8 py-2.5 flex items-center gap-8 text-[11px] font-mono">
          <DTicker label="MADRID €/m²"    value={meta.precioMedio.toLocaleString('es-ES')} delta={`+${meta.variacionMedia.toFixed(1)}%`} up />
          <DTicker label="EURIBOR 12m"    value={macro.euribor12m.toFixed(2) + '%'} delta={macro.euriborDelta.toFixed(2)} />
          <DTicker label="BCE TIPO"        value={macro.tipoBCE.toFixed(2) + '%'} delta="±0" />
          <DTicker label="ESFUERZO %"      value={macro.esfuerzoHipoteca.toFixed(1) + '%'} delta={macro.esfuerzoDelta.toFixed(1)} />
          <DTicker label="HIPOTECAS / MES" value={macro.hipotecasMensual.toLocaleString('es-ES')} delta={`+${macro.hipotecasDelta.toFixed(1)}%`} up />
          <DTicker label="TX 12m"          value={meta.transaccionesAnio.toLocaleString('es-ES')} delta="+8,2%" up />
          <span className="ml-auto flex items-center gap-2 text-emerald-700 text-[10px] uppercase tracking-widest font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            LIVE · {meta.fecha}
          </span>
        </div>
      </div>

      {/* ── HERO: MAP TAKES OVER ────────────────────────────────────── */}
      <section className="bg-stone-50 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(60% 60% at 60% 50%, rgba(16,185,129,0.08) 0%, rgba(16,185,129,0) 70%)',
        }} />

        <div className="relative max-w-6xl mx-auto px-8 pt-10 pb-14">
          <div className="flex items-end justify-between mb-6">
            <div>
              <p className="text-[11px] uppercase tracking-[0.3em] text-emerald-700 font-bold mb-3 flex items-center gap-2">
                Radar en vivo · {meta.fecha}
              </p>
              <h1 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight leading-[1.05] max-w-2xl" style={{ textWrap: 'balance' }}>
                Madrid en una mirada.<br />
                <span className="text-emerald-600">21 distritos. 131 barrios.</span>
              </h1>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <button className="px-3 py-1.5 rounded-full bg-slate-900 text-white font-semibold text-[11px]">Variación</button>
                <button className="px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-600 font-medium text-[11px]">€/m²</button>
                <button className="px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-600 font-medium text-[11px]">Alquiler</button>
                <button className="px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-600 font-medium text-[11px]">Rent.</button>
              </div>
              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">Toca o pasa el ratón sobre un distrito</p>
            </div>
          </div>

          {/* THE BIG MAP */}
          <div className="relative">
            <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
              <div className="relative" style={{ height: 720 }}>
                <div className="absolute inset-0">
                  <window.MadridGeoMap
                    distritos={distritos}
                    height={720}
                    labelsFor={['salamanca', 'san-blas-canillejas', 'villaverde', 'centro']}
                    highlight={spotlight.slug}
                  />
                </div>

                {/* KPI card top-left */}
                <div className="absolute top-6 left-6 bg-white/95 backdrop-blur border border-slate-200 rounded-2xl p-5 shadow-sm w-64">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold mb-2">€/m² medio · Madrid</p>
                  <p className="text-4xl font-bold tabular-nums text-slate-900 tracking-tight leading-none mb-1">
                    {meta.precioMedio.toLocaleString('es-ES')} €
                  </p>
                  <p className="text-xs font-semibold tabular-nums text-emerald-700 mb-3">
                    +{meta.variacionMedia.toFixed(1)}% interanual
                  </p>
                  <div className="h-px bg-slate-200 my-3" />
                  <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold mb-2">Transacciones · 12 m</p>
                  <p className="text-lg font-bold tabular-nums text-slate-900 leading-none">{meta.transaccionesAnio.toLocaleString('es-ES')}</p>
                </div>

                {/* Spotlight callout — compacto y discreto */}
                <div
                  className="absolute bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm w-52"
                  style={{ top: 420, right: 28 }}
                >
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="w-1 h-1 rounded-full bg-emerald-500" />
                    <p className="text-[9px] uppercase tracking-[0.18em] text-slate-400 font-bold">Spotlight</p>
                  </div>
                  <p className="text-sm font-bold text-slate-900 leading-tight mb-1">{spotlight.nombre}</p>
                  <p className="text-xl font-bold tabular-nums text-emerald-600 leading-none mb-2">
                    +{spotlight.varAnual.toFixed(1)}%
                  </p>
                  <p className="text-[10px] text-slate-500 leading-snug">
                    Mayor subida interanual entre los 21 distritos
                  </p>
                </div>

                {/* Legend variación */}
                <div className="absolute bottom-6 left-6 bg-white/95 backdrop-blur border border-slate-200 rounded-xl px-4 py-3">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold mb-2">Variación anual</p>
                  <div className="flex items-center gap-4 text-xs text-slate-600">
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-slate-200" />0%</span>
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full" style={{ background: 'rgb(167,221,201)' }} />+15%</span>
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500" />+30%+</span>
                  </div>
                </div>

                {/* Click hint — bottom-right */}
                <div className="absolute bottom-6 right-6 bg-white/95 backdrop-blur border border-slate-200 rounded-xl px-4 py-3">
                  <p className="text-xs text-slate-600 flex items-center gap-2">
                    <span className="text-emerald-600">●</span>
                    Click un distrito para abrirlo
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between text-xs text-slate-500">
            <span>Fuentes: Idealista, Fotocasa, Ayuntamiento de Madrid · {meta.fecha}</span>
            <a className="text-emerald-700 font-semibold hover:underline underline-offset-4">Abrir mapa completo →</a>
          </div>
        </div>
      </section>

      {/* ── HEATMAP DENSO — CLARO ───────────────────────────────────── */}
      <section className="bg-white py-20 border-y border-slate-100">
        <div className="max-w-6xl mx-auto px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-[11px] uppercase tracking-[0.3em] text-emerald-700 font-bold mb-3">
                Los 21 distritos · de un vistazo
              </p>
              <h2 className="text-4xl font-bold text-slate-900 tracking-tight max-w-xl leading-tight" style={{ textWrap: 'balance' }}>
                Quién sube, quién se enfría.
              </h2>
            </div>
            <div className="flex items-center gap-4 text-[10px] font-mono text-slate-500">
              <span className="uppercase tracking-widest">Variación YoY</span>
              {[0, 10, 20, 30].map((v) => (
                <span key={v} className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm border border-slate-200" style={{ background: dHeatColor(v) }} />
                  <span className="tabular-nums">+{v}%</span>
                </span>
              ))}
            </div>
          </div>

          <DDistritoHeatmap distritos={heatmapSorted} />

          <p className="text-[11px] text-slate-400 mt-5 font-mono uppercase tracking-widest text-center">
            Ordenados por variación anual · datos a {meta.fecha}
          </p>
        </div>
      </section>

      {/* ── TOP 3 MOVERS ─────────────────────────────────────────────── */}
      <section className="bg-stone-50 py-24 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-8">
          <div className="mb-12 max-w-2xl">
            <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400 font-bold mb-3">Los que más se mueven</p>
            <h2 className="text-4xl font-bold text-slate-900 tracking-tight" style={{ textWrap: 'balance' }}>
              Tres historias detrás del mes.
            </h2>
          </div>

          <div className="grid grid-cols-3 gap-6">
            {top3Movers.map((d, i) => (
              <DSpotlightCard key={d.slug} d={d} rank={i + 1} />
            ))}
          </div>
        </div>
      </section>

      {/* ── NOTICIAS + RANKINGS ─────────────────────────────────────── */}
      <section className="bg-white py-24 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-8">
          <div className="grid grid-cols-12 gap-10">
            <div className="col-span-7">
              <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400 font-bold mb-3">Pulso del mercado</p>
              <h2 className="text-4xl font-bold text-slate-900 tracking-tight mb-6" style={{ textWrap: 'balance' }}>
                Lo último que mueve precios.
              </h2>

              <ul className="space-y-0 border-t border-slate-200">
                {noticiasDestacadas.map((n, i) => (
                  <li key={i} onClick={() => window.navTo && window.navTo('/noticia')} className="border-b border-slate-200 py-5 group cursor-pointer">
                    <div className="flex items-baseline gap-5">
                      <span className="text-xs font-bold tabular-nums text-slate-400 w-12 flex-shrink-0">{n.fecha}</span>
                      <div className="flex-1">
                        <p className="text-[10px] uppercase tracking-[0.2em] text-emerald-700 font-bold mb-1">
                          {n.categoria}{n.distrito ? ` · ${n.distrito}` : ''}
                        </p>
                        <h3 className="text-base font-semibold text-slate-900 leading-snug group-hover:text-emerald-700 transition-colors" style={{ textWrap: 'balance' }}>
                          {n.titulo}
                        </h3>
                      </div>
                      <span className="text-slate-300 group-hover:text-emerald-600 transition-colors">→</span>
                    </div>
                  </li>
                ))}
              </ul>
              <a onClick={() => window.navTo && window.navTo('/noticias')} className="inline-block mt-6 text-sm font-semibold text-emerald-700 underline-offset-4 hover:underline cursor-pointer">Todas las noticias →</a>
            </div>

            <div className="col-span-5">
              <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400 font-bold mb-3">Rankings rápidos</p>
              <h2 className="text-4xl font-bold text-slate-900 tracking-tight mb-6" style={{ textWrap: 'balance' }}>
                A vista de barrio.
              </h2>
              <div className="space-y-4">
                <DCompactRanking
                  title="Mayor subida"
                  dot="bg-emerald-500"
                  items={masSuben.slice(0, 5)}
                  format={(b) => '+' + b.varAnual.toFixed(1) + '%'}
                  formatColor="text-emerald-700"
                />
                <DCompactRanking
                  title="Más accesibles"
                  dot="bg-sky-400"
                  items={masBaratos.slice(0, 5)}
                  format={(b) => b.precio.toLocaleString('es-ES') + ' €'}
                  formatColor="text-slate-900"
                />
              </div>
              <a className="inline-block mt-4 text-sm font-semibold text-emerald-700 underline-offset-4 hover:underline">Ver los 131 barrios →</a>
            </div>
          </div>
        </div>
      </section>

      {/* ── NEWSLETTER — CLARO ──────────────────────────────────────── */}
      <section className="bg-stone-50 py-28 relative overflow-hidden border-b border-slate-200">
        <div className="absolute -right-32 -top-32 w-[480px] h-[480px] rounded-full opacity-30 pointer-events-none" style={{
          background: 'radial-gradient(circle, rgba(16,185,129,0.18) 0%, rgba(16,185,129,0) 70%)',
        }} />

        <div className="max-w-6xl mx-auto px-8 relative">
          <div className="grid grid-cols-12 gap-10 items-end">
            <div className="col-span-7">
              <p className="text-[11px] uppercase tracking-[0.3em] text-emerald-700 font-bold mb-5">Boletín mensual · gratis</p>
              <h2 className="text-5xl font-bold text-slate-900 tracking-tight leading-[1.05] mb-5" style={{ textWrap: 'balance' }}>
                Un email al mes.<br />
                <span className="text-emerald-600">Cero ruido.</span>
              </h2>
              <p className="text-slate-600 text-base max-w-md leading-relaxed">
                Lo que pasa en cada distrito, lo que cambia y lo que aún no se ve. Sin recomendaciones, sin patrocinios.
              </p>
            </div>
            <div className="col-span-5">
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                {nlStatus === 'ok' ? (
                  <div className="py-4 text-center">
                    <p className="text-emerald-700 font-bold text-base mb-1">¡Apuntado!</p>
                    <p className="text-slate-500 text-sm">Te llegará el próximo número el primer lunes del mes.</p>
                  </div>
                ) : (
                  <>
                    <div className="flex gap-2 mb-3">
                      <input
                        className={`flex-1 bg-white border text-slate-900 placeholder-slate-400 rounded-lg px-4 py-3 text-sm focus:ring-1 outline-none ${nlStatus === 'error' ? 'border-red-400 focus:border-red-400 focus:ring-red-200' : 'border-slate-300 focus:border-emerald-500 focus:ring-emerald-500'}`}
                        placeholder="tu@email.com"
                        type="email"
                        value={nlEmail}
                        onChange={(e) => { setNlEmail(e.target.value); if (nlStatus === 'error') setNlStatus('idle'); }}
                        onKeyDown={(e) => e.key === 'Enter' && handleNlSubmit()}
                      />
                      <button
                        onClick={handleNlSubmit}
                        disabled={nlStatus === 'loading'}
                        className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-bold px-5 py-3 rounded-lg text-sm whitespace-nowrap transition-opacity"
                      >
                        {nlStatus === 'loading' ? '…' : 'Suscribirme'}
                      </button>
                    </div>
                    {nlStatus === 'error' && (
                      <p className="text-red-500 text-xs mb-2">Introduce un email válido.</p>
                    )}
                    <p className="text-slate-500 text-xs flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-slate-400" />
                      ~2.400 lectores · 1 envío/mes · sin spam
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────── */}
      <footer className="bg-white border-t border-slate-200 py-10">
        <div className="max-w-6xl mx-auto px-8 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1.5"><span className="text-emerald-600">●</span> Radar Madrid · © 2026</span>
          <span>Datos orientativos. No es asesoramiento financiero.</span>
        </div>
      </footer>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────

// Heatmap color scale — claro version
// 0% → slate-100 (very light)
// 35%+ → emerald-600 (saturated)
function dHeatColor(v) {
  if (v == null) return '#f1f5f9';        // slate-100
  if (v < 0) return '#fee2e2';            // rose-100
  const t = Math.min(1, v / 35);
  // slate-100 → emerald-600
  const c1 = [241, 245, 249];   // slate-100
  const c2 = [5, 150, 105];     // emerald-600
  const r = Math.round(c1[0] + (c2[0] - c1[0]) * t);
  const g = Math.round(c1[1] + (c2[1] - c1[1]) * t);
  const b = Math.round(c1[2] + (c2[2] - c1[2]) * t);
  return `rgb(${r},${g},${b})`;
}

function DTicker({ label, value, delta, up }) {
  const deltaCls = up
    ? 'text-emerald-600'
    : delta.startsWith('-') ? 'text-rose-500' : 'text-slate-400';
  return (
    <div className="flex items-baseline gap-2 whitespace-nowrap">
      <span className="text-slate-400 uppercase tracking-wider text-[9px] font-semibold">{label}</span>
      <span className="text-slate-900 font-bold tabular-nums">{value}</span>
      <span className={`tabular-nums font-semibold ${deltaCls}`}>{delta}</span>
    </div>
  );
}

function DDistritoHeatmap({ distritos }) {
  return (
    <div className="grid grid-cols-7 gap-2">
      {distritos.map((d) => {
        const c = dHeatColor(d.varAnual);
        // tile lightness drives text contrast
        const t = Math.min(1, (d.varAnual ?? 0) / 35);
        const darkText = t < 0.55; // light tile → dark text
        return (
          <div
            key={d.slug}
            className="rounded-md p-3 border border-slate-200 hover:ring-2 hover:ring-emerald-500 hover:ring-offset-2 hover:ring-offset-white transition-shadow cursor-pointer"
            style={{ background: c, minHeight: 110 }}
          >
            <p className={`text-[11px] font-semibold leading-tight ${darkText ? 'text-slate-700' : 'text-white'}`}>
              {d.nombre}
            </p>
            <p className={`text-2xl font-bold tabular-nums mt-2 leading-none ${darkText ? 'text-slate-900' : 'text-white'}`}>
              {d.varAnual >= 0 ? '+' : ''}{d.varAnual.toFixed(1)}%
            </p>
            <p className={`text-[10px] font-mono mt-1.5 tabular-nums ${darkText ? 'text-slate-500' : 'text-white/85'}`}>
              {d.precioMedio.toLocaleString('es-ES')} €/m²
            </p>
          </div>
        );
      })}
    </div>
  );
}

function DSpotlightCard({ d, rank }) {
  const spark = window.makeSparkline(d.precioMedio, d.varAnual);
  return (
    <div className="group relative">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 h-full hover:border-emerald-400 hover:shadow-md transition-all">
        <div className="flex items-center justify-between mb-6">
          <span className="text-[11px] uppercase tracking-[0.2em] text-emerald-700 font-bold">#{rank} · Mayor subida</span>
          <span className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">Distrito #{d.ranking}</span>
        </div>

        <h3 className="text-3xl font-bold text-slate-900 tracking-tight leading-tight mb-1">{d.nombre}</h3>
        <p className="text-sm text-slate-500 mb-6">{d.tx.toLocaleString('es-ES')} transacciones · 12 m</p>

        <div className="flex items-baseline gap-2 mb-2">
          <p className="text-5xl font-bold tabular-nums text-emerald-600 tracking-tight leading-none">+{d.varAnual.toFixed(1)}%</p>
        </div>
        <p className="text-xs text-slate-500 mb-5">Variación interanual €/m²</p>

        <div className="text-emerald-500 mb-5">
          <window.Sparkline values={spark} width={300} height={48} strokeWidth={2} />
        </div>

        <div className="grid grid-cols-3 gap-3 pt-5 border-t border-slate-200 text-xs">
          <div>
            <p className="text-slate-400 text-[10px] uppercase tracking-wider font-semibold mb-1">€/m²</p>
            <p className="font-bold tabular-nums text-slate-900">{d.precioMedio.toLocaleString('es-ES')}</p>
          </div>
          <div>
            <p className="text-slate-400 text-[10px] uppercase tracking-wider font-semibold mb-1">Alquiler</p>
            <p className="font-bold tabular-nums text-slate-900">{d.alquilerM2.toFixed(1)} €</p>
          </div>
          <div>
            <p className="text-slate-400 text-[10px] uppercase tracking-wider font-semibold mb-1">Rent.</p>
            <p className="font-bold tabular-nums text-slate-900">{d.rent.toFixed(2)}%</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function DCompactRanking({ title, dot, items, format, formatColor }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2">
        <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
        <p className="text-sm font-bold text-slate-900">{title}</p>
      </div>
      <ol>
        {items.map((it, i) => (
          <li key={i} className="px-5 py-3 flex items-baseline gap-3 border-t border-slate-50 first:border-t-0">
            <span className="text-[11px] font-bold tabular-nums text-slate-300 w-4">{i + 1}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate leading-tight">{it.nombre}</p>
              <p className="text-[11px] text-slate-400">{it.distrito}</p>
            </div>
            <span className={`text-sm font-bold tabular-nums ${formatColor}`}>{format(it)}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

window.VariationD = VariationD;
