import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { requireRole } from "../middlewares/role.middleware";
import { validarTicket } from "../middlewares/validation.middleware";
import {
  crearTicket,
  listarTickets,
  obtenerTicket,
  actualizarTicket,
  eliminarTicketConfirmado,
  buscarTickets,
  asignarTecnico,
  cambiarEstado,
  cargaLaboralTecnicos,
  listarLogs,
  metricasGenerales,
} from "../controllers/ticket.controller";
import { historialUsuario } from "../controllers/historial.controller";

const router = Router();
router.use(authMiddleware);

router.get("/buscar/filtrar", buscarTickets);
router.get("/reportes/carga-tecnicos", requireRole("administrador"), cargaLaboralTecnicos);
router.get("/reportes/metricas", requireRole("administrador"), metricasGenerales);
router.get("/logs/todos", requireRole("administrador"), listarLogs);
router.get("/usuarios/:id/historial", requireRole("administrador"), historialUsuario);

router.post("/", validarTicket, crearTicket);
router.get("/", listarTickets);
router.get("/:id", obtenerTicket);
router.put("/:id", validarTicket, actualizarTicket);
router.put("/:id/asignar", requireRole("administrador"), asignarTecnico);
router.put("/:id/estado", cambiarEstado);
router.delete("/:id/confirmar", requireRole("administrador"), eliminarTicketConfirmado);

export default router;
