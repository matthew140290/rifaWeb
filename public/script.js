let botonSeleccionado = "";
let participantes = [];

document.addEventListener("DOMContentLoaded", function () {
  // Obtener el estado actual desde el servidor
  fetch("/obtenerEstado")
    .then((response) => response.json())
    .then((data) => {
      const botonesSeleccionados = data.botonesSeleccionados || [];

      // Actualizar el localStorage y la interfaz con el estado del servidor
      localStorage.setItem(
        "botonesSeleccionados",
        JSON.stringify(botonesSeleccionados)
      );

      // Deshabilitar los botones según el estado del servidor
      deshabilitarBotones();

      // Ocultar los botones seleccionados al cargar la página
      ocultarBotonSeleccionado();
    })
    .catch((error) =>
      console.error("Error al obtener el estado desde el servidor:", error)
    );

  // Hacer una solicitud al servidor para obtener el historial al cargar la página
  fetch("/obtenerHistorial")
    .then((response) => response.json())
    .then((data) => {
      // Verificar si data es un array
      if (Array.isArray(data)) {
        participantes = data;
      } else {
        console.error("El historial recibido no es un array:", data);
      }

      // Mostrar el historial en la pantalla
      const historialDiv = document.getElementById("historial");
      mostrarHistorial(participantes, historialDiv);

      // Crear botones después de obtener el historial
      crearBotones();
    })
    .catch((error) => console.error("Error al obtener el historial:", error));
});

function deshabilitarBotones() {
  // Obtener el arreglo de botones seleccionados del localStorage
  const botonesSeleccionados =
    JSON.parse(localStorage.getItem("botonesSeleccionados")) || [];

  const botones = document.querySelectorAll("button");
  botones.forEach(function (boton) {
    // Deshabilitar todos los botones
    boton.disabled = true;

    // Habilitar solo los botones que no están en el arreglo de botones seleccionados
    if (!botonesSeleccionados.includes(boton.id)) {
      boton.disabled = false;
    }
  });
}

function ocultarBotonSeleccionado() {
  // Obtener el arreglo de botones seleccionados del localStorage
  const botonesSeleccionados =
    JSON.parse(localStorage.getItem("botonesSeleccionados")) || [];

  // Ocultar cada botón seleccionado
  botonesSeleccionados.forEach((valor) => {
    const botonSeleccionadoElement = document.getElementById(valor);
    if (botonSeleccionadoElement) {
      botonSeleccionadoElement.style.display = "none";
    }
  });
}

function crearBotones() {
  const botonesContainer = document.getElementById("botones-container");
  for (let i = 0; i < 100; i++) {
    const button = document.createElement("button");
    const numero = String(i).padStart(2, "0");
    button.id = numero;
    button.textContent = numero;
    button.onclick = function () {
      // Deshabilitar botones al hacer clic
      deshabilitarBotones();
      // Ocultar el botón al hacer clic
      this.style.display = "none";
      // Llamar a la función para capturar el valor del botón seleccionado
      capturarValores(numero);
    };
    botonesContainer.appendChild(button);
  }

  // Ocultar el botón seleccionado al cargar la página
  ocultarBotonSeleccionado();
}

document
  .getElementById("formularioRifa")
  .addEventListener("submit", function (event) {
    event.preventDefault(); // Evitar que el formulario se envíe automáticamente
    mostrarInformacion();
  });

function habilitarBotones() {
  const botones = document.querySelectorAll("button");
  botones.forEach(function (boton) {
    boton.disabled = false;
  });
}

function capturarValores(numero) {
  // Obtener el arreglo actual de botones seleccionados del localStorage
  let botonesSeleccionados =
    JSON.parse(localStorage.getItem("botonesSeleccionados")) || [];

  // Verificar si el valor ya está en el arreglo antes de agregarlo
  if (!botonesSeleccionados.includes(numero)) {
    // Actualizar el arreglo en el servidor
    actualizarEstadoServidor(botonesSeleccionados.concat(numero));

    // Actualizar el valor de botonSeleccionado
    botonSeleccionado = numero;

    // Actualizar el botón seleccionado en el estado del localStorage
    localStorage.setItem("botonSeleccionado", botonSeleccionado);
  }

  // Actualizar el arreglo en el localStorage
  localStorage.setItem(
    "botonesSeleccionados",
    JSON.stringify(botonesSeleccionados)
  );
}

function actualizarEstadoServidor(botonesSeleccionados) {
  // Realiza una solicitud al servidor para actualizar el estado
  fetch("/actualizarEstado", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ botonesSeleccionados }),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log("Estado actualizado en el servidor:", data);
    })
    .catch((error) =>
      console.error("Error al actualizar el estado en el servidor:", error)
    );
}

function mostrarInformacion() {
  console.log("La función mostrarInformacion() se está ejecutando.");

  const nombreInput = document.getElementById("nombre");
  const numerosInput = document.getElementById("numeros");

  const nombre = nombreInput.value.trim();
  const numeros = numerosInput.value.trim().padStart(2, "0");

  // Verificar si los campos no están vacíos
  if (nombre === "" || numeros === "") {
    const errorMessageDiv = document.getElementById("error-message");
    errorMessageDiv.textContent = "Por favor, complete todos los campos.";
    return;
  }

  // Verificar si se ha seleccionado un y solo un botón
  if (botonSeleccionado === "") {
    const errorMessageDiv = document.getElementById("error-message");
    errorMessageDiv.textContent = "Por favor, seleccione un y solo un botón.";
    return;
  }

  const participante = {
    nombre,
    numero: `${botonSeleccionado}${numeros}`,
  };

  // Añadir participante al array y guardarlo en localStorage
  participantes.push(participante);
  localStorage.setItem("participantes", JSON.stringify(participantes));

  // Actualizar la interfaz con la información guardada
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
      // Actualizar la interfaz con la información guardada
      mostrarInformacionEnPantalla(participante);

      // Limpiar campos de entrada
      nombreInput.value = "";
      numerosInput.value = "";

      // Limpiar mensaje de error
      const errorMessageDiv = document.getElementById("error-message");
      errorMessageDiv.textContent = "";

      // Habilitar botones después de enviar la información
      habilitarBotones();
    })
    .catch((error) => console.error("Error al enviar la información:", error));
}

function mostrarInformacionEnPantalla(participante) {
  const resultadoDiv = document.getElementById("resultado");
  const errorMessageDiv = document.getElementById("error-message");
  const historialDiv = document.getElementById("historial");

  // Mostrar la información en el resultadoDiv
  resultadoDiv.textContent = `Información Guardada: ${participante.nombre}: ${participante.numero}`;

  // Mostrar el historial de participantes
  // participantes.push(participante);
  mostrarHistorial(participantes, historialDiv);

  // Limpiar mensaje de error
  errorMessageDiv.textContent = "";
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
