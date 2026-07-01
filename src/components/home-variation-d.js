// Variation D — Híbrido (C + B), FULL CLARO
// Base: Mapa-first / espacial (C). Toma de B: ticker macro + heatmap denso de distritos.
// Todo en tono claro: bg-white / bg-stone-50 / bg-emerald-50 alternados, acento emerald-600.

function VariationD() {
  const D = window.HOME_DATA;
  const { meta, distritos, masSuben, masBaratos, macro } = D;

  const _news = window.NEWS_DATA || {};
  const latestNews = (_news.items && _news.items.length
    ? _news.items
    : [_news.destacada].filter(Boolean)).slice(0, 4);

  const spotlight = [...distritos].sort((a, b) => b.varAnual - a.varAnual)[0];
  const top3Movers = [...distritos].sort((a, b) => b.varAnual - a.varAnual).slice(0, 3);
  const heatmapSorted = [...distritos].sort((a, b) => b.varAnual - a.varAnual);

  const mapContainerRef = React.useRef(null);
  const [mapHeight, setMapHeight] = React.useState(720);
  React.useEffect(() => {
    if (!mapContainerRef.current) return;
    const obs = new ResizeObserver(([e]) => setMapHeight(e.contentRect.height));
    obs.observe(mapContainerRef.current);
    return () => obs.disconnect();
  }, []);

  const BEEHIIV_URL = '/.netlify/functions/subscribe';

  const [nlEmail, setNlEmail] = React.useState('');
  const [nlStatus, setNlStatus] = React.useState('idle'); // idle | loading | ok | error

  function handleNlSubmit() {
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nlEmail.trim());
    if (!valid) { setNlStatus('error'); return; }
    if (!BEEHIIV_URL) {
      // Sin URL configurada, abrimos la página de Beehiiv directamente
      window.open('https://beehiiv.com', '_blank');
      return;
    }
    setNlStatus('loading');
    fetch(BEEHIIV_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: nlEmail.trim() }),
    })
      .then((r) => { setNlStatus(r.ok ? 'ok' : 'error'); })
      .catch(() => { setNlStatus('error'); });
  }

  return (
    <div className="bg-stone-50 text-slate-900" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* ── HEADER ──────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
            <span className="text-emerald-600 text-xl leading-none">●</span>
            <span>Radar Inmobiliario</span>
            <span className="text-emerald-600">Madrid</span>
          </div>
          <nav className="flex items-center gap-6 text-sm text-slate-600">
            <a href="/distritos" className="hover:text-emerald-700" onClick={(e) => { e.preventDefault(); window.navTo && window.navTo('/distritos'); }}>Distritos</a>
            <a href="/noticias" className="hover:text-emerald-700" onClick={(e) => { e.preventDefault(); window.navTo && window.navTo('/noticias'); }}>Noticias</a>
            <a href="/sobre" className="hover:text-emerald-700" onClick={(e) => { e.preventDefault(); window.navTo && window.navTo('/sobre'); }}>Acerca</a>
            <span className="bg-emerald-600 text-white px-3 py-1.5 rounded-md cursor-pointer hover:bg-emerald-500">Newsletter</span>
          </nav>
        </div>
      </header>

      {/* ── TICKER BAR — CLARO ──────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-8 py-2.5 flex items-center gap-8 text-[11px] font-mono">
          <DTicker label="MADRID €/m²"    value={meta.precioMedio.toLocaleString('es-ES')} delta={`+${meta.variacionMedia.toFixed(1)}%`} up />
          <DTicker label="EURIBOR 12m"    value={macro.euribor12m.toFixed(2) + '%'} delta={macro.euriborDelta.toFixed(2)} />
          <DTicker label="ESFUERZO %"      value={macro.esfuerzoHipoteca.toFixed(1) + '%'} delta={macro.esfuerzoDelta.toFixed(1)} />
          <DTicker label="HIPOTECAS / MES" value={macro.hipotecasMensual.toLocaleString('es-ES')} delta={`+${macro.hipotecasDelta.toFixed(1)}%`} up />
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
          <div className="mb-6">
            <p className="text-[11px] uppercase tracking-[0.3em] text-emerald-700 font-bold mb-3 flex items-center gap-2">
              Radar en vivo · {meta.fecha}
            </p>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight leading-[1.05] max-w-2xl" style={{ textWrap: 'balance' }}>
              Madrid en una mirada.<br />
              <span className="text-emerald-600">21 distritos. 131 barrios.</span>
            </h1>
          </div>

          {/* THE BIG MAP */}
          <div className="relative">
            <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
              <div ref={mapContainerRef} className="relative" style={{ height: 'clamp(420px, 56vw, 720px)' }}>
                <div className="absolute inset-0">
                  <window.MadridGeoMap
                    distritos={distritos}
                    height={mapHeight}
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
                  style={{ bottom: 28, right: 28 }}
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
            <a href="/distritos" className="text-emerald-700 font-semibold hover:underline underline-offset-4" onClick={(e) => { e.preventDefault(); window.navTo && window.navTo('/distritos'); }}>Abrir mapa completo →</a>
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
                {latestNews.map((n, i) => (
                  <li key={n.slug || i} className="border-b border-slate-200 py-5 group">
                    <a href={'/noticia/' + n.slug} onClick={(e) => { e.preventDefault(); window.navTo && window.navTo('/noticia/' + n.slug); }} className="flex items-baseline gap-5 cursor-pointer">
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
                    </a>
                  </li>
                ))}
              </ul>
              <a href="/noticias" onClick={(e) => { e.preventDefault(); window.navTo && window.navTo('/noticias'); }} className="inline-block mt-6 text-sm font-semibold text-emerald-700 underline-offset-4 hover:underline">Todas las noticias →</a>
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
              <a href="/distritos" onClick={(e) => { e.preventDefault(); window.navTo && window.navTo('/distritos'); }} className="inline-block mt-4 text-sm font-semibold text-emerald-700 underline-offset-4 hover:underline">Ver los 131 barrios →</a>
            </div>
          </div>
        </div>
      </section>

      {/* ── HERRAMIENTAS DE INVESTIGACIÓN ─────────────────────────── */}
      <section className="bg-white py-20 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-8">
          <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400 font-bold mb-3">Herramientas</p>
          <h2 className="text-4xl font-bold text-slate-900 tracking-tight mb-8" style={{ textWrap: 'balance' }}>
            Analiza antes de decidir.
          </h2>
          <div className="bg-stone-50 border border-slate-200 rounded-2xl divide-y divide-slate-200">
            {[
              {
                icon: 'doc',
                titulo: 'Simulador de hipoteca',
                descripcion: 'Cuota mensual, intereses y coste total con Euríbor o tipo fijo, por distrito.',
                badge: 'Gratis',
                action: () => window.navTo && window.navTo('/herramientas/simulador'),
              },
              {
                icon: 'compare',
                titulo: 'Comparador de distritos',
                descripcion: 'Cruza precio, rentabilidad y variación anual de hasta 3 distritos a la vez.',
                badge: 'Pro',
                action: () => window.navTo && window.navTo('/herramientas/comparador'),
              },
              {
                icon: 'bell',
                titulo: 'Alertas de barrio',
                descripcion: 'Recibe un aviso cuando el precio de tu barrio se mueva más de lo habitual.',
                badge: 'Pro',
                action: () => window.showProModal && window.showProModal('Alertas de barrio'),
              },
            ].map((h, i) => (
              <div key={i} className="flex items-center justify-between px-6 py-5">
                <div className="flex items-center gap-5">
                  {window.NewsV2Icon && <window.NewsV2Icon name={h.icon} />}
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-base font-semibold text-slate-900 tracking-tight">{h.titulo}</p>
                      <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${h.badge === 'Gratis' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{h.badge}</span>
                    </div>
                    <p className="text-sm text-slate-500 leading-relaxed mt-0.5 max-w-md">{h.descripcion}</p>
                  </div>
                </div>
                <button onClick={h.action} className="bg-white border border-slate-200 text-slate-700 font-semibold px-4 py-2 rounded-lg text-sm whitespace-nowrap hover:border-emerald-400 hover:text-emerald-700 transition-colors">
                  {h.badge === 'Gratis' ? 'Abrir →' : 'Ver más →'}
                </button>
              </div>
            ))}
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
                      1 envío/mes · sin spam ·{' '}
                      <a href="/legal" onClick={(e) => { e.preventDefault(); window.navTo && window.navTo('/legal'); }} className="underline hover:text-slate-700">privacidad</a>
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────── */}
      <footer className="bg-white border-t border-slate-200 py-12">
        <div className="max-w-6xl mx-auto px-8">
          <div className="flex items-start justify-between gap-10">
            <div className="max-w-xs">
              <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-900 mb-2">
                <span className="text-emerald-600">●</span>
                <span>Radar Inmobiliario Madrid</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">Publicación independiente de datos del mercado inmobiliario de Madrid. Análisis sin patrocinios ni afiliados.</p>
              <p className="text-xs text-slate-500 mt-2">
                <a href="mailto:hola@radarinmobiliario.com" className="hover:text-emerald-700">hola@radarinmobiliario.com</a>
              </p>
            </div>
            <div className="flex gap-14 text-xs">
              <div>
                <p className="text-slate-400 uppercase tracking-wider font-semibold mb-3">Explorar</p>
                <div className="space-y-2">
                  <a href="/distritos" onClick={(e) => { e.preventDefault(); window.navTo && window.navTo('/distritos'); }} className="block text-slate-600 hover:text-emerald-700">Distritos</a>
                  <a href="/noticias" onClick={(e) => { e.preventDefault(); window.navTo && window.navTo('/noticias'); }} className="block text-slate-600 hover:text-emerald-700">Noticias</a>
                </div>
              </div>
              <div>
                <p className="text-slate-400 uppercase tracking-wider font-semibold mb-3">Publicación</p>
                <div className="space-y-2">
                  <a href="/sobre" onClick={(e) => { e.preventDefault(); window.navTo && window.navTo('/sobre'); }} className="block text-slate-600 hover:text-emerald-700">Acerca</a>
                  <a href="/metodologia" onClick={(e) => { e.preventDefault(); window.navTo && window.navTo('/metodologia'); }} className="block text-slate-600 hover:text-emerald-700">Metodología</a>
                  <a href="/legal" onClick={(e) => { e.preventDefault(); window.navTo && window.navTo('/legal'); }} className="block text-slate-600 hover:text-emerald-700">Legal / Privacidad</a>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-10 pt-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <span>© 2026 Radar Inmobiliario Madrid. Datos orientativos, no asesoramiento financiero.</span>
            <span>Madrid, España</span>
          </div>
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
