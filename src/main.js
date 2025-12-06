// --------------------------------------------
// 1) Création du layout (header, recherche, conteneur, modal)
// --------------------------------------------

function createLayout() {
  const body = document.body;

  const header = document.createElement("header");

  const title = document.createElement("h1");
  title.textContent = "Arbres remarquables de Paris";
  header.appendChild(title);

  const searchContainer = document.createElement("div");
  searchContainer.classList.add("search-box");

  const searchInputWrapper = document.createElement("div");
  searchInputWrapper.classList.add("input-wrapper");

  const searchInput = document.createElement("input");
  searchInput.type = "text";
  searchInput.id = "search";
  searchInput.placeholder = "Rechercher une espèce, une adresse...";

  const clearIcon = document.createElement("span");
  clearIcon.classList.add("clear-icon");
  clearIcon.textContent = "✖";
  clearIcon.style.display = "none"; // cachée tant que l’input est vide

  const searchIcon = document.createElement("span");
  searchIcon.classList.add("search-icon");
  searchIcon.textContent = "🔍";

  searchInputWrapper.appendChild(searchInput);
  searchInputWrapper.appendChild(clearIcon);
  searchInputWrapper.appendChild(searchIcon);

  searchContainer.appendChild(searchInputWrapper);
  header.appendChild(searchContainer);

  let app = document.querySelector("#app");
  if (!app) {
    app = document.createElement("div");
    app.id = "app";
    body.appendChild(app);
  }

  body.insertBefore(header, app);

  const imageModal = document.createElement("div");
  imageModal.classList.add("image-modal");
  imageModal.id = "image-modal";

  const modalImg = document.createElement("img");
  modalImg.id = "modal-img";
  imageModal.appendChild(modalImg);

  body.appendChild(imageModal);

  imageModal.addEventListener("click", () => {
    imageModal.classList.remove("open");
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      imageModal.classList.remove("open");
    }
  });

  return {
    searchInput,
    searchIcon,
    clearIcon,
    app,
    imageModal,
    modalImg,
  };
}

const { searchInput, searchIcon, clearIcon, app, imageModal, modalImg } =
  createLayout();

// --------------------------------------------
// 2) Appel de l'API
// --------------------------------------------

async function fetchApi(query = "") {
  try {
    let url =
      "https://opendata.paris.fr/api/explore/v2.1/catalog/datasets/arbresremarquablesparis/records";

    if (query) {
      const encodedQuery = encodeURIComponent(query);
      url += `?where=search(all,'${encodedQuery}')&limit=50`;
    } else {
      url += "?limit=20";
    }

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("HTTP error " + response.status);
    }

    const data = await response.json();
    console.log("Données API :", data);
    return data;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

// --------------------------------------------
// 3) Message "Aucun résultat"
// --------------------------------------------

function showNoResults() {
  let msg = document.querySelector(".no-results");

  if (!msg) {
    msg = document.createElement("div");
    msg.className = "no-results";
    msg.textContent = "Aucun arbre ne correspond à votre recherche.";
    app.appendChild(msg);
  }
}

function hideNoResults() {
  const msg = document.querySelector(".no-results");
  if (msg) msg.remove();
}

// --------------------------------------------
// 4) Fonction de recherche
// --------------------------------------------

function runSearch() {
  const value = searchInput.value.toLowerCase().trim();
  const cards = document.querySelectorAll(".card");

  hideNoResults(); // on enlève d'abord le message s'il existe

  // Si input vide → on réaffiche tout et on ne montre pas de message
  if (!value) {
    cards.forEach((card) => {
      card.style.display = "flex";
    });
    return;
  }

  let found = 0;

  cards.forEach((card) => {
    const text = card.innerText.toLowerCase();
    const match = text.includes(value);
    card.style.display = match ? "flex" : "none";
    if (match) found++;
  });

  if (found === 0) {
    showNoResults();
  }
}

// --------------------------------------------
// 5) Affichage des données + interactions
// --------------------------------------------

fetchApi().then((data) => {
  if (!data || !data.results) {
    console.error("No results in API response");
    return;
  }

  data.results.forEach((item) => {
    const espece = item.arbres_espece;
    const adresse = item.arbres_adresse;
    const descriptif = item.com_descriptif;
    const photo = item.com_url_photo1;

    // ------------ Création de la carte ------------
    const card = document.createElement("div");
    card.classList.add("card");

    if (photo) {
      const img = document.createElement("img");
      img.src = photo;
      img.alt = espece ?? "Arbre remarquable";

      img.addEventListener("click", () => {
        modalImg.src = photo;
        modalImg.alt = img.alt;
        imageModal.classList.add("open");
      });

      card.appendChild(img);
    }

    const content = document.createElement("div");
    content.classList.add("card-content");

    const h2 = document.createElement("h2");
    h2.textContent = espece ?? "Espèce inconnue";
    content.appendChild(h2);

    const pAdresse = document.createElement("p");
    pAdresse.textContent = adresse ?? "Adresse non renseignée";
    content.appendChild(pAdresse);

    // ------------ Descriptif + See more / See less ------------
    const pDescriptif = document.createElement("p");
    pDescriptif.textContent = descriptif ?? "Aucun descriptif";
    pDescriptif.classList.add("description", "hidden");
    content.appendChild(pDescriptif);

    const btnToggle = document.createElement("button");
    btnToggle.textContent = "See more";
    btnToggle.classList.add("toggle-btn");

    btnToggle.addEventListener("click", () => {
      const isHidden = pDescriptif.classList.contains("hidden");
      if (isHidden) {
        pDescriptif.classList.remove("hidden");
        btnToggle.textContent = "See less";
      } else {
        pDescriptif.classList.add("hidden");
        btnToggle.textContent = "See more";
      }
    });

    content.appendChild(btnToggle);

    card.appendChild(content);
    app.appendChild(card);
  });

  // --------------------------------------------
  // 6) Interactions de la barre de recherche
  // --------------------------------------------

  searchIcon.addEventListener("click", () => {
    runSearch();
  });

  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      runSearch();
    }
  });

  // Afficher / cacher la croix selon le contenu
  searchInput.addEventListener("input", () => {
    hideNoResults(); // si l’utilisateur change le texte, on enlève le message
    clearIcon.style.display = searchInput.value.trim() ? "block" : "none";

    // Si l'input devient vide, on réaffiche toutes les cartes
    if (!searchInput.value.trim()) {
      const cards = document.querySelectorAll(".card");
      cards.forEach((card) => {
        card.style.display = "flex";
      });
    }
  });

  clearIcon.addEventListener("click", () => {
    searchInput.value = "";
    clearIcon.style.display = "none";
    hideNoResults();

    document.querySelectorAll(".card").forEach((card) => {
      card.style.display = "flex";
    });
  });
});