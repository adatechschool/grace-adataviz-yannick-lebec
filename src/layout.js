// ------------------------------------------------------------
// 1) Création du layout (header, recherche, conteneur, modal)
// ------------------------------------------------------------
export function createLayout() {
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
  clearIcon.style.display = "none";

  const searchIcon = document.createElement("span");
  searchIcon.classList.add("search-icon");
  searchIcon.textContent = "🔍";

  searchInputWrapper.appendChild(searchInput);
  searchInputWrapper.appendChild(clearIcon);
  searchInputWrapper.appendChild(searchIcon);

  searchContainer.appendChild(searchInputWrapper);
  header.appendChild(searchContainer);

  const app = document.querySelector("#app");

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