const input = document.getElementById("siteInput");
const addButton = document.getElementById("addBtn");
const list = document.getElementById("siteList");

let sites = [];

/**
 * Simplifies the website url given by the user.
 * @param {*} value website url
 * @returns normalized hostname if succesful, otherwise null
 */

function normalizeSite(value) {
  try {

    if (!value.startsWith("http://") && !value.startsWith("https://")) {
      value = "https://" + value;
    }

    const url = new URL(value);
    let hostname = url.hostname.toLowerCase();


    if (hostname.startsWith("www.")) {
      hostname = hostname.slice(4);
    }

    return hostname;
  } catch {
    return null;
  }
}

/**
 * Loads blocked sites from storage, re-renders the blocked sites list.
 */
function loadSites() {
  chrome.storage.sync.get(["blockedSites"], (result) => {
    sites = result.blockedSites || [];
    render();
  });
}

/**
 * Saves blocked sites to storage.
 */
function saveSites() {
  chrome.storage.sync.set({ blockedSites: sites });
}

/**
 * Renders list of blocked websites, 
 * including the normalized web url, a remove button and the favicon of each web url, if possible.
 */
function render() {
  list.innerHTML = "";

  sites.forEach((site, index) => {
    const li = document.createElement("li");

    const left = document.createElement("div");
    left.style.display = "flex";
    left.style.alignItems = "center";
    left.style.gap = "10px";

    const img = document.createElement("img");
    img.src = `https://www.google.com/s2/favicons?domain=${site}`;
    img.width = 16;
    img.height = 16;

    const span = document.createElement("span");
    span.textContent = site;

    left.appendChild(img);
    left.appendChild(span);

    const removeButton = document.createElement("button");
    removeButton.textContent = "Remove";
    removeButton.className = "remove";

    removeButton.onclick = () => {
      sites.splice(index, 1);
      saveSites();
      render();
    };

    li.appendChild(left);
    li.appendChild(removeButton);
    list.appendChild(li);
  });
}

/**
 * Event listener for the add button.
 * Adds added sites to blocked web site list and re-renders it accordingly.
 */
addButton.addEventListener("click", () => {
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

/**
 * Input confirmation through enter instead of add button.
 */
input.addEventListener("keypress", (e) => {
  if (e.key === "Enter") addButton.click();
});

// Init
loadSites();

// Initalize vars with input of user
const weekendsEnabled = document.getElementById("weekendsEnabled");
const startInput = document.getElementById("startTime");
const endInput = document.getElementById("endTime");
const saveScheduleButton = document.getElementById("saveScheduleBtn");

/**
 * Event listener for checkbox.
 * Saves whether weekends are included or excluded from schedule to storage.
 */
weekendsEnabled.addEventListener("change", () => {
  chrome.storage.sync.set({weekendsEnabled: weekendsEnabled.checked});
});

/**
 * Loads the schedule for when websites should be blocked from storage,
 * including decision of whether weekends are included.
 * Defaults to start 9am and end 5pm.
 */
function loadSchedule() {
  chrome.storage.sync.get(["focusSchedule"], (result) => {
    const schedule = result.focusSchedule || { start: "09:00", end: "17:00" };
    startInput.value = schedule.start;
    endInput.value = schedule.end;
  });
  chrome.storage.sync.get(["weekendsEnabled"], (result) => {
    weekendsEnabled.checked = result.weekendsEnabled || false;
  });
}

/**
 * Event listener for save schedule button.
 * Saves selected schedule to storage and gives user visual feedback to confirm success.
 */
saveScheduleButton.addEventListener("click", () => {
  const schedule = { start: startInput.value, end: endInput.value };
  chrome.storage.sync.set({ focusSchedule: schedule });
  chrome.storage.sync.set({weekendsEnabled: weekendsEnabled.checked});
  
  const tmp = saveScheduleButton.textContent;
  saveScheduleButton.textContent ="Saved successfully!";
  setTimeout(() => {
    saveScheduleButton.textContent = tmp;
  },3000);
});

// Initialize schedule
loadSchedule();