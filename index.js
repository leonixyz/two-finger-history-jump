// This script is responsible for implementing the functionality of
// going back/forward in the navigation history when the user scrolls
// the page left/right using the touchpad.
// Each horizontal scroll event is intercepted and if the total motion
// within a given time is greather than a threshold, the code triggers
// a history.back() or .forward()
// Settings are handled by the background script bg.js.

(async () => {
  // define a motion accumulator
  let counter = 0;

  // define a variable to store the reset after timeout function
  let timeout;

  // get settings  
  let settings = await browser.runtime.sendMessage({ cmd: 'getSettings' });
  
  // create a visual feedback element to show the accumulator status
  let feedback = document.createElement('DIV');
  feedback.style.position = 'fixed';
  feedback.style.bottom = '0';
  feedback.style.left = '0';
  feedback.style.opacity = '0';
  feedback.style.width = '100%';
  feedback.style.height = `${settings.feedbackSize || 5}px`;
  feedback.style.backgroundColor = settings.feedbackColor || '#888888';
  feedback.style.transition = 'left 0.1s linear, opacity 0.5s';
  feedback.style.zIndex = 2147483647;
  feedback.innerHTML = '&nbsp;';
  document.body.appendChild(feedback);

  // execute each time a page is scrolled
  document.addEventListener('wheel', async e => {
    // do nothing if scroll event is vertical
    if (!e.deltaX) return;

    // set the opacity to 100%
    feedback.style.opacity = 1;
    
    // get settings again (this code doesn't seem to hurt performances and
    // it allows to apply the latest settings without needing to reload the
    // current page)
    settings = await browser.runtime.sendMessage({ cmd: 'getSettings' });
  
    // cancel the reset timeout
    clearTimeout(timeout);

    // accumulates the motion from this event
    counter += e.deltaX;

    // move the feedback div to show the accumulator status
    feedback.style.left = Math.floor((counter / (50 - settings.threshold)) * 100) + '%';

    // if the total motion is greather than threshold
    if (Math.abs(counter) >= (50 - settings.threshold)) {
      // move the feedback div out of the way
      feedback.style.display = 'none';
      // navigate back/forward in history
      if (counter > 0) { 
        setTimeout(window.history.forward(), 200);
      } else {
        setTimeout(window.history.back(), 200);
      }
    }
    
    // in any case, reset the motion accumulator and the feedback after a timeout
    timeout = setTimeout(() => feedback.style.opacity = feedback.style.left = counter = 0, settings.timeout);
  });
})();
