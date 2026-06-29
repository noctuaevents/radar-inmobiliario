// Shared real data extracted from /data/distritos.json + /data/barrios-detalle.json
// Used by all three home variations in mocks/home-variations.html

window.HOME_DATA = {
  // Madrid-wide aggregates
  meta: {
    edicion: 'Edición Junio 2026',
    numero: 'Nº 18',
    fecha: '28 · 06 · 2026',
    precioMedio: 5527,           // mean of distritos
    variacionMedia: 18.5,        // mean
    distritos: 21,
    barrios: 131,
    transaccionesAnio: 38192,
  },

  // All 21 districts (slim)
  distritos: [
    { slug: 'centro', nombre: 'Centro', precioMedio: 7566, alquilerM2: 27, rent: 3.62, varAnual: 13.59, tx: 2731, ranking: 5 },
    { slug: 'arganzuela', nombre: 'Arganzuela', precioMedio: 6334, alquilerM2: 22.1, rent: 4.34, varAnual: 20.88, tx: 1978, ranking: 7 },
    { slug: 'retiro', nombre: 'Retiro', precioMedio: 7758, alquilerM2: 24.1, rent: 3.24, varAnual: 21.43, tx: 1364, ranking: 4 },
    { slug: 'salamanca', nombre: 'Salamanca', precioMedio: 10189, alquilerM2: 28.1, rent: 2.80, varAnual: 16.15, tx: 2357, ranking: 1 },
    { slug: 'chamartin', nombre: 'Chamartín', precioMedio: 8187, alquilerM2: 23.3, rent: 3.30, varAnual: 13.44, tx: 1914, ranking: 3 },
    { slug: 'tetuan', nombre: 'Tetuán', precioMedio: 6034, alquilerM2: 23.2, rent: 4.20, varAnual: 11.72, tx: 3912, ranking: 8 },
    { slug: 'chamberi', nombre: 'Chamberí', precioMedio: 8992, alquilerM2: 26.4, rent: 3.15, varAnual: 11.16, tx: 1877, ranking: 2 },
    { slug: 'fuencarral-el-pardo', nombre: 'Fuencarral-El Pardo', precioMedio: 5423, alquilerM2: 18.3, rent: 4.40, varAnual: 17.60, tx: 2196, ranking: 10 },
    { slug: 'moncloa-aravaca', nombre: 'Moncloa-Aravaca', precioMedio: 6376, alquilerM2: 22.5, rent: 3.97, varAnual: 13.97, tx: 1257, ranking: 6 },
    { slug: 'latina', nombre: 'Latina', precioMedio: 3916, alquilerM2: 18.4, rent: 5.49, varAnual: 20.99, tx: 2522, ranking: 17 },
    { slug: 'carabanchel', nombre: 'Carabanchel', precioMedio: 3718, alquilerM2: 18.2, rent: 6.56, varAnual: 15.37, tx: 2693, ranking: 16 },
    { slug: 'usera', nombre: 'Usera', precioMedio: 3609, alquilerM2: 20.0, rent: 7.49, varAnual: 20.52, tx: 975, ranking: 19 },
    { slug: 'puente-de-vallecas', nombre: 'Puente de Vallecas', precioMedio: 3325, alquilerM2: 19.6, rent: 8.24, varAnual: 18.26, tx: 2977, ranking: 20 },
    { slug: 'moratalaz', nombre: 'Moratalaz', precioMedio: 4533, alquilerM2: 16.8, rent: 5.10, varAnual: 26.06, tx: 738, ranking: 13 },
    { slug: 'ciudad-lineal', nombre: 'Ciudad Lineal', precioMedio: 5096, alquilerM2: 19.8, rent: 4.11, varAnual: 23.47, tx: 2566, ranking: 9 },
    { slug: 'hortaleza', nombre: 'Hortaleza', precioMedio: 5411, alquilerM2: 19.0, rent: 4.92, varAnual: 14.99, tx: 1649, ranking: 12 },
    { slug: 'villaverde', nombre: 'Villaverde', precioMedio: 3002, alquilerM2: 17.1, rent: 7.21, varAnual: 29.64, tx: 903, ranking: 21 },
    { slug: 'villa-de-vallecas', nombre: 'Villa de Vallecas', precioMedio: 3717, alquilerM2: 18.1, rent: 5.66, varAnual: 11.86, tx: 1326, ranking: 18 },
    { slug: 'vicalvaro', nombre: 'Vicálvaro', precioMedio: 3903, alquilerM2: 17.1, rent: 6.02, varAnual: 20.72, tx: 1035, ranking: 15 },
    { slug: 'san-blas-canillejas', nombre: 'San Blas-Canillejas', precioMedio: 4051, alquilerM2: 17.2, rent: 5.39, varAnual: 32.80, tx: 1793, ranking: 14 },
    { slug: 'barajas', nombre: 'Barajas', precioMedio: 4901, alquilerM2: 17.0, rent: 4.78, varAnual: 15.89, tx: 450, ranking: 11 },
  ],

  // Top 10 barrios — más caros (price desc)
  masCaros: [
    { nombre: 'Castellana',  distrito: 'Salamanca',  precio: 12102, varAnual:   7.63 },
    { nombre: 'Goya',        distrito: 'Salamanca',  precio: 11445, varAnual:  17.60 },
    { nombre: 'Lista',       distrito: 'Salamanca',  precio: 11263, varAnual:  14.25 },
    { nombre: 'Recoletos',   distrito: 'Salamanca',  precio: 11229, varAnual:  -9.81 },
    { nombre: 'Almagro',     distrito: 'Chamberí',   precio: 10914, varAnual:  -1.28 },
    { nombre: 'El Viso',     distrito: 'Chamartín',  precio: 10812, varAnual:   8.34 },
    { nombre: 'Jerónimos',   distrito: 'Retiro',     precio: 10498, varAnual:   5.10 },
    { nombre: 'Trafalgar',   distrito: 'Chamberí',   precio: 10247, varAnual:   9.92 },
    { nombre: 'Justicia',    distrito: 'Centro',     precio:  9966, varAnual:  12.40 },
    { nombre: 'Ríos Rosas',  distrito: 'Chamberí',   precio:  9421, varAnual:   7.05 },
  ],

  // Top 10 barrios — mayor subida interanual
  masSuben: [
    { nombre: 'Buenavista',       distrito: 'Carabanchel',         precio: 3456, varAnual: 54.43 },
    { nombre: 'Palomeras Bajas',  distrito: 'Puente de Vallecas',  precio: 3162, varAnual: 51.20 },
    { nombre: 'Puerta Bonita',    distrito: 'Carabanchel',         precio: 3655, varAnual: 40.56 },
    { nombre: 'Almenara',         distrito: 'Tetuán',              precio: 5662, varAnual: 38.58 },
    { nombre: 'Santa Eugenia',    distrito: 'Villa de Vallecas',   precio: 3933, varAnual: 37.70 },
    { nombre: 'Numancia',         distrito: 'Puente de Vallecas',  precio: 3812, varAnual: 35.10 },
    { nombre: 'San Andrés',       distrito: 'Villaverde',          precio: 3014, varAnual: 34.20 },
    { nombre: 'San Diego',        distrito: 'Puente de Vallecas',  precio: 3290, varAnual: 33.81 },
    { nombre: 'Hellín',           distrito: 'San Blas-Canillejas', precio: 4218, varAnual: 33.50 },
    { nombre: 'Vinateros',        distrito: 'Moratalaz',           precio: 4622, varAnual: 32.94 },
  ],

  // Top 10 barrios — más baratos
  masBaratos: [
    { nombre: 'San Cristóbal',                                 distrito: 'Villaverde',          precio: 2305, varAnual:  null },
    { nombre: 'Orcasur',                                       distrito: 'Usera',               precio: 2480, varAnual:  null },
    { nombre: 'Villaverde Alto - Casco H. de Villaverde',      distrito: 'Villaverde',          precio: 2804, varAnual:  18.50 },
    { nombre: 'Entrevías',                                     distrito: 'Puente de Vallecas',  precio: 2837, varAnual:  null },
    { nombre: 'Los Rosales',                                   distrito: 'Villaverde',          precio: 3014, varAnual:  null },
    { nombre: 'Orcasitas',                                     distrito: 'Usera',               precio: 3060, varAnual:  21.40 },
    { nombre: 'Palomeras Bajas',                               distrito: 'Puente de Vallecas',  precio: 3162, varAnual:  51.20 },
    { nombre: 'San Diego',                                     distrito: 'Puente de Vallecas',  precio: 3290, varAnual:  33.81 },
    { nombre: 'Pradolongo',                                    distrito: 'Usera',               precio: 3320, varAnual:  19.10 },
    { nombre: 'Buenavista',                                    distrito: 'Carabanchel',         precio: 3456, varAnual:  54.43 },
  ],

  // Featured editorial pieces (placeholders to mock the "noticias destacadas" column)
  noticiasDestacadas: [
    { fecha: '18 May', categoria: 'Urbanismo',  titulo: 'La línea 11 de Metro supera el 50% en Arganzuela y empuja la zona sur', distrito: 'Arganzuela' },
    { fecha: '15 May', categoria: 'Regulación', titulo: 'La Comunidad ratifica que no aplicará zonas tensionadas en 2026',       distrito: null },
    { fecha: '12 May', categoria: 'Obras',      titulo: 'Operación Madrid Nuevo Norte: licitada la primera fase residencial',    distrito: 'Chamartín' },
    { fecha: '08 May', categoria: 'Movilidad',  titulo: 'Nuevos cercanías al sureste: Vallecas y Vicálvaro recortan tiempos',    distrito: 'Puente de Vallecas' },
  ],

  // Macro snapshot (terminal-style bar)
  macro: {
    euribor12m: 2.51,
    euriborDelta: -0.18,
    tipoBCE: 2.25,
    tipoBCEDelta: 0.00,
    esfuerzoHipoteca: 33.4,
    esfuerzoDelta: -1.2,
    hipotecasMensual: 12480,
    hipotecasDelta: +4.6,
  },
};
