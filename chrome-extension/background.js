// Chrome MV3 background script to keep the action badge in sync with settings
const STORAGE_KEY = 'stravaFeedFilter';

async function getSettings() {
  return new Promise(resolve => {
    try {
      chrome.storage.local.get(STORAGE_KEY, data => {
        const defaults = { enabled: true };
        const settings = data && data[STORAGE_KEY] ? data[STORAGE_KEY] : defaults;
        resolve(Object.assign({}, defaults, settings));
      });
    } catch (e) { resolve({ enabled: true }); }
  });
}

async function updateBadgeFromSettings() {
  try {
    const settings = await getSettings();
    const text = settings.enabled ? 'ON' : 'OFF';
    const color = settings.enabled ? '#10B981' : '#EF4444';
    chrome.action.setBadgeText({ text });
    try { chrome.action.setBadgeBackgroundColor({ color }); } catch (_) {}
  } catch (_) {}
}

updateBadgeFromSettings();

chrome.runtime.onInstalled.addListener(() => {
  updateBadgeFromSettings();
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes[STORAGE_KEY]) {
    updateBadgeFromSettings();
  }
});
