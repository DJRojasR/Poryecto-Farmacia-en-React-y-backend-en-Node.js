// src/components/Admin/Dashboard/Dashboard.jsx
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle, Boxes, Building2, Coins, FileBarChart, Package, RefreshCw, ShoppingBag, Users,
} from 'lucide-react';
import { useAuth } from '../../../models/context/AuthContext.jsx';
import { ESTADOS_PEDIDO, obtenerDashboard } from '../../../models/helpers/dashboard_api.js';
import './Dashboard.css';

const soles = (n) => `S/ ${Number(n || 0).toFixed(2)}`;

function estadoInfo(valor) {
  return ESTADOS_PEDIDO.find((e) => e.valor === valor) || ESTADOS_PEDIDO[0];
}

function TarjetaModulo({ icono, titulo, filas, tono, to }) {
  const contenido = (
    <>
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
    </>
  );
  const clase = `dashboard__modulo${tono ? ` dashboard__modulo--${tono}` : ''}`;
  return to ? <Link to={to} className={clase}>{contenido}</Link> : <div className={clase}>{contenido}</div>;
}

export default function Dashboard() {
  const { user, token } = useAuth();
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const cargar = useCallback(() => {
    let vigente = true;
    setCargando(true);
    obtenerDashboard(token)
      .then((d) => {
        if (!vigente) return;
        setDatos(d);
        setError('');
      })
      .catch((e) => vigente && setError(e.message))
      .finally(() => vigente && setCargando(false));
    return () => {
      vigente = false;
    };
  }, [token]);

  useEffect(() => cargar(), [cargar]);

  if (!datos) {
    return (
      <div className="dashboard">
        <div className="dashboard__intro">
          <h1>Hola, {user.nombre}</h1>
          {error ? (
            <p className="dashboard__error">
              {error}{' '}
              <button type="button" className="btn btn--ghost btn--pequeno" onClick={cargar}>Reintentar</button>
            </p>
          ) : (
            <p>Cargando resumen…</p>
          )}
        </div>
      </div>
    );
  }

  const { productos, inventario, pedidos, proveedores, ventas, usuarios, balanceMes } = datos;

  return (
    <div className="dashboard">
      <div className="dashboard__intro">
        <div>
          <h1>Hola, {user.nombre}</h1>
          <p>
            Resumen general de la farmacia · actualizado{' '}
            {new Date(datos.generadoEn).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <button type="button" className="btn btn--ghost" onClick={cargar} disabled={cargando}>
          <RefreshCw size={16} className={cargando ? 'dashboard__girando' : ''} />
          Actualizar
        </button>
      </div>

      {error && <p className="dashboard__error">{error}</p>}

      <div className="dashboard__modulos">
        <TarjetaModulo
          to="/Admin/productos"
          icono={<Package size={18} />}
          titulo="Productos"
          filas={[
            { valor: productos.total, label: 'productos en catálogo' },
            { valor: productos.categorias, label: 'categorías' },
          ]}
        />

        <TarjetaModulo
          to="/Admin/inventario"
          icono={<Boxes size={18} />}
          titulo="Inventario"
          tono={inventario.sinStock > 0 ? 'critico' : inventario.stockBajo > 0 ? 'alerta' : undefined}
          filas={[
            { valor: inventario.unidadesTotales, label: 'unidades totales' },
            { valor: inventario.stockBajo, label: `con stock bajo (≤ ${inventario.umbralStockBajo})` },
            { valor: inventario.sinStock, label: 'sin stock' },
          ]}
        />

        <TarjetaModulo
          to="/Admin/pedidos"
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
          to="/Admin/proveedores"
          icono={<Building2 size={18} />}
          titulo="Proveedores"
          filas={[
            { valor: proveedores.total, label: 'proveedores' },
            { valor: proveedores.activos, label: 'activos' },
            { valor: soles(proveedores.gastoMes), label: 'gasto del mes' },
          ]}
        />

        <TarjetaModulo
          to="/Admin/ventas"
          icono={<Coins size={18} />}
          titulo="Ventas"
          tono="exito"
          filas={[
            { valor: soles(ventas.ingresosHoy), label: 'ingresos hoy' },
            { valor: soles(ventas.ingresosMes), label: 'ingresos del mes' },
            { valor: soles(ventas.ticketPromedio), label: 'ticket promedio (mes)' },
          ]}
        />

        <TarjetaModulo
          to="/Admin/usuarios"
          icono={<Users size={18} />}
          titulo="Usuarios"
          filas={[
            { valor: usuarios.total, label: 'usuarios totales' },
            { valor: usuarios.administradores, label: 'administradores' },
            { valor: usuarios.nuevosMes, label: 'nuevos este mes' },
          ]}
        />

        <TarjetaModulo
          to="/Admin/reportes"
          icono={<FileBarChart size={18} />}
          titulo="Reportes"
          tono={balanceMes >= 0 ? 'exito' : 'critico'}
          filas={[
            { valor: soles(balanceMes), label: 'balance del mes (ventas − compras)' },
            { valor: ventas.totalVentas, label: 'ventas registradas' },
          ]}
        />
      </div>

      <div className="dashboard__doscolumnas">
        <div className="dashboard__seccion">
          <h2>Pedidos recientes</h2>
          {datos.pedidosRecientes.length === 0 ? (
            <p className="dashboard__nota">Todavía no hay pedidos registrados.</p>
          ) : (
            <ul className="dashboard__lista-pedidos">
              {datos.pedidosRecientes.map((p) => {
                const info = estadoInfo(p.estado);
                return (
                  <li key={p.id}>
                    <div>
                      <strong>#{p.id} · {p.cliente}</strong>
                      <small>
                        {new Date(p.fecha).toLocaleString('es-PE')} · {soles(p.total)}
                        {p.canal === 'mostrador' && ' · mostrador'}
                      </small>
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
                {datos.usuariosRecientes.map((u) => {
                  const soyYo = u.email === user.email;
                  return (
                    <tr key={u.id}>
                      <td>{u.nombre}{soyYo && <small> (tú)</small>}</td>
                      <td>{u.email}</td>
                      <td>
                        <span className={`dashboard__badge dashboard__badge--${u.rol === 'admin' ? 'admin' : 'cliente'}`}>
                          {u.rol === 'admin' ? 'Administrador' : 'Cliente'}
                        </span>
                      </td>
                      <td>
                        <span className="dashboard__estado">
                          <span className={`dashboard__punto${u.activo ? ' dashboard__punto--activo' : ''}`} />
                          {u.activo ? 'Activo' : 'Desactivado'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {datos.usuariosRecientes.length === 0 && (
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

      {datos.stockCritico.length > 0 && (
        <div className="dashboard__seccion dashboard__seccion--alerta">
          <h2>
            <AlertTriangle size={16} /> Productos por reponer
          </h2>
          <ul className="dashboard__lista-pedidos">
            {datos.stockCritico.map((p) => (
              <li key={p.id}>
                <div>
                  <strong>{p.nombre}</strong>
                  {p.marca && <small>{p.marca}</small>}
                </div>
                <span className={`dashboard__badge dashboard__badge--${p.stock === 0 ? 'critico' : 'alerta'}`}>
                  {p.stock === 0 ? 'Agotado' : `${p.stock} und.`}
                </span>
              </li>
            ))}
          </ul>
          <Link to="/Admin/inventario" className="dashboard__enlace">Ir a Inventario →</Link>
        </div>
      )}
    </div>
  );
}