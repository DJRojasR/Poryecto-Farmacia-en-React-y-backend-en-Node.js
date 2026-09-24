// src/components/admin/Reportes/Stock/Stock.jsx
import { Boxes, PackageX, AlertTriangle, Wallet } from 'lucide-react';
import { StatCard, ProgressBar, ReportCard, Badge } from '../ReportesUI';
import './Stock.css';

// TODO: reemplazar por datos reales del backend
const categorias = [
  { nombre: 'Medicamentos', pct: 82 },
  { nombre: 'Cuidado personal', pct: 65 },
  { nombre: 'Vitaminas', pct: 58 },
  { nombre: 'Bebés', pct: 40 },
  { nombre: 'Cuidado dental', pct: 71 },
];

const stockBajo = [
  { nombre: 'Amoxicilina 500mg', cantidad: 6 },
  { nombre: 'Suero fisiológico 250ml', cantidad: 3 },
  { nombre: 'Alcohol en gel 500ml', cantidad: 8 },
  { nombre: 'Termómetro digital', cantidad: 2 },
];

export default function Stock() {
  return (
    <div>
      <div className="stats-grid">
        <StatCard icono={Boxes} etiqueta="Productos en stock" valor="1,284" />
        <StatCard icono={AlertTriangle} etiqueta="Stock bajo" valor="18" tono="negativo" variacion="Revisar" />
        <StatCard icono={PackageX} etiqueta="Sin stock" valor="4" tono="negativo" variacion="Urgente" />
        <StatCard icono={Wallet} etiqueta="Valor del inventario" valor="S/ 92,450" />
      </div>

      <div className="report-grid-2">
        <ReportCard titulo="Nivel de stock por categoría">
          {categorias.map((c) => (
            <ProgressBar
              key={c.nombre}
              label={c.nombre}
              valor={c.pct}
              color={c.pct < 50 ? '#c0392b' : 'var(--primario)'}
            />
          ))}
        </ReportCard>

        <ReportCard titulo="Productos con stock bajo">
          <ul className="stock-lista">
            {stockBajo.map((p) => (
              <li key={p.nombre} className="stock-lista__item">
                <span>{p.nombre}</span>
                <Badge tono={p.cantidad <= 3 ? 'critico' : 'alerta'}>{p.cantidad} un.</Badge>
              </li>
            ))}
          </ul>
        </ReportCard>
      </div>
    </div>
  );
}