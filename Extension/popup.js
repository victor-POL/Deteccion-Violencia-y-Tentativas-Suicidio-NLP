const api_url = "http://127.0.0.1:5000/";
const ruta_text_prediction = "text_prediction";
const ruta_url_prediction = "url_prediction";

const botonObtenerPrediccion = document.getElementById(
  "boton-obtener-prediccion"
);
const botonObtenerPaginaActual = document.getElementById(
  "boton-obtener-pagina-actual"
);

const botonObtenerTextoPagina = document.getElementById(
  "boton-obtener-texto-pagina"
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
  div.className = "text-info";
}

function setearMensajeErrorFetch(div, error) {
  div.textContent = error;
  div.className = "text-warning";
}

function setearMensajeInfo(div, mensaje) {
  div.textContent = mensaje;
  div.className = "text-primary";
}

function setearResultado(div, data) {
  if (typeof data.prediction !== "undefined") {
    setearResultadoPrediccion(div, data.prediction);
  } else {
    setearMensajeErrorAPI(div, data.error);
  }
}

async function obtenerTextoPostReddit() {
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });

  [{ result }] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () =>
      document.querySelector('[id*="-post-rtjson-conten"]').textContent,
  });

  return result;
}

/* -------------------------------------------------------------------------- */
/*                          Obtener predict por input                         */
/* -------------------------------------------------------------------------- */

botonObtenerPrediccion.addEventListener("click", () => {
  const divResultadoPrediccion = document.querySelector(
    "#resultado-prediccion"
  );

  let inputText = document.getElementById("texto-input").value;

  if (
    inputText === "" ||
    inputText === null ||
    inputText === undefined ||
    inputText.trim() === ""
  ) {
    setearMensajeInfo(divResultadoPrediccion, "El campo de texto esta vacio");
    return;
  } else {
    setearleSpinner(divResultadoPrediccion);

    inputText = inputText.trim();

    fetch(api_url + ruta_text_prediction, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ texto: inputText }),
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

/* -------------------------------------------------------------------------- */
/*                   Para leer la pagina actual directamente                  */
/* -------------------------------------------------------------------------- */

botonObtenerTextoPagina.addEventListener("click", async () => {
  const divResultaTextoPagina = document.querySelector(
    "#resultado-texto-pagina"
  );

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const url = tabs[0].url;
    if (!/https:\/\/www\.reddit\.com\/r\/SuicideWatch\/comments\//.test(url)) {
      setearMensajeInfo(
        divResultaTextoPagina,
        "La pagina actual no es de un post de Reddit en r/SuicideWatch"
      );
    } else {
      setearleSpinner(divResultaTextoPagina);

      obtenerTextoPostReddit().then((textoPostReddit) => {
        if (textoPostReddit === null || textoPostReddit === undefined) {
          setearMensajeInfo(
            divResultaTextoPagina,
            "No se pudo obtener el texto del post"
          );
        } else if (textoPostReddit === "" || textoPostReddit.trim() === "") {
          setearMensajeInfo(divResultaTextoPagina, "El post no tiene texto");
        } else {
          textoPostReddit = textoPostReddit.trim();
          fetch(api_url + ruta_text_prediction, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ texto: textoPostReddit }),
          })
            .then((response) => {
              if (response.ok) {
                return response.json();
              }
              throw new Error("Error al enviar el texto de la pagina a la API");
            })
            .then((data) => {
              setearResultado(divResultaTextoPagina, data);
            })
            .catch((error) => {
              setearMensajeErrorFetch(divResultaTextoPagina, error.message);
            });
        }
      });
    }
  });
});
