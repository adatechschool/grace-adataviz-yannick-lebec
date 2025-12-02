// -------------------------------------------------------------
// 1) Récupération des données depuis l'API
// -------------------------------------------------------------

async function fetchApi() {
  try {
    const response = await fetch(
      "https://opendata.paris.fr/api/explore/v2.1/catalog/datasets/arbresremarquablesparis/records?limit=50"
    );
    const apiData = await response.json();
    return apiData;
  } catch (error) {
    console.log(error);
  }
}

// -------------------------------------------------------------
// 2) Construction de l'interface après chargement des données
// -------------------------------------------------------------

fetchApi().then((data) => {
  const container = document.getElementById("events");
  const searchInput = document.getElementById("search");
  const suggestionsList = document.getElementById("suggestions");
  const searchBtn = document.getElementById("search-btn");
  const imageModal = document.getElementById("image-modal");
  const modalImg = document.getElementById("modal-img");

  const cards = [];

  // -----------------------------------------------------------
  // 2.1) Création des cartes
  // -----------------------------------------------------------

  data.results.forEach((item) => {
    const div = document.createElement("div");
    div.classList.add("card");

    const espece = item.arbres_espece || "";
    const adresse = item.arbres_adresse || "";
    const descriptif = item.com_descriptif || "";
    const photo = item.com_url_photo1 || "";

    div.innerHTML = `
      <img src="${photo}" alt="${espece}" class="card-img" />
      <div class="card-content">
        <h2 class="card-title">${espece}</h2>
        <p class="card-subtitle">${adresse}</p>
        <p class="card-description">
          Date de plantation : ${descriptif}
        </p>
      </div>
    `;

    // texte complet utilisé pour la recherche
    const searchText = `${espece} ${adresse} ${descriptif}`.toLowerCase();

    div.dataset.search = searchText;
    container.appendChild(div);

    cards.push({
      element: div,
      label: `${espece} — ${adresse}`.trim() || espece || adresse,
      searchText,
      photo,
    });

    // clic sur l'image → ouverture en grand
    const img = div.querySelector(".card-img");
    img.addEventListener("click", () => {
      if (!photo) return;
      modalImg.src = photo;
      imageModal.style.display = "flex";
    });
  });

  // -----------------------------------------------------------
  // 2.2) Fermer le modal quand on clique dessus
  // -----------------------------------------------------------

  imageModal.addEventListener("click", () => {
    imageModal.style.display = "none";
    modalImg.src = "";
  });

  // -----------------------------------------------------------
  // 2.3) Fonction de filtrage des cartes
  // -----------------------------------------------------------

  function filterCards(value) {
    const lower = value.toLowerCase();

    cards.forEach(({ element, searchText }) => {
      element.style.display = searchText.includes(lower) ? "flex" : "none";
    });
  }

  // -----------------------------------------------------------
  // 2.4) Fonction de mise à jour des suggestions
  // -----------------------------------------------------------

  function updateSuggestions(value) {
    const lower = value.toLowerCase();
    suggestionsList.innerHTML = "";

    if (!lower) return;

    const matches = cards.filter((card) =>
      card.searchText.includes(lower)
    );

    const uniqueLabels = Array.from(
      new Map(matches.map((m) => [m.label, m])).values()
    );

    uniqueLabels.slice(0, 10).forEach((card) => {
      const li = document.createElement("li");
      li.textContent = card.label;

      // on utilise mousedown pour ne pas être coupé par le blur
      li.addEventListener("mousedown", (e) => {
        e.preventDefault();

        searchInput.value = card.label;
        suggestionsList.innerHTML = "";

        // on filtre sur l'espèce (avant le "—")
        const especeRecherchee = card.label.split("—")[0].trim();
        filterCards(especeRecherchee);
      });

      suggestionsList.appendChild(li);
    });
  }

  // -----------------------------------------------------------
  // 2.5) Input : filtrage en temps réel + suggestions
  // -----------------------------------------------------------

  searchInput.addEventListener("input", (e) => {
    const value = e.target.value;
    filterCards(value);
    updateSuggestions(value);
  });

  // clic dans l'input → reset
  searchInput.addEventListener("click", () => {
    searchInput.value = "";
    filterCards("");
    suggestionsList.innerHTML = "";
  });

  // -----------------------------------------------------------
  // 2.6) Bouton de recherche 🔍
  // -----------------------------------------------------------

  if (searchBtn) {
    searchBtn.addEventListener("click", () => {
      const value = searchInput.value.trim();

      if (!value) {
        filterCards("");
        suggestionsList.innerHTML = "";
        return;
      }

      filterCards(value);
      updateSuggestions(value);
    });
  }

  // -----------------------------------------------------------
  // 2.7) Blur : on ferme les suggestions après un petit délai
  // -----------------------------------------------------------

  searchInput.addEventListener("blur", () => {
    setTimeout(() => {
      suggestionsList.innerHTML = "";
    }, 150);
  });
});