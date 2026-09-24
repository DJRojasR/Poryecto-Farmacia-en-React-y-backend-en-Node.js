// src/components/admin/Reportes/Compras/Compras.jsx
import { FileText, Truck, Wallet, Clock } from 'lucide-react';
import { StatCard, ReportCard, Badge } from '../ReportesUI';
import './Compras.css';

// TODO: reemplazar por datos reales del backend
const ordenes = [
  { id: 'OC-1042', proveedor: 'Droguería Continental', monto: 4200, estado: 'recibido' },
  { id: 'OC-1043', proveedor: 'Distribuidora Sanitas', monto: 1850, estado: 'transito' },
  { id: 'OC-1044', proveedor: 'Química Suiza', monto: 3120, estado: 'pendiente' },
  { id: 'OC-1045', proveedor: 'Droguería Continental', monto: 980, estado: 'recibido' },
];

const estados = {
  recibido: { tono: 'ok', texto: 'Recibido' },
  transito: { tono: 'info', texto: 'En tránsito' },
  pendiente: { tono: 'alerta', texto: 'Pendiente' },
};

export default function Compras() {
  return (
    <div>
      <div className="stats-grid">
        <StatCard icono={FileText} etiqueta="Órdenes de compra" valor="42" />
        <StatCard icono={Truck} etiqueta="Proveedores activos" valor="15" />
        <StatCard icono={Wallet} etiqueta="Gasto total del mes" valor="S/ 28,900" />
        <StatCard icono={Clock} etiqueta="Pendientes de recibir" valor="6" tono="neutro" />
      </div>

      <ReportCard titulo="Órdenes de compra recientes">
        <div className="compras-tabla">
          <div className="compras-tabla__cabecera">
            <span>Orden</span>
            <span>Proveedor</span>
            <span>Monto</span>
            <span>Estado</span>
          </div>
          {ordenes.map((o) => (
            <div key={o.id} className="compras-tabla__fila">
              <span className="compras-tabla__id">{o.id}</span>
              <span>{o.proveedor}</span>
              <span>S/ {o.monto.toLocaleString('es-PE')}</span>
              <Badge tono={estados[o.estado].tono}>{estados[o.estado].texto}</Badge>
            </div>
          ))}
        </div>
      </ReportCard>
    </div>
  );
}