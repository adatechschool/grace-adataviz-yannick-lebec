// -------------------------------------------------------------
// 0) Construction du DOM
// -------------------------------------------------------------

function buildLayout() {
  const body = document.body;

  // Conteneur principal pour le header et la liste
  const mainContainer = document.createElement("div");
  body.appendChild(mainContainer);

  // ----- HEADER -----
  const header = document.createElement("div");
  header.classList.add("header");
  mainContainer.appendChild(header);

  const title = document.createElement("h1");
  title.classList.add("header-title");
  title.textContent = "Arbres remarquables à Paris";
  header.appendChild(title);

  // Wrapper pour la recherche
  const searchWrapper = document.createElement("div");
  searchWrapper.classList.add("search-wrapper");
  header.appendChild(searchWrapper);

  const searchBox = document.createElement("div");
  searchBox.classList.add("search-box");
  searchWrapper.appendChild(searchBox);

  // Input de recherche
  const searchInput = document.createElement("input");
  searchInput.type = "text";
  searchInput.id = "search";
  searchInput.placeholder = "Rechercher un arbre...";
  searchInput.autocomplete = "off";
  searchBox.appendChild(searchInput);

  // Bouton 🔍
  const searchBtn = document.createElement("button");
  searchBtn.id = "search-btn";
  searchBtn.textContent = "🔍";
  searchBox.appendChild(searchBtn);

  // Liste des suggestions
  const suggestionsList = document.createElement("ul");
  suggestionsList.id = "suggestions";
  searchWrapper.appendChild(suggestionsList);

  // Conteneur des cartes
  const eventsContainer = document.createElement("div");
  eventsContainer.id = "events";
  mainContainer.appendChild(eventsContainer);

  // Modal pour l'image en grand
  const imageModal = document.createElement("div");
  imageModal.id = "image-modal";
  imageModal.classList.add("image-modal");

  const modalImg = document.createElement("img");
  modalImg.id = "modal-img";
  modalImg.alt = "Agrandissement de l'arbre";
  imageModal.appendChild(modalImg);

  body.appendChild(imageModal);

  // On retourne les éléments utiles pour la suite
  return {
    container: eventsContainer,
    searchInput,
    suggestionsList,
    searchBtn,
    imageModal,
    modalImg,
  };
}

// -------------------------------------------------------------
// 1) Fonctions utilitaires / API
// -------------------------------------------------------------

// 1.1) Récupération des données depuis l'API
async function fetchApi() {
  try {
    const response = await fetch(
      "https://opendata.paris.fr/api/explore/v2.1/catalog/datasets/arbresremarquablesparis/records?limit=100"
    );
    const apiData = await response.json();
    return apiData;
  } catch (error) {
    console.log(error);
  }
}

