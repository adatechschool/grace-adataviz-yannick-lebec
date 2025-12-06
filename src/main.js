// ------------------------------------------------------------
// 1) Création du layout (header, recherche, conteneur, modal)
// ------------------------------------------------------------
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
// 2) Variables globales
// --------------------------------------------
let dataResults = [];
const allCards = [];
let visibleCount = 10;
const STEP = 10;
let loadMoreBtn = null;

// --------------------------------------------
// 3) Appel de l'API
// --------------------------------------------
async function fetchApi() {
  try {
    const url =
      "https://opendata.paris.fr/api/explore/v2.1/catalog/datasets/arbresremarquablesparis/records?limit=100";

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
// 4) Message "Aucun résultat"
// --------------------------------------------
function showNoResults() {
  let msg = document.querySelector(".no-results");

  if (!msg) {
    msg = document.createElement("div");
    msg.className = "no-results";
    msg.textContent = "Aucun arbre ne correspond à votre recherche 🌿";
    app.appendChild(msg);
  }
}

function hideNoResults() {
  const msg = document.querySelector(".no-results");
  if (msg) msg.remove();
}

// --------------------------------------------
// 5) Mise à jour de l'affichage des cartes
// --------------------------------------------
function updateVisibleCards() {
  hideNoResults();
  allCards.forEach((card, index) => {
    card.style.display = index < visibleCount ? "flex" : "none";
  });

  if (loadMoreBtn) {
    loadMoreBtn.style.display =
      visibleCount >= allCards.length ? "none" : "block";
  }
}

// ----------------------------------------------
// 6) Création des cartes
// ----------------------------------------------
function renderCards(results) {
  app.innerHTML = "";
  allCards.length = 0;
  hideNoResults();

  results.forEach((item) => {
    const espece = item.arbres_espece;
    const adresse = item.arbres_adresse;
    const descriptif = item.com_descriptif;
    const photo = item.com_url_photo1;

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

    allCards.push(card);
  });

  if (!loadMoreBtn) {
    loadMoreBtn = document.createElement("button");
    loadMoreBtn.id = "load-more";
    loadMoreBtn.classList.add("load-more");
    loadMoreBtn.textContent = "Charger plus";
    app.insertAdjacentElement("afterend", loadMoreBtn);

    loadMoreBtn.addEventListener("click", () => {
      visibleCount += STEP;
      updateVisibleCards();
    });
  }

  if (searchInput.value.trim() === "") {
    visibleCount = 10;
    updateVisibleCards();
  } else {
    allCards.forEach((card) => {
      card.style.display = "flex";
    });
    if (loadMoreBtn) loadMoreBtn.style.display = "none";
    if (allCards.length === 0) showNoResults();
  }
}

// --------------------------------------------
// 7) Fonction de recherche côté front
// --------------------------------------------
function runSearch() {
  const q = searchInput.value.toLowerCase().trim();
  hideNoResults();

  if (!q) {
    visibleCount = 10;
    renderCards(dataResults);
    return;
  }

  const filtered = dataResults.filter((item) => {
    const espece = (item.arbres_espece || "").toLowerCase();
    const adresse = (item.arbres_adresse || "").toLowerCase();
    const descriptif = (item.com_descriptif || "").toLowerCase();

    const text = `${espece} ${adresse} ${descriptif}`;
    return text.includes(q);
  });

  renderCards(filtered);
}

// --------------------------------------------
// 8) Chargement initial
// --------------------------------------------
(async function init() {
  const data = await fetchApi();
  if (data && data.results) {
    dataResults = data.results;
    renderCards(dataResults);
  }

  searchIcon.addEventListener("click", () => {
    runSearch();
  });

  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      runSearch();
    }
  });

  searchInput.addEventListener("input", () => {
    const hasValue = searchInput.value.trim() !== "";
    clearIcon.style.display = hasValue ? "block" : "none";
    if (!hasValue) {
      runSearch();
    }
  });

  // retour dataset initial
  clearIcon.addEventListener("click", () => {
    searchInput.value = "";
    clearIcon.style.display = "none";
    runSearch();
  });
})();