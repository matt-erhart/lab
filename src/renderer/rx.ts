// if we need touch screens: https://varun.ca/drag-with-rxjs/
import { fromEvent, Observable } from "rxjs";
import {
  exhaustMap as mapIgnoreOuterUntilInnerDone,
  takeUntil,
  startWith,
  map,
  endWith,
  tap,
  scan
} from "rxjs/operators";
import { start } from "repl";

const mouseMap = (e: MouseEvent) => {
  return {
    type: e.type as "mousedown" | "mousemove" | "mouseup",
    x: e.clientX,
    y: e.clientY,
    ctrlKey: e.ctrlKey
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

// todo need some common container to make one component draggable cuz cursor
// todo take an onDrag handler and apply mousedown.x-mousemove.x transform
// note the difference between dragging something to transform it and
// dragging something to drop in on something else, i.e. drag and drop
// see resizedivider/resizer dragToTransform
export const dragData = (el: HTMLElement) => {
  const { mousedown, mousemove, mouseup } = [
    "mousedown",
    "mousemove",
    "mouseup"
  ].reduce((all, eventName) => {
    return {
      ...all,
      [eventName]: fromEvent(el, eventName).pipe(
        map(mouseMap as any)
      )
    };
  }, {}) as { [eventName: string]: Observable<mouseData> };

  return mousedown.pipe(
    mapIgnoreOuterUntilInnerDone((down: mouseData) => {
      return mousemove.pipe(
        startWith(down),
        map(move => ({ ...move, x: move.x - down.x, y: move.y - down.y })),
        takeUntil(mouseup),
        endWith({ type: "mouseup", x: null, y: null, ctrlKey: down.ctrlKey }) // todo end with mouseup event
        // tap(x => console.log(x))
      ) as Observable<mouseData>;
    })
  ) as Observable<mouseData>;
};
