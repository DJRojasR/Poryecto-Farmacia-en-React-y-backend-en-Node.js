// src/components/admin/Reportes/Resumen/Resumen.jsx
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  Package,
  AlertTriangle,
  ShoppingCart,
  DollarSign,
  Star,
  ArrowRight,
} from 'lucide-react';
import { StatCard, ReportCard } from '../ReportesUI';
import './Resumen.css';

// TODO: reemplazar por datos reales del backend (idealmente un solo endpoint /reportes/resumen)
const ventasSemana = [
  { dia: 'Lun', monto: 1180 },
  { dia: 'Mar', monto: 1420 },
  { dia: 'Mié', monto: 980 },
  { dia: 'Jue', monto: 1650 },
  { dia: 'Vie', monto: 2100 },
  { dia: 'Sáb', monto: 2480 },
  { dia: 'Dom', monto: 1240 },
];

const ingresosPorCategoria = [
  { nombre: 'Medicamentos', pct: 45, color: 'var(--primario)' },
  { nombre: 'Cuidado personal', pct: 22, color: 'var(--acento)' },
  { nombre: 'Vitaminas', pct: 18, color: '#7c9cbf' },
  { nombre: 'Otros', pct: 15, color: 'var(--gris-suave)' },
];



function construirGradiente(data) {
  let acumulado = 0;
  const partes = data.map((d) => {
    const inicio = acumulado;
    acumulado += d.pct;
    return `${d.color} ${inicio}% ${acumulado}%`;
  });
  return `conic-gradient(${partes.join(', ')})`;
}

export default function Resumen() {
  const max = Math.max(...ventasSemana.map((v) => v.monto));

  return (
    <div>
      <div className="stats-grid">
        <StatCard icono={TrendingUp} etiqueta="Ventas del mes" valor="S/ 48,320" variacion="+12.4%" tono="positivo" />
        <StatCard icono={DollarSign} etiqueta="Utilidad neta" valor="S/ 38,450" variacion="+11.6%" tono="positivo" />
        <StatCard icono={AlertTriangle} etiqueta="Alertas activas" valor="9" tono="negativo" variacion="Stock y vencimientos" />
        <StatCard icono={ShoppingCart} etiqueta="Compras pendientes" valor="6" />
      </div>

      <div className="report-grid-2">
        <ReportCard titulo="Ventas de los últimos 7 días">
          <div className="resumen-chart">
            {ventasSemana.map((v, i) => (
              <div key={v.dia} className="resumen-chart__col">
                <div className="resumen-chart__barra-wrap">
                  <motion.div
                    className="resumen-chart__barra"
                    initial={{ height: 0 }}
                    whileInView={{ height: `${(v.monto / max) * 100}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
                <span className="resumen-chart__dia">{v.dia}</span>
              </div>
            ))}
          </div>
          <Link to="ventas" className="resumen-vermas">
            Ver reporte completo <ArrowRight size={14} />
          </Link>
        </ReportCard>

        <ReportCard titulo="Ingresos por categoría">
          <div className="resumen-dona">
            <div
              className="resumen-dona__circulo"
              style={{ background: construirGradiente(ingresosPorCategoria) }}
            >
              <div className="resumen-dona__centro">
                <span className="resumen-dona__valor">S/ 61.4k</span>
              </div>
            </div>
            <ul className="resumen-dona__leyenda">
              {ingresosPorCategoria.map((d) => (
                <li key={d.nombre}>
                  <span className="resumen-dona__punto" style={{ background: d.color }} />
                  <span>{d.nombre}</span>
                  <span className="resumen-dona__pct">{d.pct}%</span>
                </li>
              ))}
            </ul>
          </div>
          <Link to="ingresos" className="resumen-vermas">
            Ver reporte completo <ArrowRight size={14} />
          </Link>
        </ReportCard>
      </div>
    </div>
  );
}