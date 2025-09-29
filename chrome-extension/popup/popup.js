(function(){
  const STORAGE_KEY = 'stravaFeedFilter';
  const DEFAULTS = { enabled: true };

  function loadSettings(){
    return new Promise(resolve => {
      try {
        chrome.storage.local.get(STORAGE_KEY, data => {
          const settings = data && data[STORAGE_KEY] ? data[STORAGE_KEY] : DEFAULTS;
          resolve(Object.assign({}, DEFAULTS, settings));
        });
      } catch(e){ resolve(Object.assign({}, DEFAULTS)); }
    });
  }

  function saveSettings(settings){
    try { chrome.storage.local.set({ [STORAGE_KEY]: settings }); } catch(e){}
  }

  async function init(){
    const toggle = document.getElementById('toggle-enabled');
    const versionEl = document.getElementById('version');
    const settings = await loadSettings();
    toggle.checked = !!settings.enabled;

    // Set dynamic version from manifest
    try {
      const manifest = chrome.runtime.getManifest();
      if (manifest && manifest.version && versionEl) {
        versionEl.textContent = `v${manifest.version}`;
      }
    } catch (e) {}

    // Initialize badge
    try {
      chrome.action.setBadgeText({ text: settings.enabled ? 'ON' : 'OFF' });
      chrome.action.setBadgeBackgroundColor({ color: settings.enabled ? '#10B981' : '#EF4444' });
    } catch (e) {}

    toggle.addEventListener('change', async () => {
      settings.enabled = toggle.checked;
      saveSettings(settings);
      // Update badge state
      try {
        chrome.action.setBadgeText({ text: settings.enabled ? 'ON' : 'OFF' });
        chrome.action.setBadgeBackgroundColor({ color: settings.enabled ? '#10B981' : '#EF4444' });
      } catch (e) {}
      // Notify all tabs on strava.com to re-apply filters
      const tabs = await chrome.tabs.query({ url: '*://www.strava.com/*' });
      for (const tab of tabs) {
        try { chrome.tabs.sendMessage(tab.id, { type: 'SFF_TOGGLE_ENABLED', enabled: settings.enabled }); } catch(e){}
      }
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
