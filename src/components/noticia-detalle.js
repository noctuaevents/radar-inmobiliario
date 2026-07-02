// Detalle de noticia · 3 variaciones del rediseño
// Usa la pieza "Madrid Nuevo Norte" (categoría Urbanismo → ámbar) como ejemplo,
// con datos reales de distritos (Fuencarral-El Pardo, Chamartín) del repo.
//
// Lenguaje visual: paper + Inter + slate/stone, acento ámbar para Urbanismo,
// barras de acento laterales, métricas con tabular-nums, JetBrains Mono para fechas.
// Sin fondos oscuros (consistente con N2).

const ARTICLE = {
  categoria: 'Urbanismo',
  categoriaSlug: 'urbanism',
  accent: 'amber',  // ámbar para urbanismo/obras
  distritoPrincipal: {
    slug: 'fuencarral-el-pardo',
    nombre: 'Fuencarral-El Pardo',
    precioMedio: 5423,
    variacionAnual: 17.6,
    transaccionesUltimoAno: 2196,
    rentabilidadBrutaPct: 4.4,
  },
  distritoSecundario: {
    slug: 'chamartin',
    nombre: 'Chamartín',
    precioMedio: 8187,
    variacionAnual: 13.44,
    transaccionesUltimoAno: 1914,
  },
  fuente: { nombre: '20minutos', url: '#' },
  fecha: '18 May 2026',
  fechaCorta: '18 May',
  hora: '09:32',
  leyendaTiempo: 'hace 2 días',
  tiempoLectura: '5 min',
  title: 'Madrid Nuevo Norte ya es realidad tras 30 años en proyecto',
  resumen: 'Arrancan los derribos en Las Tablas Oeste con demolición de 15 edificios. El ámbito prevé 741 viviendas y más de 91.000 m² de zonas verdes; Malmea–San Roque–Tres Olivos suma más de 7.100 viviendas.',
  tags: ['obra-pública', 'en-ejecución', 'ayuntamiento-madrid', 'nuevo-norte', 'desarrollo-residencial'],
  // body como bloques (para poder hacer drop-cap y pull-quote)
  body: [
    { type: 'p', dropcap: true, text: 'El proyecto Madrid Nuevo Norte ha pasado a la fase de ejecución material tras tres décadas de tramitación. Los trabajos de derribo han comenzado en el ámbito de Las Tablas Oeste, donde se prevé la demolición de 15 edificios sobre una superficie de 113.725 metros cuadrados, con retirada de 15.740 metros cúbicos de materiales.' },
    { type: 'p', text: 'El ámbito de Las Tablas Oeste contempla la construcción de 741 viviendas, de las cuales el 38% corresponderán a gestión municipal, lo que implica una aportación relevante a la oferta de vivienda asequible en el norte de Madrid. La actuación incluye además más de 91.000 metros cuadrados de zonas verdes, una dotación que mejora significativamente los estándares de espacio libre del entorno.' },
    { type: 'pullquote', text: 'El 38% de Las Tablas Oeste será gestión municipal — la mayor aportación de vivienda asequible al norte de Madrid en una década.' },
    { type: 'p', text: 'De forma complementaria, el ámbito de Malmea–San Roque–Tres Olivos, también dentro del desarrollo de Madrid Nuevo Norte, prevé la construcción de más de 7.100 viviendas, lo que convierte esta zona en uno de los focos de nueva oferta residencial más significativos del norte metropolitano.' },
    { type: 'p', text: 'El inicio de los derribos supone un hito simbólico y operativo en un proyecto que ha marcado durante décadas el debate urbanístico madrileño. La escala del desarrollo —tanto en número de viviendas como en superficie de nuevos espacios públicos— tendrá impacto en la dinámica de precios del norte de Madrid, particularmente en distritos limítrofes como Fuencarral-El Pardo y Chamartín.' },
    { type: 'p', text: 'La participación del 38% de gestión municipal en Las Tablas Oeste introduce una variable de vivienda pública en un entorno residencial de gama media-alta, lo que puede influir en el perfil de demanda del conjunto del desarrollo.' },
  ],
  datosClave: [
    { label: 'Viviendas Las Tablas Oeste', valor: '741', tag: 'nuevas' },
    { label: 'Gestión municipal', valor: '38 %', tag: 'asequible' },
    { label: 'Zonas verdes', valor: '91.000 m²', tag: 'parque' },
    { label: 'Viviendas Malmea–SR–TO', valor: '7.100', tag: 'fase 2' },
    { label: 'Superficie de derribo', valor: '113.725 m²', tag: 'demolición' },
    { label: 'Año primeras entregas', valor: '2029', tag: 'cronograma' },
  ],
  relacionadas: [
    {
      categoria: 'Obras', accent: 'emerald',
      fecha: '12 May',
      titulo: 'Madrid Nuevo Norte: licitada la primera fase residencial (10.500 viviendas)',
      resumen: 'BBVA y ACS adjudican el primer pliego. Precio medio de salida: 6.800 €/m².',
      fuente: 'Idealista News',
      impacto: '6.800 €/m²',
    },
    {
      categoria: 'Infraestructura', accent: 'amber',
      fecha: '20 May',
      titulo: 'San Blas lidera Madrid: +32,8 % tras el anuncio del nuevo intercambiador',
      resumen: 'Hellín y Salvador concentran el 60 % de las transacciones del último trimestre.',
      fuente: 'El País · Madrid',
      impacto: '+32,8 %',
    },
    {
      categoria: 'Urbanismo', accent: 'amber',
      fecha: '08 May',
      titulo: 'El parque de Montecarmelo arranca: 14 hectáreas y 4 nuevos accesos',
      resumen: 'Las obras del nuevo parque conectan Las Tablas con Montecarmelo en 8 minutos.',
      fuente: 'Madridiario',
      impacto: '–8 min',
    },
  ],
  // serie precio €/m² Fuencarral-El Pardo, 24 meses (mock plausible)
  serie24m: [4612, 4628, 4655, 4682, 4710, 4744, 4778, 4812, 4855, 4901, 4948, 4994, 5042, 5091, 5135, 5180, 5224, 5267, 5308, 5347, 5378, 5402, 5418, 5423],
};

const accentClasses = {
  amber:   { bar: 'bg-amber-500', dot: 'bg-amber-500', text: 'text-amber-700', soft: 'bg-amber-50', softBorder: 'border-amber-200', chip: 'bg-amber-100 text-amber-800 border-amber-200' },
  emerald: { bar: 'bg-emerald-500', dot: 'bg-emerald-500', text: 'text-emerald-700', soft: 'bg-emerald-50', softBorder: 'border-emerald-200', chip: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  rose:    { bar: 'bg-rose-500', dot: 'bg-rose-500', text: 'text-rose-700', soft: 'bg-rose-50', softBorder: 'border-rose-200', chip: 'bg-rose-100 text-rose-800 border-rose-200' },
  sky:     { bar: 'bg-sky-500', dot: 'bg-sky-500', text: 'text-sky-700', soft: 'bg-sky-50', softBorder: 'border-sky-200', chip: 'bg-sky-100 text-sky-800 border-sky-200' },
  violet:  { bar: 'bg-violet-500', dot: 'bg-violet-500', text: 'text-violet-700', soft: 'bg-violet-50', softBorder: 'border-violet-200', chip: 'bg-violet-100 text-violet-800 border-violet-200' },
};

// ─── Sparkline SVG (local — distinta a la global de map.jsx) ─────
function NDSparkline({ data, w = 240, h = 56, stroke = '#b45309', fill = '#fef3c7' }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const step = w / (data.length - 1);
  const points = data.map((v, i) => [i * step, h - ((v - min) / range) * (h - 8) - 4]);
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  const areaD = `${pathD} L ${w} ${h} L 0 ${h} Z`;
  const last = points[points.length - 1];
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="block">
      <path d={areaD} fill={fill} opacity="0.6" />
      <path d={pathD} fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r="3" fill={stroke} />
      <circle cx={last[0]} cy={last[1]} r="6" fill={stroke} opacity="0.2" />
    </svg>
  );
}

