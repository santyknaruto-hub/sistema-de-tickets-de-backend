import { Request, Response, NextFunction } from "express";
import { body, validationResult } from "express-validator";

export const validarTicket = [
  body("titulo").trim().isLength({ min: 3, max: 150 }),
  body("descripcion").trim().isLength({ min: 5 }),
  body("prioridad_id").isInt({ min: 1, max: 4 }),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errores: errors.array() });
    next();
  },
];
