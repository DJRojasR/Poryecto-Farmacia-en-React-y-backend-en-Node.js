// src/components/admin/Reportes/MasVendidos/MasVendidos.jsx
import { motion } from 'framer-motion';
import { ReportCard } from '../ReportesUI';
import './MasVendidos.css';

// TODO: reemplazar por datos reales del backend
const topProductos = [
  { nombre: 'Paracetamol 500mg', unidades: 842 },
  { nombre: 'Multivitamínico x30', unidades: 610 },
  { nombre: 'Alcohol en gel 500ml', unidades: 588 },
  { nombre: 'Ibuprofeno 400mg', unidades: 495 },
  { nombre: 'Protector solar FPS50', unidades: 401 },
];

const medallas = ['🥇', '🥈', '🥉'];

export default function MasVendidos() {
  const max = topProductos[0].unidades;

  return (
    <ReportCard titulo="Top 5 productos más vendidos este mes">
      <div className="ranking">
        {topProductos.map((p, i) => (
          <motion.div
            key={p.nombre}
            className="ranking__fila"
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
          >
            <span className="ranking__puesto">{medallas[i] ?? `#${i + 1}`}</span>
            <div className="ranking__info">
              <div className="ranking__cabecera">
                <span className="ranking__nombre">{p.nombre}</span>
                <span className="ranking__unidades">{p.unidades} un.</span>
              </div>
              <div className="ranking__barra">
                <motion.div
                  className="ranking__barra-fill"
                  initial={{ width: 0 }}
                  whileInView={{ width: `${(p.unidades / max) * 100}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.7, delay: i * 0.08 + 0.15 }}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </ReportCard>
  );
}