// 1.2) Normalisation texte pour la recherche (accents, majuscules...)
function normalizeText(str) {
  return (str || "")
    .toString()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

// -------------------------------------------------------------
// 2) Construction de l'interface après chargement du DOM
// -------------------------------------------------------------

document.addEventListener("DOMContentLoaded", () => {
  const {
    container,
    searchInput,
    suggestionsList,
    searchBtn,
    imageModal,
    modalImg,
  } = buildLayout();

  const cards = [];

  // paramètres "charger plus"
  const INITIAL_VISIBLE = 10;
  const STEP = 10;
  let visibleCount = INITIAL_VISIBLE;
  let loadMoreBtn = null;

  // -----------------------------------------------------------
  // 2.1) Message "Aucun résultat" dans #events
  // -----------------------------------------------------------

  function showNoResults() {
    let msg = container.querySelector(".no-results-inline");
    if (!msg) {
      msg = document.createElement("div");
      msg.className = "no-results-inline";
      msg.textContent = "Aucun arbre ne correspond à votre recherche 🌿";
      container.appendChild(msg);
    }
  }

  function hideNoResults() {
    const msg = container.querySelector(".no-results-inline");
    if (msg) msg.remove();
  }

  // -----------------------------------------------------------
  // 2.2) Gestion de l'affichage par lots (Charger plus)
  // -----------------------------------------------------------

  function applyVisibleCount() {
    cards.forEach(({ element }, index) => {
      element.style.display = index < visibleCount ? "flex" : "none";
    });

    // gérer la visibilité du bouton
    if (!loadMoreBtn) return;
    if (visibleCount >= cards.length) {
      loadMoreBtn.style.display = "none";
    } else {
      loadMoreBtn.style.display = "block";
    }
  }

  // -----------------------------------------------------------
  // 2.3) Filtrer les cartes (recherche)
  // -----------------------------------------------------------

  function filterCards(value) {
    const lower = normalizeText(value);

    // si recherche vide → on revient au comportement "charger plus"
    if (!lower) {
      hideNoResults();
      visibleCount = INITIAL_VISIBLE;
      applyVisibleCount();
      return;
    }

    let visible = 0;

    cards.forEach(({ element, searchText }) => {
      const isVisible = searchText.includes(lower);
      element.style.display = isVisible ? "flex" : "none";
      if (isVisible) visible++;
    });

    if (visible === 0) {
      showNoResults();
    } else {
      hideNoResults();
    }

    // en mode recherche, on cache le bouton "charger plus"
    if (loadMoreBtn) {
      loadMoreBtn.style.display = "none";
    }
  }

  // -----------------------------------------------------------
  // 2.4) Suggestions (autocomplete)
// -----------------------------------------------------------

  function updateSuggestions(value) {
    const lower = normalizeText(value);
    suggestionsList.innerHTML = "";

    if (!lower) {
      suggestionsList.style.display = "none";
      return;
    }

    const matches = cards.filter((card) =>
      card.searchText.includes(lower)
    );

    if (matches.length === 0) {
      suggestionsList.style.display = "none";
      return;
    }

    suggestionsList.style.display = "block";

    const uniqueLabels = Array.from(
      new Map(matches.map((m) => [m.label, m])).values()
    );

    uniqueLabels.slice(0, 10).forEach((card) => {
      const li = document.createElement("li");
      li.textContent = card.label;

      li.addEventListener("mousedown", (e) => {
        e.preventDefault(); // évite le blur immédiat de l'input

        // mettre la valeur choisie dans l'input
        searchInput.value = card.label;

        // vider et cacher la liste de suggestions
        suggestionsList.innerHTML = "";
        suggestionsList.style.display = "none";

        // on filtre sur l'espèce (avant le "—") si présente
        const especeRecherchee = card.label.split("—")[0].trim();
        filterCards(especeRecherchee);
      });

      suggestionsList.appendChild(li);
    });
  }

  // -----------------------------------------------------------
  // 2.5) Appel API + création des cartes
  // -----------------------------------------------------------

  fetchApi().then((data) => {
    if (!data || !Array.isArray(data.results)) {
      console.error("Données invalides depuis l'API", data);
      const errorMsg = document.createElement("div");
      errorMsg.className = "no-results-inline";
      errorMsg.textContent =
        "Impossible de charger les arbres pour le moment. Réessayez plus tard 🍃";
      container.appendChild(errorMsg);
      return;
    }

    // 2.5.1) Création des cartes à partir des données
    data.results.forEach((item) => {
      const div = document.createElement("div");
      div.classList.add("card");

      const espece = item.arbres_espece || "";
      const adresse = item.arbres_adresse || "";
      const descriptif = item.com_descriptif || "";
      const photo = item.com_url_photo1 || "";

      // image
      const img = document.createElement("img");
      img.classList.add("card-img");
      img.alt = espece;

      if (photo) {
        img.src = photo;
        img.addEventListener("click", () => {
          modalImg.src = photo;
          imageModal.style.display = "flex";
        });
      } else {
        img.style.display = "none";
      }

      div.appendChild(img);

      // contenu
      const content = document.createElement("div");
      content.classList.add("card-content");
      div.appendChild(content);

      const title = document.createElement("h2");
      title.classList.add("card-title");
      title.textContent = espece || "Arbre remarquable";
      content.appendChild(title);

      const subtitle = document.createElement("p");
      subtitle.classList.add("card-subtitle");
      subtitle.textContent = adresse || "Adresse non renseignée";
      content.appendChild(subtitle);

      const desc = document.createElement("p");
      desc.classList.add("card-description");
      desc.textContent = descriptif
        ? `Descriptif : ${descriptif}`
        : "Pas de descriptif disponible.";
      desc.style.display = "none";
      content.appendChild(desc);

      const seeMoreBtn = document.createElement("button");
      seeMoreBtn.textContent = "Voir plus";
      seeMoreBtn.classList.add("see-more-btn");

      seeMoreBtn.addEventListener("click", () => {
        const isHidden = desc.style.display === "none";
        if (isHidden) {
          desc.style.display = "block";
          seeMoreBtn.textContent = "Voir moins";
        } else {
          desc.style.display = "none";
          seeMoreBtn.textContent = "Voir plus";
        }
      });

      content.appendChild(seeMoreBtn);

      // On ajoute la carte au DOM AVANT de calculer le texte de recherche
      container.appendChild(div);

      // texte de recherche = tout le texte visible de la carte
      const searchText = normalizeText(div.textContent);
      div.dataset.search = searchText;

      // label pour les suggestions
      let label = "";
      if (espece && adresse) label = `${espece} — ${adresse}`;
      else if (espece) label = espece;
      else if (adresse) label = adresse;
      else label = "Arbre sans libellé";

      cards.push({
        element: div,
        label,
        searchText,
      });
    });

    // ---------------------------------------------------------
    // 2.6) Modal : fermer en cliquant sur le fond
    // ---------------------------------------------------------

    imageModal.addEventListener("click", () => {
      imageModal.style.display = "none";
      modalImg.src = "";
    });

    // ---------------------------------------------------------
    // 2.7) Bouton "Charger plus"
    // ---------------------------------------------------------

    loadMoreBtn = document.createElement("button");
    loadMoreBtn.id = "load-more";
    loadMoreBtn.textContent = "Charger plus";
    container.insertAdjacentElement("afterend", loadMoreBtn);

    loadMoreBtn.addEventListener("click", () => {
      visibleCount += STEP;
      applyVisibleCount();
    });

    // Affichage initial (10 cartes)
    applyVisibleCount();

    // ---------------------------------------------------------
    // 2.8) Écouteurs sur la recherche (input, clic, entrée, blur)
    // ---------------------------------------------------------

    // 2.8.1) Input : filtrage + suggestions
    searchInput.addEventListener("input", (e) => {
      const value = e.target.value;
      filterCards(value);
      updateSuggestions(value);
    });

    // 2.8.2) Clic dans l'input : reset complet
    searchInput.addEventListener("click", () => {
      // vider le texte
      searchInput.value = "";

      // enlever le message "aucun résultat" et les suggestions
      hideNoResults();
      suggestionsList.innerHTML = "";
      suggestionsList.style.display = "none";

      // revenir au mode "charger plus"
      visibleCount = INITIAL_VISIBLE;
      applyVisibleCount();
    });

    // 2.8.3) Entrée pour lancer la recherche
    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        const value = searchInput.value.trim();
        filterCards(value);
        updateSuggestions(value);
      }
    });

    // 2.8.4) Bouton de recherche 🔍
    if (searchBtn) {
      searchBtn.addEventListener("click", () => {
        const value = searchInput.value.trim();

        if (!value) {
          suggestionsList.innerHTML = "";
          suggestionsList.style.display = "none";
          hideNoResults();
          visibleCount = INITIAL_VISIBLE;
          applyVisibleCount();
          return;
        }

        filterCards(value);
        updateSuggestions(value);
      });
    }

    // 2.8.5) Blur : fermer les suggestions après un petit délai
    searchInput.addEventListener("blur", () => {
      setTimeout(() => {
        suggestionsList.innerHTML = "";
        suggestionsList.style.display = "none";
      }, 150);
    });
  });
});