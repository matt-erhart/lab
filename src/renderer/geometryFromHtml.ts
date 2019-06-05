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

const getNearestSide = (el: HTMLElement) => (e: MouseEvent) => {
  const bounding = el.getBoundingClientRect();
  console.log("bounding: ", bounding);
  const { clientX, clientY } = e;
  console.log("clientX, clientY: ", clientX, clientY);
  const dists = {
    up: clientY - bounding.top,
    down: bounding.top + bounding.height - clientY,
    left: clientX - bounding.left,
    right: bounding.right - clientX
  };

  // key with smallest value util?
  const side = Object.entries(dists).reduce(
    (all, dist) => {
      const [key, val] = dist;
      if (Math.abs(val) < Math.abs(all.val)) {
        return { key, val };
      } else {
        return all;
      }
    },
    { key: "", val: Infinity }
  );

  return side;
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

export const useNearestSide = (ref: React.MutableRefObject<HTMLElement>) => {
  if (!ref) return undefined;
  const [side, setSide] = useState(undefined);

  const setHoveredSide = (e: MouseEvent) => {
    const newSide = getNearestSide(ref.current)(e);
    setSide(newSide);
  };

  useEffect(() => {
    ref.current.addEventListener("mousemove", e => setHoveredSide(e));
    return ref.current.removeEventListener("mousemove", e => setHoveredSide(e));
  }, []);

  return side;
};
