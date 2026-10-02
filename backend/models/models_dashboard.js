// backend/models/models_dashboard.js
import pool from '../db/db.js';
import { STOCK_BAJO } from '../helpers/motivos_inventario.js';

// "Hoy" y "este mes" se calculan con la hora de Perú, no la del servidor
const ZONA = 'America/Lima';
const ESTADOS_PENDIENTES = ['pendiente', 'confirmado', 'en_camino'];

// Venta = pedido pagado y no cancelado (web con tarjeta o mostrador). Cuenta desde que se paga.
// Todos los indicadores en UNA sola consulta (un viaje a la BD)
const SQL_INDICADORES = `
WITH t AS (
  SELECT date_trunc('day',   NOW() AT TIME ZONE $2::text) AT TIME ZONE $2::text AS inicio_dia,
         date_trunc('month', NOW() AT TIME ZONE $2::text) AT TIME ZONE $2::text AS inicio_mes,
         date_trunc('month', NOW() AT TIME ZONE $2::text)::date                 AS mes_fecha
)
SELECT
  (SELECT COUNT(*) FROM productos WHERE activo)                                       AS productos_total,
  (SELECT COUNT(DISTINCT categoria) FROM productos WHERE activo)                      AS categorias,
  (SELECT COALESCE(SUM(stock), 0) FROM productos WHERE activo)                        AS unidades,
  (SELECT COUNT(*) FROM productos WHERE activo AND stock > 0 AND stock <= $1)         AS stock_bajo,
  (SELECT COUNT(*) FROM productos WHERE activo AND stock = 0)                         AS sin_stock,

  (SELECT COUNT(*) FROM pedidos)                                                      AS pedidos_total,
  (SELECT COUNT(*) FROM pedidos WHERE estado = ANY($3::text[]))                       AS pedidos_pendientes,
  (SELECT COUNT(*) FROM pedidos, t
    WHERE estado = 'entregado' AND entregado_en >= t.inicio_dia)                      AS entregados_hoy,

  (SELECT COUNT(*) FROM proveedores)                                                  AS proveedores_total,
  (SELECT COUNT(*) FROM proveedores WHERE activo)                                     AS proveedores_activos,
  (SELECT COALESCE(SUM(total), 0) FROM compras, t
    WHERE estado = 'registrada' AND fecha >= t.mes_fecha)                             AS gasto_mes,

  (SELECT COALESCE(SUM(total), 0) FROM pedidos, t
    WHERE pago_estado = 'pagado' AND estado <> 'cancelado' AND pagado_en >= t.inicio_dia)                                      AS ingresos_hoy,
  (SELECT COALESCE(SUM(total), 0) FROM pedidos, t
    WHERE pago_estado = 'pagado' AND estado <> 'cancelado' AND pagado_en >= t.inicio_mes)                                      AS ingresos_mes,
  (SELECT COUNT(*) FROM pedidos, t
    WHERE pago_estado = 'pagado' AND estado <> 'cancelado' AND pagado_en >= t.inicio_mes)                                      AS ventas_mes,
  (SELECT COUNT(*) FROM pedidos WHERE pago_estado = 'pagado' AND estado <> 'cancelado')                                        AS ventas_total,

  (SELECT COUNT(*) FROM usuarios)                                                     AS usuarios_total,
  (SELECT COUNT(*) FROM usuarios WHERE rol = 'admin')                                 AS administradores,
  (SELECT COUNT(*) FROM usuarios, t WHERE creado_en >= t.inicio_mes)                  AS usuarios_nuevos_mes
`;

// pg devuelve COUNT (bigint) y NUMERIC como string
const n = (v) => Number(v) || 0;
const dinero = (v) => Math.round(n(v) * 100) / 100;

export const DashboardModel = {
  async resumen() {
    const [indicadores, pedidos, usuarios, criticos] = await Promise.all([
      pool.query(SQL_INDICADORES, [STOCK_BAJO, ZONA, ESTADOS_PENDIENTES]),
      pool.query(
        `SELECT id, cliente_nombre AS cliente, canal, estado, total, creado_en AS fecha
           FROM pedidos ORDER BY creado_en DESC, id DESC LIMIT 5`
      ),
      pool.query(
        `SELECT id, nombre, email, rol, activo, creado_en
           FROM usuarios ORDER BY creado_en DESC, id DESC LIMIT 5`
      ),
      pool.query(
        `SELECT id, nombre, marca, stock
           FROM productos WHERE activo AND stock <= $1
          ORDER BY stock ASC, nombre ASC LIMIT 5`,
        [STOCK_BAJO]
      ),
    ]);

    const k = indicadores.rows[0];
    const ingresosMes = dinero(k.ingresos_mes);
    const ventasMes = n(k.ventas_mes);
    const gastoMes = dinero(k.gasto_mes);

    return {
      productos: { total: n(k.productos_total), categorias: n(k.categorias) },
      inventario: {
        unidadesTotales: n(k.unidades),
        stockBajo: n(k.stock_bajo),
        sinStock: n(k.sin_stock),
        umbralStockBajo: STOCK_BAJO,
      },
      pedidos: {
        total: n(k.pedidos_total),
        pendientes: n(k.pedidos_pendientes),
        entregadosHoy: n(k.entregados_hoy),
      },
      proveedores: {
        total: n(k.proveedores_total),
        activos: n(k.proveedores_activos),
        gastoMes,
      },
      ventas: {
        ingresosHoy: dinero(k.ingresos_hoy),
        ingresosMes,
        ventasMes,
        ticketPromedio: ventasMes ? dinero(ingresosMes / ventasMes) : 0,
        totalVentas: n(k.ventas_total),
      },
      usuarios: {
        total: n(k.usuarios_total),
        administradores: n(k.administradores),
        nuevosMes: n(k.usuarios_nuevos_mes),
      },
      balanceMes: dinero(ingresosMes - gastoMes),
      pedidosRecientes: pedidos.rows.map((p) => ({ ...p, total: dinero(p.total) })),
      usuariosRecientes: usuarios.rows,
      stockCritico: criticos.rows,
      generadoEn: new Date().toISOString(),
    };
  },
};