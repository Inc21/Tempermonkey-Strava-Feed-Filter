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
        browser.storage.local.get(STORAGE_KEY).then(data => {
          const settings = data && data[STORAGE_KEY] ? data[STORAGE_KEY] : DEFAULTS;
          resolve(Object.assign({}, DEFAULTS, settings));
        }).catch(() => resolve(Object.assign({}, DEFAULTS)));
      } catch(e){ resolve(Object.assign({}, DEFAULTS)); }
    });
  }

  function saveSettings(settings){
    return new Promise((resolve, reject) => {
      try { 
        browser.storage.local.set({ [STORAGE_KEY]: settings }).then(() => {
          resolve();
        }).catch(reject);
      } catch(e){ 
        reject(e);
      }
    });
  }

  function showMessage(text, type = 'success'){
    const msg = document.getElementById('message');
    if (!msg) return;
    msg.textContent = text;
    msg.className = `p-message ${type}`;
    setTimeout(() => {
      msg.textContent = '';
      msg.className = 'p-message';
    }, 3000);
  }

  function exportSettings(settings){
    try {
      const manifest = browser.runtime.getManifest();
      const exportData = {
        version: manifest?.version || 'unknown',
        exportDate: new Date().toISOString(),
        settings: settings
      };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const date = new Date().toISOString().split('T')[0];
      a.href = url;
      a.download = `strava-feed-filter-settings-${date}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showMessage('Settings exported successfully!', 'success');
    } catch(e){
      showMessage('Export failed. Please try again.', 'error');
      console.error('Export error:', e);
    }
  }

  function importSettings(file){
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        let settings = imported.settings || imported;
        
        // Validate it's an object
        if (typeof settings !== 'object' || settings === null) {
          throw new Error('Invalid settings format');
        }

        // Merge with defaults to handle new/missing fields
        settings = Object.assign({}, DEFAULTS, settings);
        
        console.log('Importing settings:', settings);
        
        // Save and wait for completion
        await saveSettings(settings);
        console.log('Settings saved successfully');
        
        showMessage('Settings imported successfully!', 'success');
        
        // Notify all Strava tabs to reload settings
        const tabs = await browser.tabs.query({ url: '*://www.strava.com/*' });
        console.log('Notifying tabs:', tabs.length);
        for (const tab of tabs) {
          try { 
            await browser.tabs.sendMessage(tab.id, { type: 'SFF_SETTINGS_UPDATED' }); 
          } catch(e){
            console.warn('Failed to notify tab:', tab.id, e);
          }
        }
        
        // Reload popup to reflect changes
        setTimeout(() => window.location.reload(), 1500);
      } catch(e){
        showMessage('Import failed. Invalid file format.', 'error');
        console.error('Import error:', e);
      }
    };
    reader.onerror = () => {
      showMessage('Failed to read file.', 'error');
    };
    reader.readAsText(file);
  }

  async function resetSettings(){
    if (confirm('Are you sure you want to reset all settings to defaults? This cannot be undone.')) {
      await saveSettings(DEFAULTS);
      showMessage('Settings reset to defaults!', 'success');
      
      // Notify all Strava tabs to reload
      const tabs = await browser.tabs.query({ url: '*://www.strava.com/*' });
      for (const tab of tabs) {
        try { 
          await browser.tabs.sendMessage(tab.id, { type: 'SFF_SETTINGS_UPDATED' }); 
        } catch(e){}
      }
      
      setTimeout(() => window.location.reload(), 1500);
    }
  }

  async function init(){
    const toggle = document.getElementById('toggle-enabled');
    const versionEl = document.getElementById('version');
    const settings = await loadSettings();
    toggle.checked = !!settings.enabled;

    // Set dynamic version from manifest
    try {
      const manifest = browser.runtime.getManifest();
      if (manifest && manifest.version && versionEl) {
        versionEl.textContent = `v${manifest.version}`;
      }
    } catch (e) {}

    // Initialize badge
    try {
      await browser.action.setBadgeText({ text: settings.enabled ? 'ON' : 'OFF' });
      await browser.action.setBadgeBackgroundColor({ color: settings.enabled ? '#10B981' : '#EF4444' });
    } catch (e) {}

    toggle.addEventListener('change', async () => {
      settings.enabled = toggle.checked;
      saveSettings(settings);
      // Update badge state
      try {
        await browser.action.setBadgeText({ text: settings.enabled ? 'ON' : 'OFF' });
        await browser.action.setBadgeBackgroundColor({ color: settings.enabled ? '#10B981' : '#EF4444' });
      } catch (e) {}
      // Notify all tabs on strava.com to re-apply filters
      const tabs = await browser.tabs.query({ url: '*://www.strava.com/*' });
      for (const tab of tabs) {
        try { await browser.tabs.sendMessage(tab.id, { type: 'SFF_TOGGLE_ENABLED', enabled: settings.enabled }); } catch(e){}
      }
    });

    // Export button
    const exportBtn = document.getElementById('export-btn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => exportSettings(settings));
    }

    // Import button
    const importBtn = document.getElementById('import-btn');
    const importFile = document.getElementById('import-file');
    if (importBtn && importFile) {
      importBtn.addEventListener('click', () => importFile.click());
      importFile.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          importSettings(file);
          importFile.value = ''; // Reset input
        }
      });
    }

    // Reset button
    const resetBtn = document.getElementById('reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', resetSettings);
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
