// Background service worker for Firefox MV3
// Keeps the action badge in sync with stored settings on startup and whenever settings change

const STORAGE_KEY = 'stravaFeedFilter';

async function getSettings() {
  // console.log('SFF BG: getSettings called');
  try {
    const data = await browser.storage.local.get(STORAGE_KEY);
    // console.log('SFF BG: Storage data:', data);
    const defaults = { enabled: true };
    const result = Object.assign({}, defaults, data && data[STORAGE_KEY] ? data[STORAGE_KEY] : {});
    // console.log('SFF BG: Settings result:', result);
    return result;
  } catch (e) {
    // console.error('SFF BG: Error getting settings:', e);
    return { enabled: true };
  }
}

async function updateBadgeFromSettings() {
  // console.log('SFF BG: updateBadgeFromSettings called');
  try {
    const settings = await getSettings();
    // console.log('SFF BG: Updating badge with settings:', settings);
    const text = settings.enabled ? 'ON' : 'OFF';
    const color = settings.enabled ? '#10B981' : '#EF4444';
    // console.log('SFF BG: Setting badge text to:', text);
    await browser.action.setBadgeText({ text });
    // console.log('SFF BG: Setting badge color to:', color);
    try { await browser.action.setBadgeBackgroundColor({ color }); } catch (e) { /* console.error('SFF BG: Error setting badge color:', e); */ }
    // console.log('SFF BG: Badge updated successfully');
  } catch (e) {
    // console.error('SFF BG: Error updating badge:', e);
    // noop
  }
}

// Initialize on worker startup
// console.log('SFF BG: Background script started');
updateBadgeFromSettings();

// Also on install/update
try {
  // console.log('SFF BG: Adding onInstalled listener');
  browser.runtime.onInstalled.addListener(updateBadgeFromSettings);
} catch (e) { /* console.error('SFF BG: Error adding onInstalled listener:', e); */ }

// React to storage changes
try {
  // console.log('SFF BG: Adding storage change listener');
  browser.storage.onChanged.addListener((changes, area) => {
    // console.log('SFF BG: Storage changed:', changes, area);
    if (area === 'local' && changes[STORAGE_KEY]) {
      updateBadgeFromSettings();
    }
  });
} catch (e) { /* console.error('SFF BG: Error adding storage change listener:', e); */ }
