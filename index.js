// This script is responsible for implementing the functionality of
// going back/forward in the navigation history when the user scrolls
// the page left/right using the touchpad.
// Each horizontal scroll event is intercepted and if the total motion
// within a given time is greather than a threshold, the code triggers
// a history.back() or .forward()
// Settings are handled by the background script bg.js.

(() => {
  // define a motion accumulator
  let counter = 0;

  // execute each time a page is scrolled
  document.addEventListener('wheel', async e => {
    // get settings 
    let settings = await browser.runtime.sendMessage({ cmd: 'getSettings' });
  
    // do nothing if scroll event is vertical
    if (!e.deltaX) return;
   
    // accumulates the motion from this event
    counter += e.deltaX;

    // if the total motion is greather than threshold
    if (Math.abs(counter) >= (30 - settings.threshold)) {
      // navigate back/forward in history
      if (counter > 0) {
        window.history.forward();
      } else {
        window.history.back();
      }
      // reset the motion accumulator
      counter = 0;
    }
    
    // in any case, reset the motion accumulator after a timeout
    setTimeout(() => counter = 0, settings.timeout);
  });
})();
