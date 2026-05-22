//OPTIONAL
let audioUnlocked = false;
// toast timer
let toastTimer = null;
// Translations for UI strings
const translations = {
  en: {
    title: "Nuha Pastry",
    main: "Main Dishes",
    dessert: "Desserts",
    drink: "Drinks",
    search: "Search food...",
    noItems: "No items found.",
    admin: "Admin Panel",
    login: "Login"
  },
  am: {
    title: "ኑሀ ኬክ ቤት",
    main: "ዋና ምግቦች",
    dessert: "ጣፋጮች",
    drink: "መጠጦች",
    search: "ምግብ ፈልግ...",
    noItems: "ምንም አልተገኘም",
    admin: "አስተዳደር",
    login: "ግባ"
  }
};
// CLEAN INITIALIZATION (runs once)
document.addEventListener("DOMContentLoaded", () => {
  // Determine language: saved preference -> auto-detect -> default
  const savedLang = localStorage.getItem("lang");
  if (savedLang && translations[savedLang]) {
    currentLang = savedLang;
  } else {
    const userLang = navigator.language || "en";
    currentLang = userLang.startsWith("am") ? "am" : "en";
  }

  loadMenu();                    // load saved or default menu
  renderMenu(pages[pageIndex]);  // render first page
  updateActiveTab();             // activate first tab
  // Apply UI strings for current language
  document.documentElement.setAttribute("lang", currentLang);
  const s = document.getElementById("searchInput");
  if (s) s.placeholder = translations[currentLang].search;
  if (translations[currentLang] && translations[currentLang].title) {
    document.title = translations[currentLang].title;
  }
  // update static UI text
  updateUIText();
  // reveal splash animation (slight delay so paint can occur)
  const _splash = document.getElementById('splash');
  if (_splash) setTimeout(() => _splash.classList.add('show'), 60);
});
// PAGE SYSTEM (MUST BE FIRST)
const pages = ["main", "dessert", "drink"];
let pageIndex = 0;

// Pages order and index
let currentLang = "en";     // current language
let PIN = "1234";           // change pin if you want

// SECRET ADMIN ACCESS (double tap)
document.addEventListener("dblclick", function () {
  openAdmin();
});

// DEFAULT MENU
let menu = [
  {
    id: 1,
    en: "Chicken Curry",
    am: "የዶሮ ጥብስ",
    price: 250,
    cat: "main",
    img: "chicken.jpg",
    desc: "Tender chicken simmered in rich Ethiopian spices.",
    available: true
  },
  {
    id: 2,
    en: "Grilled Beef",
    am: "የተጠበሰ ስጋ",
    price: 300,
    cat: "main",
    img: "beef.jpg",
    desc: "Juicy beef strips grilled to perfection and served hot.",
    available: true
  },
  {
    id: 3,
    en: "Mango Juice",
    am: "የማንጎ ጭማቂ",
    price: 80,
    cat: "drink",
    img: "mango.jpg",
    desc: "Mango Juice.",
    available: true
  },
  {
    id: 4,
    en: "Coffee",
    am: "ቡና",
    price: 50,
    cat: "drink",
    img: "coffee.jpg",
    desc: "Traditional Ethiopian Coffee.",
    available: true
  },
  {
    id: 5,
    en: "Ice Cream",
    am: "አይስክሬም",
    price: 100,
    cat: "dessert",
    img: "icecream.jpg",
    desc: "Cold Ice cream.",
    available: true
  }
];


