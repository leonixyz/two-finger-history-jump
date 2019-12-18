// This background script is responsible for managing the extension settings.
// Whenever a content script or a popup script needs to retrieve or modify the
// settings it has to send a message which is handled here.

(async () => {
  // defaults
  const defaultSettings = {
    threshold: 20,
    timeout: 1000
  }

  // get stored settings or default ones
  let settings = await browser.storage.local.get();
  if (!settings || !settings.timeout || !settings.threshold) {
    settings = defaultSettings;
  }

  // listen to messages from content script / popup
  browser.runtime.onMessage.addListener(request => {
    // cmd required
    if (!request.cmd) {
      return sendResponse({ error: 'Nothing to do.' });
    }

    switch (request.cmd) {
      case 'getSettings': 
        return Promise.resolve(settings);

      case 'resetSettings':
        settings = defaultSettings;
        return browser.storage.local.set(settings)
          .then(() => settings)
          .catch(error => {
            return { error: error };
          });

      case 'setSettings':
        if (!request.settings) {
          return Promise.resolve({ error: 'No settings to save.' });
        }
        settings = request.settings;
        return browser.storage.local.set(settings)
          .then(() => settings)
          .catch(error => {
            return { error: error };
          });
    
      default:
        return Promise.resolve({ error: 'Command unknown.' });
    }
  });
})();
