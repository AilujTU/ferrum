
/**
 * Returns the blocked web sites from storage 
 * and performs the specified callback function.
 * @param callback function that is used on stored blocked sites
 */

function getBlockedSites(callback) {
  chrome.storage.sync.get(["blockedSites"], (result) => {
    callback(result.blockedSites || []);
  });
}


/**
 * Simply return all styling elements for the blocked screen shown 
 * if blocked website is accessed within schedule.
 * @returns focus overlay style css
 */
function getFocusOverlayStyle() {
  return `
        #focus-block-overlay {
          position: fixed;
          top:0; left:0; width:100%; height:100%;
          background: rgba(240,242,245,0.95);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 999999;
          backdrop-filter: blur(8px);
          font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif;
          animation: fadeInOverlay 0.3s forwards;
        }
        .focus-box {
          background:#fff; padding:36px 28px; border-radius:20px;
          max-width:400px; width:90%; min-height:180px;
          box-shadow:0 8px 24px rgba(0,0,0,0.12);
          display:flex; flex-direction:column;
          justify-content:center; align-items:center; gap:18px;
          text-align:center;
        }
        .focus-box h1 { margin:0; font-size:22px; font-weight:600; color:#2c3e50; }
        .focus-box p { margin:0; font-size:15px; color:#4f5b66; }
        #focus-close-btn { padding:12px 26px; border:none; border-radius:12px;
          background: linear-gradient(135deg,#6c63ff,#9b8fff); color:#fff; font-size:15px;
          cursor:pointer; min-width:130px; transition: background 0.3s, transform 0.2s;
        }
        #focus-close-btn:hover { background: linear-gradient(135deg,#5a52e6,#8678ff); transform:translateY(-2px); }
        @keyframes fadeInOverlay { from{opacity:0;} to{opacity:1;} }
      `;
}


/**
 * Checks if current time is within the blocked schedule.
 * If yes, the callback function is called with true.
 * If not, the callback function is called with false.
 * The schedule is assumed to span over midnight, 
 * if end time is samller than start time.
 * @param callback decides wether or not to display focus overlay for given website
 */
function isWithinSchedule(callback) {
  chrome.storage.sync.get(["focusSchedule"], (result) => {
    const schedule = result.focusSchedule || { start: "09:00", end: "17:00" };
    const now = new Date();
    const [startHour, startMin] = schedule.start.split(":").map(Number);
    const [endHour, endMin] = schedule.end.split(":").map(Number);

    const startTime = new Date();
    startTime.setHours(startHour, startMin, 0, 0);

    const endTime = new Date();
    endTime.setHours(endHour, endMin, 0, 0);

    if (endTime < startTime) {
      if (now >= startTime || now <= endTime) callback(true);
      else callback(false);
    } else {
      callback(now >= startTime && now <= endTime);
    }
  });
}
/**
 * Checks first if the schedule is not enabled for weekends and then if it's the weekend.
 * If yes, the callback function is called with true.
 * If not, the callback function is called with false.
 * @param callback decides the behaviour if schedule is enabled and it's the weekend
 */
function isNotEnabledAndWeekend(callback) {
  chrome.storage.sync.get(["weekendsEnabled"], (result) => {
    const day = new Date().getDay();
    if (!result && (day == 0 || day == 6)) callback(true);
    else callback(false);
  });
}

/**
 * Injects focus overlay if called, blocking the website from access.
 * @param tabId defines the target of the script
 */
function injectOverlay(tabId) {
  chrome.scripting.executeScript({
    target: { tabId },
    func: () => {
      if (document.getElementById("focus-block-overlay")) return;

      const overlay = document.createElement("div");
      overlay.id = "focus-block-overlay";

      overlay.innerHTML = `
        <div class="focus-box">
          <h1>Nope, not right now.</h1>
          <p>This site is blocked to help you stay productive.</p>
          <button id="focus-close-btn">Okay.</button>
        </div>
      `;

      const style = document.createElement("style");
      style.textContent = getFocusOverlayStyle();

      document.head.appendChild(style);
      document.body.appendChild(overlay);
      document.documentElement.style.overflow = "hidden";

      document.getElementById("focus-close-btn").onclick = () => {
        chrome.runtime.sendMessage({ action: "closeTab" });
      };
    }
  });
}

/**
 * Checks on change in tab, if a blocked website is currently visited.
 * If so, it further checks if it's within the blocked schedule and blocks accordingly.
 */
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== "complete" || !tab.url) return;

  getBlockedSites((blockedSites) => {
    const url = new URL(tab.url);
    if (!blockedSites.some(site => url.hostname.includes(site))) return;

    isWithinSchedule((shouldBlock) => {
      if (!shouldBlock) return;

      isNotEnabledAndWeekend((notEnabledAndWeekend) => {
        if (!notEnabledAndWeekend) injectOverlay(tabId);
      });
    });
  });
});


/**
 * Simple runtime listener for closing the tab.
 */
chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.action === "closeTab" && sender.tab?.id) {
    chrome.tabs.remove(sender.tab.id);
  }
});
