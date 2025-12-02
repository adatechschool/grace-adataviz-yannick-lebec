async function fetchApi() {
  try {
    const response = await fetch(
      "https://opendata.paris.fr/api/explore/v2.1/catalog/datasets/arbresremarquablesparis/records?limit=20"
    );
    const apiData = await response.json();
    console.log(apiData);
    return apiData;
  } catch (error) {
    console.log(error);
  }
}

fetchApi().then(data => {
  const container = document.getElementById("events");

  data.results.forEach(event => {
    const div = document.createElement("div");
    div.classList.add("card");

    div.innerHTML = `
      <img src="${event.com_url_photo1}" alt="${event.arbres_espece}" />

      <div class="card-content">
        <h2 class="card-title">${event.arbres_espece}</h2>
        <p class="card-subtitle">${event.arbres_adresse}</p>
        <p class="card-description">Date de plantation : ${event.com_descriptif}</p>
      </div>
    `;

    container.appendChild(div);
  });
});