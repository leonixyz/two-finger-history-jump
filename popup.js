// This script is responsible for implementing the UI of the extension. It allows
// to change the extension settings. The actual modification is performed by the
// background script bg.js which keeps track of the current values and stores
// them into the browser's storage.

(async () => {
  let settings = {};

  // sends a message to the background script to save the current settings
  const saveSettings = newSettings => {
    return browser.runtime.sendMessage({
      cmd: 'setSettings',
      settings: newSettings
    });
  };

  // sends a message to the background script to reset the settings to their
  // default values
  const resetSettings = () => {
    return browser.runtime.sendMessage({
      cmd: 'resetSettings'
    });
  };

  // sends a message to the background script to get the current settings
  const getSettings = () => {
    return browser.runtime.sendMessage({
      cmd: 'getSettings'
    });
  };

  // updates the UI given the current settings
  const updateUI = settings => {
    document.querySelector('#timeout').value = settings.timeout;
    document.querySelector('#timeout-badge').innerText = `${settings.timeout} ms`;
    document.querySelector('#threshold').value = settings.threshold;
    document.querySelector('#threshold-badge').innerText = settings.threshold;
    document.querySelector('#feedback-size').value = settings.feedbackSize;
    document.querySelector('#feedback-size-badge').innerText = `${settings.feedbackSize} pixels`;
    // document.querySelector('#feedback-color').value = settings.feedbackColor;
    // document.querySelector('#feedback-color-badge').innerText = settings.feedbackColor;
  };

  // saves the current settings and updates the UI
  const handleSettingsUpdate = () => {
    saveSettings(settings).then(s => updateUI(s));
  };


  // **************************************************
  window.addEventListener('DOMContentLoaded', (event) => {
    getSettings().then(s => {
      updateUI(s);
      settings = s;
    });
  });

  document.querySelector('#threshold').addEventListener('change', e => {
    settings.threshold = parseInt(e.target.value);
    handleSettingsUpdate();
  });

  document.querySelector('#timeout').addEventListener('change', e => {
    settings.timeout = parseInt(e.target.value);
    handleSettingsUpdate();
  });

  document.querySelector('#feedback-size').addEventListener('change', e => {
    settings.feedbackSize = parseInt(e.target.value);
    handleSettingsUpdate();
  });

  // document.querySelector('#feedback-color').addEventListener('change', e => {
  //   settings.feedbackColor = e.target.value;
  //   handleSettingsUpdate();
  // });

  document.querySelector('#save-btn').addEventListener('click', async e => {
    settings = saveSettings(settings).then(s => window.close());
  });
  
  document.querySelector('#reset-btn').addEventListener('click', async e => {
    resetSettings().then(s => {
      settings = s;
      updateUI(s);
    });   
  });
})();

