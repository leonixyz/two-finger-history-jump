# Two-Finger History Jump

This add-on allows you to jump back/forward in the browser's history by swiping
horizontally with two fingers on your touchpad. Swiping to the left will take you
back one page, while swiping to the right will do the opposite. It mimics the
default behaviour on Mac OS. It needs the 'Access your data for all websites'
permission in order to access the browser's local storage and be able to save
its settings persistently.

You can configure how the browser reacts to your gestures with three settings:

- **Sensitivity**: This indicates how sensitive your browser is to horizontal
swipes. If you set this value too low, you have to swipe more to  trigger a jump
in history. If you set this value too high, you might jump back and forward
unintentionally. 30 is the default and suggested values range from 10 to 50.
- **Timeout**: The amount of time that the browser will wait before jumping back
or forward. If you set this value too low, it will be more difficult to cancel
accidental jumps. If you set this value too high, you might have to wait a long
time before you can jump back or forward. 250 is the default and suggested value.
- **Deadzone**: The amount of pixels that will be ignored when swiping. If you
set this value too low you are more likely to trigger the animation by accident
when scrolling.

## Components

The code is organized in three parts:

- **A popup** which is used both as a standard browser action popup, and as a
  settings page
- **A background script** which is responsible for managing the settings and
  storing them locally
- **A content script** which is injected in all pages and listens to scroll
  events in order to trigger a history jump
