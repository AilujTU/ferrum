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
          target: { tabId: tabId },
          func: () => {
            alert("⚠️ This site is blocked to help you stay focused.");
          }
        });

        setTimeout(() => {
          chrome.tabs.remove(tabId);
        }, 2000);
      }
    });
  }
});