function fmtEuro(n) {
  return n.toLocaleString('es-ES') + ' €/m²';
}
function fmtPct(n) {
  return (n >= 0 ? '+' : '') + n.toFixed(1).replace('.', ',') + ' %';
}

// ─── V1 · Editorial híbrido con sidebar ficha distrito ───────────
function NoticiaDetalleV1() {
  const A = ARTICLE;
  const ac = accentClasses[A.accent];
  return (
    <div className="bg-white font-sans" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* breadcrumb */}
      <div className="max-w-6xl mx-auto px-10 pt-10">
        <nav className="flex items-center gap-2 text-[12px] text-slate-400">
          <a className="hover:text-emerald-700 cursor-pointer">Inicio</a>
          <span>›</span>
          <a className="hover:text-emerald-700 cursor-pointer">Noticias</a>
          <span>›</span>
          <span className={ac.text}>{A.categoria}</span>
        </nav>
      </div>

      {/* HERO */}
      <div className="max-w-6xl mx-auto px-10 mt-6">
        <div className="relative bg-stone-50 border border-slate-200 rounded-3xl overflow-hidden">
          <div className={`absolute top-0 left-0 bottom-0 w-1.5 ${ac.bar}`} />
          <div className="relative grid grid-cols-12 gap-10 p-10 pl-12">
            <div className="col-span-7">
              <div className="flex items-center gap-3 mb-6">
                <span className="inline-block w-6 h-px bg-slate-900" />
                <span className="text-[10px] uppercase tracking-[0.28em] font-bold text-slate-900">Reportaje</span>
                <span className="text-slate-300 text-[10px]">·</span>
                <span className={`text-[10px] uppercase tracking-[0.18em] font-bold ${ac.text}`}>{A.categoria}</span>
                <span className="text-slate-300 text-[10px]">·</span>
                <span className="text-[10px] uppercase tracking-[0.12em] text-slate-500 font-semibold">{A.distritoPrincipal.nombre}</span>
              </div>
              <h1 className="text-[2.7rem] font-bold text-slate-900 tracking-[-0.02em] leading-[1.04] mb-5" style={{ textWrap: 'balance' }}>
                {A.title}
              </h1>
              <p className="text-[16px] text-slate-600 leading-relaxed max-w-xl">{A.resumen}</p>
              <div className="flex items-center gap-5 mt-7 text-[12px] text-slate-500">
                <span className="font-semibold text-slate-700">{A.fuente.nombre}</span>
                <span className="text-slate-300">·</span>
                <span className="font-mono tabular-nums">{A.fecha} · {A.hora}</span>
                <span className="text-slate-300">·</span>
                <span>{A.tiempoLectura} de lectura</span>
                <span className="text-slate-300">·</span>
                <span className={`${ac.text} font-semibold`}>● {A.leyendaTiempo}</span>
              </div>
            </div>

            <div className="col-span-5 flex flex-col justify-center">
              <p className="text-[10px] uppercase tracking-[0.22em] text-slate-400 font-bold mb-4">Impacto cuantificable</p>
              <div className="space-y-2.5">
                <div className="bg-white border border-slate-200 rounded-xl px-5 py-3.5 flex items-center justify-between relative overflow-hidden">
                  <span className={`absolute left-0 top-0 bottom-0 w-0.5 ${ac.bar}`} />
                  <span className="text-[12px] text-slate-500">Viviendas nuevas (fase 1)</span>
                  <span className="text-lg font-bold text-slate-900 tabular-nums">741</span>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl px-5 py-3.5 flex items-center justify-between relative overflow-hidden">
                  <span className={`absolute left-0 top-0 bottom-0 w-0.5 ${ac.bar}`} />
                  <span className="text-[12px] text-slate-500">Gestión municipal</span>
                  <span className="text-lg font-bold text-slate-900 tabular-nums">38 %</span>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl px-5 py-3.5 flex items-center justify-between relative overflow-hidden">
                  <span className={`absolute left-0 top-0 bottom-0 w-0.5 ${ac.bar}`} />
                  <span className="text-[12px] text-slate-500">Fase 2 (Malmea–SR–TO)</span>
                  <span className="text-lg font-bold text-slate-900 tabular-nums">7.100</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BODY + SIDEBAR */}
      <div className="max-w-6xl mx-auto px-10 mt-14 grid grid-cols-12 gap-10">
        <div className="col-span-8">
          <article className="prose-article">
            {A.body.map((b, i) => {
              if (b.type === 'p') {
                return (
                  <p key={i} className={`text-[16.5px] text-slate-700 leading-[1.7] mb-6 ${b.dropcap ? 'first-letter:text-[3.4rem] first-letter:font-bold first-letter:text-slate-900 first-letter:mr-2 first-letter:float-left first-letter:leading-[0.95] first-letter:mt-1.5' : ''}`}>
                    {b.text}
                  </p>
                );
              }
              if (b.type === 'pullquote') {
                return (
                  <blockquote key={i} className="my-10 pl-8 py-4 relative">
                    <span className={`absolute left-0 top-0 bottom-0 w-[3px] ${ac.bar}`} />
                    <p className="text-[1.55rem] font-bold text-slate-900 leading-[1.25] tracking-[-0.01em]" style={{ textWrap: 'balance' }}>
                      &ldquo;{b.text}&rdquo;
                    </p>
                  </blockquote>
                );
              }
              return null;
            })}

            {/* CTA fuente original */}
            <div className="mt-10 pt-6 border-t border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400 font-bold">Cobertura original</p>
                <p className="text-[14px] text-slate-700 mt-1">Publicado por <span className="font-semibold">{A.fuente.nombre}</span> el {A.fecha}</p>
              </div>
              <a className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-5 py-2.5 rounded-lg text-sm cursor-pointer">
                Leer en {A.fuente.nombre} ↗
              </a>
            </div>

            {/* tags */}
            <div className="mt-6 flex flex-wrap gap-1.5">
              {A.tags.map((t) => (
                <span key={t} className="text-[11px] bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-medium">#{t}</span>
              ))}
            </div>
          </article>
        </div>

        {/* SIDEBAR */}
        <aside className="col-span-4 space-y-5">
          {/* FICHA DISTRITO con sparkline */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400 font-bold">Distrito afectado</p>
              <span className={`text-[10px] uppercase tracking-[0.12em] font-bold ${ac.text} ${ac.soft} border ${ac.softBorder} rounded px-2 py-0.5`}>en obras</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mt-2">{A.distritoPrincipal.nombre}</h3>
            <p className="text-[12px] text-slate-500 mt-0.5">Ranking #10 de 21 distritos</p>

            <div className="mt-5">
              <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-1">Precio medio · 24 meses</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900 tabular-nums">{fmtEuro(A.distritoPrincipal.precioMedio)}</span>
                <span className="text-[13px] font-bold text-emerald-700 tabular-nums">{fmtPct(A.distritoPrincipal.variacionAnual)}</span>
              </div>
              <div className="mt-2">
                <NDSparkline data={A.serie24m} w={300} h={64} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-5 pt-5 border-t border-slate-100">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Transacciones (12m)</p>
                <p className="text-base font-bold text-slate-900 tabular-nums mt-0.5">{A.distritoPrincipal.transaccionesUltimoAno.toLocaleString('es-ES')}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Rentabilidad bruta</p>
                <p className="text-base font-bold text-slate-900 tabular-nums mt-0.5">{A.distritoPrincipal.rentabilidadBrutaPct} %</p>
              </div>
            </div>

            <a className="block mt-5 text-[12px] font-semibold text-emerald-700 hover:underline underline-offset-4 cursor-pointer">
              Ver ficha completa de {A.distritoPrincipal.nombre} →
            </a>
          </div>

          {/* Otro distrito mencionado */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400 font-bold mb-3">También mencionado</p>
            <div className="flex items-baseline justify-between">
              <div>
                <p className="text-base font-bold text-slate-900">{A.distritoSecundario.nombre}</p>
                <p className="text-[12px] text-slate-500 mt-0.5">{fmtEuro(A.distritoSecundario.precioMedio)} · {A.distritoSecundario.transaccionesUltimoAno.toLocaleString('es-ES')} tx</p>
              </div>
              <span className="text-[13px] font-bold text-emerald-700 tabular-nums">{fmtPct(A.distritoSecundario.variacionAnual)}</span>
            </div>
          </div>

          {/* Lectura analista */}
          <div className={`${ac.soft} border ${ac.softBorder} rounded-2xl p-6`}>
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-700 font-bold mb-3">Lectura del editor</p>
            <p className="text-[14px] text-slate-800 leading-relaxed">
              La entrada en obras es el primer hito en 30 años. Históricamente, anuncios firmes de infraestructura en el norte de Madrid han precedido subidas del 4–7 % en los 18 meses siguientes — pero la oferta municipal del 38 % puede contener el efecto.
            </p>
          </div>

          {/* Compartir */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400 font-bold mb-3">Compartir</p>
            <div className="flex items-center gap-2">
              {['Copiar enlace', 'X', 'LinkedIn', 'Email'].map((s) => (
                <button key={s} className="text-[12px] font-semibold text-slate-700 border border-slate-200 rounded-lg px-3 py-1.5 hover:border-emerald-400 hover:text-emerald-700">{s}</button>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* RELACIONADAS */}
      <div className="max-w-6xl mx-auto px-10 mt-20 pb-20">
        <div className="flex items-end justify-between mb-6 border-b border-slate-200 pb-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400 font-bold mb-1">Sigue el hilo</p>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Más sobre Madrid Nuevo Norte y el norte de la ciudad.</h2>
          </div>
          <a className="text-[12px] font-semibold text-emerald-700 hover:underline underline-offset-4 cursor-pointer">Todas las noticias →</a>
        </div>
        <div className="grid grid-cols-3 gap-5">
          {A.relacionadas.map((r, i) => {
            const c = accentClasses[r.accent];
            return (
              <div key={i} className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-emerald-400 hover:shadow-sm transition-all cursor-pointer group">
                <div className="flex items-center gap-2.5 mb-3">
                  <span className={`text-[10px] uppercase tracking-[0.15em] font-bold px-2 py-0.5 rounded border ${c.chip}`}>{r.categoria}</span>
                  <span className="text-[11px] text-slate-400 font-mono tabular-nums">{r.fecha}</span>
                </div>
                <h3 className="text-[16px] font-bold text-slate-900 tracking-tight leading-snug mb-2 group-hover:text-emerald-700 transition-colors" style={{ textWrap: 'balance' }}>
                  {r.titulo}
                </h3>
                <p className="text-[13px] text-slate-600 leading-relaxed mb-4">{r.resumen}</p>
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <span className="text-[12px] font-semibold text-slate-700">{r.fuente}</span>
                  <span className={`text-[12px] font-bold tabular-nums ${c.text}`}>{r.impacto}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── V2 · Briefing / dossier (title-first, ficha rápida, bullets) ───
function NoticiaDetalleV2() {
  const A = ARTICLE;
  const ac = accentClasses[A.accent];
  const loQueNecesitasSaber = [
    'Las Tablas Oeste arranca con la demolición de 15 edificios sobre 113.725 m². Primeras viviendas previstas para 2029.',
    '741 viviendas en fase 1, con un 38 % de gestión municipal — la mayor inyección de vivienda asequible al norte en una década.',
    'Malmea–San Roque–Tres Olivos suma más de 7.100 viviendas, lo que convierte el ámbito en uno de los mayores desarrollos residenciales de Madrid.',
    'Distritos limítrofes (Fuencarral-El Pardo, Chamartín) llevan acumulando subidas del 13–18 % anual; la nueva oferta puede moderar — no detener — el ritmo.',
  ];
  // bar chart variations distritos limítrofes
  const distritosBar = [
    { nombre: 'Hortaleza', v: 19.4 },
    { nombre: 'Fuencarral-El Pardo', v: A.distritoPrincipal.variacionAnual, highlight: true },
    { nombre: 'Chamartín', v: A.distritoSecundario.variacionAnual, highlight: true },
    { nombre: 'Tetuán', v: 11.8 },
    { nombre: 'Moncloa-Aravaca', v: 9.2 },
  ];
  const maxV = Math.max(...distritosBar.map(d => d.v));

  return (
    <div className="bg-stone-50 font-sans" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* TOP BAR */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-10 py-4 flex items-center justify-between">
          <nav className="flex items-center gap-2 text-[12px] text-slate-500">
            <a className="hover:text-emerald-700 cursor-pointer">←  Volver a Noticias</a>
          </nav>
          <div className="flex items-center gap-4 text-[11px] uppercase tracking-[0.18em] font-bold text-slate-400">
            <span>Briefing</span>
            <span className="text-slate-300">·</span>
            <span className={ac.text}>{A.categoria}</span>
          </div>
        </div>
      </div>

      {/* TITLE BLOCK */}
      <div className="max-w-4xl mx-auto px-10 pt-16 pb-10">
        <div className="flex items-center gap-3 mb-7">
          <span className={`inline-block w-8 h-[3px] ${ac.bar}`} />
          <span className={`text-[11px] uppercase tracking-[0.28em] font-bold ${ac.text}`}>{A.categoria}</span>
          <span className="text-slate-300 text-[10px]">·</span>
          <span className="text-[11px] uppercase tracking-[0.15em] text-slate-500 font-semibold">{A.distritoPrincipal.nombre} · {A.distritoSecundario.nombre}</span>
        </div>
        <h1 className="text-[3.2rem] font-bold text-slate-900 tracking-[-0.025em] leading-[1.02] mb-6" style={{ textWrap: 'balance' }}>
          {A.title}
        </h1>
        <p className="text-[18px] text-slate-600 leading-relaxed max-w-3xl">{A.resumen}</p>

        {/* FICHA RÁPIDA */}
        <div className="mt-9 grid grid-cols-4 gap-px bg-slate-200 border border-slate-200 rounded-2xl overflow-hidden">
          {[
            { k: 'Publicada', v: A.fecha, sub: A.hora },
            { k: 'Fuente', v: A.fuente.nombre, sub: 'Cobertura externa' },
            { k: 'Distritos', v: '2', sub: `${A.distritoPrincipal.nombre.split('-')[0]}, ${A.distritoSecundario.nombre}` },
            { k: 'Lectura', v: A.tiempoLectura, sub: '6 secciones' },
          ].map((f, i) => (
            <div key={i} className="bg-white px-5 py-4">
              <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400 font-bold">{f.k}</p>
              <p className="text-[18px] font-bold text-slate-900 mt-1 tabular-nums">{f.v}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">{f.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* LO QUE NECESITAS SABER */}
      <div className="max-w-4xl mx-auto px-10">
        <div className="bg-white border border-slate-200 rounded-3xl p-10 relative overflow-hidden">
          <div className={`absolute top-0 left-0 right-0 h-1 ${ac.bar}`} />
          <div className="flex items-center gap-3 mb-6">
            <span className="text-[11px] uppercase tracking-[0.28em] font-bold text-slate-900">Lo que necesitas saber</span>
            <span className="text-slate-300 text-[10px]">·</span>
            <span className="text-[11px] uppercase tracking-[0.15em] text-slate-500 font-semibold">{loQueNecesitasSaber.length} puntos clave</span>
          </div>
          <ol className="space-y-5">
            {loQueNecesitasSaber.map((b, i) => (
              <li key={i} className="flex gap-5">
                <span className={`flex-shrink-0 w-7 h-7 rounded-full ${ac.soft} border ${ac.softBorder} ${ac.text} font-bold flex items-center justify-center text-[13px] tabular-nums`}>{i + 1}</span>
                <p className="text-[15.5px] text-slate-800 leading-[1.65] pt-0.5">{b}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* BODY */}
      <div className="max-w-3xl mx-auto px-10 pt-16">
        <article>
          <h2 className="text-[1.65rem] font-bold text-slate-900 tracking-tight mt-2 mb-5 flex items-center gap-3">
            <span className={`w-1.5 h-6 ${ac.bar} rounded-full`} />
            El proyecto entra en obras
          </h2>
          {A.body.slice(0, 2).map((b, i) => (
            <p key={i} className="text-[16.5px] text-slate-700 leading-[1.7] mb-5">{b.text}</p>
          ))}

          {/* INLINE CALLOUT */}
          <div className={`my-10 ${ac.soft} border ${ac.softBorder} rounded-2xl p-7`}>
            <div className="flex items-center gap-3 mb-3">
              <span className={`text-[10px] uppercase tracking-[0.22em] font-bold ${ac.text}`}>Datos clave</span>
              <span className="flex-1 h-px bg-slate-200" />
            </div>
            <div className="grid grid-cols-3 gap-5">
              {A.datosClave.slice(0, 6).map((d, i) => (
                <div key={i}>
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">{d.tag}</p>
                  <p className="text-xl font-bold text-slate-900 tabular-nums mt-0.5">{d.valor}</p>
                  <p className="text-[11px] text-slate-600 leading-snug mt-0.5">{d.label}</p>
                </div>
              ))}
            </div>
          </div>

          <h2 className="text-[1.65rem] font-bold text-slate-900 tracking-tight mt-2 mb-5 flex items-center gap-3">
            <span className={`w-1.5 h-6 ${ac.bar} rounded-full`} />
            El impacto sobre el mercado
          </h2>
          {A.body.slice(3, 6).map((b, i) => (
            <p key={i} className="text-[16.5px] text-slate-700 leading-[1.7] mb-5">{b.text}</p>
          ))}
        </article>
      </div>

      {/* DISTRITOS BAR CHART */}
      <div className="max-w-4xl mx-auto px-10 pt-10">
        <div className="bg-white border border-slate-200 rounded-3xl p-10">
          <div className="flex items-end justify-between mb-7 pb-5 border-b border-slate-100">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400 font-bold mb-1">Variación anual del precio</p>
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">Norte de Madrid: los distritos afectados, en contexto</h3>
            </div>
            <p className="text-[11px] text-slate-400 font-mono tabular-nums">€/m² · 12 meses</p>
          </div>
          <div className="space-y-3">
            {distritosBar.map((d, i) => (
              <div key={i} className="flex items-center gap-4">
                <span className={`w-44 text-[13px] ${d.highlight ? 'font-bold text-slate-900' : 'text-slate-600'} flex-shrink-0`}>{d.nombre}</span>
                <div className="flex-1 relative h-7 bg-slate-50 rounded-md overflow-hidden">
                  <div
                    className={`h-full rounded-md transition-all ${d.highlight ? ac.bar : 'bg-slate-300'}`}
                    style={{ width: `${(d.v / maxV) * 100}%` }}
                  />
                  {d.highlight && (
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] uppercase tracking-wider font-bold text-white">Citado</span>
                  )}
                </div>
                <span className={`w-20 text-right text-[14px] tabular-nums font-bold ${d.highlight ? ac.text : 'text-slate-600'}`}>{fmtPct(d.v)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RELACIONADAS TIMELINE */}
      <div className="max-w-4xl mx-auto px-10 pt-16 pb-20">
        <div className="flex items-end justify-between mb-6 border-b border-slate-200 pb-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400 font-bold mb-1">Línea del tiempo</p>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Madrid Nuevo Norte: cómo hemos llegado hasta aquí</h2>
          </div>
        </div>
        <div className="relative pl-8 border-l-2 border-slate-200">
          {A.relacionadas.map((r, i) => {
            const c = accentClasses[r.accent];
            return (
              <div key={i} className="relative mb-7 last:mb-0">
                <span className={`absolute -left-[2.35rem] top-2 w-4 h-4 rounded-full border-4 border-stone-50 ${c.dot}`} />
                <div className="bg-white border border-slate-200 rounded-xl p-5 hover:border-emerald-400 hover:shadow-sm transition-all cursor-pointer">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-[11px] text-slate-500 font-mono tabular-nums">{r.fecha}</span>
                    <span className={`text-[10px] uppercase tracking-[0.15em] font-bold ${c.text}`}>{r.categoria}</span>
                  </div>
                  <h4 className="text-[16px] font-bold text-slate-900 tracking-tight leading-snug mb-1" style={{ textWrap: 'balance' }}>{r.titulo}</h4>
                  <div className="flex items-center justify-between text-[12px] text-slate-500 mt-2">
                    <span>{r.fuente}</span>
                    <span className={`font-bold tabular-nums ${c.text}`}>{r.impacto}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── V3 · Magazine long-form (cover full-bleed + TOC sticky) ─────
function NoticiaDetalleV3() {
  const A = ARTICLE;
  const ac = accentClasses[A.accent];
  const toc = [
    { id: 's1', label: 'El proyecto entra en obras', dot: 1 },
    { id: 's2', label: 'Las Tablas Oeste · 741 viviendas', dot: 2 },
    { id: 's3', label: 'El impacto sobre el mercado', dot: 3 },
    { id: 's4', label: 'Datos clave', dot: 4 },
    { id: 's5', label: 'Distritos afectados', dot: 5 },
  ];

  return (
    <div className="bg-white font-sans" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* READING PROGRESS BAR (decorativa, estática al 28%) */}
      <div className="h-[3px] bg-slate-100">
        <div className={`h-full ${ac.bar}`} style={{ width: '28%' }} />
      </div>

      {/* COVER */}
      <div className="relative">
        {/* Imagen real (image-slot) — arrastra una foto encima */}
        <div className="relative h-[460px] overflow-hidden bg-slate-900">
          {/* Slot que ocupa todo el cover */}
          <image-slot
            id="nd3-cover-mnn"
            placeholder="Arrastra una foto editorial (Las Tablas Oeste, derribos)"
            fit="cover"
            shape="rect"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}
          ></image-slot>

          {/* Vignette / gradient overlay para legibilidad del título blanco */}
          <div className="absolute inset-0 pointer-events-none" style={{
            background: 'linear-gradient(180deg, rgba(15,23,42,0.55) 0%, rgba(15,23,42,0.15) 35%, rgba(15,23,42,0.35) 60%, rgba(15,23,42,0.85) 100%)',
          }} />
          <div className="absolute inset-0 pointer-events-none" style={{
            background: 'radial-gradient(ellipse at 25% 70%, rgba(245,158,11,0.18) 0%, transparent 55%)',
          }} />

          {/* Top chrome: breadcrumb + meta */}
          <div className="absolute top-6 left-10 right-10 flex items-center justify-between pointer-events-none">
            <nav className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-stone-300 font-semibold">
              <span className="text-stone-400">←</span>
              <a className="hover:text-white cursor-pointer pointer-events-auto">Noticias</a>
              <span className="text-stone-500">·</span>
              <span className={`${ac.text} text-amber-300`}>{A.categoria}</span>
            </nav>
            <div className="text-[10px] uppercase tracking-[0.22em] text-stone-400 font-mono tabular-nums">
              18.05.2026 · 09:32 · madrid
            </div>
          </div>

          {/* Title overlay */}
          <div className="absolute inset-0 flex items-end pointer-events-none">
            <div className="max-w-6xl mx-auto px-10 pb-16 w-full">
              <div className="flex items-center gap-3 mb-6">
                <span className={`inline-block w-10 h-[3px] ${ac.bar}`} />
                <span className="text-[11px] uppercase tracking-[0.32em] font-bold text-amber-300">{A.categoria}</span>
                <span className="text-stone-500 text-[10px]">·</span>
                <span className="text-[11px] uppercase tracking-[0.15em] text-stone-300 font-semibold">Reportaje</span>
                <span className="text-stone-500 text-[10px]">·</span>
                <span className="text-[11px] uppercase tracking-[0.15em] text-stone-300 font-semibold">{A.distritoPrincipal.nombre}</span>
              </div>
              <h1 className="text-[3.4rem] font-bold text-white tracking-[-0.025em] leading-[1.02] max-w-4xl drop-shadow-sm" style={{ textWrap: 'balance' }}>
                {A.title}
              </h1>
              <p className="text-[17px] text-stone-100 leading-relaxed max-w-2xl mt-6">{A.resumen}</p>
            </div>
          </div>
        </div>

        {/* MÉTRICAS BAND (overlapping cover) */}
        <div className="max-w-6xl mx-auto px-10 -mt-8 relative z-10">
          <div className="grid grid-cols-4 gap-px bg-slate-200 border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            {[
              { k: 'Viviendas (fase 1)', v: '741', s: 'Las Tablas Oeste', accent: false },
              { k: 'Gestión municipal', v: '38 %', s: 'vivienda asequible', accent: true },
              { k: 'Fase 2 prevista', v: '7.100', s: 'Malmea–SR–TO', accent: false },
              { k: 'Precio actual distrito', v: fmtEuro(A.distritoPrincipal.precioMedio), s: fmtPct(A.distritoPrincipal.variacionAnual) + ' interanual', accent: false },
            ].map((m, i) => (
              <div key={i} className={`px-6 py-5 ${m.accent ? ac.soft : 'bg-white'}`}>
                <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500 font-bold">{m.k}</p>
                <p className={`text-2xl font-bold mt-1.5 tabular-nums ${m.accent ? ac.text : 'text-slate-900'}`}>{m.v}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{m.s}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* BODY 8/4 */}
      <div className="max-w-6xl mx-auto px-10 pt-16 grid grid-cols-12 gap-12">
        <article className="col-span-8">
          <p className="text-[12px] uppercase tracking-[0.22em] text-slate-400 font-bold mb-3">
            Por la redacción de Radar · {A.tiempoLectura} de lectura
          </p>

          <h2 id="s1" className="text-[1.8rem] font-bold text-slate-900 tracking-tight mt-2 mb-5">
            <span className={`inline-block w-1.5 h-7 ${ac.bar} rounded-full mr-3 align-middle`} />
            El proyecto entra en obras
          </h2>
          <p className="text-[17px] text-slate-700 leading-[1.72] mb-6 first-letter:text-[3.6rem] first-letter:font-bold first-letter:text-slate-900 first-letter:mr-2 first-letter:float-left first-letter:leading-[0.95] first-letter:mt-1.5">
            {A.body[0].text}
          </p>

          <h2 id="s2" className="text-[1.8rem] font-bold text-slate-900 tracking-tight mt-10 mb-5">
            <span className={`inline-block w-1.5 h-7 ${ac.bar} rounded-full mr-3 align-middle`} />
            Las Tablas Oeste · 741 viviendas
          </h2>
          <p className="text-[17px] text-slate-700 leading-[1.72] mb-6">{A.body[1].text}</p>

          {/* Pull quote */}
          <blockquote className="my-10 py-6 border-y border-slate-200">
            <span className={`inline-block ${ac.text} text-4xl leading-none align-top mr-2 font-serif`}>“</span>
            <span className="text-[1.55rem] font-bold text-slate-900 leading-[1.3] tracking-[-0.01em]" style={{ textWrap: 'balance' }}>
              El 38% de Las Tablas Oeste será gestión municipal — la mayor aportación de vivienda asequible al norte de Madrid en una década.
            </span>
          </blockquote>

          <h2 id="s3" className="text-[1.8rem] font-bold text-slate-900 tracking-tight mt-10 mb-5">
            <span className={`inline-block w-1.5 h-7 ${ac.bar} rounded-full mr-3 align-middle`} />
            El impacto sobre el mercado
          </h2>
          {A.body.slice(3, 5).map((b, i) => (
            <p key={i} className="text-[17px] text-slate-700 leading-[1.72] mb-6">{b.text}</p>
          ))}

          <h2 id="s4" className="text-[1.4rem] font-bold text-slate-900 tracking-tight mt-12 mb-4 flex items-center gap-3">
            <span className={`w-1.5 h-5 ${ac.bar} rounded-full`} />
            Datos clave
          </h2>
          <div className="grid grid-cols-3 gap-px bg-slate-200 border border-slate-200 rounded-2xl overflow-hidden">
            {A.datosClave.map((d, i) => (
              <div key={i} className="bg-white px-5 py-4">
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">{d.tag}</p>
                <p className="text-xl font-bold text-slate-900 tabular-nums mt-0.5">{d.valor}</p>
                <p className="text-[11px] text-slate-600 leading-snug mt-0.5">{d.label}</p>
              </div>
            ))}
          </div>

          {/* fuente */}
          <div className="mt-12 pt-6 border-t border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400 font-bold">Cobertura original</p>
              <p className="text-[14px] text-slate-700 mt-1">Publicado por <span className="font-semibold">{A.fuente.nombre}</span> · {A.fecha}</p>
            </div>
            <a className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-5 py-2.5 rounded-lg text-sm cursor-pointer">
              Leer en {A.fuente.nombre} ↗
            </a>
          </div>

          {/* tags */}
          <div className="mt-6 flex flex-wrap gap-1.5">
            {A.tags.map((t) => (
              <span key={t} className="text-[11px] bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-medium">#{t}</span>
            ))}
          </div>
        </article>

        {/* STICKY RAIL */}
        <aside className="col-span-4">
          <div className="sticky top-6 space-y-5">
            {/* TOC */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400 font-bold">En este reportaje</p>
                <span className="text-[10px] text-slate-400 font-mono tabular-nums">2 / {toc.length}</span>
              </div>
              <ol className="relative">
                {/* Línea vertical */}
                <span className="absolute left-[7px] top-1 bottom-1 w-px bg-slate-200" />
                {toc.map((t, i) => {
                  const isActive = i === 1;
                  const isPast = i < 1;
                  return (
                    <li key={t.id} className="relative pl-7 pb-3 last:pb-0 cursor-pointer group">
                      <span className={`absolute left-0 top-1 w-[15px] h-[15px] rounded-full border-2 ${isActive ? `${ac.bar} border-white ring-2 ${ac.text} ring-current` : isPast ? `${ac.bar} border-white` : 'bg-white border-slate-300 group-hover:border-emerald-500'}`} style={isActive ? { boxShadow: `0 0 0 3px ${A.accent === 'amber' ? 'rgba(245,158,11,0.2)' : 'rgba(16,185,129,0.2)'}` } : {}} />
                      <div className={`text-[13px] leading-snug ${isActive ? 'text-slate-900 font-bold' : isPast ? 'text-slate-500' : 'text-slate-600 group-hover:text-emerald-700'}`}>
                        <span className={`text-[10px] font-mono tabular-nums mr-2 ${isActive ? ac.text : 'text-slate-400'}`}>0{t.dot}</span>
                        {t.label}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>

            {/* MÉTRICAS DISTRITO */}
            <div className="bg-stone-50 border border-slate-200 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400 font-bold">Distrito en vivo</p>
                <span className="text-[10px] text-emerald-700 font-bold tracking-wider">● ACTUALIZADO</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mt-1">{A.distritoPrincipal.nombre}</h3>
              <div className="flex items-baseline gap-2 mt-3">
                <span className="text-2xl font-bold text-slate-900 tabular-nums">{fmtEuro(A.distritoPrincipal.precioMedio)}</span>
                <span className="text-[12px] font-bold text-emerald-700 tabular-nums">{fmtPct(A.distritoPrincipal.variacionAnual)}</span>
              </div>
              <NDSparkline data={A.serie24m} w={290} h={56} />
              <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-slate-200">
                <div>
                  <p className="text-[10px] uppercase text-slate-400 font-semibold">Transacciones</p>
                  <p className="text-sm font-bold text-slate-900 tabular-nums">{A.distritoPrincipal.transaccionesUltimoAno.toLocaleString('es-ES')}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-slate-400 font-semibold">Rentabilidad</p>
                  <p className="text-sm font-bold text-slate-900 tabular-nums">{A.distritoPrincipal.rentabilidadBrutaPct} %</p>
                </div>
              </div>
              <a className="block mt-4 text-[12px] font-semibold text-emerald-700 hover:underline underline-offset-4 cursor-pointer">
                Ficha completa →
              </a>
            </div>

            {/* TAMBIÉN */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5">
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400 font-bold mb-3">También mencionado</p>
              <div className="flex items-center justify-between">
                <span className="text-[14px] font-semibold text-slate-800">{A.distritoSecundario.nombre}</span>
                <span className="text-[12px] font-bold text-emerald-700 tabular-nums">{fmtPct(A.distritoSecundario.variacionAnual)}</span>
              </div>
            </div>

            {/* HERRAMIENTAS COMPACTAS */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5">
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400 font-bold mb-3">Herramientas</p>
              <div className="space-y-2">
                <a className="flex items-center justify-between text-[13px] text-slate-700 hover:text-emerald-700 cursor-pointer py-1">
                  <span>Comparar {A.distritoPrincipal.nombre} vs Chamartín</span>
                  <span className="text-slate-400">→</span>
                </a>
                <a className="flex items-center justify-between text-[13px] text-slate-700 hover:text-emerald-700 cursor-pointer py-1">
                  <span>Alerta de precio en este distrito</span>
                  <span className="text-slate-400">→</span>
                </a>
                <a className="flex items-center justify-between text-[13px] text-slate-700 hover:text-emerald-700 cursor-pointer py-1">
                  <span>Simular rentabilidad de compra</span>
                  <span className="text-slate-400">→</span>
                </a>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* RELACIONADAS */}
      <div className="max-w-6xl mx-auto px-10 mt-20 pb-20">
        <div className="flex items-end justify-between mb-6 border-b border-slate-200 pb-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400 font-bold mb-1">Cobertura del proyecto</p>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Todo lo que hemos publicado sobre Madrid Nuevo Norte.</h2>
          </div>
          <a className="text-[12px] font-semibold text-emerald-700 hover:underline underline-offset-4 cursor-pointer">Ver hilo completo →</a>
        </div>
        <div className="grid grid-cols-3 gap-5">
          {A.relacionadas.map((r, i) => {
            const c = accentClasses[r.accent];
            return (
              <div key={i} className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-emerald-400 hover:shadow-sm transition-all cursor-pointer group">
                <div className="flex items-center gap-2.5 mb-3">
                  <span className={`text-[10px] uppercase tracking-[0.15em] font-bold px-2 py-0.5 rounded border ${c.chip}`}>{r.categoria}</span>
                  <span className="text-[11px] text-slate-400 font-mono tabular-nums">{r.fecha}</span>
                </div>
                <h3 className="text-[16px] font-bold text-slate-900 tracking-tight leading-snug mb-2 group-hover:text-emerald-700 transition-colors" style={{ textWrap: 'balance' }}>
                  {r.titulo}
                </h3>
                <p className="text-[13px] text-slate-600 leading-relaxed mb-4">{r.resumen}</p>
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <span className="text-[12px] font-semibold text-slate-700">{r.fuente}</span>
                  <span className={`text-[12px] font-bold tabular-nums ${c.text}`}>{r.impacto}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* PREV / NEXT NAVIGATION */}
      <div className="border-t border-slate-200 bg-stone-50">
        <div className="max-w-6xl mx-auto px-10 py-10 grid grid-cols-2 gap-px bg-slate-200">
          <a className="bg-stone-50 hover:bg-white px-8 py-7 group cursor-pointer transition-colors">
            <p className="text-[10px] uppercase tracking-[0.22em] text-slate-400 font-bold mb-2 flex items-center gap-2">
              <span className="text-slate-500">←</span> Anterior
            </p>
            <p className="text-[10px] uppercase tracking-[0.15em] font-bold text-sky-700 mb-1">Movilidad · Puente de Vallecas</p>
            <h3 className="text-[17px] font-bold text-slate-900 tracking-tight leading-snug group-hover:text-emerald-700 transition-colors" style={{ textWrap: 'balance' }}>
              Nuevos Cercanías al sureste: Vallecas y Vicálvaro recortan 14 minutos a Atocha
            </h3>
            <p className="text-[11px] text-slate-500 mt-2 font-mono tabular-nums">08 May · El Mundo</p>
          </a>
          <a className="bg-stone-50 hover:bg-white px-8 py-7 group cursor-pointer transition-colors text-right">
            <p className="text-[10px] uppercase tracking-[0.22em] text-slate-400 font-bold mb-2 flex items-center gap-2 justify-end">
              Siguiente <span className="text-slate-500">→</span>
            </p>
            <p className={`text-[10px] uppercase tracking-[0.15em] font-bold ${ac.text} mb-1`}>Infraestructura · San Blas-Canillejas</p>
            <h3 className="text-[17px] font-bold text-slate-900 tracking-tight leading-snug group-hover:text-emerald-700 transition-colors" style={{ textWrap: 'balance' }}>
              San Blas lidera Madrid: +32,8 % interanual tras el anuncio del nuevo intercambiador
            </h3>
            <p className="text-[11px] text-slate-500 mt-2 font-mono tabular-nums">20 May · El País · Madrid</p>
          </a>
        </div>
      </div>
    </div>
  );
}

window.NoticiaDetalleV1 = NoticiaDetalleV1;
window.NoticiaDetalleV2 = NoticiaDetalleV2;
window.NoticiaDetalleV3 = NoticiaDetalleV3;

// ─── Dynamic article detail — driven by NEWS_DATA slug ───────────
function NoticiaDetalleDynamic({ slug }) {
  const D = window.NEWS_DATA;
  const allItems = D.items || [];
  const article = allItems.find(a => a.slug === slug)
    || (D.destacada && D.destacada.slug === slug ? D.destacada : null)
    || D.destacada;

  if (!article) {
    return (
      <div style={{ fontFamily: 'Inter, system-ui, sans-serif' }} className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-400">Artículo no encontrado.</p>
      </div>
    );
  }

  const tagColor = {
    rose:    { bar: 'bg-rose-500',    text: 'text-rose-700',    soft: 'bg-rose-50',    border: 'border-rose-200' },
    emerald: { bar: 'bg-emerald-500', text: 'text-emerald-700', soft: 'bg-emerald-50', border: 'border-emerald-200' },
    sky:     { bar: 'bg-sky-500',     text: 'text-sky-700',     soft: 'bg-sky-50',     border: 'border-sky-200' },
    violet:  { bar: 'bg-violet-500',  text: 'text-violet-700',  soft: 'bg-violet-50',  border: 'border-violet-200' },
    amber:   { bar: 'bg-amber-500',   text: 'text-amber-700',   soft: 'bg-amber-50',   border: 'border-amber-200' },
  };
  const ac = tagColor[article.tag] || tagColor.emerald;

  let distritoData = null;
  if (article.distrito && window.HOME_DATA) {
    distritoData = window.HOME_DATA.distritos.find(d => d.nombre === article.distrito);
  }

  const relacionadas = allItems
    .filter(n => n.slug !== slug && n.titulo !== D.destacada?.titulo)
    .slice(0, 3);

  const metricCards = article.metricas
    || (article.impacto ? [{ label: article.impactoLabel || 'Impacto', valor: article.impacto, delta: '', up: true }] : []);

  const { useEffect: useEffectND } = React;
  useEffectND(() => {
    const prev = document.getElementById('ld-article');
    if (prev) prev.remove();
    const script = document.createElement('script');
    script.id = 'ld-article';
    script.type = 'application/ld+json';
    const pageUrl = 'https://www.radarinmobiliario.com/noticia/' + article.slug;
    const dateValue = (article.fechaISO && article.hora)
      ? (article.fechaISO + 'T' + article.hora + ':00+02:00')
      : (article.fechaISO || article.fecha);
    const articleBody = Array.isArray(article.body)
      ? article.body.filter(b => b.type === 'p').map(b => b.text).join('\n\n')
      : undefined;
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "NewsArticle",
      "headline": article.titulo,
      "description": article.resumen ? article.resumen.slice(0, 200) : undefined,
      "image": article.imagen,
      "datePublished": dateValue,
      "dateModified": dateValue,
      "url": pageUrl,
      "inLanguage": "es",
      "articleSection": article.categoria,
      "keywords": article.tags ? article.tags.join(', ') : undefined,
      "articleBody": articleBody,
      "author": {
        "@type": "Organization",
        "name": "Redacción Radar Inmobiliario Madrid",
        "url": "https://www.radarinmobiliario.com/sobre"
      },
      "publisher": { "@id": "https://www.radarinmobiliario.com/#organization" },
      "mainEntityOfPage": { "@type": "WebPage", "@id": pageUrl },
      "breadcrumb": {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Inicio", "item": "https://www.radarinmobiliario.com/" },
          { "@type": "ListItem", "position": 2, "name": "Noticias", "item": "https://www.radarinmobiliario.com/noticias" },
          { "@type": "ListItem", "position": 3, "name": article.titulo }
        ]
      }
    });
    document.head.appendChild(script);
    return () => { const el = document.getElementById('ld-article'); if (el) el.remove(); };
  }, [article.slug]);

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif' }} className="bg-white">
      <div className="max-w-6xl mx-auto px-10 pt-10">
        <nav className="flex items-center gap-2 text-[12px] text-slate-400">
          <a href="/" onClick={(e) => { e.preventDefault(); window.navTo('/'); }} className="hover:text-emerald-700">Inicio</a>
          <span>›</span>
          <a href="/noticias" onClick={(e) => { e.preventDefault(); window.navTo('/noticias'); }} className="hover:text-emerald-700">Noticias</a>
          <span>›</span>
          <span className={ac.text}>{article.categoria}</span>
        </nav>
      </div>

      <div className="max-w-6xl mx-auto px-10 mt-6">
        <div className="relative bg-stone-50 border border-slate-200 rounded-3xl overflow-hidden">
          <div className={`absolute top-0 left-0 bottom-0 w-1.5 ${ac.bar}`} />
          <div className="relative grid grid-cols-12 gap-10 p-10 pl-12">
            <div className="col-span-7">
              <div className="flex items-center gap-3 mb-6">
                <span className="inline-block w-6 h-px bg-slate-900" />
                <span className={`text-[10px] uppercase tracking-[0.28em] font-bold ${ac.text}`}>{article.categoria}</span>
                {article.distrito && (
                  <>
                    <span className="text-slate-300 text-[10px]">·</span>
                    <span className="text-[10px] uppercase tracking-[0.12em] text-slate-500 font-semibold">{article.distrito}</span>
                  </>
                )}
              </div>
              <h1 className="text-[2.6rem] font-bold text-slate-900 tracking-[-0.02em] leading-[1.04] mb-2" style={{ textWrap: 'balance' }}>
                {article.titulo}
              </h1>
              <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '16px', marginTop: '4px' }}>
                Por <strong style={{ color: '#334155' }}>Redacción Radar Inmobiliario</strong> · {article.fecha || article.fechaISO}
              </p>
              <p className="text-[16px] text-slate-600 leading-relaxed max-w-xl">{article.resumen}</p>
              <div className="flex items-center gap-5 mt-7 text-[12px] text-slate-500">
                <span className="font-semibold text-slate-700">{article.fuente}</span>
                <span className="text-slate-300">·</span>
                <span className="font-mono tabular-nums">{article.fecha} · {article.hora}</span>
              </div>
            </div>
            <div className="col-span-5 flex flex-col justify-center gap-4">
              {article.imagen && (
                <div className="rounded-2xl overflow-hidden bg-slate-100" style={{ aspectRatio: '16/9' }}>
                  <img src={article.imagen} alt={article.titulo}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={e => { e.currentTarget.parentElement.style.display = 'none'; }} />
                </div>
              )}
              {metricCards.length > 0 && (
                <div className="space-y-2.5">
                  {metricCards.map((m, i) => (
                    <div key={i} className="bg-white border border-slate-200 rounded-xl px-5 py-3.5 flex items-center justify-between relative overflow-hidden">
                      <span className={`absolute left-0 top-0 bottom-0 w-0.5 ${ac.bar}`} />
                      <span className="text-[12px] text-slate-500">{m.label}</span>
                      <div className="flex items-baseline gap-2.5">
                        <span className="text-lg font-bold text-slate-900 tabular-nums">{m.valor}</span>
                        {m.delta && (
                          <span className={`text-[12px] font-bold tabular-nums ${m.up ? 'text-emerald-700' : 'text-rose-700'}`}>{m.delta}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-10 mt-14 grid grid-cols-12 gap-10 pb-20">
        <article className="col-span-8">
          {article.body ? (
            article.body.map((block, i) => {
              if (block.type === 'pullquote') {
                return (
                  <blockquote key={i} className="my-8 py-5 border-y border-slate-200">
                    <span className={`inline-block ${ac.text} text-3xl leading-none align-top mr-2 font-serif`}>"</span>
                    <span className="text-[1.35rem] font-bold text-slate-900 leading-[1.3]" style={{ textWrap: 'balance' }}>
                      {block.text}
                    </span>
                  </blockquote>
                );
              }
              const isFirst = i === 0 && block.dropcap;
              return (
                <p key={i} className={`text-[16.5px] text-slate-700 leading-[1.7] mb-5${isFirst ? ' first-letter:text-[3.4rem] first-letter:font-bold first-letter:text-slate-900 first-letter:mr-1.5 first-letter:float-left first-letter:leading-[0.92] first-letter:mt-1' : ''}`}>
                  {block.text}
                </p>
              );
            })
          ) : (
            <p className="text-[16.5px] text-slate-700 leading-[1.7] mb-8">{article.resumen}</p>
          )}
          {window.AffiliateBlock && (
            <div className="mb-8">
              <window.AffiliateBlock context="hipoteca" />
            </div>
          )}
          <div className="pt-6 border-t border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400 font-bold">Fuente original</p>
              {article.url && article.url.indexOf('http') === 0 ? (
                <p className="text-[14px] mt-1">
                  <a href={article.url} target="_blank" rel="noopener nofollow"
                     className="text-[14px] font-semibold text-emerald-700 hover:underline">
                    Leer en {article.fuente} ↗
                  </a>
                  <span className="text-slate-700"> · {article.fecha}</span>
                </p>
              ) : (
                <p className="text-[14px] text-slate-700 mt-1">{article.fuente} · {article.fecha}</p>
              )}
            </div>
            <a href="/noticias" onClick={(e) => { e.preventDefault(); window.navTo('/noticias'); }}
              className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-5 py-2.5 rounded-lg text-sm cursor-pointer">
              ← Volver a noticias
            </a>
          </div>
        </article>
        <aside className="col-span-4 space-y-5">
          {distritoData && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6">
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400 font-bold mb-2">Distrito afectado</p>
              <h2 className="text-xl font-bold text-slate-900 mt-1">{distritoData.nombre}</h2>
              <div className="mt-4 space-y-2.5">
                {[
                  ['Precio medio', `${distritoData.precioMedio.toLocaleString('es-ES')} €/m²`],
                  ['Var. interanual', `+${distritoData.varAnual.toFixed(1)} %`],
                  ['Rentabilidad bruta', `${distritoData.rent.toFixed(2)} %`],
                ].map(([label, val]) => (
                  <div key={label} className="flex items-baseline justify-between">
                    <span className="text-[12px] text-slate-500">{label}</span>
                    <span className="text-sm font-bold text-slate-900 tabular-nums">{val}</span>
                  </div>
                ))}
              </div>
              <a href="/distritos" onClick={(e) => { e.preventDefault(); window.navTo('/distritos'); }}
                className="block mt-4 text-[12px] font-semibold text-emerald-700 hover:underline underline-offset-4">
                Ver todos los distritos →
              </a>
            </div>
          )}
          {relacionadas.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6">
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400 font-bold mb-4">Más noticias</p>
              <div className="space-y-4">
                {relacionadas.map((r, i) => (
                  <a key={i} href={`/noticia/${r.slug}`}
                    onClick={(e) => { e.preventDefault(); window.navTo(`/noticia/${r.slug}`); }}
                    className="block group cursor-pointer">
                    <p className="text-[10px] uppercase tracking-[0.15em] font-bold text-slate-400 mb-1">{r.categoria}</p>
                    <p className="text-[13px] font-semibold text-slate-900 leading-snug group-hover:text-emerald-700 transition-colors" style={{ textWrap: 'balance' }}>
                      {r.titulo}
                    </p>
                  </a>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

// ─── Metodología ─────────────────────────────────────────────────
function MetodologiaPage() {
  const secs = [
    {
      h: 'Fuentes de datos',
      body: null,
      items: [
        '<strong>Idealista</strong> y <strong>Fotocasa</strong>: precios de anuncio de venta (precio de oferta, no precio escriturado).',
        '<strong>Colegios Notariales</strong>: precios de transacciones reales escrituradas. Base de referencia para el precio de cierre.',
        '<strong>Ministerio de Transportes (MITMA)</strong>: estadísticas trimestrales de transacciones inmobiliarias.',
        '<strong>Ayuntamiento de Madrid</strong>: datos de obra nueva y planeamiento urbanístico.',
      ],
    },
    {
      h: 'Cálculo del precio €/m²',
      body: 'El precio publicado es la mediana de los anuncios activos para cada distrito, filtrados por superficie entre 30 y 300 m². Se excluyen los anuncios sin superficie declarada y los precios que se desvíen más de 2,5 desviaciones estándar de la mediana del distrito. La mediana es menos sensible a los outliers que la media aritmética.',
    },
    {
      h: 'Rentabilidad bruta estimada',
      body: 'La rentabilidad bruta se calcula como: <code style="background:#f1f5f9;padding:2px 6px;border-radius:4px">(Alquiler mensual × 12) / Precio de compra × 100</code>. El precio de alquiler se obtiene de Idealista y Fotocasa aplicando la misma metodología de mediana por distrito. Este valor es <strong>antes de gastos</strong> (IBI, comunidad, seguros, reforma, vacancia). No representa la rentabilidad neta real de una inversión.',
    },
    {
      h: 'Variación interanual',
      body: 'Compara el precio mediano del mes actual con el del mismo mes del año anterior. No es una proyección: es el cambio ya ocurrido. Variaciones muy elevadas en barrios con menos de 15 anuncios deben interpretarse con cautela.',
    },
    {
      h: 'Cadencia de actualización',
      body: 'Los datos de precio y rentabilidad se actualizan mensualmente (primera semana de cada mes, con datos del mes anterior). Las noticias de mercado se publican de forma continua, con un mínimo de 4 noticias por semana.',
    },
    {
      h: 'Limitaciones',
      items: [
        'Los precios de anuncio no son precios de cierre; la diferencia de negociación puede ser del 3–8 %.',
        'Los datos de barrio tienen mayor margen de error por menor volumen de muestra.',
        'No incluimos garajes, trasteros ni locales comerciales.',
        'Los datos del Ministerio tienen un retardo de 3–6 meses respecto al momento de escritura.',
      ],
    },
  ];
  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif' }} className="bg-slate-50 min-h-screen">
      <div className="max-w-3xl mx-auto px-8 py-16">
        <nav className="flex items-center gap-2 text-[12px] text-slate-400 mb-10">
          <a href="/sobre" onClick={(e) => { e.preventDefault(); window.navTo('/sobre'); }} className="hover:text-emerald-700">Acerca</a>
          <span>›</span>
          <span>Metodología</span>
        </nav>
        <h1 className="text-4xl font-bold text-slate-900 mb-3">Metodología de datos</h1>
        <p className="text-emerald-600 font-medium mb-10">Cómo calculamos cada cifra publicada en Radar Inmobiliario Madrid.</p>
        <div className="space-y-10">
          {secs.map((s, i) => (
            <section key={i}>
              <h2 className="text-xl font-bold text-slate-900 mb-3">{s.h}</h2>
              {s.body && <p className="text-base text-slate-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: s.body }} />}
              {s.items && (
                <ul className="list-disc list-inside space-y-1.5 text-base text-slate-700 leading-relaxed">
                  {s.items.map((it, j) => <li key={j} dangerouslySetInnerHTML={{ __html: it }} />)}
                </ul>
              )}
            </section>
          ))}
        </div>
        <div className="mt-12 pt-8 border-t border-slate-200">
          <a href="/sobre" onClick={(e) => { e.preventDefault(); window.navTo('/sobre'); }}
            className="text-emerald-600 text-sm font-medium hover:text-emerald-700">← Volver a Acerca</a>
        </div>
      </div>
    </div>
  );
}

// ─── Legal / Privacidad ──────────────────────────────────────────
function LegalPage() {
  const secs = [
    { h: 'Titular del sitio', body: 'Radar Inmobiliario Madrid es una publicación de datos independiente. Contacto: <a href="mailto:hola@radarinmobiliario.com" style="color:#059669">hola@radarinmobiliario.com</a>' },
    { h: 'Datos personales que recogemos', body: 'La única información personal que recopilamos es la <strong>dirección de correo electrónico</strong> que introduces voluntariamente en el formulario de suscripción al boletín mensual.' },
    { h: 'Finalidad y base legal', body: 'Tu email se usa exclusivamente para enviarte el boletín mensual de Radar Inmobiliario Madrid. La base legal del tratamiento es tu consentimiento explícito al suscribirte (art. 6.1.a RGPD). No cedemos tu email a terceros ni lo usamos para publicidad.' },
    { h: 'Plazo de conservación', body: 'Conservamos tu email mientras mantengas la suscripción activa. Puedes cancelarla en cualquier momento desde el enlace de baja que incluye cada envío.' },
    {
      h: 'Tus derechos (RGPD / LOPD-GDD)',
      body: 'Puedes ejercer en cualquier momento los derechos de <strong>acceso, rectificación, supresión, oposición, limitación y portabilidad</strong>. Escríbenos a <a href="mailto:hola@radarinmobiliario.com" style="color:#059669">hola@radarinmobiliario.com</a> y respondemos en 30 días. Si no quedas satisfecho, puedes reclamar ante la <a href="https://www.aepd.es" target="_blank" rel="noopener" style="color:#059669">Agencia Española de Protección de Datos (AEPD)</a>.',
    },
    { h: 'Cookies y rastreo', body: 'Esta publicación usa <strong>Google AdSense</strong> para financiarse. Google puede establecer cookies de publicidad. No usamos otras herramientas de analítica ni rastreo propias.' },
    { h: 'Descargo de responsabilidad', body: 'Los datos publicados son <strong>orientativos</strong> y no constituyen asesoramiento financiero, legal ni de inversión. Consulta siempre a un profesional antes de tomar decisiones de compra, venta o alquiler.' },
  ];
  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif' }} className="bg-slate-50 min-h-screen">
      <div className="max-w-3xl mx-auto px-8 py-16">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">Aviso Legal y Privacidad</h1>
        <p className="text-sm text-slate-500 mb-10">Última actualización: junio 2026</p>
        <div className="space-y-8">
          {secs.map((s, i) => (
            <section key={i}>
              <h2 className="text-xl font-bold text-slate-900 mb-3">{s.h}</h2>
              <p className="text-base text-slate-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: s.body }} />
            </section>
          ))}
        </div>
        <div className="mt-12 pt-8 border-t border-slate-200">
          <a href="/" onClick={(e) => { e.preventDefault(); window.navTo('/'); }}
            className="text-emerald-600 text-sm font-medium hover:text-emerald-700">← Volver al inicio</a>
        </div>
      </div>
    </div>
  );
}

window.NoticiaDetalleDynamic = NoticiaDetalleDynamic;
window.MetodologiaPage = MetodologiaPage;
window.LegalPage = LegalPage;
