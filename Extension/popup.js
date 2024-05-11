const api_url = "https://05e4-2802-8010-8f23-501-b91f-238b-b638-14a5.ngrok-free.app/";

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

  fetch(api_url + "output?text=" + inputText, {
    headers: {
      "ngrok-skip-browser-warning": "true",
    },
  })
    .then((response) => {
      if (response.ok) {
        return response.json();
      }
      throw new Error();
    })
    .then((data) => {
      divResultadoPrediccion.textContent = data.prediction ? "Suicida" : "No suicida";
    })
    .catch((error) => {
      divResultadoPrediccion.textContent = "Error al consultar el input ingresado";
    });
});

botonObtenerPaginaActual.addEventListener("click", () => {
  const divResultadoPaginaActual = document.querySelector("#resultado-pagina-actual");

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const url = tabs[0].url;
    if (/https:\/\/www\.reddit\.com\/r\/SuicideWatch\/comments\//.test(url)) {
      fetch(api_url + "analizar_url", {
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
          if(data.message){
            divResultadoPaginaActual.textContent = data.message
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
