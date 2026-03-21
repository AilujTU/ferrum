const input = document.getElementById("siteInput");
const addBtn = document.getElementById("addBtn");
const list = document.getElementById("siteList");

let sites = [];

// Normalize input (important!)
function normalizeSite(value) {
  try {
    // Add protocol if missing so URL() works
    if (!value.startsWith("http://") && !value.startsWith("https://")) {
      value = "https://" + value;
    }

    const url = new URL(value);
    let hostname = url.hostname.toLowerCase();

    // Remove "www."
    if (hostname.startsWith("www.")) {
      hostname = hostname.slice(4);
    }

    return hostname;
  } catch {
    return null;
  }
}

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

    // Left side (favicon + text)
    const left = document.createElement("div");
    left.style.display = "flex";
    left.style.alignItems = "center";
    left.style.gap = "10px";

    // Favicon
    const img = document.createElement("img");
    img.src = `https://www.google.com/s2/favicons?domain=${site}`;
    img.width = 16;
    img.height = 16;

    // Site text
    const span = document.createElement("span");
    span.textContent = site;

    left.appendChild(img);
    left.appendChild(span);

    // Remove button
    const removeBtn = document.createElement("button");
    removeBtn.textContent = "Remove";
    removeBtn.className = "remove";

    removeBtn.onclick = () => {
      sites.splice(index, 1);
      saveSites();
      render();
    };

    li.appendChild(left);
    li.appendChild(removeBtn);
    list.appendChild(li);
  });
}

// Add site
addBtn.addEventListener("click", () => {
  const rawValue = input.value.trim();
  const normalized = normalizeSite(rawValue);

  if (!normalized) {
    alert("Invalid website");
    return;
  }

  if (!sites.includes(normalized)) {
    sites.push(normalized);
    input.value = "";
    saveSites();
    render();
  }
});

// Enter key support
input.addEventListener("keypress", (e) => {
  if (e.key === "Enter") addBtn.click();
});

// Init
loadSites();

const startInput = document.getElementById("startTime");
const endInput = document.getElementById("endTime");
const saveScheduleBtn = document.getElementById("saveScheduleBtn");

// Load schedule
function loadSchedule() {
  chrome.storage.sync.get(["focusSchedule"], (result) => {
    const schedule = result.focusSchedule || { start: "09:00", end: "17:00" };
    startInput.value = schedule.start;
    endInput.value = schedule.end;
  });
}

// Save schedule
saveScheduleBtn.addEventListener("click", () => {
  const schedule = { start: startInput.value, end: endInput.value };
  chrome.storage.sync.set({ focusSchedule: schedule });
  alert("Schedule saved!");
});

// Initialize schedule
loadSchedule();