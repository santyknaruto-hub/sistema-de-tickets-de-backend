import { Response } from "express";
import { pool } from "../config/db";
import { AuthRequest } from "../middlewares/auth.middleware";

export const historialUsuario = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const usuario = await pool.query(
    `SELECT u.id, u.nombre, u.email, r.nombre AS rol, u.creado_en
     FROM usuarios u JOIN roles r ON u.rol_id = r.id WHERE u.id = $1`,
    [id]
  );
  if (usuario.rows.length === 0) return res.status(404).json({ error: "Usuario no encontrado" });

  const actividad = await pool.query(
    `SELECT accion, COUNT(*) AS cantidad, MAX(fecha_hora) AS ultima_vez
     FROM logs WHERE usuario_id = $1 GROUP BY accion`,
    [id]
  );

  const ticketsRelacionados = await pool.query(
    `SELECT COUNT(*) FILTER (WHERE solicitante_id = $1) AS como_solicitante,
            COUNT(*) FILTER (WHERE tecnico_id = $1) AS como_tecnico
     FROM tickets WHERE solicitante_id = $1 OR tecnico_id = $1`,
    [id]
  );

  const metadatos = {
    usuario: usuario.rows[0],
    resumen_actividad: actividad.rows,
    tickets: ticketsRelacionados.rows[0],
    generado_en: new Date().toISOString(),
  };

  res.json(metadatos);
};
