import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { pool } from "../config/db";
import { hashPassword, comparePassword } from "../utils/hash";

export const register = async (req: Request, res: Response) => {
  const { nombre, email, password, rol_id } = req.body;
  try {
    const hash = await hashPassword(password);
    const result = await pool.query(
      `INSERT INTO usuarios (nombre, email, password_hash, rol_id)
       VALUES ($1, $2, $3, $4) RETURNING id, nombre, email, rol_id`,
      [nombre, email, hash, rol_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(400).json({ error: "No se pudo registrar el usuario" });
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const result = await pool.query(
    `SELECT u.id, u.nombre, u.email, u.password_hash, r.nombre AS rol
     FROM usuarios u JOIN roles r ON u.rol_id = r.id
     WHERE u.email = $1`,
    [email]
  );

  const usuario = result.rows[0];
  if (!usuario) return res.status(401).json({ error: "Credenciales inválidas" });

  const valido = await comparePassword(password, usuario.password_hash);
  if (!valido) return res.status(401).json({ error: "Credenciales inválidas" });

  const token = jwt.sign(
    { id: usuario.id, rol: usuario.rol, nombre: usuario.nombre },
    process.env.JWT_SECRET as string,
    { expiresIn: "8h" }
  );

  res.json({ token, usuario: { id: usuario.id, nombre: usuario.nombre, rol: usuario.rol } });
};
