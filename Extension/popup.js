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

function setearResultadoPrediccionSuicida(div, prediction) {
  div.textContent = prediction ? "Suicida" : "No suicida";
  div.className = prediction ? "text-danger" : "text-success";
}

function setearResultadoPrediccionViolento(div, prediction) {
  div.textContent = prediction ? "Violento" : "No violento";
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

function esPostReddit(url) {
  return /^https:\/\/www\.reddit\.com\/r\/[^\/]+\/comments\/[^\/]+/.test(url);
}

/* -------------------------------------------------------------------------- */
/*                          Obtener predict por input                         */
/* -------------------------------------------------------------------------- */

botonObtenerPrediccion.addEventListener("click", () => {
  const divResultadoPrediccionSuicida = document.querySelector(
    "#resultado-prediccion-suicida"
  );

  const divResultadoPrediccionViolento = document.querySelector(
    "#resultado-prediccion-violento"
  );

  let inputText = document.getElementById("texto-input").value;

  if (
    inputText === "" ||
    inputText === null ||
    inputText === undefined ||
    inputText.trim() === ""
  ) {
    setearMensajeInfo(
      divResultadoPrediccionSuicida,
      "El campo de texto esta vacio"
    );
    return;
  } else {
    setearleSpinner(divResultadoPrediccionSuicida);

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
        if (
          data.prediction_suicidio === undefined ||
          data.prediction_violencia === undefined
        ) {
          setearMensajeErrorAPI(divResultadoPrediccionSuicida, data.error);
          return;
        }
        setearResultadoPrediccionSuicida(
          divResultadoPrediccionSuicida,
          data.prediction_suicidio
        );
        setearResultadoPrediccionViolento(
          divResultadoPrediccionViolento,
          data.prediction_violencia
        );
      })
      .catch((error) => {
        setearMensajeErrorFetch(divResultadoPrediccionSuicida, error.message);
      });
  }
});

/* -------------------------------------------------------------------------- */
/*                           Obtener predict por url                          */
/* -------------------------------------------------------------------------- */

botonObtenerPaginaActual.addEventListener("click", () => {
  const divResultadoPaginaActualSuicida = document.querySelector(
    "#resultado-pagina-actual-suicida"
  );

  const divResultadoPaginaActualViolento = document.querySelector(
    "#resultado-pagina-actual-violento"
  );

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const url = tabs[0].url;
    if (!esPostReddit(url)) {
      setearMensajeInfo(
        divResultadoPaginaActualSuicida,
        "La pagina actual no es de un post de Reddit en r/SuicideWatch"
      );
    } else {
      setearleSpinner(divResultadoPaginaActualSuicida);

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
          if (
            data.prediction_suicidio === undefined ||
            data.prediction_violencia === undefined
          ) {
            setearMensajeErrorAPI(divResultadoPaginaActualSuicida, data.error);
            return;
          }
          setearResultadoPrediccionSuicida(
            divResultadoPaginaActualSuicida,
            data.prediction_suicidio
          );
          setearResultadoPrediccionViolento(
            divResultadoPaginaActualViolento,
            data.prediction_violencia
          );
        })
        .catch((error) => {
          setearMensajeErrorFetch(divResultadoPaginaActualSuicida, error.message);
        });
    }
  });
});

/* -------------------------------------------------------------------------- */
/*                   Para leer la pagina actual directamente                  */
/* -------------------------------------------------------------------------- */

botonObtenerTextoPagina.addEventListener("click", async () => {
  const divResultaTextoPaginaSuicida = document.querySelector(
    "#resultado-texto-pagina-suicida"
  );

  const divResultaTextoPaginaViolento = document.querySelector(
    "#resultado-texto-pagina-violento"
  );

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const url = tabs[0].url;
    if (!esPostReddit(url)) {
      setearMensajeInfo(
        divResultaTextoPaginaSuicida,
        "La pagina actual no es de un post de Reddit en r/SuicideWatch"
      );
    } else {
      setearleSpinner(divResultaTextoPaginaSuicida);

      obtenerTextoPostReddit().then((textoPostReddit) => {
        if (textoPostReddit === null || textoPostReddit === undefined) {
          setearMensajeInfo(
            divResultaTextoPaginaSuicida,
            "No se pudo obtener el texto del post"
          );
        } else if (textoPostReddit === "" || textoPostReddit.trim() === "") {
          setearMensajeInfo(divResultaTextoPaginaSuicida, "El post no tiene texto");
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
              if (
                data.prediction_suicidio === undefined ||
                data.prediction_violencia === undefined
              ) {
                setearMensajeErrorAPI(divResultadoPaginaActualSuicida, data.error);
                return;
              }
              setearResultadoPrediccionSuicida(
                divResultaTextoPaginaSuicida,
                data.prediction_suicidio
              );
              setearResultadoPrediccionViolento(
                divResultaTextoPaginaViolento,
                data.prediction_violencia
              );
            })
            .catch((error) => {
              setearMensajeErrorFetch(divResultaTextoPaginaSuicida, error.message);
            });
        }
      });
    }
  });
});

document
  .getElementById("texto-input")
  .addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      event.preventDefault();
      document.getElementById("boton-obtener-prediccion").click();
    }
  });
