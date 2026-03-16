// Background service worker for Design Vault Clipper extension

// Open side panel when extension icon is clicked
chrome.action.onClicked.addListener((tab) => {
  if (tab.id) {
    chrome.sidePanel.open({ tabId: tab.id });
  }
});

// Listen for messages from content script and relay to side panel
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'IMAGES_SELECTED') {
    // Forward to all extension contexts (the side panel will pick it up)
    chrome.runtime.sendMessage(message).catch(() => {
      // Side panel may not be open — that's ok
    });
    sendResponse({ received: true });
  }

  if (message.type === 'GET_AUTH_STATE') {
    chrome.storage.local.get('dv_auth_token', (result) => {
      sendResponse({ hasToken: !!result.dv_auth_token });
    });
    return true; // Keep message channel open for async response
  }
});

// Set side panel behavior — open on action click
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {
  // setPanelBehavior may not be available in all Chrome versions
});
