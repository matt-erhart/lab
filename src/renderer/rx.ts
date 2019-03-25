// if we need touch screens: https://varun.ca/drag-with-rxjs/
import { fromEvent, Observable, merge } from "rxjs";
import {
  exhaustMap as mapIgnoreOuterUntilInnerDone,
  takeUntil,
  startWith,
  map,
  endWith,
  tap,
  scan,
  last,
  takeWhile
} from "rxjs/operators";
import { start } from "repl";

const mouseMap = (e: MouseEvent) => {
  return {
    type: e.type as "mousedown" | "mousemove" | "mouseup",
    x: e.clientX,
    y: e.clientY,
    ctrlKey: e.ctrlKey,
    shiftKey: e.shiftKey
  };
};
type mouseData = ReturnType<typeof mouseMap>;

export const dndContainer = (containerRef: React.RefObject<any>) => {
  const { mousedown, mousemove, mouseup } = [
    "mousedown",
    "mousemove",
    "mouseup"
  ].reduce((all, eventName) => {
    return {
      ...all,
      [eventName]: fromEvent(containerRef.current, eventName).pipe(
        map(mouseMap as any)
      )
    };
  }, {}) as { [eventName: string]: Observable<mouseData> };

  return mousedown.pipe(
    mapIgnoreOuterUntilInnerDone((down: mouseData) => {
      return mousemove.pipe(
        startWith(down),
        takeUntil(mouseup),
        endWith({ type: "mouseup", x: 0, y: 0, ctrlKey: down.ctrlKey }) // todo end with mouseup event
        // tap(x => console.log(x))
      ) as Observable<mouseData>;
    })
  ) as Observable<mouseData>;
};

const mMap = (e: MouseEvent) => {
  return {
    type: e.type as "mousedown" | "mousemove" | "mouseup",
    screenX: e.screenX,
    screenY: e.screenY,
    clientX: e.clientX,
    clientY: e.clientY,
    dx: 0,
    dy: 0,
    ctrlKey: e.ctrlKey,
    shiftKey: e.shiftKey
  };
};
export type mData = ReturnType<typeof mMap>;
export const dragData = (mouseDownEvent: MouseEvent) => {
  const down = mMap(mouseDownEvent); // start with clicked element
  
  const mousemove = fromEvent(document, "mousemove").pipe(
    map(mMap as any)
  ) as Observable<mData>; // could happen anywhere

  const mouseup = fromEvent(document, "mouseup").pipe(
    map(mMap as any)
  ) as Observable<mData>; // could happen anywhere

  return merge(mousemove, mouseup).pipe(
    startWith(down),
    map(current => ({
      ...current,
      dx: current.screenX - down.screenX,
      dy: current.screenY - down.screenY
    })),
    takeWhile(current => current.type !== "mouseup", true)
  ) as Observable<mData>;
};
