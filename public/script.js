document.addEventListener("DOMContentLoaded", async function () {
  try {
    await obtenerEstadoDesdeServidor();
    await obtenerHistorialDesdeServidor();

    crearBotones();

    document
      .getElementById("formularioRifa")
      .addEventListener("submit", function (event) {
        event.preventDefault();
        mostrarInformacion();
      });
  } catch (error) {
    console.error("Error durante la inicialización:", error);
  }
});

async function obtenerEstadoDesdeServidor() {
  try {
    const response = await fetch("/obtenerEstado");
    const data = await response.json();
    const botonesSeleccionados = data.botonesSeleccionados || [];

    localStorage.setItem(
      "botonesSeleccionados",
      JSON.stringify(botonesSeleccionados)
    );

    deshabilitarBotones();
    ocultarBotonSeleccionado();
  } catch (error) {
    console.error("Error al obtener el estado desde el servidor:", error);
    throw error;
  }
}

async function obtenerHistorialDesdeServidor() {
  try {
    const response = await fetch("/obtenerHistorial");
    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error("El historial recibido no es un array");
    }

    participantes = data;
    mostrarHistorial(participantes, document.getElementById("historial"));
  } catch (error) {
    console.error("Error al obtener el historial:", error);
    throw error;
  }
}

function deshabilitarBotones() {
  const botonesSeleccionados =
    JSON.parse(localStorage.getItem("botonesSeleccionados")) || [];

  const botones = document.querySelectorAll("button");
  botones.forEach((boton) => {
    boton.disabled = true;

    if (!botonesSeleccionados.includes(boton.id)) {
      boton.disabled = false;
    }
  });
}

function ocultarBotonSeleccionado() {
  const botonesSeleccionados =
    JSON.parse(localStorage.getItem("botonesSeleccionados")) || [];

  botonesSeleccionados.forEach((valor) => {
    const botonSeleccionadoElement = document.getElementById(valor);
    if (botonSeleccionadoElement) {
      botonSeleccionadoElement.style.display = "none";
    }
  });
}

function crearBotones() {
  const botonesContainer = document.getElementById("botones-container");
  console.log("Creando botones...");

  for (let i = 0; i < 100; i++) {
    const button = document.createElement("button");
    const numero = String(i).padStart(2, "0");
    button.id = numero;
    button.textContent = numero;
    button.onclick = function () {
      deshabilitarBotones();
      this.style.display = "none";
      capturarValores(numero);
    };
    botonesContainer.appendChild(button);
  }

  ocultarBotonSeleccionado();
}

async function capturarValores(numero) {
  let botonesSeleccionados =
    JSON.parse(localStorage.getItem("botonesSeleccionados")) || [];

  if (!botonesSeleccionados.includes(numero)) {
    await actualizarEstadoServidor(botonesSeleccionados.concat(numero));
    botonSeleccionado = numero;
    localStorage.setItem("botonSeleccionado", botonSeleccionado);
  }

  localStorage.setItem(
    "botonesSeleccionados",
    JSON.stringify(botonesSeleccionados)
  );
}

async function actualizarEstadoServidor(botonesSeleccionados) {
  try {
    const response = await fetch("/actualizarEstado", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ botonesSeleccionados }),
    });
    const data = await response.json();
    console.log("Estado actualizado en el servidor:", data);
  } catch (error) {
    console.error("Error al actualizar el estado en el servidor:", error);
    throw error;
  }
}

function mostrarInformacion() {
  console.log("La función mostrarInformacion() se está ejecutando.");

  const nombreInput = document.getElementById("nombre");
  const numerosInput = document.getElementById("numeros");

  const nombre = nombreInput.value.trim();
  const numeros = numerosInput.value.trim().padStart(2, "0");

  if (nombre === "" || numeros === "") {
    mostrarError("Por favor, complete todos los campos.");
    return;
  }

  if (botonSeleccionado === "") {
    mostrarError("Por favor, seleccione un y solo un botón.");
    return;
  }

  const participante = {
    nombre,
    numero: `${botonSeleccionado}${numeros}`,
  };

  participantes.push(participante);
  localStorage.setItem("participantes", JSON.stringify(participantes));

  mostrarInformacionEnPantalla(participante);

  fetch("/guardarInformacion", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(participante),
  })
    .then((response) => response.text())
    .then((message) => {
      console.log(message);
      mostrarInformacionEnPantalla(participante);
      nombreInput.value = "";
      numerosInput.value = "";
      mostrarError(""); // Limpiar mensaje de error
    })
    .catch((error) => console.error("Error al enviar la información:", error));
}

function mostrarInformacionEnPantalla(participante) {
  const resultadoDiv = document.getElementById("resultado");
  const errorMessageDiv = document.getElementById("error-message");
  const historialDiv = document.getElementById("historial");

  resultadoDiv.textContent = `Información Guardada: ${participante.nombre}: ${participante.numero}`;
  mostrarHistorial(participantes, historialDiv);
  errorMessageDiv.textContent = "";
}

function mostrarError(mensaje) {
  const errorMessageDiv = document.getElementById("error-message");
  errorMessageDiv.textContent = mensaje;
}

function mostrarHistorial(participantes, historialDiv) {
  historialDiv.innerHTML = "<h2>Historial de Participantes</h2>";
  if (participantes.length === 0) {
    historialDiv.innerHTML += "<p>No hay participantes aún.</p>";
  } else {
    participantes.forEach(function (participante) {
      historialDiv.innerHTML += `<p>${participante.nombre}: ${participante.numero}</p>`;
    });
  }
}
