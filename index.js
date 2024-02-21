const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const cors = require("cors");
const { MongoClient } = require("mongodb");

const app = express();
const PORT = process.env.PORT || 3000;

// Reemplaza <MONGO_CONNECTION_STRING> con la cadena de conexión de tu base de datos MongoDB
const MONGO_CONNECTION_STRING =
  "mongodb+srv://rifadb:U6f2ChTltRGlgHwe@cluster0.ha5slsf.mongodb.net/";

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

app.use(express.static(path.join(__dirname, "public")));

// Conectar a MongoDB
let db;

(async () => {
  try {
    const client = await MongoClient.connect(MONGO_CONNECTION_STRING, {});

    db = client.db();
    console.log("Conexión a MongoDB establecida correctamente");
  } catch (error) {
    console.error("Error al conectar a MongoDB:", error.message);
  }
})();

app.post("/guardarInformacion", async (req, res) => {
  const participante = req.body;
  const { historial, estado } = await obtenerHistorial();

  participante.botonSeleccionado = estado.botonSeleccionado;

  const nuevoHistorial = [...historial, participante];

  await guardarHistorialYEstado({ historial: nuevoHistorial, estado });
  res.send("Información guardada exitosamente.");
});

app.get("/obtenerHistorial", async (req, res) => {
  const historial = (await obtenerHistorial()).historial;
  res.json(historial);
});

app.post("/actualizarEstado", async (req, res) => {
  const { botonesSeleccionados } = req.body;
  await guardarEstadoEnServidor(botonesSeleccionados);
  res.json({ success: true });
});

app.get("/obtenerEstado", async (req, res) => {
  const estado = await obtenerEstadoDesdeServidor();
  res.json(estado);
});

async function obtenerHistorial() {
  try {
    const historialCollection = db.collection("historial");
    const estadoCollection = db.collection("estado");

    const historial = await historialCollection.find().toArray();
    const estado = (await estadoCollection.findOne()) || {};

    return { historial, estado };
  } catch (error) {
    console.error(
      "Error al leer el historial o estado desde MongoDB:",
      error.message
    );
    return { historial: [], estado: {} };
  }
}

async function guardarHistorialYEstado({ historial, estado }) {
  try {
    const historialCollection = db.collection("historial");
    const estadoCollection = db.collection("estado");

    await historialCollection.deleteMany({});
    await historialCollection.insertMany(historial);

    await estadoCollection.deleteMany({});
    await estadoCollection.insertOne(estado);

    console.log("Historial y estado guardados correctamente en MongoDB.");
  } catch (error) {
    console.error(
      "Error al guardar el historial o estado en MongoDB:",
      error.message
    );
  }
}

async function obtenerEstadoDesdeServidor() {
  try {
    const estadoCollection = db.collection("estado");
    const estado = (await estadoCollection.findOne()) || {};

    return estado;
  } catch (error) {
    console.error(
      "Error al leer el estado desde el servidor en MongoDB:",
      error.message
    );
    return {};
  }
}

async function guardarEstadoEnServidor(botonesSeleccionados) {
  try {
    const estadoCollection = db.collection("estado");

    await estadoCollection.deleteMany({});
    await estadoCollection.insertOne({ botonesSeleccionados });

    console.log("Estado guardado en el servidor correctamente en MongoDB.");
  } catch (error) {
    console.error(
      "Error al guardar el estado en el servidor en MongoDB:",
      error.message
    );
  }
}

app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
