import { Response } from "express";
import { pool } from "../config/db";
import { AuthRequest } from "../middlewares/auth.middleware";

export const crearTicket = async (req: AuthRequest, res: Response) => {
  const { titulo, descripcion, prioridad_id } = req.body;
  const numero = `TCK-${Date.now()}`;
  const result = await pool.query(
    `INSERT INTO tickets (numero, titulo, descripcion, solicitante_id, prioridad_id)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [numero, titulo, descripcion, req.user?.id, prioridad_id]
  );
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
  const result = await pool.query(`SELECT * FROM tickets WHERE id = $1`, [id]);
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
  res.json(result.rows[0]);
};

export const eliminarTicket = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  await pool.query(`DELETE FROM tickets WHERE id = $1`, [id]);
  res.status(204).send();
};
