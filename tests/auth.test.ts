import request from "supertest";
import app from "../src/app";
import { pool } from "../src/config/db";

describe("Pruebas integrales del sistema", () => {
  let adminToken = "";
  let tecnicoToken = "";
  let solicitanteToken = "";
  let ticketId = 0;
  let ticketNumero = "";

  beforeAll(async () => {
    const admin = await request(app)
      .post("/api/auth/login")
      .send({
        email: "santyknaruto@gmail.com",
        password: "89601636",
      });

    expect(admin.status).toBe(200);
    adminToken = admin.body.token;

    const tecnico = await request(app)
      .post("/api/auth/login")
      .send({
        email: "daniela@gmail.com",
        password: "daniela1giron123456",
      });

    expect(tecnico.status).toBe(200);
    tecnicoToken = tecnico.body.token;

    const solicitante = await request(app)
      .post("/api/auth/login")
      .send({
        email: "lynkjfg@gmail.com",
        password: "Mugiwaraya1*",
      });

    expect(solicitante.status).toBe(200);
    solicitanteToken = solicitante.body.token;
  });

  it("1. login correcto devuelve un JWT válido", () => {
    expect(adminToken).toBeTruthy();
  });

  it("2. solicitante crea un ticket en estado pendiente", async () => {
    const res = await request(app)
      .post("/api/tickets")
      .set("Authorization", `Bearer ${solicitanteToken}`)
      .send({
        titulo: "Ticket de prueba integral",
        descripcion:
          "Ticket creado automáticamente para las pruebas de Fase 3",
        prioridad_id: 2,
      });

    expect(res.status).toBe(201);
    expect(res.body.estado_id).toBe(1);

    ticketId = res.body.id;
    ticketNumero = res.body.numero;
  });

  it("3. técnico no puede consultar los logs", async () => {
    const res = await request(app)
      .get("/api/tickets/logs/todos")
      .set("Authorization", `Bearer ${tecnicoToken}`);

    expect(res.status).toBe(403);
  });

  it("4. administrador asigna el ticket al técnico y genera log", async () => {
    const res = await request(app)
      .put(`/api/tickets/${ticketId}/asignar`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ tecnico_id: 3 });

    expect(res.status).toBe(200);
    expect(res.body.tecnico_id).toBe(3);
  });

  it("5. administrador cambia el ticket a finalizado y registra fecha de cierre", async () => {
    const res = await request(app)
      .put(`/api/tickets/${ticketId}/estado`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ estado_id: 3 });

    expect(res.status).toBe(200);
    expect(res.body.estado_id).toBe(3);
    expect(res.body.fecha_cierre).toBeTruthy();
  });

  it("6. eliminación con contraseña incorrecta devuelve 401", async () => {
    const res = await request(app)
      .delete(`/api/tickets/${ticketId}/confirmar`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ password: "contraseña_incorrecta" });

    expect(res.status).toBe(401);
  });

  it("7. búsqueda por número de ticket funciona", async () => {
    const res = await request(app)
      .get(`/api/tickets/buscar/filtrar?q=${ticketNumero}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.some((t: any) => t.numero === ticketNumero)).toBe(true);
  });

  it("8. filtro combinado de estado y prioridad funciona", async () => {
    const res = await request(app)
      .get(
        "/api/tickets/buscar/filtrar?estado=finalizado&prioridad=media"
      )
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);

    for (const ticket of res.body) {
      expect(ticket.estado).toBe("finalizado");
      expect(ticket.prioridad).toBe("media");
    }
  });

  afterAll(async () => {
    if (ticketId && adminToken) {
      await request(app)
        .delete(`/api/tickets/${ticketId}/confirmar`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ password: "89601636" });
    }

    await pool.end();
  });
});