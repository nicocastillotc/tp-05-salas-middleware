const express = require("express");
const expressLayouts = require("express-ejs-layouts");
const morgan = require("morgan");
const path = require("node:path");

const PORT = 3000;
const salasPermitidas = ["Sala Norte", "Sala Sur", "Sala Multimedia"];
const turnosPermitidos = ["Mañana", "Tarde", "Noche"];

let numeroDeSolicitud = 0;

const reservas = [
  {
    id: 1,
    estudiante: "Lucio Lopez",
    email: "luciolpz@practico.com",
    sala: "Sala Norte",
    fecha: "13-09-2026",
    turno: "Mañana",
    personas: 3
  },
  {
    id: 2,
    estudiante: "Juana Martinez",
    email: "juanimz@practico.com",
    sala: "Sala Sur",
    fecha: "06-10-2026",
    turno: "Noche",
    personas: 4
  },
  {
    id: 3,
    estudiante: "Luis Paz",
    email: "pazluisp@practico.com",
    sala: "Sala Multimedia",
    fecha: "10-10-2026",
    turno: "Mañana",
    personas: 5
  },
  {
    id: 4,
    estudiante: "Ana Martínez",
    email: "anamar@practico.com",
    sala: "Sala Norte",
    fecha: "15-10-2026",
    turno: "Tarde",
    personas: 2
  }
];

function identificarSolicitud(req, res, next) {
  numeroDeSolicitud += 1;
  res.locals.solicitudId = `BIB-${String(numeroDeSolicitud).padStart(4, "0")}`;
  next();
}

function medirDuracion(req, res, next) {
  const inicio = process.hrtime.bigint();
  res.on("finish", () => {
    const fin = process.hrtime.bigint();
    const milisegundos = Number(fin - inicio) / 1_000_000;
    console.log(
      `[${res.locals.solicitudId}] ${req.method} ${req.originalUrl} ${res.statusCode} ${milisegundos.toFixed(2)} ms`
    );
  });
  next();
}

function prepararAreaReservas(req, res, next) {
  res.locals.seccion = "Reservas de salas";
  next();
}

function validarReserva(req, res, next) {
  const estudiante = String(req.body.estudiante ?? "").trim();
  const email = String(req.body.email ?? "").trim();
  const sala = String(req.body.sala ?? "").trim();
  const fecha = String(req.body.fecha ?? "").trim();
  const turno = String(req.body.turno ?? "").trim();
  const personas = Number(req.body.personas);

  if (
    !estudiante ||
    !email ||
    !sala ||
    !fecha ||
    !turno ||
    !email.includes("@") ||
    !salasPermitidas.includes(sala) ||
    !turnosPermitidos.includes(turno) ||
    !Number.isInteger(personas) ||
    personas < 1 ||
    personas > 6
  ) {
    return res.status(400).render("reservas/nueva", {
      titulo: "Nueva Reserva",
      error: "Completá todos los campos con valores válidos.",
      valores: req.body,
      salasPermitidas
    });
  }

  req.reservaValidada = {
    estudiante,
    email,
    sala,
    fecha,
    turno,
    personas
  };
  next();
}

function crearReserva(req, res) {
  const ultimoId = reservas.reduce((maxId, item) => Math.max(maxId, item.id), 0);
  const nuevaReserva = {
    id: ultimoId + 1,
    ...req.reservaValidada
  };
  reservas.push(nuevaReserva);
  res.redirect("/reservas");
}

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "..", "views"));
app.set("layout", "layouts/main");

app.use(morgan("dev"));
app.use(identificarSolicitud);
app.use(medirDuracion);
app.use(expressLayouts);
app.use(express.static(path.join(__dirname, "..", "public")));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.get("/", (req, res) => {
  res.render("inicio", { titulo: "Inicio" });
});

app.get("/estado", (req, res) => {
  res.json({
    servicio: "activo",
    reservas: reservas.length,
    solicitudId: res.locals.solicitudId
  });
});

const reservasRouter = express.Router();
reservasRouter.use(prepararAreaReservas);

reservasRouter.get("/", (req, res) => {
  res.render("reservas/lista", {
    titulo: "Listado de Reservas",
    reservas
  });
});

reservasRouter.get("/nueva", (req, res) => {
  res.render("reservas/nueva", {
    titulo: "Nueva Reserva",
    error: null,
    valores: {},
    salasPermitidas
  });
});

reservasRouter.get("/:id", (req, res) => {
  const id = Number(req.params.id);
  const reserva = reservas.find((item) => item.id === id);

  if (!reserva) {
    return res.status(404).render("no-encontrado", {
      titulo: "Reserva no encontrada",
      mensaje: "No existe una reserva registrada con ese identificador."
    });
  }

  res.render("reservas/detalle", {
    titulo: `Reserva #${reserva.id}`,
    reserva
  });
});

reservasRouter.post("/", validarReserva, crearReserva);

app.use("/reservas", reservasRouter);

app.use((req, res) => {
  res.status(404).render("no-encontrado", {
    titulo: "Página no encontrada",
    mensaje: "La dirección solicitada no existe."
  });
});

app.listen(PORT, () => {
  console.log(`Aplicación disponible en http://localhost:${PORT}`);
});