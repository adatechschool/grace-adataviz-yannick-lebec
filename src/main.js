// -------------------------------------------------------------
// 0) Construction du DOM
// -------------------------------------------------------------

function buildLayout() {
  const body = document.body;

  const mainContainer = document.createElement("div");
  body.appendChild(mainContainer);

  const header = document.createElement("div");
  header.classList.add("header");
  mainContainer.appendChild(header);

  const title = document.createElement("h1");
  title.classList.add("header-title");
  title.textContent = "Arbres remarquables à Paris";
  header.appendChild(title);

  const searchWrapper = document.createElement("div");
  searchWrapper.classList.add("search-wrapper");
  header.appendChild(searchWrapper);

  const searchBox = document.createElement("div");
  searchBox.classList.add("search-box");
  searchWrapper.appendChild(searchBox);

  const searchInput = document.createElement("input");
  searchInput.type = "text";
  searchInput.id = "search";
  searchInput.placeholder = "Rechercher un arbre...";
  searchInput.autocomplete = "off";
  searchBox.appendChild(searchInput);

  const clearBtn = document.createElement("button");
  clearBtn.id = "clear-btn";
  clearBtn.textContent = "✖";
  searchBox.appendChild(clearBtn);

  const searchBtn = document.createElement("button");
  searchBtn.id = "search-btn";
  searchBtn.textContent = "🔍";
  searchBox.appendChild(searchBtn);

  const suggestionsList = document.createElement("ul");
  suggestionsList.id = "suggestions";
  searchWrapper.appendChild(suggestionsList);

  const events = document.createElement("div");
  events.id = "events";
  mainContainer.appendChild(events);

  const imageModal = document.createElement("div");
  imageModal.id = "image-modal";
  imageModal.classList.add("image-modal");

  const modalImg = document.createElement("img");
  modalImg.id = "modal-img";
  imageModal.appendChild(modalImg);

  body.appendChild(imageModal);

  return {
    container: events,
    searchInput,
    suggestionsList,
    searchBtn,
    clearBtn,
    imageModal,
    modalImg,
  };
}

// -------------------------------------------------------------
// 1) API + Utils
// -------------------------------------------------------------

async function fetchApi() {
  try {
    const response = await fetch(
      "https://opendata.paris.fr/api/explore/v2.1/catalog/datasets/arbresremarquablesparis/records?limit=100"
    );
    return await response.json();
  } catch (error) {
    console.log(error);
  }
}

