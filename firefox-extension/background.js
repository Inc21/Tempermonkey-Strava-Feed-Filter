// Background service worker for Firefox MV3
// Keeps the action badge in sync with stored settings on startup and whenever settings change

const STORAGE_KEY = 'stravaFeedFilter';

async function getSettings() {
  try {
    const data = await browser.storage.local.get(STORAGE_KEY);
    const defaults = { enabled: true };
    return Object.assign({}, defaults, data && data[STORAGE_KEY] ? data[STORAGE_KEY] : {});
  } catch (e) {
    return { enabled: true };
  }
}

async function updateBadgeFromSettings() {
  try {
    const settings = await getSettings();
    const text = settings.enabled ? 'ON' : 'OFF';
    const color = settings.enabled ? '#10B981' : '#EF4444';
    await browser.action.setBadgeText({ text });
    try { await browser.action.setBadgeBackgroundColor({ color }); } catch (_) {}
  } catch (e) {
    // noop
  }
}

// Initialize on worker startup
updateBadgeFromSettings();

// Also on install/update
try {
  browser.runtime.onInstalled.addListener(updateBadgeFromSettings);
} catch (_) {}

// React to storage changes
try {
  browser.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes[STORAGE_KEY]) {
      updateBadgeFromSettings();
    }
  });
} catch (_) {}
