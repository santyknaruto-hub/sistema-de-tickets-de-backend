import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import {
  crearTicket,
  listarTickets,
  obtenerTicket,
  actualizarTicket,
  eliminarTicket,
} from "../controllers/ticket.controller";

const router = Router();
router.use(authMiddleware);

router.post("/", crearTicket);
router.get("/", listarTickets);
router.get("/:id", obtenerTicket);
router.put("/:id", actualizarTicket);
router.delete("/:id", eliminarTicket);

export default router;
