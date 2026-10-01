// Las CLAVES (med, cuidado, ...) deben coincidir con el CHECK de la tabla productos.
export const CATEGORIAS = {
  med: {
    nombre: 'Medicamentos',
    subcategorias: [
      'Analgésicos y antiinflamatorios',
      'Gripe y resfrío',
      'Antibióticos',
      'Digestivo y gastrointestinal',
      'Alergias',
      'Respiratorio y asma',
      'Cardiovascular y presión arterial',
      'Diabetes',
      'Salud femenina',
      'Oftálmicos y óticos',
      'Otros medicamentos',
    ],
  },
  cuidado: {
    nombre: 'Cuidado personal',
    subcategorias: [
      'Higiene bucal',
      'Cuidado del cabello',
      'Higiene corporal',
      'Desodorantes y fragancias',
      'Afeitado y depilación',
      'Higiene íntima',
      'Preservativos y bienestar sexual',
    ],
  },
  dermo: {
    nombre: 'Dermocosmética',
    subcategorias: [
      'Protector solar',
      'Limpieza facial',
      'Hidratación facial',
      'Anti-edad',
      'Acné y piel grasa',
      'Manchas y aclarantes',
      'Cuidado corporal',
      'Labios',
    ],
  },
  salud: {
    nombre: 'Salud y bienestar',
    subcategorias: [
      'Vitaminas y minerales',
      'Suplementos y nutrición',
      'Primeros auxilios',
      'Equipos de medición',
      'Ortopedia y soporte',
      'Control de peso',
    ],
  },
  bebe: {
    nombre: 'Bebé y maternidad',
    subcategorias: [
      'Pañales',
      'Fórmulas y alimentación',
      'Higiene y cuidado del bebé',
      'Mamaderas y chupones',
      'Salud del bebé',
      'Maternidad y lactancia',
    ],
  },
};

// Lo que recibe el frontend en GET /api/productos/categorias
export const catalogoParaCliente = () =>
  Object.entries(CATEGORIAS).map(([id, c]) => ({
    id,
    nombre: c.nombre,
    subcategorias: c.subcategorias,
  }));