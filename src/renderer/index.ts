/* 
This file is something related to the main/ renderer/ process
see https://medium.com/cameron-nokes/deep-dive-into-electrons-main-and-renderer-processes-7a9599d5c9e2

Main process is responsible for creating and managing BrowserWindow
Render process is responsible for running the web page, which is an instance of webContents. 
*/

import "./App";
// import  "./Test";

// var oldAddEventListener = EventTarget.prototype.addEventListener;
// EventTarget.prototype.addEventListener = function(eventName, eventHandler) {
//   oldAddEventListener.call(this, eventName, function(event) {
//     if (eventName.includes('mouse')) console.log(event);
//     eventHandler(event)
//   });
// };
import {timeStamp} from './events'
const log = e => {
  let data = {};
  switch (e.type) {
    case "mousemove":
      console.log(e.clientX, e.clientY);
      break;
    case "mousedown":
    case "mouseup":
      console.log('mouse press ', e.button);
      break;
    case "mousewheel":
      console.log('wheel ',e.deltaX, e.deltaY);
      break;
    case "keydown":
      console.log('key press', e.key, timeStamp());
  }
};

const domEvents = [
  "mousedown",
  "mouseup",
  "mousemove",
  "mousewheel",
  "keydown",
  "keyup"
];

domEvents.forEach(eventName => window.addEventListener(eventName, log));
window.onbeforeunload = function() {
  domEvents.forEach(eventName => window.removeEventListener(eventName, log));
};
