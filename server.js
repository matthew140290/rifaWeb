const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const fs = require("fs");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000; // Utilizar el puerto proporcionado por el entorno o 3000 como predeterminado
app.use(cors());
// Middleware para procesar datos JSON y formularios
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Middleware para servir archivos estáticos desde la carpeta 'public'
app.use(express.static(path.join(__dirname, "public")));

// Definir rutas de archivos de historial y estado
const obtenerRutaHistorial = () => path.join(__dirname, "historial.json");
const obtenerRutaEstado = () => path.join(__dirname, "estado.json");

// Manejadores de rutas

app.post("/guardarInformacion", (req, res) => {
  const participante = req.body;
  const { historial, estado } = obtenerHistorial();
  participante.botonSeleccionado = estado.botonSeleccionado;
  const nuevoHistorial = [...historial, participante];
  guardarHistorialYEstado({ historial: nuevoHistorial, estado });
  res.send("Información guardada exitosamente.");
});

app.get("/obtenerHistorial", (req, res) => {
  const historial = obtenerHistorial().historial;
  res.json(historial);
});

app.post("/actualizarEstado", (req, res) => {
  const { botonesSeleccionados } = req.body;
  guardarEstadoEnServidor(botonesSeleccionados);
  res.json({ success: true });
});

app.get("/obtenerEstado", (req, res) => {
  const estado = obtenerEstadoDesdeServidor();
  res.json(estado);
});

// Funciones auxiliares

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

function guardarEstadoEnServidor(botonesSeleccionados) {
  try {
    const rutaEstado = obtenerRutaEstado();
    fs.writeFileSync(rutaEstado, JSON.stringify({ botonesSeleccionados }));
    console.log("Estado guardado en el servidor correctamente.");
  } catch (error) {
    console.error("Error al guardar el estado en el servidor:", error.message);
  }
}

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

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);

  const rutaEstado = obtenerRutaEstado();
  if (!fs.existsSync(rutaEstado)) {
    fs.writeFileSync(rutaEstado, JSON.stringify({ botonesSeleccionados: [] }));
    console.log("Estado inicializado correctamente.");
  }
});