function normalize(str) {
  return (str || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

// -------------------------------------------------------------
// 2) App principale
// -------------------------------------------------------------

document.addEventListener("DOMContentLoaded", async () => {
  const {
    container,
    searchInput,
    suggestionsList,
    searchBtn,
    clearBtn,
    imageModal,
    modalImg,
  } = buildLayout();

  const cards = [];
  const INITIAL_VISIBLE = 10;
  const STEP = 10;
  let visibleCount = INITIAL_VISIBLE;
  let loadMoreBtn = null;
  let activeIndex = -1;

  // -------------------------------------------------------------
  // 2.x) MESSAGE "AUCUN RESULTAT"
  // -------------------------------------------------------------

  function showNoResults() {
    let msg = document.querySelector(".no-results-inline");
    if (!msg) {
      msg = document.createElement("div");
      msg.className = "no-results-inline";
      msg.textContent = "Aucun arbre ne correspond à votre recherche 🌿";
      container.appendChild(msg);
    }
  }

  function hideNoResults() {
    const msg = document.querySelector(".no-results-inline");
    if (msg) msg.remove();
  }

  // -------------------------------------------------------------
  // Affichage par lots
  // -------------------------------------------------------------

  function showMore() {
    cards.forEach(({ element }, i) => {
      element.style.display = i < visibleCount ? "flex" : "none";
    });

    if (loadMoreBtn) {
      loadMoreBtn.style.display =
        visibleCount >= cards.length ? "none" : "block";
    }
  }

  function resetList() {
    visibleCount = INITIAL_VISIBLE;
    hideNoResults();
    showMore();
  }

  // -------------------------------------------------------------
  // Suggestions
  // -------------------------------------------------------------

  function clearSuggestions() {
    suggestionsList.innerHTML = "";
    suggestionsList.style.display = "none";
    activeIndex = -1;
  }

  function highlightSuggestion() {
    const items = suggestionsList.querySelectorAll("li");
    items.forEach((li, i) => {
      li.classList.toggle("active", i === activeIndex);
    });
  }

  function updateSuggestions(value) {
    const q = normalize(value);
    clearSuggestions();
    if (!q) return;

    const matches = cards.filter((c) => c.searchText.includes(q));
    const unique = Array.from(new Map(matches.map((m) => [m.label, m])).values());

    unique.slice(0, 10).forEach((c) => {
      const li = document.createElement("li");
      li.textContent = c.label;
      li.addEventListener("mousedown", () => chooseSuggestion(c.label));
      suggestionsList.appendChild(li);
    });

    if (unique.length > 0) {
      suggestionsList.style.display = "block";
    }
  }

  // -------------------------------------------------------------
  // Choisir une suggestion → un seul arbre
  // -------------------------------------------------------------

  function chooseSuggestion(label) {
    searchInput.value = label;
    clearBtn.style.display = "block";
    clearSuggestions();
    hideNoResults(); // ← IMPORTANT

    cards.forEach(({ element, label: cardLabel }) => {
      element.style.display = label === cardLabel ? "flex" : "none";
    });

    if (loadMoreBtn) loadMoreBtn.style.display = "none";
  }

  // -------------------------------------------------------------
  // Recherche globale (Enter ou loupe)
  // -------------------------------------------------------------

  function runSearch(query) {
    const q = normalize(query);
    hideNoResults(); // ← important

    if (!q) {
      resetList();
      return;
    }

    let found = 0;

    cards.forEach(({ element, searchText }) => {
      const match = searchText.includes(q);
      element.style.display = match ? "flex" : "none";
      if (match) found++;
    });

    if (found === 0) showNoResults();

    if (loadMoreBtn) loadMoreBtn.style.display = "none";
  }

  // -------------------------------------------------------------
  // Construction des cartes depuis l'API
  // -------------------------------------------------------------

  const data = await fetchApi();

  data.results.forEach((item) => {
    const div = document.createElement("div");
    div.classList.add("card");

    const espece = item.arbres_espece || "";
    const adresse = item.arbres_adresse || "";
    const descriptif = item.com_descriptif || "";
    const photo = item.com_url_photo1 || "";

    const img = document.createElement("img");
    img.classList.add("card-img");
    img.alt = espece;

    if (photo) {
      img.src = photo;
      img.addEventListener("click", () => {
        modalImg.src = photo;
        imageModal.style.display = "flex";
      });
    } else img.style.display = "none";

    div.appendChild(img);

    const content = document.createElement("div");
    content.classList.add("card-content");
    div.appendChild(content);

    const title = document.createElement("h2");
    title.classList.add("card-title");
    title.textContent = espece || "Arbre remarquable";
    content.appendChild(title);

    const subtitle = document.createElement("p");
    subtitle.classList.add("card-subtitle");
    subtitle.textContent = adresse;
    content.appendChild(subtitle);

    const desc = document.createElement("p");
    desc.classList.add("card-description");
    desc.textContent = `Descriptif : ${descriptif}`;
    desc.style.display = "none";
    content.appendChild(desc);

    const btn = document.createElement("button");
    btn.textContent = "Voir plus";
    btn.classList.add("see-more-btn");
    btn.addEventListener("click", () => {
      const show = desc.style.display === "none";
      desc.style.display = show ? "block" : "none";
      btn.textContent = show ? "Voir moins" : "Voir plus";
    });
    content.appendChild(btn);

    container.appendChild(div);

    const searchText = normalize(div.textContent);
    const label =
      espece && adresse ? `${espece} — ${adresse}` : espece || adresse;

    cards.push({ element: div, label, searchText });
  });

  // -------------------------------------------------------------
  // Bouton "Charger plus"
  // -------------------------------------------------------------
  
  loadMoreBtn = document.createElement("button");
  loadMoreBtn.id = "load-more";
  loadMoreBtn.textContent = "Charger plus";
  container.insertAdjacentElement("afterend", loadMoreBtn);

  loadMoreBtn.addEventListener("click", () => {
    visibleCount += STEP;
    showMore();
  });

  showMore();

  // -------------------------------------------------------------
  // Bouton reset ✖
  // -------------------------------------------------------------

  clearBtn.style.display = "none";

  clearBtn.addEventListener("click", () => {
    searchInput.value = "";
    clearBtn.style.display = "none";
    clearSuggestions();
    hideNoResults();
    resetList();
  });

  // -------------------------------------------------------------
  // Recherche + navigation au clavier
  // -------------------------------------------------------------

  searchInput.addEventListener("input", () => {
    clearBtn.style.display = searchInput.value.trim()
      ? "block"
      : "none";

    hideNoResults();
    updateSuggestions(searchInput.value);
  });

  searchInput.addEventListener("keydown", (e) => {
    const items = suggestionsList.querySelectorAll("li");

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (items.length > 0) {
        activeIndex = (activeIndex + 1) % items.length;
        highlightSuggestion();
      }
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (items.length > 0) {
        activeIndex = (activeIndex - 1 + items.length) % items.length;
        highlightSuggestion();
      }
    }

    if (e.key === "Enter") {
      e.preventDefault();

      if (activeIndex >= 0 && items.length > 0) {
        chooseSuggestion(items[activeIndex].textContent);
      } else {
        runSearch(searchInput.value);
      }

      clearSuggestions();
    }
  });

  searchBtn.addEventListener("click", () => {
    clearSuggestions();
    runSearch(searchInput.value);
  });

  searchInput.addEventListener("blur", () => {
    setTimeout(() => clearSuggestions(), 150);
  });

  imageModal.addEventListener("click", () => {
    imageModal.style.display = "none";
  });
});