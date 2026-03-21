const input = document.getElementById("siteInput");
const addBtn = document.getElementById("addBtn");
const list = document.getElementById("siteList");

let sites = [];

// Load sites
function loadSites() {
  chrome.storage.sync.get(["blockedSites"], (result) => {
    sites = result.blockedSites || [];
    render();
  });
}

// Save sites
function saveSites() {
  chrome.storage.sync.set({ blockedSites: sites });
}

// Render list
function render() {
  list.innerHTML = "";

  sites.forEach((site, index) => {
    const li = document.createElement("li");

    const span = document.createElement("span");
    span.textContent = site;

    const removeBtn = document.createElement("button");
    removeBtn.textContent = "remove";
    removeBtn.className = "remove";

    removeBtn.onclick = () => {
      sites.splice(index, 1);
      saveSites();
      render();
    };

    li.appendChild(span);
    li.appendChild(removeBtn);
    list.appendChild(li);
  });
}

// Add site
addBtn.addEventListener("click", () => {
  const value = input.value.trim();

  if (value && !sites.includes(value)) {
    sites.push(value);
    input.value = "";
    saveSites();
    render();
  }
});

// Optional: press Enter to add
input.addEventListener("keypress", (e) => {
  if (e.key === "Enter") addBtn.click();
});

// Init
loadSites();