// LOAD / SAVE
function loadMenu() {
  let saved = localStorage.getItem("menuData");
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        menu = parsed.map(it => ({ ...it, available: it.available !== false }));
      } else {
        console.warn("menuData in storage is not an array, resetting to default", parsed);
        menu = [];
      }
    } catch (ex) {
      console.error("Failed to parse saved menuData, ignoring", ex);
      menu = [];
    }
    if (menu.length === 0) {
      console.warn("Loaded menuData but resulting menu is empty, using default menu instead.");
      // if we lost everything accidentally, fall back to original defaults
      // (copying ensures we don't mutate the constant array defined above)
      menu = [
        {
          id: 1,
          en: "Chicken Curry",
          am: "የዶሮ ጥብስ",
          price: 250,
          cat: "main",
          img: "chicken.jpg",
          desc: "Tender chicken simmered in rich Ethiopian spices.",
          available: true
        },
        {
          id: 2,
          en: "Grilled Beef",
          am: "የተጠበሰ ስጋ",
          price: 300,
          cat: "main",
          img: "beef.jpg",
          desc: "Juicy beef strips grilled to perfection and served hot.",
          available: true
        },
        {
          id: 3,
          en: "Mango Juice",
          am: "የማንጎ ጭማቂ",
          price: 80,
          cat: "drink",
          img: "mango.jpg",
          desc: "Mango Juice.",
          available: true
        },
        {
          id: 4,
          en: "Coffee",
          am: "ቡና",
          price: 50,
          cat: "drink",
          img: "coffee.jpg",
          desc: "Traditional Ethiopian Coffee.",
          available: true
        },
        {
          id: 5,
          en: "Ice Cream",
          am: "አይስክሬም",
          price: 100,
          cat: "dessert",
          img: "icecream.jpg",
          desc: "Cold Ice cream.",
          available: true
        }
      ];
    }
  }
  updateActiveTab();
}


function saveMenu() {
  localStorage.setItem("menuData", JSON.stringify(menu));
  // refresh current page and keep any search term
  const searchVal = document.getElementById("searchInput")?.value || "";
  renderMenu(pages[pageIndex], searchVal);
  showToast("Saved successfully!");
}

function showToast(message, ms = 2200) {
  if (!message) return;
  let el = document.getElementById('toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';
    el.className = 'toast';
    el.setAttribute('aria-live', 'polite');
    el.setAttribute('aria-atomic', 'true');
    document.body.appendChild(el);
  }

  el.textContent = message;
  el.classList.add('show');

  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el.classList.remove('show');
    toastTimer = null;
  }, ms);
}

// HIGHLIGHT SEARCH
function highlight(text, word) {
  if (!word) return text;
  let re = new RegExp("(" + escapeRegExp(word) + ")", "gi");
  return text.replace(re, "<span class='highlight'>$1</span>");
}
// safe highlighting that preserves HTML-escaping (prevents XSS)
function highlightSafe(text, word) {
  if (!word) return escapeHtml(text);
  const re = new RegExp(escapeRegExp(word), 'gi');
  let result = '';
  let lastIndex = 0;
  let match;
  while ((match = re.exec(text)) !== null) {
    const start = match.index;
    const end = re.lastIndex;
    result += escapeHtml(text.slice(lastIndex, start));
    result += `<span class="highlight">${escapeHtml(text.slice(start, end))}</span>`;
    lastIndex = end;
    // protect against infinite loop on empty matches
    if (re.lastIndex === match.index) re.lastIndex++;
  }
  result += escapeHtml(text.slice(lastIndex));
  return result;
}
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// RENDER MENU
function renderMenu(filter = "all", search = "") {
  let area = document.getElementById("menuArea");
  if (!area) return; // guard if DOM not present
  let html = "";
  if (!Array.isArray(menu)) {
    console.warn("renderMenu called but menu is not an array", menu);
    menu = [];
  }
  console.debug(`renderMenu(${filter}, "${search}") – ${menu.length} items, lang=${currentLang}`);

  let cats = {
    main: {
    en: "Main Dishes",
    am: "ዋና ምግቦች"
    },
    dessert: {
    en: "Desserts",
    am: "ጣፋጮች"
    },
    drink: {
    en: "Drinks",
    am: "መጠጦች"
    }
  };

  let currentCat = "";

  menu
    .slice()
    .sort((a, b) => {
      const order = { main: 1, dessert: 2, drink: 3 };
      return order[a.cat] - order[b.cat];
    })
    .forEach(item => {

      if (filter !== "all" && item.cat !== filter) return;

      let name = item[currentLang];
      if (!name.toLowerCase().includes(search.toLowerCase())) return;

      // Add category title only once
      if (currentCat !== item.cat) {
        html += `
          <div class="chalk-section">
            <div class="chalk-title">${cats[item.cat][currentLang]}</div>
          </div>
        `;
        currentCat = item.cat;
      }
      // Chalkboard item
      // use safe highlighting to avoid injecting unescaped HTML
      const displayName = highlightSafe(name, search);
      const description = item[currentLang === 'am' ? 'desc_am' : 'desc'] || item.desc || '';
      const displayDesc = description ? highlightSafe(description, search) : '';
      html += `
  <div class="chalk-item ${!item.available ? 'unavailable' : ''}">
    <div class="chalk-img">
      <img src="images/${item.img || 'placeholder.jpg'}"
           alt="${name}"
           loading="lazy"
           onerror="this.src='images/placeholder.jpg'">
    </div>

    <div class="chalk-info">
      <div class="chalk-name">${displayName}</div>
      <div class="chalk-desc">${displayDesc}</div>
      <div class="chalk-line"></div>
      <div class="chalk-price">
        ${item.available ? `ETB ${item.price}` : `<span class="soldout">Not available today</span>`}
      </div>
    </div>
  </div>
`;
      });
  area.innerHTML = html || `<p class='no-items'>${escapeHtml(translations[currentLang].noItems)}</p>`;
  
}
function escapeHtml(text) {
  const div = document.createElement('div');
  div.innerText = text;
  return div.innerHTML;
}

