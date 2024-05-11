const boton = document.getElementById("cambiar-mensaje");
api_url = "https://73e7-35-230-169-58.ngrok-free.app/";

boton.addEventListener("click", () => {
  const mensaje = document.querySelector("div");
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
