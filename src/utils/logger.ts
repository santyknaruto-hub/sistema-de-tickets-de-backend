import { pool } from "../config/db";

export const registrarLog = async (
  usuario_id: number,
  ticket_id: number | null,
  accion: string
) => {
  await pool.query(`INSERT INTO logs (usuario_id, ticket_id, accion) VALUES ($1, $2, $3)`, [
    usuario_id,
    ticket_id,
    accion,
  ]);
};
