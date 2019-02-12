// if we need touch screens: https://varun.ca/drag-with-rxjs/
import { fromEvent, Observable } from "rxjs";
import {
  exhaustMap as mapIgnoreOuterUntilInnerDone,
  takeUntil,
  startWith,
  map,
  endWith,
  tap
} from "rxjs/operators";

const mouseMap = (e: MouseEvent) => {  
  return {
    type: e.type,
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
        map(mouseMap)
      )
    };
  }, {}) as { [eventName: string]: Observable<mouseData> };

  return mousedown.pipe(
    mapIgnoreOuterUntilInnerDone((down: mouseData) => {
      return mousemove.pipe(
        startWith(down),
        takeUntil(mouseup),
        endWith({type: 'mouseup', x: 0, y: 0, ctrlKey: down.ctrlKey}), // todo end with mouseup event
        // tap(x => console.log(x))
      ) as Observable<mouseData>
    })
  ) as Observable<mouseData>;
};
