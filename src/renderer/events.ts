/**
 * for opensource event replay there is https://github.com/rrweb-io/rrweb
 * rrweb uses mutation observer to watch for every dom change
 * rrweb doesn't work with css in js as of july 2019
 *
 * search for 'js session replay' to find  enterpise options. logrocket might be good esp. for errors.
 *  */

// todo add coords in element

// pan, zoom, multicanvas


export const domIds = {
  app: "app",
  viewPort: "viewPort",
  panels: "panels",
  panel: "panel",
  scroll: "scroll",
  menu: "menu",
  menuItem: "menuItem",

  // middle
  panelResizer: "panelResizer",

  // top
  pdfSelector: "pdfSelector",

  // pdf reader
  pdfScroll: "pdfScroll",
  pages: "pages",
  page: "page",
  pdfCanvas: "pdfCanvas",
  boxSegments: "boxSegments",
  boxSegment: "boxSegment",

  // graph
  graphScroll: "graphScroll",
  graphMap: "graphMap",
  graphNode: "graphNode",
  graphLink: "graphLink",
  textEditor: "textEditor",
  textEditorScroll: "textEditorScroll",
  sizeToggler: "sizeToggler",
  dragHandle: "dragHandle",
  resizableEdge: "resizableEdge",
  svgLayer: "svgLayer",
  frame: "frame",

  // portals
  textEditorMenu: "textEditorMenu",
  textEditorAutoComplete: "textEditorAutoComplete",
  autoCompleteItem: "autoCompleteItem"
};

export const domIdWithUid = (domId: string, uid: string | number) => {
  return domId + "-" + uid;
};

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

import { zeroPad } from "./utils";
var fs = require("fs");
const today = new Date();
var day = zeroPad(today.getDate(), 2);
var monthIndex = zeroPad(today.getMonth(), 2);
var year = today.getFullYear();
console.log(year, monthIndex, day);
const outDir = "C:\\Users\\mattj\\dev\\lab\\src\\store\\";
var mouseLogger = fs.createWriteStream(
  outDir + `${year}${monthIndex}${day}_mouseLog.csv`,
  { flags: "a" }
);

var keyboardLogger = fs.createWriteStream(
  outDir + `${year}${monthIndex}${day}_keyLog.csv`,
  { flags: "a" }
);

export const reduxLogger = fs.createWriteStream(
  outDir + `${year}${monthIndex}${day}_reduxLog.jsonl`,
  { flags: "a" }
);

let prevPath = "";
let path = "";

const log = e => {
  const newPath = e.path
    .map(x => {
      // use ####
      const tag = !!x && !!x.nodeName ? x.nodeName.toLowerCase() : "";
      return !!x.id && x.id.length > 0 ? tag + "#" + x.id : tag;
    })
    .join("/")
    .split("div#app")[0];
  path = newPath !== prevPath ? newPath : "same";
  prevPath = newPath;
  switch (e.type) {
    case "mousemove":
      mouseLogger.write(
        `move,${e.clientX},${e.clientY},-1,${timeStamp()},${path}\n`
      );
      break;
    case "mousedown":
      mouseLogger.write(
        `down,${e.clientX},${e.clientY},${e.button},${timeStamp()},${path}\n`
      );
      break;
    case "mouseup":
      mouseLogger.write(
        `up,${e.clientX},${e.clientY},${e.button},${timeStamp()},${path}\n`
      );
      break;
    case "mousewheel":
      mouseLogger.write(
        `wheel,${e.deltaX},${e.deltaY},-1,${timeStamp()},${path}\n`
      );
      break;
    case "keydown":
      keyboardLogger.write(`down,${e.key},${timeStamp()},${path}\n`);
      break;
    case "keyup":
      keyboardLogger.write(`up,${e.key},${timeStamp()},${path}\n`);
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
  keyboardLogger.end(); // close string
  mouseLogger.end();
  reduxLogger.end()
};
