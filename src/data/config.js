// Radar Inmobiliario — configuración de monetización (Fase 2)
// Modo actual: Stripe Payment Links vacíos → formulario de lista de espera.
// Cuando haya Payment Links reales, rellenar stripe.monthly / stripe.yearlyFounder
// y el botón "Hazte Pro" redirigirá directamente en vez de mostrar la lista de espera.

window.RADAR_CONFIG = {
  stripe: {
    monthly: '',       // Payment Link mensual (Stripe) — vacío = modo lista de espera
    yearlyFounder: '',  // Payment Link anual "precio fundador" (Stripe) — vacío = modo lista de espera
  },
  founder: {
    yearlyPrice: 49,
    normalYearly: 79,
    monthly: 9,
    seats: 100,
  },
  affiliates: [
    // { id, label, url, context: 'hipoteca' | 'mudanza', cta }
    // Vacío = los bloques de afiliados no se muestran.
  ],
  proCodes: [
    // SHA-256 hex (minúsculas) de cada código de acceso fundador válido.
    // Vacío = el comparador Pro queda cerrado para todos. Añade un código con:
    //   printf '%s' 'MICODIGO' | shasum -a 256   → pega el hex aquí como string.
    // (NO pongas el código en claro: config.js se sirve público.)
  ],
  euribor: 2.51, // reusa window.HOME_DATA.macro.euribor12m
};
