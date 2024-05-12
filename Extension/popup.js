const api_url = "http://127.0.0.1:5000/";
const ruta_text_prediction = "text_prediction";
const ruta_url_prediction = "url_predition";

const botonObtenerPrediccion = document.getElementById(
  "boton-obtener-prediccion"
);
const botonObtenerPaginaActual = document.getElementById(
  "boton-obtener-pagina-actual"
);

/* -------------------------------------------------------------------------- */
/*                            Funciones auxiliares                            */
/* -------------------------------------------------------------------------- */

function obtenerCodigoSpinner() {
  return `
    <div class="spinner-border text-light" role="status">
      <span class="visually-hidden">Cargando...</span>
    </div>
  `;
}

function setearleSpinner(div) {
  div.className = "";
  div.innerHTML = obtenerCodigoSpinner();
}

function setearResultadoPrediccion(div, prediction) {
  div.textContent = prediction ? "Suicida" : "No suicida";
  div.className = prediction ? "text-danger" : "text-success";
}

function setearMensajeErrorAPI(div, error) {
  div.textContent = error;
  div.className = "text-primary";
}

function setearMensajeErrorFetch(div, error) {
  div.textContent = error;
  div.className = "text-warning";
}

function setearMensajeInfo(div, mensaje) {
  div.textContent = mensaje;
  div.className = "text-info";
}

function setearResultado(div, data) {
  if (typeof data.prediction !== "undefined") {
    setearResultadoPrediccion(div, data.prediction);
  } else {
    setearMensajeErrorAPI(div, data.error);
  }
}

/* -------------------------------------------------------------------------- */
/*                          Obtener predict por input                         */
/* -------------------------------------------------------------------------- */

botonObtenerPrediccion.addEventListener("click", () => {
  const divResultadoPrediccion = document.querySelector(
    "#resultado-prediccion"
  );

  const inputText = encodeURIComponent(
    document.getElementById("texto-input").value
  );

  if (inputText === "") {
    setearMensajeInfo(divResultadoPrediccion, "El campo de texto esta vacio");
    return;
  } else {
    setearleSpinner(divResultadoPrediccion);

    fetch(api_url + ruta_text_prediction + "?text=" + inputText, {
      headers: {
        "ngrok-skip-browser-warning": "true",
      },
    })
      .then((response) => {
        if (response.ok) {
          return response.json();
        }
        throw new Error("Error al enviar el texto a la API");
      })
      .then((data) => {
        setearResultado(divResultadoPrediccion, data);
      })
      .catch((error) => {
        setearMensajeErrorFetch(divResultadoPrediccion, error.message);
      });
  }
});

/* -------------------------------------------------------------------------- */
/*                           Obtener predict por url                          */
/* -------------------------------------------------------------------------- */

botonObtenerPaginaActual.addEventListener("click", () => {
  const divResultadoPaginaActual = document.querySelector(
    "#resultado-pagina-actual"
  );

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const url = tabs[0].url;
    if (!/https:\/\/www\.reddit\.com\/r\/SuicideWatch\/comments\//.test(url)) {
      setearMensajeInfo(
        divResultadoPaginaActual,
        "La pagina actual no es de un post de Reddit en r/SuicideWatch"
      );
    } else {
      setearleSpinner(divResultadoPaginaActual);

      fetch(api_url + ruta_url_prediction, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: url }),
      })
        .then((response) => {
          if (response.ok) {
            return response.json();
          }
          throw new Error("Error al enviar la URL a la API");
        })
        .then((data) => {
          setearResultado(divResultadoPaginaActual, data);
        })
        .catch((error) => {
          setearMensajeErrorFetch(divResultadoPaginaActual, error.message);
        });
    }
  });
});
