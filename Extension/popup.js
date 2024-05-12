const api_url = "http://127.0.0.1:5000/";
const ruta_text_prediction = "text_prediction"
const ruta_url_prediction = "url_predition"

const botonObtenerPrediccion = document.getElementById(
  "boton-obtener-prediccion"
);
const botonObtenerPaginaActual = document.getElementById(
  "boton-obtener-pagina-actual"
);

botonObtenerPrediccion.addEventListener("click", () => {
  const divResultadoPrediccion = document.querySelector("#resultado-prediccion");
  const inputText = encodeURIComponent(
    document.getElementById("texto-input").value
  );

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
      divResultadoPrediccion.textContent = data.prediction ? "Suicida" : "No suicida";
    })
    .catch((error) => {
      divResultadoPrediccion.textContent = error.message;
    });
});

botonObtenerPaginaActual.addEventListener("click", () => {
  const divResultadoPaginaActual = document.querySelector("#resultado-pagina-actual");

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const url = tabs[0].url;
    if (/https:\/\/www\.reddit\.com\/r\/SuicideWatch\/comments\//.test(url)) {
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
          if(data.prediction){
            divResultadoPaginaActual.textContent = data.prediction ? "Suicida" : "No suicida";
          } else {
            divResultadoPaginaActual.textContent = data.error
          }
        })
        .catch((error) => {
          divResultadoPaginaActual.textContent = error.message
        });
    } else {
      divResultadoPaginaActual.textContent = "No estás en la página de Reddit de SuicideWatch";
    }
  });
});