// SEARCH (use current page)
document.addEventListener("keyup", function (e) {
  const s = document.getElementById("searchInput");
  if (!s) return;

  // only run when typing inside search input
  if (document.activeElement === s) {
    renderMenu(pages[pageIndex], s.value);
  }
});

function setLanguage(lang) {
  currentLang = lang;
  // This line tells the CSS which language we are using
  document.documentElement.setAttribute("lang", lang);
  // persist preference
  try { localStorage.setItem("lang", lang); } catch (e) { /* ignore */ }
  // update UI strings
  const s = document.getElementById("searchInput");
  if (s) s.placeholder = translations[lang].search;
  if (translations[lang] && translations[lang].title) document.title = translations[lang].title;
  renderMenu(pages[pageIndex], document.getElementById("searchInput")?.value || "");
  updateActiveTab();
  updateUIText();
}

// Update UI text nodes that are static in HTML
function updateUIText() {
  const t = translations[currentLang] || translations.en;
  const headerTitle = document.querySelector('header h1');
  if (headerTitle) headerTitle.textContent = t.title;
  const splashTitle = document.querySelector('#splash h1');
  if (splashTitle) splashTitle.textContent = t.title;
  const tabs = document.querySelectorAll('#topTabs .tab');
  if (tabs.length >= 3) {
    tabs[0].textContent = t.main;
    tabs[1].textContent = t.dessert;
    tabs[2].textContent = t.drink;
  }
  const loginH2 = document.querySelector('#loginBox h2');
  if (loginH2) loginH2.textContent = t.admin;
  const loginBtn = document.querySelector('#loginBox button');
  if (loginBtn) loginBtn.textContent = t.login;
  const langSel = document.getElementById('langSelect');
  if (langSel) langSel.value = currentLang;
}
// ADMIN UI
function openAdmin() {
  const panel = document.getElementById("adminPanel");
  if (!panel) return;
  panel.style.display = "block";
  document.body.classList.add("admin-open");
  const pin = document.getElementById("adminPin");
  if (pin) pin.focus();
}

function closeAdmin() {
  const panel = document.getElementById("adminPanel");
  if (!panel) return;
  panel.style.display = "none";
  document.body.classList.remove("admin-open");
}
// ENTER KEY SUPPORT FOR ADMIN LOGIN
document.addEventListener("keydown", function (e) {
  const pinInput = document.getElementById("adminPin");

  if (!pinInput) return;

  // Only trigger when admin panel is open & input is focused
  if (
    document.getElementById("adminPanel")?.style.display === "block" &&
    document.activeElement === pinInput &&
    e.key === "Enter"
  ) {
    e.preventDefault();
    checkPin();
  }
});
function checkPin() {
  const pinInput = document.getElementById("adminPin");
  const loginBox = document.getElementById("loginBox");
  if (!pinInput || !loginBox) return;
  const inner = loginBox.querySelector(".login-inner") || loginBox;

  if (pinInput.value === PIN) {
    loginBox.style.display = "none";
    const editor = document.getElementById("editor");
    if (editor) editor.style.display = "block";
    loadAdmin();
  } else {

    // reset animation
    inner.classList.remove("shake");
    pinInput.classList.remove("pin-error");

    // force reflow
    void inner.offsetWidth;

    // play again
    inner.classList.add("shake");
    pinInput.classList.add("pin-error");

    pinInput.value = "";

    setTimeout(() => {
      inner.classList.remove("shake");
      pinInput.classList.remove("pin-error");
    }, 450);
  }
}

