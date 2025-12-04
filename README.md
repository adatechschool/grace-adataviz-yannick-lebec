[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/QvAN1_dN)


# 🌳 Arbres Remarquables à Paris — README

## 📘 Présentation du projet
Ce projet est une application web permettant d’explorer les **arbres remarquables de Paris** via les données publiques de l’Open Data Paris.  
Il propose une interface moderne avec recherche intelligente, suggestions, navigation au clavier, pagination et affichage détaillé des arbres.

## ✨ Fonctionnalités principales

### 🔍 Recherche intelligente
- Suggestions instantanées pendant la saisie  
- Validation via **Entrée**, **loupe** ou **clic suggestion**  
- Saisie assistée avec navigation au clavier (**↑/↓**)  
- Clic suggestion → affichage **d’un seul arbre**  
- Bouton **réinitialiser (✖)** pour revenir à l’état initial

### 📄 Affichage des arbres
Chaque arbre est affiché dans une carte contenant :
- nom de l’espèce  
- adresse  
- descriptif (affiché via “Voir plus”)  
- photo (clic → modal en grand)  

### 📥 Pagination
- 10 arbres affichés par défaut  
- bouton **“Charger plus”** pour afficher les suivants  
- désactivé automatiquement lors d’une recherche

### 🚫 Message “Aucun résultat”
Quand aucune carte ne correspond à la recherche :
> _Aucun arbre ne correspond à votre recherche 🌿_

---

## 📦 Structure du projet

```
.
├── index.html
├── src/
│   ├── main.js
│   └── style.css
└── README.md
```

### `index.html`
Structure principale + chargement JS/CSS.

### `style.css`
Gère tout le design :
- thème écolo  
- layout responsive  
- styles de la recherche, suggestions, cartes  
- modal image  
- animations légères  

### `main.js`
Gère :
- construction du DOM  
- appel API  
- recherche + suggestions  
- navigation au clavier  
- bouton reset ✖  
- pagination  
- modal image  
- message d’erreur  
- création dynamique des cartes  

---


## 📚 Détails techniques

### 🔗 Appel API
URL utilisée :
```
https://opendata.paris.fr/api/explore/v2.1/catalog/datasets/arbresremarquablesparis/records?limit=100
```

Champs utilisés :
- `arbres_espece`
- `arbres_adresse`
- `com_descriptif`
- `com_url_photo1`

### 🔍 Normalisation texte
Recherche simplifiée grâce à :
- suppression des accents  
- transformation en minuscule  
- extraction du texte complet des cartes  

### 🧠 Suggestions
- affichage dynamique selon saisie  
- suppression des doublons  
- sélection via clic ou Entrée  
- navigation avec flèches ↑ et ↓  

### ⌨️ Navigation au clavier
- `ArrowDown` → suggestion suivante  
- `ArrowUp` → précédente  
- `Enter` → valide la suggestion active ou recherche globale  

### 📥 Pagination
- affichage par lots de 10 cartes  
- bouton “Charger plus” pour afficher les suivantes  
- caché lors d’une recherche

---

## 🎨 Thème & style
Palette écolo :
- verts naturels  
- fond doux  
- ombres légères  
- léger effet “glass”  

Responsive :
- header sticky  
- cartes adaptatives  
- images fluides  

---