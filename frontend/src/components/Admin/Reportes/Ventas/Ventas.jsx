// src/components/admin/Reportes/Ventas/Ventas.jsx
import { motion } from 'framer-motion';
import { TrendingUp, Receipt, CalendarDays, Percent } from 'lucide-react';
import { StatCard, ReportCard } from '../ReportesUI';
import './Ventas.css';

// TODO: reemplazar por datos reales del backend
const ventasSemana = [
  { dia: 'Lun', monto: 1180 },
  { dia: 'Mar', monto: 1420 },
  { dia: 'Mié', monto: 980 },
  { dia: 'Jue', monto: 1650 },
  { dia: 'Vie', monto: 2100 },
  { dia: 'Sáb', monto: 2480 },
  { dia: 'Dom', monto: 1240 },
];

export default function Ventas() {
  const max = Math.max(...ventasSemana.map((v) => v.monto));

  return (
    <div>
      <div className="stats-grid">
        <StatCard icono={TrendingUp} etiqueta="Ventas del mes" valor="S/ 48,320" variacion="+12.4%" tono="positivo" />
        <StatCard icono={Receipt} etiqueta="Ticket promedio" valor="S/ 34.50" variacion="+2.1%" tono="positivo" />
        <StatCard icono={CalendarDays} etiqueta="Ventas de hoy" valor="S/ 1,240" />
        <StatCard icono={Percent} etiqueta="Meta del mes" valor="76%" variacion="Faltan 9 días" tono="neutro" />
      </div>

      <ReportCard titulo="Ventas de los últimos 7 días">
        <div className="ventas-chart">
          {ventasSemana.map((v, i) => (
            <div key={v.dia} className="ventas-chart__col">
              <div className="ventas-chart__barra-wrap">
                <motion.div
                  className="ventas-chart__barra"
                  initial={{ height: 0 }}
                  whileInView={{ height: `${(v.monto / max) * 100}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                >
                  <span className="ventas-chart__monto">S/ {v.monto}</span>
                </motion.div>
              </div>
              <span className="ventas-chart__dia">{v.dia}</span>
            </div>
          ))}
        </div>
      </ReportCard>
    </div>
  );
}