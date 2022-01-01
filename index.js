// This script is responsible for implementing the functionality of
// going back/forward in the navigation history when the user scrolls
// the page left/right using the touchpad.
// Settings are handled by the background script bg.js.

(async () => {
  // define a motion accumulator
  let counter = 0;

  // define a variable to store the reset after timeout function
  let timeout;

  // get settings  
  let settings = await browser.runtime.sendMessage({ cmd: 'getSettings' });

  setInterval(async () => {
    // Get settings again (this code doesn't seem to hurt performance and
    // it allow to applying the latest settings without needing to reload
    // the current page)
    settings = await browser.runtime.sendMessage({ cmd: 'getSettings' });
  }, 1000);

  // Add styles to the document
  let style = document.createElement('STYLE');
  // all: initial; makes sure that the page's styling doesn't mess with our styles
  style.innerHTML = `
  #history-jump-container {
    all: initial !important;
    position: fixed !important;
    top: calc(50vh - 20px) !important;
    display: none !important;
    z-index: 2147483647 !important;
  }
  
  .history-jump-circle {
    all: initial !important;
    height: 40px !important;
    width: 40px !important;
    border-radius: 20px !important;
    position: absolute !important;
    top: 0 !important;
  }
  
  #history-jump-arrow {
    background: white !important;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.5) !important;
    font-size: 24px !important;
    padding: 2px 10px !important;
    box-sizing: border-box !important;
    color: #46f !important;
    font-weight: bold !important;
  }
  
  #history-jump-arrow.highlighted {
    background: #46f !important;
    color: white !important;
  }
  
  #history-jump-indicator {
    background: #46f !important;
    opacity: 0.5 !important;
  }`
  document.head.appendChild(style);

  // Arrow similar to the one in Google Chrome

  // Container to hold everything
  let container = document.createElement('DIV');
  container.id = 'history-jump-container';

  // Blue translucent circle that changes size
  let indicator = document.createElement('DIV');
  indicator.className = 'history-jump-circle';
  indicator.id = 'history-jump-indicator';

  // Circle with the arrow
  let arrow = document.createElement('DIV');
  arrow.className = 'history-jump-circle';
  arrow.id = 'history-jump-arrow';
  arrow.innerHTML = '🡠';

  // Append everything to the document
  container.appendChild(indicator);
  container.appendChild(arrow);
  document.body.appendChild(container);

  // Whether the arrow is highlighted or not
  let highlighted = false;

  // Updates the animation
  function setValue(value) {
    // Whether the arrow is on the left or right side
    let left = value < 0;
    // Make sure the value is always positive
    if (left) {
      value *= -1;
    }
    // Make the first 20 pixels of scroll do nothing
    value = Math.max(0, value - settings.deadzone);
    // Make the animation level off after 100 pixels (a bit messy/difficult to understand)
    // Honestly I just messed around in a graph plotter until it looked right, so I don't fully understand it
    if (value > 100) {
      value -= 100;
      value = ((value / 50) / ((value / 50) + 1) * 50);
      value += 100;
    }
    if (value == 0) {
      // Hide the arrow if the value is 0
      container.style.setProperty("display", "none", "important");
    } else {
      container.style.setProperty("display", "block", "important");
      // Put the arroe on the left or right side
      if (left) {
        container.style.setProperty("right", "");
        container.style.setProperty("left", "-40px", "important");
        container.style.setProperty("transform", "translatex(" + value + "px)", "important");
        arrow.innerHTML = "🡠";
      } else {
        container.style.setProperty("right", "-40px", "important");
        container.style.setProperty("left", "");
        container.style.setProperty("transform", "translatex(-" + value + "px)", "important");
        arrow.innerHTML = "🡢";
      }
      // Highlight the arrow if the value is above the threshold
      if (value > 100) {
        arrow.classList.add("highlighted");
        highlighted = true;
      } else {
        arrow.classList.remove("highlighted");
        highlighted = false;
      }
      // Scale the indicator circle
      indicator.style.setProperty("transform", "scale(" + (Math.min(value / 100, 1) + 1) + ")", "important");
    }
  }
  
  let userScrolled = false;
  // The amount of horizontal scroll in the current frame
  let scrollAmountThisFrame = 0;
  
  let holding = false;
  
  // The last time the user scrolled (does not include overscroll)
  let lastScrollTime = 0;
  // The last time the user moved the arrow by scrolling
  let lastMoveTime = 0;
  
  function scrolled () {
    // If the user starts scrolling the content, allow the arrow to leave the screen
    holding = false;
    // Mark that the user scrolled - this means that touchpad scrolling should be
    // ignored, because the user is trying to scroll the page rather than using a gesture
    userScrolled = true;
    lastScrollTime = Date.now();
  }
  
  visualViewport.addEventListener("scroll", scrolled);
  document.addEventListener("scroll", scrolled, true);
  
  window.addEventListener("wheel", (e) => {
    const currentTime = Date.now();
    if (currentTime - lastScrollTime < settings.newTimeout) {
      // Count this as a scroll if the user scrolled recently
      lastScrollTime = currentTime;
      return;
    }

    // Ignore zooming and vertical scrolling
    if (!e.ctrlKey && e.deltaY == 0) {
      scrollAmountThisFrame += e.deltaX;
    }
  })
  
  // The progress of the animation
  // Positive = navigating forward
  // Negative = navigating backward
  let animationSlideAmount = 0;
  
  // Called every frame
  // TODO: Make sure it works with high refresh rates
  function step() {
    let currentTime = Date.now();
    // If the viewport was moved, ignore the scroll
    if (!userScrolled && scrollAmountThisFrame != 0) {
      holding = true;
      animationSlideAmount += scrollAmountThisFrame * settings.threshold * 0.0075;
      lastMoveTime = currentTime;
      // Update the animation
      setValue(animationSlideAmount);
    } else if (!holding && animationSlideAmount != 0) {
      if (Math.abs(animationSlideAmount) < 20) {
        animationSlideAmount = 0;
      } else {
        animationSlideAmount += animationSlideAmount > 0 ? -20 : 20;
      }
      // Update the animation
      setValue(animationSlideAmount);
    }
    // When the animation times out, it will be reset if the arrow is not highlighted
    // If the arrow is highlighted, the action will be performed
    let timedOut = (currentTime - lastMoveTime) > settings.newTimeout;
    if (timedOut) {
      holding = false;
    }
    if (highlighted && timedOut) {
      highlighted = false;
      if (animationSlideAmount > 0) {
        history.forward();
      } else {
        history.back();
      }
      animationSlideAmount = 0;
      // Update the animation
      setValue(animationSlideAmount);
    }
    userScrolled = false;
    scrollAmountThisFrame = 0;
    window.requestAnimationFrame(step);
  }
  
  window.requestAnimationFrame(step);
})();
