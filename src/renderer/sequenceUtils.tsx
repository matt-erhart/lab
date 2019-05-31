// if we need touch screens: https://varun.ca/drag-with-rxjs/
import { fromEvent, merge } from "rxjs";
import {
  startWith,
  takeWhile,
  exhaustMap as mapUntilInnerDone,
  filter
} from "rxjs/operators";

import {
  boxToEdges,
  edgesToBox,
  pointsToBox,
  Box,
  BoxEdges,
  Point2d
} from "./geometry";
import { getBrowserZoom, getPointInElement } from "./geometryFromHtml";

/**
 * movementX, movementY, type are particularly useful for dragging
 */
export const dragData = (el: HTMLElement) => {
  if (!el) return null;
  const mousedown = fromEvent<MouseEvent>(el, "mousedown");

  const mousemove = fromEvent<MouseEvent>(
    document, // not el because we'll mouse over multiple els
    "mousemove"
  );

  const mouseup = fromEvent<MouseEvent>(document, "mouseup");
  const moveOrUp = merge(mousemove, mouseup);

  return mousedown.pipe(
    mapUntilInnerDone(down => {
      return moveOrUp.pipe(
        startWith(down),
        takeWhile(moveOrUp => moveOrUp.type !== "mouseup", true)
      );
    })
  );
};

// rx + react
import { useState, useRef, useEffect } from "react";

export const useDrag = (reactRef: React.RefObject<HTMLElement>) => {
  if (!reactRef) return undefined;

  const [mouseDrag, setMouseDrag] = useState(null as MouseEvent);
  const sub = useRef(null);
  useEffect(() => {
    sub.current = dragData(reactRef.current).subscribe(event => {
      setMouseDrag(event);
    });
    return () => {
      !!sub && sub.current.unsubscribe();
    };
  }, []);
  return mouseDrag;
};

export function useDragPoints(
  drag: ReturnType<typeof useDrag>,
  el: React.RefObject<HTMLElement> //todo infer from linage
) {
  const [points, setPoints] = useState({
    first: { x: 0, y: 0, type: "", id: "" },
    second: { x: 0, y: 0, type: "", id: "" },
    movement: { x: 0, y: 0 },
    isDragging: false
  });

  useEffect(() => {
    if (!drag) return undefined;
    // offsetX + offsetY handles zoom right, but not multiple els
    const browserZoom = getBrowserZoom();

    // x,y could be scaled differently, need
    const { type, movementX, movementY, clientX, clientY, target } = drag;
    const { second } = points;
    const { x, y, scaleX, scaleY } = getPointInElement(el.current, {
      clientX,
      clientY
    });

    switch (type) {
      case "mousedown":
        // valid start component
        const point = {
          x,
          y,
          type,
          id: (target as HTMLElement).id
        };
        console.log('point: ', point);

        setPoints({
          ...points,
          first: point,
          second: point,
          movement: { x: 0, y: 0 },
          isDragging: true
        });
        break;

      case "mousemove":
        setPoints({
          ...points,
          second: {
            x,
            y,
            type,
            id: (target as HTMLElement).id
          },
          movement: {
            x: movementX / scaleX / browserZoom,
            y: movementY / scaleY / browserZoom
          },
          isDragging: true
        });
        break;
      case "mouseup":
        setPoints({
          ...points,
          second: {
            x,
            y,
            type,
            id: (target as HTMLElement).id
          },
          movement: {
            x: 0,
            y: 0
          },
          isDragging: false
        });
        break;
      default:
        return undefined;
    }
  }, [drag]);
  return points;
}


export const useDrawBox = (ref) => {
  const drag = useDrag(ref)
  const points = useDragPoints(drag, ref)
  return {box: pointsToBox(points), points}
}