export const timeStamp = () =>
  // higher res than alternatives
  performance.now() + performance.timing.navigationStart;

type EventTypes =
  | "zoom"
  | "scroll"
  | "move"
  | "drag"
  | "transform"
  | "select"
  | "enter" //mouse vs keyboard
  | "show"
  | "hide"
  | "add"
  | "remove"
  | "update"
  | "load"
  | "render"
  | "compute"
  | "save";

type SequenceProgressTypes =
  | "started"
  | "initialized"
  | "updated"
  | "completed"
  | "requested"
  | "recieved"
  | "rejected"
  | "canceled"
  | "instant";

type Expectations = "data" | "side effect" | "feedback";

type Sensors =
  | "mouse buttons"
  | "mouse wheel"
  | "mouse movement"
  | "touchscreen"
  | "keyboard"
  | "microphone"
  | "camera"
  | "eyetracker"
  | "accelerometer"
  | "compass"
  | "gps";

interface InstantEvent {
  timeStamp: number;
  event: EventTypes;
  progress: SequenceProgressTypes;
  domPath: string;
  sensors: Sensors[];
}




interface ZoomEvent extends InstantEvent {
  /**
   * zoomed in a pdf
   * zoomed a live slice in a graph
   * zoomed a graph
   * zoomed the browser
   */
  scale: number;
}

interface DrawEvent extends InstantEvent {
  /**
   * drawing started to create a live slice node in a pdf
   * drawing started to select graph elements
   */
}

interface ScrollEvent extends InstantEvent {
  /**
   * scrolled a pdf
   * scrolled a live slice in the graph
   * scrolled a graph
   */
}

/**
 
 *

 *

 *
 * switched to a new full pdf
 * showed new panel
 * opened a comment on box in a pdf
 *
 * selected graph elements
 * selected text in a pdf
 * selected text in an editor
 *
 * added graph elements using a graph or pdf
 * removed graph elements using a graph or pdf
 *
 * updated the data in graph elements {typing + debounce} aaaaaaaa
 *
 * moved/resized a box in a pdf
 * moved/resized  a box in a graph
 * resized  a panel
 *
 * moved mouse
 * pressed mouse button
 * pressed key
 *
 * entered panel
 * entered node
 * entered link
 * entered pdf box
 * entered pdf box menu item
 * entered pdf menu
 * entered pdf menu item
 *
 * rendered pdf
 * rendered graph
 *
 * processed pdf
 *
 * started app
 *
 * started tour
 * started condition
 *
 * searched in pdf
 *
 *
 *
 *
 *
 */

type PdfEventTypes =
  | "drew/pdf/box"
  | "adjusted/pdf/box"
  | "scrolled/pdf"
  | "zoomed/pdf"
  | "deleted/pdf/box"
  | "scrolledTo/pdf/box"
  | "openedComment/pdf/box"
  | "added/pdf";

"requested-viewFullPdf";

type AppEventTypes = PdfEventTypes;


// var oldAddEventListener = EventTarget.prototype.addEventListener;
// EventTarget.prototype.addEventListener = function(eventName, eventHandler)
// {
//   listenerCount[eventName] = (listenerCount[eventName] || 0) + 1;
//   renderTable();
  
//   oldAddEventListener.call(this, eventName, function(event) {
//     eventCount[eventName] = (eventCount[eventName] || 0) + 1;
//     updateTable(eventName);
//     eventHandler(event);
//   });
// };