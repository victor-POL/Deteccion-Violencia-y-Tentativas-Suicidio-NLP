const botonObtenerPrediccion = document.getElementById("boton-obtener-prediccion");
api_url = "https://bf67-2802-8010-8f23-501-b91f-238b-b638-14a5.ngrok-free.app/";

botonObtenerPrediccion.addEventListener("click", () => {
  const mensaje = document.querySelector("#resultado-prediccion");
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
      mensaje.textContent = data.prediction ? "Suicida" : "No suicida";
    })
    .catch((error) => {
      mensaje.textContent = "Error al consultar la API";
    });
});
