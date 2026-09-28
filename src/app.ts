import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/auth.routes";
import ticketRoutes from "./routes/ticket.routes";

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Demasiados intentos de inicio de sesión. Intente más tarde." },
});
app.use("/api/auth/login", loginLimiter);

app.use("/api/auth", authRoutes);
app.use("/api/tickets", ticketRoutes);

export default app;
