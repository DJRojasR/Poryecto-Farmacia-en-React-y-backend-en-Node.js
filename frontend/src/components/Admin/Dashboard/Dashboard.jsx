// src/components/admin/Dashboard/Dashboard.jsx
import { useMemo } from 'react';
import {
  AlertTriangle, Boxes, Building2, Coins, FileBarChart, Package, ShoppingBag, Users,
} from 'lucide-react';
import { useAuth } from '../../../models/context/AuthContext.jsx';
import { obtenerProductos } from '../../../models/helpers/productos.js';
import { resumenInventario } from '../../../models/helpers/inventario.js';
import { ESTADOS_PEDIDO, obtenerPedidos, resumenPedidos } from '../../../models/helpers/pedidos.js';
import { resumenProveedores } from '../../../models/helpers/proveedores.js';
import { obtenerUsuariosRegistrados, resumenUsuarios } from '../../../models/helpers/usuarios.js';
import { resumenVentas } from '../../../models/helpers/ventas.js';
import './Dashboard.css';

function estadoInfo(valor) {
  return ESTADOS_PEDIDO.find((e) => e.valor === valor) || ESTADOS_PEDIDO[0];
}

function TarjetaModulo({ icono, titulo, filas, tono }) {
  return (
    <div className={`dashboard__modulo${tono ? ` dashboard__modulo--${tono}` : ''}`}>
      <div className="dashboard__modulo-cabecera">
        <span className="dashboard__modulo-icono">{icono}</span>
        <h3>{titulo}</h3>
      </div>
      <div className="dashboard__modulo-filas">
        {filas.map((f) => (
          <div className="dashboard__modulo-fila" key={f.label}>
            <span className="dashboard__modulo-valor">{f.valor}</span>
            <span className="dashboard__modulo-label">{f.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();

  const productos = useMemo(() => obtenerProductos(), []);
  const inventario = useMemo(() => resumenInventario(), []);
  const proveedores = useMemo(() => resumenProveedores(), []);
  const pedidos = useMemo(() => resumenPedidos(), []);
  const usuarios = useMemo(() => resumenUsuarios(), []);
  const ventas = useMemo(() => resumenVentas(), []);

  const categorias = useMemo(
    () => new Set(productos.map((p) => p.categoria)).size,
    [productos],
  );

  const balanceDelMes = ventas.ingresosMes - proveedores.gastoDelMes;

  const pedidosRecientes = useMemo(() => obtenerPedidos().slice(0, 5), []);
  const usuariosRecientes = useMemo(() => obtenerUsuariosRegistrados().slice(0, 5), []);

  return (
    <div className="dashboard">
      <div className="dashboard__intro">
        <h1>Hola, {user.nombre}</h1>
        <p>Resumen general de la farmacia.</p>
      </div>

      <div className="dashboard__modulos">
        <TarjetaModulo
          icono={<Package size={18} />}
          titulo="Productos"
          filas={[
            { valor: productos.length, label: 'productos en catálogo' },
            { valor: categorias, label: 'categorías' },
          ]}
        />

        <TarjetaModulo
          icono={<Boxes size={18} />}
          titulo="Inventario"
          tono={inventario.sinStock > 0 ? 'critico' : inventario.stockBajo > 0 ? 'alerta' : undefined}
          filas={[
            { valor: inventario.unidadesTotales, label: 'unidades totales' },
            { valor: inventario.stockBajo, label: 'con stock bajo' },
            { valor: inventario.sinStock, label: 'sin stock' },
          ]}
        />

        <TarjetaModulo
          icono={<ShoppingBag size={18} />}
          titulo="Pedidos"
          tono={pedidos.pendientes > 0 ? 'alerta' : undefined}
          filas={[
            { valor: pedidos.total, label: 'pedidos totales' },
            { valor: pedidos.pendientes, label: 'pendientes' },
            { valor: pedidos.entregadosHoy, label: 'entregados hoy' },
          ]}
        />

        <TarjetaModulo
          icono={<Building2 size={18} />}
          titulo="Proveedores"
          filas={[
            { valor: proveedores.totalProveedores, label: 'proveedores' },
            { valor: proveedores.activos, label: 'activos' },
            { valor: `S/ ${proveedores.gastoDelMes.toFixed(2)}`, label: 'gasto del mes' },
          ]}
        />

        <TarjetaModulo
          icono={<Coins size={18} />}
          titulo="Ventas"
          tono="exito"
          filas={[
            { valor: `S/ ${ventas.ingresosHoy.toFixed(2)}`, label: 'ingresos hoy' },
            { valor: `S/ ${ventas.ingresosMes.toFixed(2)}`, label: 'ingresos del mes' },
            { valor: `S/ ${ventas.ticketPromedio.toFixed(2)}`, label: 'ticket promedio' },
          ]}
        />

        <TarjetaModulo
          icono={<Users size={18} />}
          titulo="Usuarios"
          filas={[
            { valor: usuarios.total, label: 'usuarios totales' },
            { valor: usuarios.administradores, label: 'administradores' },
            { valor: usuarios.nuevosEsteMes, label: 'nuevos este mes' },
          ]}
        />

        <TarjetaModulo
          icono={<FileBarChart size={18} />}
          titulo="Reportes"
          tono={balanceDelMes >= 0 ? 'exito' : 'critico'}
          filas={[
            { valor: `S/ ${balanceDelMes.toFixed(2)}`, label: 'balance del mes (ventas − compras)' },
            { valor: ventas.totalVentas, label: 'ventas registradas' },
          ]}
        />
      </div>

      <div className="dashboard__doscolumnas">
        <div className="dashboard__seccion">
          <h2>Pedidos recientes</h2>
          {pedidosRecientes.length === 0 ? (
            <p className="dashboard__nota">Todavía no hay pedidos registrados.</p>
          ) : (
            <ul className="dashboard__lista-pedidos">
              {pedidosRecientes.map((p) => {
                const info = estadoInfo(p.estado);
                return (
                  <li key={p.id}>
                    <div>
                      <strong>{p.cliente}</strong>
                      <small>{new Date(p.fecha).toLocaleString('es-PE')}</small>
                    </div>
                    <span className="dashboard__badge" style={{ color: info.color, background: `${info.color}1a` }}>
                      {info.etiqueta}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="dashboard__seccion">
          <h2>Usuarios recientes</h2>
          <div className="dashboard__tabla-wrap">
            <table className="dashboard__tabla">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Correo</th>
                  <th>Rol</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {usuariosRecientes.map((u) => {
                  const enLinea = u.email === user.email;
                  return (
                    <tr key={u.email}>
                      <td>{u.nombre}</td>
                      <td>{u.email}</td>
                      <td>
                        <span className={`dashboard__badge dashboard__badge--${u.rol === 'admin' ? 'admin' : 'cliente'}`}>
                          {u.rol === 'admin' ? 'Administrador' : 'Cliente'}
                        </span>
                      </td>
                      <td>
                        <span className="dashboard__estado">
                          <span className={`dashboard__punto${enLinea ? ' dashboard__punto--activo' : ''}`} />
                          {enLinea ? 'En línea' : 'Registrado'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {usuariosRecientes.length === 0 && (
                  <tr>
                    <td colSpan={4} className="dashboard__tabla-vacio">
                      Todavía no hay usuarios registrados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {inventario.sinStock > 0 && (
        <p className="dashboard__alerta-global">
          <AlertTriangle size={14} /> Hay {inventario.sinStock} producto(s) sin stock. Revisa el módulo de Inventario.
        </p>
      )}
    </div>
  );
}