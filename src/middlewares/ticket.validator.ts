import { body, validationResult } from "express-validator";
import { Request, Response, NextFunction } from "express";

export const validarTicket = [
  body("titulo")
    .trim()
    .isLength({ min: 3, max: 150 })
    .withMessage("El título debe tener entre 3 y 150 caracteres"),

  body("descripcion")
    .trim()
    .isLength({ min: 5 })
    .withMessage("La descripción debe tener al menos 5 caracteres"),

  body("prioridad_id")
    .isInt({ min: 1, max: 4 })
    .withMessage("La prioridad no es válida"),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errores: errors.array() });
    }

    next();
  },
];
