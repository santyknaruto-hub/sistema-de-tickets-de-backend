import { Response } from "express";
import { pool } from "../config/db";
import { AuthRequest } from "../middlewares/auth.middleware";
import { comparePassword } from "../utils/hash";
import { registrarLog } from "../utils/logger";

export const crearTicket = async (req: AuthRequest, res: Response) => {
  const { titulo, descripcion, prioridad_id } = req.body;
  const numero = `TCK-${Date.now()}`;
  const result = await pool.query(
    `INSERT INTO tickets (numero, titulo, descripcion, solicitante_id, prioridad_id)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [numero, titulo, descripcion, req.user?.id, prioridad_id]
  );
  await registrarLog(req.user!.id, result.rows[0].id, "Creó el ticket");
  res.status(201).json(result.rows[0]);
};

export const listarTickets = async (_req: AuthRequest, res: Response) => {
  const result = await pool.query(
    `SELECT t.*, e.nombre AS estado, p.nombre AS prioridad,
            u1.nombre AS solicitante, u2.nombre AS tecnico
     FROM tickets t
     JOIN estados e ON t.estado_id = e.id
     JOIN prioridades p ON t.prioridad_id = p.id
     JOIN usuarios u1 ON t.solicitante_id = u1.id
     LEFT JOIN usuarios u2 ON t.tecnico_id = u2.id
     ORDER BY t.fecha_creacion DESC`
  );
  res.json(result.rows);
};

export const obtenerTicket = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const result = await pool.query(
    `SELECT t.*, e.nombre AS estado, p.nombre AS prioridad,
            u1.nombre AS solicitante, u2.nombre AS tecnico
     FROM tickets t
     JOIN estados e ON t.estado_id = e.id
     JOIN prioridades p ON t.prioridad_id = p.id
     JOIN usuarios u1 ON t.solicitante_id = u1.id
     LEFT JOIN usuarios u2 ON t.tecnico_id = u2.id
     WHERE t.id = $1`,
    [id]
  );
  if (result.rows.length === 0) return res.status(404).json({ error: "Ticket no encontrado" });
  res.json(result.rows[0]);
};

export const actualizarTicket = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { titulo, descripcion, prioridad_id } = req.body;
  const result = await pool.query(
    `UPDATE tickets SET titulo = $1, descripcion = $2, prioridad_id = $3
     WHERE id = $4 RETURNING *`,
    [titulo, descripcion, prioridad_id, id]
  );
  await registrarLog(req.user!.id, Number(id), "Editó el ticket");
  res.json(result.rows[0]);
};

// Eliminación simple (se mantiene solo por compatibilidad interna; el flujo real usa eliminarTicketConfirmado)
export const eliminarTicket = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  await pool.query(`DELETE FROM tickets WHERE id = $1`, [id]);
  res.status(204).send();
};

export const eliminarTicketConfirmado = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { password } = req.body;

  const userResult = await pool.query(`SELECT password_hash FROM usuarios WHERE id = $1`, [
    req.user?.id,
  ]);
  const hash = userResult.rows[0]?.password_hash;

  const valido = hash && (await comparePassword(password, hash));
  if (!valido) {
    return res.status(401).json({ error: "Contraseña incorrecta. Eliminación cancelada." });
  }

  await registrarLog(req.user!.id, Number(id), "Eliminó el ticket");
  await pool.query(`DELETE FROM tickets WHERE id = $1`, [id]);
  res.status(204).send();
};

export const buscarTickets = async (req: AuthRequest, res: Response) => {
  const { q, estado, prioridad, tecnico_id, fecha_desde, fecha_hasta } = req.query;

  const condiciones: string[] = [];
  const valores: any[] = [];
  let i = 1;

  if (q) {
    condiciones.push(
      `(t.numero ILIKE $${i} OR t.titulo ILIKE $${i} OR u1.nombre ILIKE $${i} OR u2.nombre ILIKE $${i})`
    );
    valores.push(`%${q}%`);
    i++;
  }
  if (estado) {
    condiciones.push(`e.nombre = $${i}`);
    valores.push(estado);
    i++;
  }
  if (prioridad) {
    condiciones.push(`p.nombre = $${i}`);
    valores.push(prioridad);
    i++;
  }
  if (tecnico_id) {
    condiciones.push(`t.tecnico_id = $${i}`);
    valores.push(tecnico_id);
    i++;
  }
  if (fecha_desde) {
    condiciones.push(`t.fecha_creacion >= $${i}`);
    valores.push(fecha_desde);
    i++;
  }
  if (fecha_hasta) {
    condiciones.push(`t.fecha_creacion <= $${i}`);
    valores.push(fecha_hasta);
    i++;
  }

  const where = condiciones.length ? `WHERE ${condiciones.join(" AND ")}` : "";

  const result = await pool.query(
    `SELECT t.*, e.nombre AS estado, p.nombre AS prioridad,
            u1.nombre AS solicitante, u2.nombre AS tecnico
     FROM tickets t
     JOIN estados e ON t.estado_id = e.id
     JOIN prioridades p ON t.prioridad_id = p.id
     JOIN usuarios u1 ON t.solicitante_id = u1.id
     LEFT JOIN usuarios u2 ON t.tecnico_id = u2.id
     ${where}
     ORDER BY t.fecha_creacion DESC`,
    valores
  );
  res.json(result.rows);
};

export const asignarTecnico = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { tecnico_id } = req.body;

  const result = await pool.query(`UPDATE tickets SET tecnico_id = $1 WHERE id = $2 RETURNING *`, [
    tecnico_id,
    id,
  ]);

  await registrarLog(req.user!.id, Number(id), `Asignó el ticket al técnico ${tecnico_id}`);
  res.json(result.rows[0]);
};

export const cambiarEstado = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { estado_id } = req.body;

  const fechaCierre = estado_id === 3 ? "NOW()" : "NULL";

  const result = await pool.query(
    `UPDATE tickets SET estado_id = $1, fecha_cierre = ${fechaCierre} WHERE id = $2 RETURNING *`,
    [estado_id, id]
  );

  await registrarLog(req.user!.id, Number(id), `Cambió el estado a ${estado_id}`);
  res.json(result.rows[0]);
};

export const cargaLaboralTecnicos = async (_req: AuthRequest, res: Response) => {
  const result = await pool.query(`
    SELECT u.id, u.nombre,
      COUNT(*) FILTER (WHERE e.nombre = 'pendiente') AS pendientes,
      COUNT(*) FILTER (WHERE e.nombre = 'en_proceso') AS en_proceso,
      COUNT(*) FILTER (WHERE e.nombre = 'finalizado') AS finalizados,
      COUNT(*) AS total
    FROM usuarios u
    JOIN roles r ON u.rol_id = r.id
    LEFT JOIN tickets t ON t.tecnico_id = u.id
    LEFT JOIN estados e ON t.estado_id = e.id
    WHERE r.nombre = 'tecnico'
    GROUP BY u.id, u.nombre
    ORDER BY total DESC
  `);
  res.json(result.rows);
};

export const listarLogs = async (_req: AuthRequest, res: Response) => {
  const result = await pool.query(`
    SELECT l.id, u.nombre AS usuario, l.accion, t.numero AS ticket, l.fecha_hora
    FROM logs l
    JOIN usuarios u ON l.usuario_id = u.id
    LEFT JOIN tickets t ON l.ticket_id = t.id
    ORDER BY l.fecha_hora DESC
  `);
  res.json(result.rows);
};

export const metricasGenerales = async (_req: AuthRequest, res: Response) => {
  const totales = await pool.query(`
    SELECT
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE e.nombre = 'pendiente') AS pendientes,
      COUNT(*) FILTER (WHERE e.nombre = 'en_proceso') AS en_proceso,
      COUNT(*) FILTER (WHERE e.nombre = 'finalizado') AS finalizados
    FROM tickets t JOIN estados e ON t.estado_id = e.id
  `);

  const porPrioridad = await pool.query(`
    SELECT p.nombre AS prioridad, COUNT(*) AS cantidad
    FROM tickets t JOIN prioridades p ON t.prioridad_id = p.id
    GROUP BY p.nombre
  `);

  const porPeriodo = await pool.query(`
    SELECT DATE_TRUNC('day', fecha_creacion) AS dia, COUNT(*) AS cantidad
    FROM tickets
    GROUP BY dia
    ORDER BY dia DESC
    LIMIT 30
  `);

  res.json({
    totales: totales.rows[0],
    porPrioridad: porPrioridad.rows,
    porPeriodo: porPeriodo.rows,
  });
};