function loadAdmin() {
  let table = document.getElementById("adminTable");
  if (!table) return;
  // Added "Image Name" to the header
  table.innerHTML = `
    <tr>
      <th>English</th>
      <th>Amharic</th>
      <th>Price</th>
      <th>Image Name</th>
      <th>Category</th>
      <th>Available</th>
      <th>Description</th>
      <th>Delete</th>
    </tr>
  `;

  menu.forEach((item, index) => {
    let row = table.insertRow();

    row.insertCell().innerHTML = `<input value="${escapeHtml(item.en)}" oninput="updateItem(${index}, 'en', this.value)">`;
    row.insertCell().innerHTML = `<input value="${escapeHtml(item.am)}" oninput="updateItem(${index}, 'am', this.value)">`;
    row.insertCell().innerHTML = `<input type="number" value="${item.price}" oninput="updateItem(${index}, 'price', this.value)">`;

    // NEW: Image input field
    row.insertCell().innerHTML = `<input value="${item.img || ''}" placeholder="e.g. pizza.jpg" oninput="updateItem(${index}, 'img', this.value)">`;

    let cat = row.insertCell();
    cat.innerHTML = `
      <select onchange="updateItem(${index}, 'cat', this.value)">
        <option value="main" ${item.cat=="main"?"selected":""}>Main</option>
        <option value="dessert" ${item.cat=="dessert"?"selected":""}>Dessert</option>
        <option value="drink" ${item.cat=="drink"?"selected":""}>Drink</option>
      </select>
    `;
    // available checkbox
row.insertCell().innerHTML = `<input type="checkbox"
${item.available !== false ? 'checked' : ''}
onchange="toggleAvailability(${index}, this.checked)">
`;
// description edit button
row.insertCell().innerHTML = `
  <button onclick="openDescEditor(${index})">📝 Description</button>
`;
    row.insertCell().innerHTML = `<button onclick="deleteItem(${item.id})">❌</button>`;
  });
}
function updateItem(index, field, value) {
  if (!menu[index]) return;

  if (field === "price") {
    const n = Number(value);
    menu[index][field] = Number.isFinite(n) ? n : (menu[index][field] || 0);
  } else {
    menu[index][field] = value;
  }

  // live refresh menu without saving
  renderMenu(pages[pageIndex], document.getElementById("searchInput")?.value || "");
}
// Delete by id
function deleteItem(id) {
  menu = menu.filter(i => i.id !== id);
  saveMenu();
  loadAdmin();
}
function addItem() {
  let id = Date.now();
  // Added 'img' property here so new items aren't broken
  menu.push({id, en:"New Item", am:"አዲስ ነገር", price:100, cat:"main", img:"placeholder.jpg", available: true});
  saveMenu();
  renderMenu(pages[pageIndex]);
  loadAdmin();
}

function toggleAvailability(index, checked) {
  if (!menu[index]) return;
  menu[index].available = checked;
  saveMenu();
  renderMenu(pages[pageIndex]);
}
// PAGE  FLIPBOOK LOGIC
// we expect an element .page wrapping #menuArea
function flipTo(index) {
  if (index < 0 || index >= pages.length) return;

  const pageEl = document.querySelector(".page");
  const prev = pageIndex;

  if (!pageEl) return;

  // 🔊 PLAY FLIP SOUND
  const audio = document.getElementById("flipSound");
  if (audio) {
    audio.pause();
    audio.currentTime = 0;
    audio.play().catch(err => console.log("Sound blocked:", err));
  }

  pageEl.classList.remove("flip-forward", "flip-back");

  const forward = index > prev;
  const ANIM = 500;

  // BACKWARD: change content first
  if (!forward) {
    pageIndex = index;
    renderMenu(pages[pageIndex]);
    updateActiveTab();
  }

  // APPLY FLIP
  requestAnimationFrame(() => {
    pageEl.classList.add(forward ? "flip-forward" : "flip-back");
  });

  // FORWARD: change after animation
  if (forward) {
    setTimeout(() => {
      pageIndex = index;
      renderMenu(pages[pageIndex]);
      updateActiveTab();
    }, ANIM);
  }

  // CLEANUP
  setTimeout(() => {
    pageEl.classList.remove("flip-forward", "flip-back");
  }, ANIM + 40);
}

