(function(){
  const STORAGE_KEY = 'stravaFeedFilter';
  const DEFAULTS = {
    keywords: [],
    allowedAthletes: [],
    ignoredAthletes: [],
    types: {},
    hideNoMap: false,
    hideGiveGift: false,
    hideClubPosts: false,
    hideChallenges: false,
    hideJoinedChallenges: false,
    hideSuggestedFriends: false,
    hideYourClubs: false,
    hideMyWindsock: false,
    hideSummitbag: false,
    hideRunHealth: false,
    hideWandrer: false,
    hideJoinWorkout: false,
    hideCoachCat: false,
    hideAthleteJoinedClub: false,
    hideFooter: false,
    showKudosButton: false,
    minKm: "",
    maxKm: "",
    minMins: "",
    maxMins: "",
    minElevM: "",
    maxElevM: "",
    minPace: "",
    maxPace: "",
    unitSystem: 'metric',
    enabled: true
  };

  function loadSettings(){
    return new Promise(resolve => {
      try {
        chrome.storage.local.get(STORAGE_KEY).then(data => {
          const settings = data && data[STORAGE_KEY] ? data[STORAGE_KEY] : DEFAULTS;
          resolve(Object.assign({}, DEFAULTS, settings));
        }).catch(() => resolve(Object.assign({}, DEFAULTS)));
      } catch(e){ resolve(Object.assign({}, DEFAULTS)); }
    });
  }

  function saveSettings(settings){
    return new Promise((resolve, reject) => {
      try { 
        chrome.storage.local.set({ [STORAGE_KEY]: settings }).then(() => {
          resolve();
        }).catch(reject);
      } catch(e){ 
        reject(e);
      }
    });
  }

  async function init(){
    const toggle = document.getElementById('toggle-enabled');
    const versionEl = document.getElementById('version');
    const changelogVersionEl = document.getElementById('changelog-version');
    const settings = await loadSettings();
    toggle.checked = !!settings.enabled;

    // Set dynamic version from manifest
    try {
      const manifest = chrome.runtime.getManifest();
      if (manifest && manifest.version) {
        if (versionEl) {
          versionEl.textContent = `v${manifest.version}`;
        }
        if (changelogVersionEl) {
          changelogVersionEl.textContent = manifest.version;
        }
      }
    } catch (e) {
      console.error('Failed to set version:', e);
      if (versionEl) {
        versionEl.textContent = 'v2.4.7'; // Fallback
      }
      if (changelogVersionEl) {
        changelogVersionEl.textContent = '2.4.7'; // Fallback
      }
    }

    // Initialize badge
    try {
      await chrome.action.setBadgeText({ text: settings.enabled ? 'ON' : 'OFF' });
      await chrome.action.setBadgeBackgroundColor({ color: settings.enabled ? '#10B981' : '#EF4444' });
    } catch (e) {}

    toggle.addEventListener('change', async () => {
      settings.enabled = toggle.checked;
      saveSettings(settings);
      // Update badge state
      try {
        await chrome.action.setBadgeText({ text: settings.enabled ? 'ON' : 'OFF' });
        await chrome.action.setBadgeBackgroundColor({ color: settings.enabled ? '#10B981' : '#EF4444' });
      } catch (e) {}
      // Notify all tabs on strava.com to re-apply filters
      const tabs = await chrome.tabs.query({ url: '*://www.strava.com/*' });
      for (const tab of tabs) {
        try { await chrome.tabs.sendMessage(tab.id, { type: 'SFF_TOGGLE_ENABLED', enabled: settings.enabled }); } catch(e){}
      }
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
