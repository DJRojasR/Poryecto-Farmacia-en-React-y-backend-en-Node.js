// src/components/admin/Reportes/ProximosVencer/ProximosVencer.jsx
import { ReportCard, Badge } from '../ReportesUI';
import './ProximosVencer.css';

// TODO: reemplazar por datos reales del backend
const productos = [
  { nombre: 'Jarabe para la tos 120ml', lote: 'L-2291', dias: 6 },
  { nombre: 'Amoxicilina 500mg', lote: 'L-2187', dias: 12 },
  { nombre: 'Suero fisiológico 250ml', lote: 'L-2305', dias: 21 },
  { nombre: 'Gotas oftálmicas', lote: 'L-2199', dias: 28 },
  { nombre: 'Crema antimicótica', lote: 'L-2244', dias: 45 },
];

function estadoPorDias(dias) {
  if (dias <= 15) return { tono: 'critico', texto: 'Crítico' };
  if (dias <= 30) return { tono: 'alerta', texto: 'Próximo' };
  return { tono: 'ok', texto: 'En rango' };
}

export default function ProximosVencer() {
  return (
    <ReportCard titulo="Productos próximos a vencer">
      <div className="vencimientos">
        {productos
          .sort((a, b) => a.dias - b.dias)
          .map((p) => {
            const estado = estadoPorDias(p.dias);
            return (
              <div key={p.lote} className="vencimientos__fila">
                <div>
                  <p className="vencimientos__nombre">{p.nombre}</p>
                  <p className="vencimientos__lote">Lote {p.lote}</p>
                </div>
                <div className="vencimientos__derecha">
                  <span className="vencimientos__dias">{p.dias} días</span>
                  <Badge tono={estado.tono}>{estado.texto}</Badge>
                </div>
              </div>
            );
          })}
      </div>
    </ReportCard>
  );
}