function nextPage() {
  if (pageIndex < pages.length - 1) flipTo(pageIndex + 1);
}

function prevPage() {
  if (pageIndex > 0) flipTo(pageIndex - 1);
}

// SWIPE HANDLING (touch)
(function attachSwipe() {
  const book = document.getElementById("book");
  if (!book) return;
  let startX = 0;

  book.addEventListener("touchstart", function (e) {
    startX = e.touches[0].clientX;
  }, {passive:true});

  book.addEventListener("touchend", function (e) {
    let endX = e.changedTouches[0].clientX;
    let diff = endX - startX;
    if (diff < -60) nextPage();
    else if (diff > 60) prevPage();
  });
})();

// ACTIVE TAB UI
function updateActiveTab() {
  const tabs = document.querySelectorAll("#topTabs .tab");

  tabs.forEach(tab => tab.classList.remove("active"));

  if (tabs[pageIndex]) {
    tabs[pageIndex].classList.add("active");
  }
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./service-worker.js")
      .then(reg => {
        console.log("Service Worker registered:", reg.scope);
      })
      .catch(err => {
        console.error("Service Worker failed:", err);
      });
  });
}
// SPLASH — CIRCULAR MASK REVEAL
window.addEventListener("load", () => {
  const splash = document.getElementById("splash");

  if (!splash) return;

  // small initial delay so first paint completes — keep this very short so backdrop is brief
  setTimeout(() => {
    splash.classList.add("reveal");

    // keep splash visible for this many ms before hiding (title stay duration)
    const VISIBLE_MS = 2500;    const CIRCLE_CLOSE_DELAY = 5000; // Additional delay before circle closes
    setTimeout(() => {
      splash.classList.add("hide");

      // remove element after CSS transition finishes (slightly longer than transition)
      setTimeout(() => {
        try {
          if (splash && splash.parentNode) splash.parentNode.removeChild(splash);
        } catch (e) { /* ignore */ }
      }, 1500);

    }, VISIBLE_MS);

  }, 700);
});

//OPTIONAL
document.addEventListener("click", () => {
  if (audioUnlocked) return;

  const audio = document.getElementById("flipSound");
  if (audio) {
    audio.muted = true;
    audio.play().then(() => {
      audio.pause();
      audio.currentTime = 0;
      audio.muted = false;
      audioUnlocked = true;
    }).catch(() => {});
  }
}, { once: true });

// Tooltip not used anymore (description shown inline under name)

// === Description Editor Logic ===
let currentDescIndex = null;  // tracks which menu item is being edited

function openDescEditor(index) {
  currentDescIndex = index;
  const modal = document.getElementById("descModal");
  const enBox = document.getElementById("descEnBox");
  const amBox = document.getElementById("descAmBox");

  const food = menu[index];
  if (!food) return;

  if (!modal || !enBox || !amBox) return;

  enBox.value = food.desc || "";
  amBox.value = food.desc_am || "";

  modal.style.display = "flex";
}
// attach modal buttons safely
const descCancelBtn = document.getElementById("descCancelBtn");
if (descCancelBtn) descCancelBtn.addEventListener("click", () => {
  const modal = document.getElementById("descModal");
  if (modal) modal.style.display = "none";
});

const descSaveBtn = document.getElementById("descSaveBtn");
if (descSaveBtn) descSaveBtn.addEventListener("click", () => {
  const modal = document.getElementById("descModal");
  const food = menu[currentDescIndex];
  if (!food) return;

  const enBox = document.getElementById("descEnBox");
  const amBox = document.getElementById("descAmBox");
  if (!enBox || !amBox) return;

  food.desc = enBox.value.trim();
  food.desc_am = amBox.value.trim();

  saveMenu();
  renderMenu(pages[pageIndex]);
  if (modal) modal.style.display = "none";
});