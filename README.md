# Two-Finger History Jump

This add-on allows you to jump back/forward in the browser's history by swiping
horizontally with two fingers on your touchpad. Swiping to the left will take you
back one page, while swiping to the right will do the opposite. It mimics the
default behaviour on Mac Os. It needs the 'Access your data for all websites'
permission in order to access the browser's local storage and be able to save
its settings persistently.

You can configure how the browser reacts to your gestures with two settings:

- **sensibility**: this indicates how sensible your browser is to
horizontal swipes. If you set this value too low, you have to swipe more to 
trigger a jump in history. If you set this value too high, you might jump back
and forward unintentionally, or jump for more than one page. A suggested value
is from 15 to 20.
- **timeout**: your swipe should happen within a specific time range
in order to trigger a history jump. This value represents that time range. If 
you swipe too slow the jump won't be triggered. If you set this value too low, 
you will have a hard time jumping. A suggested value is 1000 milliseconds.

## Components

The code is organized in three parts:

- **a popup** which is used both as a standard browser action popup, and as a
  settings page
- **a background script** which is responsible for managing the settings and
  store them locally
- **a content script** which is injected in all pages and listens to scroll
  events in order to trigger a history jump
