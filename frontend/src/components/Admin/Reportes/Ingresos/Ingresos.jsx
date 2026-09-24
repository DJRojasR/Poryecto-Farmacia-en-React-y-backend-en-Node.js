// src/components/admin/Reportes/Ingresos/Ingresos.jsx
import { DollarSign, TrendingDown, PiggyBank, Percent } from 'lucide-react';
import { StatCard, ReportCard } from '../ReportesUI';
import './Ingresos.css';

// TODO: reemplazar por datos reales del backend
const desglose = [
  { nombre: 'Medicamentos', pct: 45, color: 'var(--primario)' },
  { nombre: 'Cuidado personal', pct: 22, color: 'var(--acento)' },
  { nombre: 'Vitaminas', pct: 18, color: '#7c9cbf' },
  { nombre: 'Otros', pct: 15, color: 'var(--gris-suave)' },
];

// Construye el gradiente cónico a partir del desglose
function construirGradiente(data) {
  let acumulado = 0;
  const partes = data.map((d) => {
    const inicio = acumulado;
    acumulado += d.pct;
    return `${d.color} ${inicio}% ${acumulado}%`;
  });
  return `conic-gradient(${partes.join(', ')})`;
}

export default function Ingresos() {
  return (
    <div>
      <div className="stats-grid">
        <StatCard icono={DollarSign} etiqueta="Ingresos totales" valor="S/ 61,400" variacion="+8.2%" tono="positivo" />
        <StatCard icono={TrendingDown} etiqueta="Gastos operativos" valor="S/ 22,950" variacion="+3.0%" tono="negativo" />
        <StatCard icono={PiggyBank} etiqueta="Utilidad neta" valor="S/ 38,450" variacion="+11.6%" tono="positivo" />
        <StatCard icono={Percent} etiqueta="Margen" valor="62.6%" />
      </div>

      <ReportCard titulo="Ingresos por categoría">
        <div className="ingresos-dona">
          <div
            className="ingresos-dona__circulo"
            style={{ background: construirGradiente(desglose) }}
          >
            <div className="ingresos-dona__centro">
              <span className="ingresos-dona__valor">S/ 61,400</span>
              <span className="ingresos-dona__etiqueta">Total del mes</span>
            </div>
          </div>

          <ul className="ingresos-dona__leyenda">
            {desglose.map((d) => (
              <li key={d.nombre}>
                <span className="ingresos-dona__punto" style={{ background: d.color }} />
                <span className="ingresos-dona__nombre">{d.nombre}</span>
                <span className="ingresos-dona__pct">{d.pct}%</span>
              </li>
            ))}
          </ul>
        </div>
      </ReportCard>
    </div>
  );
}