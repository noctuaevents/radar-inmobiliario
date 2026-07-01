// monetize.js — Fase 2: gate Pro (MVP client-side), modal de upsell, bloque de afiliados.
// Debe cargarse ANTES del router y de herramientas.js / distrito-detalle.js.

// ─── Gate Pro (MVP): código único hasheado en SHA-256, persistido en localStorage ───
window.hasPro = function hasPro() {
  try {
    return window.localStorage.getItem('radar_pro') === '1';
  } catch (e) {
    return false;
  }
};

async function sha256Hex(text) {
  const enc = new TextEncoder().encode(text);
  const digest = await window.crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function ProUnlockForm({ onUnlock }) {
  const [code, setCode] = React.useState('');
  const [status, setStatus] = React.useState('idle'); // idle | checking | error

  async function handleSubmit() {
    const trimmed = code.trim();
    if (!trimmed) { setStatus('error'); return; }
    setStatus('checking');
    const hash = await sha256Hex(trimmed);
    const codes = (window.RADAR_CONFIG && window.RADAR_CONFIG.proCodes) || [];
    if (codes.includes(hash)) {
      try { window.localStorage.setItem('radar_pro', '1'); } catch (e) {}
      setStatus('idle');
      if (onUnlock) onUnlock();
    } else {
      setStatus('error');
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md mx-auto text-center">
      <p className="text-sm font-semibold text-slate-900 mb-1">¿Ya tienes un código de acceso fundador?</p>
      <p className="text-xs text-slate-500 mb-4">Introdúcelo para desbloquear el comparador de distritos.</p>
      <div className="flex gap-2">
        <input
          className={`flex-1 bg-white border text-slate-900 placeholder-slate-400 rounded-lg px-4 py-2.5 text-sm focus:ring-1 outline-none ${status === 'error' ? 'border-rose-200 focus:border-rose-200 focus:ring-rose-200' : 'border-slate-300 focus:border-emerald-500 focus:ring-emerald-500'}`}
          placeholder="Código de acceso"
          value={code}
          onChange={(e) => { setCode(e.target.value); if (status === 'error') setStatus('idle'); }}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        />
        <button
          onClick={handleSubmit}
          disabled={status === 'checking'}
          className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-bold px-4 py-2.5 rounded-lg text-sm whitespace-nowrap transition-opacity"
        >
          {status === 'checking' ? '…' : 'Desbloquear'}
        </button>
      </div>
      {status === 'error' && <p className="text-rose-600 text-xs mt-2">Código no válido.</p>}
      <button
        onClick={() => window.navTo('/pro')}
        className="mt-4 text-emerald-700 text-xs font-semibold hover:underline underline-offset-4"
      >
        Ver planes →
      </button>
    </div>
  );
}
window.ProUnlockForm = ProUnlockForm;

// ─── Modal de upsell Pro ───────────────────────────────────────────────────
function ProModal({ feature, onClose }) {
  const founder = (window.RADAR_CONFIG && window.RADAR_CONFIG.founder) || { yearlyPrice: 49, normalYearly: 79, seats: 100 };
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-8 max-w-sm w-full relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 text-sm"
          aria-label="Cerrar"
        >
          ✕
        </button>
        <div className="text-[11px] uppercase tracking-[0.2em] text-emerald-700 font-bold mb-3">Función Pro</div>
        <h2 className="text-xl font-bold text-slate-900 mb-2" style={{ textWrap: 'balance' }}>
          {feature || 'Esta función'} es parte de Radar Pro
        </h2>
        <p className="text-sm text-slate-500 mb-5 leading-relaxed">
          Desbloquea el comparador de distritos, los 131 barrios y el histórico completo.
        </p>
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 mb-5">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{founder.yearlyPrice}€</span>
            <span className="text-slate-400 text-sm" style={{ textDecoration: 'line-through' }}>{founder.normalYearly}€</span>
            <span className="text-slate-500 text-xs">/año</span>
          </div>
          <p className="text-emerald-700 text-xs font-semibold mt-1">
            Precio fundador — primeros {founder.seats} suscriptores, para siempre
          </p>
        </div>
        <button
          onClick={() => { onClose(); window.navTo('/pro'); }}
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold transition-colors"
        >
          Ver planes →
        </button>
      </div>
    </div>
  );
}

let _proModalRoot = null;
window.showProModal = function showProModal(feature) {
  if (!_proModalRoot) {
    const el = document.createElement('div');
    el.id = 'pro-modal-root';
    document.body.appendChild(el);
    _proModalRoot = ReactDOM.createRoot(el);
  }
  const close = () => _proModalRoot.render(null);
  _proModalRoot.render(<ProModal feature={feature} onClose={close} />);
};

// ─── Bloque de afiliados, config-driven ────────────────────────────────────
function AffiliateBlock({ context }) {
  const affiliates = ((window.RADAR_CONFIG && window.RADAR_CONFIG.affiliates) || [])
    .filter(a => a.context === context);
  if (affiliates.length === 0) return null;
  return (
    <div className="space-y-3">
      {affiliates.map((a) => (
        <div key={a.id} className="bg-stone-50 border border-slate-200 rounded-xl p-5">
          <p className="text-[10px] uppercase tracking-[0.15em] text-slate-400 font-bold mb-2">Enlace patrocinado</p>
          <p className="text-sm font-semibold text-slate-900 mb-3">{a.label}</p>
          <a
            href={a.url}
            target="_blank"
            rel="sponsored nofollow"
            className="inline-block bg-slate-900 hover:bg-slate-800 text-white font-semibold px-4 py-2 rounded-lg text-sm"
          >
            {a.cta || 'Ver más →'}
          </a>
        </div>
      ))}
    </div>
  );
}
window.AffiliateBlock = AffiliateBlock;

// ─── Página de agradecimiento (success-URL de los Payment Links) ──────────
function GraciasPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <div className="text-emerald-600 text-5xl mb-4">✓</div>
        <h1 className="text-2xl font-bold text-slate-900 mb-3">Pago recibido</h1>
        <p className="text-slate-500 mb-8">Te enviaremos tu código de acceso fundador por email en menos de 24h.</p>
        <button onClick={() => window.navTo('/')} className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-emerald-500 transition-colors">Volver al inicio</button>
      </div>
    </div>
  );
}
window.GraciasPage = GraciasPage;
