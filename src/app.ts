import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes";
import ticketRoutes from "./routes/ticket.routes";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/tickets", ticketRoutes);

export default app;
