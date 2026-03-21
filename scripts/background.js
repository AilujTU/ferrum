const blockedSites = ["reddit.com", "x.com", "twitter.com", "youtube.com"];

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url) {
    const url = new URL(tab.url);

    if (blockedSites.some(site => url.hostname.includes(site))) {
      
      // Show warning
      chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: () => {
          alert("⚠️ This site is blocked to help you stay focused.");
        }
      });

      // Close tab after short delay
      setTimeout(() => {
        chrome.tabs.remove(tabId);
      }, 3000);
    }
  }
});

