export const getElementScale = (element: HTMLElement) => {
  // from leaflet utils
  // use this or you'll need to track n-levels of zoom to correct drag movement
  const elementRect = element.getBoundingClientRect();
  const scaleX = elementRect.width / element.offsetWidth || 1;
  const scaleY = elementRect.height / element.offsetHeight || 1;

  return { scaleX, scaleY };
};

export const getPointInElement = (
  element: HTMLElement,
  point: { clientX: number; clientY: number } // e.g. from mouseevent
) => {
  const rect = element.getBoundingClientRect();
  const { scaleX, scaleY } = getElementScale(element);

  const elementX = (point.clientX - rect.left) / scaleX;
  const elementY = (point.clientY - rect.top) / scaleY;

  return { x: elementX, y: elementY, scaleX, scaleY };
};

export const getBrowserZoom = () =>
  Math.round((window.outerWidth / window.innerWidth) * 100) / 100;

type sides = "top" | "bottom" | "left" | "right";
const getNearestSide = (el: HTMLElement, sides: sides[]) => (e: MouseEvent) => {
  const bounding = el.getBoundingClientRect();
  const { clientX, clientY } = e;
  const dists = {
    top: clientY - bounding.top,
    bottom: bounding.top + bounding.height - clientY,
    left: clientX - bounding.left,
    right: bounding.right - clientX
  };

  // key with smallest value util?
  const side = Object.entries(dists).reduce(
    (all, dist) => {
      const [key, val] = dist;
      if (Math.abs(val) < Math.abs(all.val) && sides.includes(key as any)) {
        return { key, val };
      } else {
        return all;
      }
    },
    { key: "", val: Infinity }
  );

  // may want to do sides and corners
  return { side: side.key as keyof typeof dists };
};

// react
import * as React from "react";
import {
  useState,
  useRef,
  useLayoutEffect,
  useEffect,
  useCallback
} from "react";
import memoize from "fast-memoize";

type returnType = { side: "top" | "bottom" | "left" | "right"; top: number };
export const useNearestSide = (
  ref: React.MutableRefObject<HTMLElement>
): returnType => {
  if (!ref) return undefined;
  const [side, setSide] = useState(undefined as returnType);

  const setHoveredSide = (e: MouseEvent) => {
    // if you want left/right, add it to ["top", "bottom"]
    const newSide = getNearestSide(ref.current, ["top", "bottom"])(e);
    const height = ref.current.getBoundingClientRect().height || 0;
    const top = newSide.side === "top" ? -30 : height - 2;
    setSide({ side: newSide.side, top });
  };

  useEffect(() => {
    ref.current.addEventListener("mousemove", e => setHoveredSide(e));
    return ref.current.removeEventListener("mousemove", e => setHoveredSide(e));
  }, []);

  return side;
};
