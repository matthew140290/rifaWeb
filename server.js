const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const app = express();
const PORT = 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static("public"));

// Definir la ruta del archivo historial.json de manera absoluta
const obtenerRutaHistorial = () => path.join(__dirname, "historial.json");
const obtenerRutaEstado = () => path.join(__dirname, "estado.json");

// console.log("Ruta del historial:", obtenerRutaHistorial());

app.post("/guardarInformacion", (req, res) => {
  const participante = req.body;
  const { historial, estado } = obtenerHistorial();
  participante.botonSeleccionado = estado.botonSeleccionado;
  const nuevoHistorial = [...historial, participante]; // Utilizamos spread operator para crear un nuevo array
  guardarHistorialYEstado({ historial: nuevoHistorial, estado });
  res.send("Información guardada exitosamente.");
});

app.get("/obtenerHistorial", (req, res) => {
  const historial = obtenerHistorial().historial;
  res.json(historial);
});

function obtenerHistorial() {
  try {
    const rutaHistorial = obtenerRutaHistorial();
    const dataHistorial = fs.existsSync(rutaHistorial)
      ? fs.readFileSync(rutaHistorial, "utf8")
      : "[]";

    const rutaEstado = obtenerRutaEstado();
    const dataEstado = fs.existsSync(rutaEstado)
      ? fs.readFileSync(rutaEstado, "utf8")
      : "{}";

    const historial = JSON.parse(dataHistorial) || [];
    const estado = JSON.parse(dataEstado) || {};

    return { historial, estado };
  } catch (error) {
    console.error("Error al leer el historial o estado:", error.message);
    return { historial: [], estado: {} };
  }
}

function guardarHistorialYEstado({ historial, estado }) {
  try {
    const rutaHistorial = obtenerRutaHistorial();
    const rutaEstado = obtenerRutaEstado();

    fs.writeFileSync(rutaHistorial, JSON.stringify(historial));
    fs.writeFileSync(rutaEstado, JSON.stringify(estado));

    console.log("Historial y estado guardados correctamente.");
  } catch (error) {
    console.error("Error al guardar el historial o estado:", error.message);
  }
}

app.post("/actualizarEstado", (req, res) => {
  const { botonesSeleccionados } = req.body;
  guardarEstadoEnServidor(botonesSeleccionados);
  res.json({ success: true });
});

function guardarEstadoEnServidor(botonesSeleccionados) {
  try {
    const rutaEstado = obtenerRutaEstado();
    fs.writeFileSync(rutaEstado, JSON.stringify({ botonesSeleccionados }));
    console.log("Estado guardado en el servidor correctamente.");
  } catch (error) {
    console.error("Error al guardar el estado en el servidor:", error.message);
  }
}

app.get("/obtenerEstado", (req, res) => {
  const estado = obtenerEstadoDesdeServidor();
  res.json(estado);
});

function obtenerEstadoDesdeServidor() {
  try {
    const ruta = obtenerRutaEstado();
    const data = fs.readFileSync(ruta, "utf8");
    return JSON.parse(data) || {};
  } catch (error) {
    console.error("Error al leer el estado desde el servidor:", error.message);
    return {};
  }
}

app.listen(PORT, () => {
  // console.log(`Servidor escuchando en el puerto ${PORT}`);

  // Inicializa el estado si no existe
  const rutaEstado = obtenerRutaEstado();
  if (!fs.existsSync(rutaEstado)) {
    fs.writeFileSync(rutaEstado, JSON.stringify({ botonesSeleccionados: [] }));
    console.log("Estado inicializado correctamente.");
  }
});
