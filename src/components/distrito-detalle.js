// distrito-detalle.js — Fase 1: ficha de distrito (arregla el 404 en /distritos/:slug).
// Depende de window.HOME_DATA, window.NEWS_DATA, window.NotFoundPage-equivalent, window.AffiliateBlock (monetize.js).

function DistritoDetalle({ slug }) {
  const distritos = (window.HOME_DATA && window.HOME_DATA.distritos) || [];
  const d = distritos.find(x => x.slug === slug);

  React.useEffect(() => {
    document.title = d
      ? `${d.nombre} — precio m², rentabilidad y noticias | Radar Inmobiliario Madrid`
      : 'Distrito no encontrado | Radar Inmobiliario Madrid';
  }, [slug, d]);

  if (!d) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="text-emerald-600 text-6xl font-bold mb-4">404</div>
          <h1 className="text-2xl font-bold text-slate-900 mb-3">Distrito no encontrado</h1>
          <p className="text-slate-500 mb-8">No existe ningún distrito con ese identificador. Puede que el enlace esté roto.</p>
          <button onClick={() => window.navTo('/distritos')} className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-emerald-500 transition-colors">Ver todos los distritos</button>
        </div>
      </div>
    );
  }

  const news = (window.NEWS_DATA && window.NEWS_DATA.items) || [];
  const relacionadas = news.filter(n => n.distrito === d.nombre).slice(0, 6);

  const stats = [
    { label: 'Precio medio', valor: `${d.precioMedio.toLocaleString('es-ES')} €/m²` },
    { label: 'Variación interanual', valor: `${d.varAnual >= 0 ? '+' : ''}${d.varAnual.toFixed(1)} %`, up: d.varAnual >= 0 },
    { label: 'Alquiler medio', valor: `${d.alquilerM2.toLocaleString('es-ES')} €/m²` },
    { label: 'Rentabilidad bruta', valor: `${d.rent.toFixed(2)} %` },
    { label: 'Transacciones/año', valor: d.tx.toLocaleString('es-ES') },
    { label: 'Ranking de precio en Madrid', valor: `#${d.ranking} de 21` },
  ];

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif' }} className="bg-slate-50 min-h-screen">
      <div className="max-w-5xl mx-auto px-8 pt-10">
        <nav className="flex items-center gap-2 text-[12px] text-slate-400 mb-6">
          <a href="/" onClick={(e) => { e.preventDefault(); window.navTo('/'); }} className="hover:text-emerald-700">Inicio</a>
          <span>›</span>
          <a href="/distritos" onClick={(e) => { e.preventDefault(); window.navTo('/distritos'); }} className="hover:text-emerald-700">Distritos</a>
          <span>›</span>
          <span className="text-slate-600">{d.nombre}</span>
        </nav>

        <div className="bg-white border border-slate-200 rounded-3xl p-10 mb-10">
          <p className="text-[11px] uppercase tracking-[0.3em] text-emerald-700 font-bold mb-3">Distrito de Madrid</p>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-8" style={{ textWrap: 'balance' }}>{d.nombre}</h1>
          <div className="grid grid-cols-3 gap-5">
            {stats.map((s, i) => (
              <div key={i} className="bg-stone-50 border border-slate-200 rounded-xl px-5 py-4">
                <p className="text-[11px] text-slate-500 mb-1">{s.label}</p>
                <p className={`text-xl font-bold tabular-nums ${s.up === false ? 'text-rose-700' : 'text-slate-900'}`}>{s.valor}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 mb-10 flex items-center justify-between gap-6">
          <div>
            <p className="text-sm font-bold text-slate-900 mb-1">131 barrios de Madrid — datos detallados en Pro</p>
            <p className="text-xs text-slate-600">Consulta el desglose por barrio de {d.nombre}: precio, variación y rentabilidad barrio a barrio.</p>
          </div>
          <button
            onClick={() => window.showProModal('Barrios de ' + d.nombre)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-5 py-2.5 rounded-lg text-sm whitespace-nowrap transition-colors flex-shrink-0"
          >
            Ver barrios →
          </button>
        </div>

        <div className="grid grid-cols-12 gap-8 pb-20">
          <div className="col-span-8">
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400 font-bold mb-4">Noticias de {d.nombre}</p>
            {relacionadas.length > 0 ? (
              <div className="space-y-4">
                {relacionadas.map((n, i) => (
                  <a
                    key={i}
                    href={`/noticia/${n.slug}`}
                    onClick={(e) => { e.preventDefault(); window.navTo(`/noticia/${n.slug}`); }}
                    className="block bg-white border border-slate-200 rounded-xl px-5 py-4 hover:border-emerald-400 transition-colors cursor-pointer"
                  >
                    <p className="text-[10px] uppercase tracking-[0.15em] font-bold text-slate-400 mb-1.5">{n.categoria} · {n.fecha}</p>
                    <p className="text-sm font-semibold text-slate-900 leading-snug" style={{ textWrap: 'balance' }}>{n.titulo}</p>
                  </a>
                ))}
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-xl px-5 py-8 text-center">
                <p className="text-sm text-slate-400">Todavía no hay noticias específicas de {d.nombre}.</p>
                <a href="/noticias" onClick={(e) => { e.preventDefault(); window.navTo('/noticias'); }} className="inline-block mt-3 text-sm font-semibold text-emerald-700 hover:underline underline-offset-4">Ver todas las noticias →</a>
              </div>
            )}
          </div>
          <div className="col-span-4">
            {window.AffiliateBlock && <window.AffiliateBlock context="hipoteca" />}
            <a
              href="/distritos"
              onClick={(e) => { e.preventDefault(); window.navTo('/distritos'); }}
              className="block mt-5 text-sm font-semibold text-emerald-700 hover:underline underline-offset-4"
            >
              ← Ver todos los distritos
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
window.DistritoDetalle = DistritoDetalle;
