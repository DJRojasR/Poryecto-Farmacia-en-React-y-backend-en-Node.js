// src/components/admin/Reportes/ReportesUI.jsx
import { motion } from 'framer-motion';
import './ReportesUI.css';

export function StatCard({ icono: Icono, etiqueta, valor, variacion, tono = 'neutro' }) {
  return (
    <motion.div
      className="stat-card"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="stat-card__icono">
        <Icono size={20} strokeWidth={2.2} />
      </div>
      <p className="stat-card__valor">{valor}</p>
      <p className="stat-card__etiqueta">{etiqueta}</p>
      {variacion && (
        <span className={`stat-card__variacion stat-card__variacion--${tono}`}>
          {variacion}
        </span>
      )}
    </motion.div>
  );
}

export function ProgressBar({ label, valor, max = 100, color }) {
  const pct = Math.min((valor / max) * 100, 100);
  return (
    <div className="progress-row">
      <div className="progress-row__cabecera">
        <span>{label}</span>
        <span>{Math.round(pct)}%</span>
      </div>
      <div className="progress-bar">
        <motion.div
          className="progress-bar__fill"
          style={{ background: color }}
          initial={{ width: 0 }}
          whileInView={{ width: `${pct}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  );
}

export function Badge({ tono = 'info', children }) {
  return <span className={`badge badge--${tono}`}>{children}</span>;
}

export function ReportCard({ titulo, children, className = '' }) {
  return (
    <motion.div
      className={`report-card ${className}`}
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.4 }}
    >
      {titulo && <h3 className="report-card__titulo">{titulo}</h3>}
      {children}
    </motion.div>
  );
}