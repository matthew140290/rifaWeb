require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const cors = require("cors");
const { MongoClient } = require("mongodb");

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_CONNECTION_STRING = process.env.MONGO_CONNECTION_STRING;

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something went wrong!");
});

app.use(
  cors({
    origin: "*",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
  })
);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "public", "index.html")));

let db;

(async function () {
  try {
    const client = await MongoClient.connect(MONGO_CONNECTION_STRING, {});
    db = client.db();
    console.log("Conexión a MongoDB establecida correctamente");
  } catch (error) {
    console.error("Error al conectar a MongoDB:", error.message);
  }
})();

app.post("/guardarInformacion", async (req, res) => {
  try {
    const participante = req.body;
    const { historial, estado } = await obtenerHistorial();

    participante.botonSeleccionado = estado.botonSeleccionado;

    const nuevoHistorial = [...historial, participante];

    await guardarHistorialYEstado({ historial: nuevoHistorial, estado });
    res.send("Información guardada exitosamente.");
  } catch (error) {
    console.error("Error al guardar información:", error.message);
    res.status(500).json({ error: "Error al guardar información" });
  }
});

app.get("/obtenerHistorial", async (req, res) => {
  try {
    const historial = (await obtenerHistorial()).historial;
    res.json(historial);
  } catch (error) {
    console.error("Error al obtener historial:", error.message);
    res.status(500).json({ error: "Error al obtener historial" });
  }
});

app.post("/actualizarEstado", async (req, res) => {
  try {
    const { botonesSeleccionados } = req.body;
    await guardarEstadoEnServidor(botonesSeleccionados);
    res.json({ success: true });
  } catch (error) {
    console.error("Error al actualizar estado:", error.message);
    res.status(500).json({ error: "Error al actualizar estado" });
  }
});

app.get("/obtenerEstado", async (req, res) => {
  try {
    const estado = await obtenerEstadoDesdeServidor();
    res.json(estado);
  } catch (error) {
    console.error("Error al obtener estado:", error.message);
    res.status(500).json({ error: "Error al obtener estado" });
  }
});

async function obtenerHistorial() {
  const historialCollection = db.collection("historial");
  const estadoCollection = db.collection("estado");

  const historial = await historialCollection.find().toArray();
  const estado = (await estadoCollection.findOne()) || {};

  return { historial, estado };
}

async function guardarHistorialYEstado({ historial, estado }) {
  const historialCollection = db.collection("historial");
  const estadoCollection = db.collection("estado");

  await historialCollection.deleteMany({});
  await historialCollection.insertMany(historial);

  await estadoCollection.deleteMany({});
  await estadoCollection.insertOne(estado);

  console.log("Historial y estado guardados correctamente en MongoDB.");
}

async function obtenerEstadoDesdeServidor() {
  const estadoCollection = db.collection("estado");
  const estado = (await estadoCollection.findOne()) || {};

  return estado;
}

async function guardarEstadoEnServidor(botonesSeleccionados) {
  const estadoCollection = db.collection("estado");

  await estadoCollection.deleteMany({});
  await estadoCollection.insertOne({ botonesSeleccionados });

  console.log("Estado guardado en el servidor correctamente en MongoDB.");
}

app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
