function getBlockedSites(callback) {
  chrome.storage.sync.get(["blockedSites"], (result) => {
    callback(result.blockedSites || []);
  });
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url) {
    const url = new URL(tab.url);

    getBlockedSites((blockedSites) => {
      if (blockedSites.some(site => url.hostname.includes(site))) {

        chrome.scripting.executeScript({
          target: { tabId },
          func: () => {
            if (document.getElementById("focus-block-overlay")) return;

            // Create overlay
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
            style.textContent = `
              /* Overlay */
              #focus-block-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(240, 242, 245, 0.95); /* soft light gray */
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 999999;
                backdrop-filter: blur(8px);
                opacity: 0;
                animation: fadeInOverlay 0.3s forwards;
                font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif;
              }

              /* Modal box */
              .focus-box {
                background: #ffffff;
                padding: 36px 28px;
                border-radius: 20px;
                max-width: 400px;
                width: 90%;
                min-height: 180px;
                box-shadow: 0 8px 24px rgba(0,0,0,0.12);
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                gap: 18px;
              }

              /* Heading */
              .focus-box h1 {
                margin: 0;
                font-size: 22px;
                font-weight: 600;
                color: #2c3e50; /* dark muted blue */
              }

              /* Paragraph */
              .focus-box p {
                margin: 0;
                font-size: 15px;
                color: #4f5b66; /* soft gray-blue */
                text-align: center;
              }

              /* Button */
              #focus-close-btn {
                padding: 12px 26px;
                border: none;
                border-radius: 12px;
                background: linear-gradient(135deg, #6c63ff, #9b8fff); /* soft purple gradient */
                color: #ffffff;
                font-size: 15px;
                cursor: pointer;
                min-width: 130px;
                transition: background 0.3s, transform 0.2s;
              }

              #focus-close-btn:hover {
                background: linear-gradient(135deg, #5a52e6, #8678ff);
                transform: translateY(-2px);
              }

              /* Fade-in */
              @keyframes fadeInOverlay {
                from { opacity: 0; }
                to { opacity: 1; }
              }
            `;

            document.head.appendChild(style);
            document.body.appendChild(overlay);

            // Block page scrolling
            document.documentElement.style.overflow = "hidden";

            // Close tab on button click
            document.getElementById("focus-close-btn").onclick = () => {
              chrome.runtime.sendMessage({ action: "closeTab" });
            };
          }
        });
      }
    });
  }
});

chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.action === "closeTab" && sender.tab?.id) {
    chrome.tabs.remove(sender.tab.id);
  }
});
