(function() {
  const STORAGE_KEY = 'sffChromeSettings';
  const DEFAULTS = { enabled: true };

  function loadSettings() {
    return new Promise(resolve => {
      try {
        chrome.storage.sync.get([STORAGE_KEY], data => {
          const settings = data && data[STORAGE_KEY] ? data[STORAGE_KEY] : DEFAULTS;
          resolve({ ...DEFAULTS, ...settings });
        });
      } catch (e) {
        resolve({ ...DEFAULTS });
      }
    });
  }

  function saveSettings(settings) {
    try {
      chrome.storage.sync.set({ [STORAGE_KEY]: settings });
    } catch (e) {
      // no-op
    }
  }

  function createToggleUI(settings) {
    // Remove any existing UI first
    const prev = document.querySelector('#sff-chrome-ui');
    if (prev) prev.remove();

    const box = document.createElement('div');
    box.id = 'sff-chrome-ui';
    box.innerHTML = `
      <div class="sffc-header">
        <span class="sffc-title">Strava Feed Filter</span>
        <label class="sffc-switch" title="Enable/Disable the extension">
          <input type="checkbox" class="sffc-toggle" ${settings.enabled ? 'checked' : ''}>
          <span class="sffc-slider"></span>
        </label>
      </div>
      <div class="sffc-body">
        <div class="sffc-row">
          <a class="sffc-link" href="https://github.com/Inc21/Tempermonkey-Strava-Feed-Filter/issues" target="_blank" rel="noopener noreferrer">Report an issue on GitHub</a>
        </div>
        <div class="sffc-note">
          Strava updates the site periodically. If filters stop working, please report it before leaving a negative review so we can fix it. Thanks!
        </div>
      </div>
    `;

    const toggle = box.querySelector('.sffc-toggle');
    toggle.addEventListener('change', () => {
      settings.enabled = toggle.checked;
      saveSettings(settings);
      document.body.toggleAttribute('data-sff-chrome-enabled', settings.enabled);
      // Notify any listeners (future filtering code) of state change
      document.dispatchEvent(new CustomEvent('sff:chrome:enabled-changed', { detail: { enabled: settings.enabled } }));
    });

    document.body.appendChild(box);
    // Reflect state on body
    document.body.toggleAttribute('data-sff-chrome-enabled', settings.enabled);
  }

  function ensureStyles() {
    if (document.getElementById('sff-chrome-style')) return;
    const link = document.createElement('link');
    link.id = 'sff-chrome-style';
    link.rel = 'stylesheet';
    link.href = chrome.runtime.getURL('content/styles.css');
    document.head.appendChild(link);
  }

  function init() {
    ensureStyles();
    loadSettings().then(settings => {
      createToggleUI(settings);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
