const mensaje = document.querySelector("div");
const boton = document.getElementById("cambiar-mensaje");

api_url = "https://ed7f-2802-8010-8f23-501-597d-7688-888c-50ea.ngrok-free.app/";

boton.addEventListener("click", () => {
  fetch(api_url + "test", {
    headers: {
      "ngrok-skip-browser-warning": "true",
    },
  })
    .then((response) => {
      if (response.ok) {
        return response.json();
      }
      throw new Error("Error en la solicitud a la API");
    })
    .then((data) => {
      mensaje.textContent = data.message;
    })
    .catch((error) => {
      console.error("Error:", error);
      mensaje.textContent = "Error al cargar los datos";
    });
});
