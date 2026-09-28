CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(20) UNIQUE NOT NULL
);

CREATE TABLE usuarios (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  rol_id INTEGER NOT NULL REFERENCES roles(id),
  creado_en TIMESTAMP DEFAULT NOW()
);

CREATE TABLE estados (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(20) UNIQUE NOT NULL
);

CREATE TABLE prioridades (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(20) UNIQUE NOT NULL
);

CREATE TABLE tickets (
  id SERIAL PRIMARY KEY,
  numero VARCHAR(20) UNIQUE NOT NULL,
  titulo VARCHAR(150) NOT NULL,
  descripcion TEXT NOT NULL,
  solicitante_id INTEGER NOT NULL REFERENCES usuarios(id),
  tecnico_id INTEGER REFERENCES usuarios(id),
  prioridad_id INTEGER NOT NULL REFERENCES prioridades(id),
  estado_id INTEGER NOT NULL REFERENCES estados(id) DEFAULT 1,
  fecha_creacion TIMESTAMP DEFAULT NOW(),
  fecha_cierre TIMESTAMP
);

CREATE TABLE logs (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
  ticket_id INTEGER REFERENCES tickets(id),
  accion VARCHAR(50) NOT NULL,
  fecha_hora TIMESTAMP DEFAULT NOW()
);

INSERT INTO roles (nombre) VALUES ('administrador'), ('tecnico'), ('solicitante');
INSERT INTO estados (nombre) VALUES ('pendiente'), ('en_proceso'), ('finalizado');
INSERT INTO prioridades (nombre) VALUES ('baja'), ('media'), ('alta'), ('urgente');
