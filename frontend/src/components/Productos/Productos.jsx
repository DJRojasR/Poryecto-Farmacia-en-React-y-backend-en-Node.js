import React, { useState } from 'react';
import { Search, ShoppingCart, ChevronDown, ChevronUp } from 'lucide-react';
import './Productos.css';

const CATEGORIAS_DATA = [
  {
    id: 'med',
    nombre: 'Medicamentos',
    subcategorias: [
      'Venta libre (dolor, gripe, digestión)',
      'Con receta médica (controlados y crónicos)'
    ]
  },
  {
    id: 'cuidado',
    nombre: 'Cuidado Personal e Higiene',
    subcategorias: [
      'Higiene bucal (pastas, enjuagues, cepillos)',
      'Cuidado capilar y corporal (jabones, champús)'
    ]
  },
  {
    id: 'dermo',
    nombre: 'Dermocosmética',
    subcategorias: [
      'Protección solar (bloqueadores)',
      'Cuidado facial (limpiadores, hidratantes, sérums)'
    ]
  },
  {
    id: 'salud',
    nombre: 'Salud y Bienestar',
    subcategorias: [
      'Vitaminas y suplementos (defensas, colágeno)',
      'Nutrición especializada y deportiva'
    ]
  },
  {
    id: 'bebe',
    nombre: 'Mamá y Bebé',
    subcategorias: [
      'Pañales y toallitas húmedas',
      'Alimentación y lactancia infantil (fórmulas)'
    ]
  }
];

// Productos de muestra para el avance visual
const PRODUCTOS_MOCK = [
  {
    id: 1,
    nombre: 'Champú 2 en 1 Hidratación',
    marca: 'Head & Shoulders',
    precio: '55.90',
    emoji: '🧴'
  },
  {
    id: 2,
    nombre: 'Paracetamol 500mg (Caja 20 tab)',
    marca: 'Panadol',
    precio: '12.50',
    emoji: '💊'
  },
  {
    id: 3,
    nombre: 'Protector Solar FPS 50+ Facial',
    marca: 'La Roche-Posay',
    precio: '98.00',
    emoji: '☀️'
  },
  {
    id: 4,
    nombre: 'Multivitamínico Gomitas Adulto',
    marca: 'Centrum',
    precio: '64.90',
    emoji: '✨'
  },
  {
    id: 5,
    nombre: 'Fórmula Infantil Etapa 1',
    marca: 'Nan Pro',
    precio: '82.00',
    emoji: '🍼'
  },
  {
    id: 6,
    nombre: 'Crema Hidratante Cerámicas',
    marca: 'CeraVe',
    precio: '74.50',
    emoji: '🧴'
  }
];

export default function Productos() {
  const [busqueda, setBusqueda] = useState('');
  const [abiertos, setAbiertos] = useState({
    med: true,
    cuidado: true,
    dermo: true,
    salud: true,
    bebe: true
  });

  const toggleCategoria = (id) => {
    setAbiertos((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="productos-page">
      {/* 1. Barra de Búsqueda Superior */}
      <div className="search-bar-container">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Busca una marca o producto..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <button type="button" aria-label="Buscar">
            <Search size={18} />
          </button>
        </div>
      </div>

      {/* 2. Estructura Principal: Sidebar + Catálogo */}
      <div className="productos-layout">
        {/* Lado Izquierdo: Categorizador */}
        <aside className="sidebar-categorias">
          <div className="sidebar-header">
            <h3>PRODUCTOS</h3>
          </div>

          <nav>
            {CATEGORIAS_DATA.map((cat) => (
              <div key={cat.id} className="category-group">
                <button
                  type="button"
                  className="category-header"
                  onClick={() => toggleCategoria(cat.id)}
                >
                  <span>{cat.nombre}</span>
                  {abiertos[cat.id] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {abiertos[cat.id] && (
                  <ul className="subcategories-list">
                    {cat.subcategorias.map((sub, idx) => (
                      <li key={idx} className="subcategory-item">
                        {sub}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </nav>
        </aside>

        {/* Lado Derecho: Grid de Productos */}
        <section className="productos-grid">
          {PRODUCTOS_MOCK.map((prod) => (
            <div key={prod.id} className="producto-card">
              <div className="card-top">
                <div className="card-image-box">
                  <span>{prod.emoji}</span>
                </div>
                <div className="card-info">
                  <span className="card-brand">{prod.marca}</span>
                  <h4 className="card-title">{prod.nombre}</h4>
                  <p className="card-price">S/. {prod.precio}</p>
                </div>
              </div>

              <button type="button" className="btn-add-cart">
                <ShoppingCart size={18} />
                Agregar al carrito
              </button>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}