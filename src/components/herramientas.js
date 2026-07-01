// herramientas.js — Fase 2: Simulador de hipoteca (gratis) + Comparador de distritos (Pro, gateado).
// Depende de window.HOME_DATA, window.RADAR_CONFIG, window.hasPro, window.ProUnlockForm (monetize.js).

// ─── Simulador de hipoteca (GRATIS) ────────────────────────────────────────
function SimuladorHipoteca() {
  const distritos = (window.HOME_DATA && window.HOME_DATA.distritos) || [];
  const euribor = (window.RADAR_CONFIG && window.RADAR_CONFIG.euribor)
    || (window.HOME_DATA && window.HOME_DATA.macro && window.HOME_DATA.macro.euribor12m)
    || 2.51;

  const [distritoSlug, setDistritoSlug] = React.useState('');
  const [precio, setPrecio] = React.useState(300000);
  const [entradaPct, setEntradaPct] = React.useState(20);
  const [anios, setAnios] = React.useState(25);
  const [tipoModo, setTipoModo] = React.useState('fijo'); // fijo | variable
  const [tipoFijo, setTipoFijo] = React.useState(3);
  const [diferencial, setDiferencial] = React.useState(1);

  React.useEffect(() => {
    document.title = 'Simulador de hipoteca Madrid — cuota mensual con Euríbor | Radar Inmobiliario';
  }, []);

  function handleDistrito(slug) {
    setDistritoSlug(slug);
    const d = distritos.find(x => x.slug === slug);
    if (d) setPrecio(Math.round(d.precioMedio * 90)); // referencia: piso ~90 m² en ese distrito
  }

  const tipoAnual = tipoModo === 'fijo' ? Number(tipoFijo) : (euribor + Number(diferencial));
  const entrada = precio * (entradaPct / 100);
  const financiado = Math.max(precio - entrada, 0);
  const i = tipoAnual / 100 / 12;
  const n = anios * 12;
  const cuota = i > 0
    ? (financiado * i) / (1 - Math.pow(1 + i, -n))
    : financiado / n;
  const costeTotal = cuota * n;
  const interesesTotales = costeTotal - financiado;

  const fmt = (v) => v.toLocaleString('es-ES', { maximumFractionDigits: 0 });

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif' }} className="bg-slate-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-8 py-16">
        <p className="text-[11px] uppercase tracking-[0.3em] text-emerald-700 font-bold mb-3">Herramienta gratuita</p>
        <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-3" style={{ textWrap: 'balance' }}>
          Simulador de hipoteca en Madrid
        </h1>
        <p className="text-slate-500 text-base max-w-xl mb-10 leading-relaxed">
          Calcula la cuota mensual de tu hipoteca con el Euríbor actual ({euribor.toFixed(2)}%) o a tipo fijo. Elige un distrito para partir de un precio de referencia.
        </p>

        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-7 bg-white border border-slate-200 rounded-2xl p-8 space-y-6">
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Distrito de referencia (opcional)</label>
              <select
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                value={distritoSlug}
                onChange={(e) => handleDistrito(e.target.value)}
              >
                <option value="">Importe libre</option>
                {distritos.map(d => (
                  <option key={d.slug} value={d.slug}>{d.nombre} · {d.precioMedio.toLocaleString('es-ES')} €/m²</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Precio de la vivienda (€)</label>
              <input
                type="number"
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                value={precio}
                min={0}
                step={1000}
                onChange={(e) => { setDistritoSlug(''); setPrecio(Number(e.target.value) || 0); }}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Entrada (%)</label>
                <input
                  type="number"
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                  value={entradaPct}
                  min={0}
                  max={100}
                  onChange={(e) => setEntradaPct(Number(e.target.value) || 0)}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Plazo (años)</label>
                <input
                  type="number"
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                  value={anios}
                  min={1}
                  max={40}
                  onChange={(e) => setAnios(Number(e.target.value) || 1)}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Tipo de interés</label>
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => setTipoModo('fijo')}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors ${tipoModo === 'fijo' ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-slate-300 text-slate-600'}`}
                >
                  Fijo
                </button>
                <button
                  onClick={() => setTipoModo('variable')}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors ${tipoModo === 'variable' ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-slate-300 text-slate-600'}`}
                >
                  Variable (Euríbor + diferencial)
                </button>
              </div>
              {tipoModo === 'fijo' ? (
                <input
                  type="number"
                  step={0.05}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                  value={tipoFijo}
                  onChange={(e) => setTipoFijo(Number(e.target.value) || 0)}
                />
              ) : (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-500">Euríbor 12m: <strong className="text-slate-900">{euribor.toFixed(2)}%</strong> +</span>
                  <input
                    type="number"
                    step={0.05}
                    className="w-24 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                    value={diferencial}
                    onChange={(e) => setDiferencial(Number(e.target.value) || 0)}
                  />
                  <span className="text-sm text-slate-500">%</span>
                </div>
              )}
            </div>
          </div>

          <div className="col-span-5">
            <div className="bg-emerald-600 rounded-2xl p-7 text-white sticky" style={{ top: '80px' }}>
              <p className="text-[11px] uppercase tracking-[0.2em] text-emerald-100 font-bold mb-2">Cuota mensual estimada</p>
              <div className="text-4xl font-bold mb-6 tabular-nums">{fmt(cuota)} €<span className="text-lg font-normal text-emerald-200">/mes</span></div>
              <div className="space-y-2.5 text-sm border-t border-white/20 pt-5">
                <div className="flex justify-between"><span className="text-emerald-100">Importe financiado</span><span className="font-semibold tabular-nums">{fmt(financiado)} €</span></div>
                <div className="flex justify-between"><span className="text-emerald-100">Tipo anual aplicado</span><span className="font-semibold tabular-nums">{tipoAnual.toFixed(2)} %</span></div>
                <div className="flex justify-between"><span className="text-emerald-100">Intereses totales</span><span className="font-semibold tabular-nums">{fmt(interesesTotales)} €</span></div>
                <div className="flex justify-between"><span className="text-emerald-100">Coste total del préstamo</span><span className="font-semibold tabular-nums">{fmt(costeTotal)} €</span></div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 mt-5">
              <p className="text-sm font-semibold text-slate-900 mb-2">¿Quieres comparar distritos?</p>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">El comparador de distritos (Pro) cruza precio, rentabilidad y variación anual de hasta 3 zonas a la vez.</p>
              <button
                onClick={() => window.navTo('/herramientas/comparador')}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-semibold transition-colors"
              >
                Ir al comparador →
              </button>
            </div>
          </div>
        </div>

        <p className="text-slate-400 text-xs mt-8 max-w-xl leading-relaxed">
          Cálculo orientativo mediante sistema de amortización francés (cuota constante). No incluye gastos de apertura, tasación, notaría, ni seguros vinculados. El tipo variable usa el último Euríbor a 12 meses publicado.
        </p>
      </div>
    </div>
  );
}
window.SimuladorHipoteca = SimuladorHipoteca;

// ─── Comparador de distritos (PRO, gateado) ────────────────────────────────
function ComparadorDistritos() {
  const distritos = (window.HOME_DATA && window.HOME_DATA.distritos) || [];
  const [pro, setPro] = React.useState(window.hasPro ? window.hasPro() : false);
  const [sel, setSel] = React.useState(['salamanca', 'carabanchel', 'tetuan'].filter(s => distritos.some(d => d.slug === s)));

  React.useEffect(() => {
    document.title = 'Comparador de distritos de Madrid — precio, rentabilidad y variación | Radar Inmobiliario';
  }, []);

  function toggleDistrito(slug) {
    setSel(prev => {
      if (prev.includes(slug)) return prev.filter(s => s !== slug);
      if (prev.length >= 3) return prev; // máx 3
      return [...prev, slug];
    });
  }

  const seleccionados = sel.map(s => distritos.find(d => d.slug === s)).filter(Boolean);

  const rows = [
    { label: 'Precio medio €/m²', get: (d) => d.precioMedio.toLocaleString('es-ES') + ' €' },
    { label: 'Variación interanual', get: (d) => (d.varAnual >= 0 ? '+' : '') + d.varAnual.toFixed(1) + ' %' },
    { label: 'Alquiler medio €/m²', get: (d) => d.alquilerM2.toLocaleString('es-ES') + ' €' },
    { label: 'Rentabilidad bruta', get: (d) => d.rent.toFixed(2) + ' %' },
    { label: 'Transacciones/año', get: (d) => d.tx.toLocaleString('es-ES') },
    { label: 'Ranking de precio', get: (d) => '#' + d.ranking },
  ];

  const Table = (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-stone-50 border-b border-slate-200">
            <th className="text-left px-5 py-3.5 text-[11px] uppercase tracking-[0.15em] text-slate-400 font-bold">Métrica</th>
            {seleccionados.map(d => (
              <th key={d.slug} className="text-right px-5 py-3.5 text-sm font-bold text-slate-900">{d.nombre}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-slate-100 last:border-0">
              <td className="px-5 py-3 text-slate-500">{r.label}</td>
              {seleccionados.map(d => (
                <td key={d.slug} className="px-5 py-3 text-right font-semibold text-slate-900 tabular-nums">{r.get(d)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif' }} className="bg-slate-50 min-h-screen">
      <div className="max-w-5xl mx-auto px-8 py-16">
        <p className="text-[11px] uppercase tracking-[0.3em] text-emerald-700 font-bold mb-3">Herramienta Pro</p>
        <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-3" style={{ textWrap: 'balance' }}>
          Comparador de distritos
        </h1>
        <p className="text-slate-500 text-base max-w-xl mb-8 leading-relaxed">
          Compara hasta 3 distritos de Madrid: precio, rentabilidad, variación anual y transacciones.
        </p>

        <div className="flex flex-wrap gap-2 mb-8">
          {distritos.map(d => (
            <button
              key={d.slug}
              onClick={() => toggleDistrito(d.slug)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors ${sel.includes(d.slug) ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-slate-300 text-slate-600 hover:border-emerald-400'}`}
            >
              {d.nombre}
            </button>
          ))}
        </div>

        {pro ? (
          Table
        ) : (
          <div className="relative">
            <div style={{ filter: 'blur(6px)', userSelect: 'none', pointerEvents: 'none' }}>
              {Table}
            </div>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-md max-w-sm text-center">
                <p className="text-sm font-bold text-slate-900 mb-1">Comparador disponible en Radar Pro</p>
                <p className="text-xs text-slate-500 mb-4 leading-relaxed">Desbloquea la comparación completa de distritos con un código de acceso fundador o suscríbete.</p>
                <button
                  onClick={() => window.showProModal('Comparador de distritos')}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-bold transition-colors mb-3"
                >
                  Hazte Pro →
                </button>
                <window.ProUnlockForm onUnlock={() => setPro(true)} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
window.ComparadorDistritos = ComparadorDistritos;
