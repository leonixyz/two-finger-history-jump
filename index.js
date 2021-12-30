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
  style.innerHTML = `
  #history-jump-container {
    position: fixed;
    top: calc(50vh - 20px);
    display: none;
  }
  
  .history-jump-circle {
    height: 40px;
    width: 40px;
    border-radius: 20px;
    position: absolute;
    top: 0;
  }
  
  #history-jump-arrow {
    background: white;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
    font-size: 24px;
    padding: 2px 10px;
    box-sizing: border-box;
    color: #46f;
    font-weight: bold;
  }
  
  #history-jump-arrow.highlighted {
    background: #46f;
    color: white;
  }
  
  #history-jump-indicator {
    background: #46f;
    opacity: 0.5;
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
      container.style.display = "none";
    } else {
      container.style.display = "block";
      // Put the arroe on the left or right side
      if (left) {
        container.style.right = "";
        container.style.left = value - 40 + "px";
        arrow.innerHTML = "🡠";
      } else {
        container.style.right = value - 40 + "px";
        container.style.left = "";
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
      indicator.style.transform = "scale(" + (Math.min(value / 100, 1) + 1) + ")";
    }
  }
  
  let viewportMoved = false;
  // The amount of horizontal scroll in the current frame
  let scrollAmountThisFrame = 0;
  
  let holding = false;
  
  // The last time the user scrolled
  let lastMoveTime = 0;
  
  window.visualViewport.onscroll = () => {
    // If the user starts scrolling the content, allow the arrow to leave the screen
    holding = false;
    // Mark that the viewport was moved - this means that scrolling is should be ignored,
    // because the user is trying to scroll the page rather than using a gesture
    viewportMoved = true;
  }
  
  window.onwheel = function (e) {
    // Ignore zooming and vertical scrolling
    if (!e.ctrlKey && e.deltaY == 0) {
      scrollAmountThisFrame += e.deltaX;
    }
  }
  
  // The progress of the animation
  // Positive = navigating forward
  // Negative = navigating backward
  let animationSlideAmount = 0;
  
  // Called every frame
  // TODO: Make sure it works with high refresh rates
  function step() {
    let currentTime = +new Date();
    // If the viewport was moved, ignore the scroll
    if (!viewportMoved && scrollAmountThisFrame != 0) {
      holding = true;
      animationSlideAmount += scrollAmountThisFrame * settings.threshold * 0.005;
      console.log(animationSlideAmount);
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
    viewportMoved = false;
    scrollAmountThisFrame = 0;
    window.requestAnimationFrame(step);
  }
  
  window.requestAnimationFrame(step);
})();
