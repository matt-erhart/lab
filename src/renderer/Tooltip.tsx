import * as React from "react";
import { useLayoutEffect, useState, useRef, useEffect } from "react";
import { Portal } from "./Portal";
export const Tooltip = ({
  mouseX = NaN,
  mouseY = NaN,
  width = 200,
  height = 200
}) => {
  //   const [bbox, setBbox] = useState({left})
  let tooltipRef = useRef<HTMLDivElement>(null);
  // const [bbox, setBbox] = useState({
  //   bottom: 0,
  //   height: 0,
  //   left: 0,
  //   right: 0,
  //   top: 0,
  //   width: 0,
  //   x: 0,
  //   y: 0
  // } as DOMRect | ClientRect);
  // setBbox(tooltipRef.current.getBoundingClientRect());

  const [viewportDims, setViewportDims] = useState({ width: 0, height: 0 });
  const [popup, setPopup] = useState({
    style: {
      left: 100,
      top: 100,
      width: 70,
      height: 50
    }
  });
  const [show, setShow] = useState(false);
  let { x: windowX, y: windowY } = useWindowMousePosition();
  const intervalRef = useRef();
  useEffect(() => {
    console.log(mouseX, mouseY);

    if ([mouseX, mouseY].includes(NaN)) return undefined;
    const { width: popupWidth, height: popupHeight } = popup.style;
    const { width: viewportWidth, height: viewportHeight } = viewportDims;
    const moreSpaceDown = windowY < viewportHeight / 2;
    const moreSpaceRight = windowX < viewportWidth / 2;
    let x, y;
    if (moreSpaceDown) {
      y = windowY + 15;
    } else {
      y = windowY - 5 - popupHeight;
    }

    if (moreSpaceRight) {
      x = windowX + 15;
    } else {
      x = windowX - 5 - popupWidth;
    }
    setPopup({ style: { ...popup.style, left: x, top: y } });
    setShow(true);
    selfDestruct()
    return () => clearTimeout(intervalRef.current);
  }, [mouseX, mouseY]);

  const selfDestruct = () => {
    intervalRef.current = setTimeout(() => {
      setShow(false);
      console.log("timeout?");
    }, 1000);
  }

  useLayoutEffect(() => {
    const {
      // doesn't include scroll bars
      clientHeight: height,
      clientWidth: width
    } = document.documentElement;
    setViewportDims({ width, height });
  }, []);

  if (show) {
    return (
      <Portal>
        <div
          style={{
            position: "absolute",
            ...popup.style,
            backgroundColor: "green",
            maxWidth: viewportDims.width,
            maxHeight: viewportDims.height,
            overflow: "auto"
          }}
          onMouseOver={e => {
            clearTimeout(intervalRef.current);
          }}
          onMouseLeave={e => {
            selfDestruct()
          }}
        >
          up
        </div>
      </Portal>
    );
  } else {
    return null;
  }
};

// https://github.com/rehooks/window-mouse-position/blob/master/index.js
function useWindowMousePosition() {
  let [WindowMousePosition, setWindowMousePosition] = useState({
    x: null,
    y: null
  });

  function handleMouseMove(e) {
    setWindowMousePosition({
      x: e.pageX,
      y: e.pageY
    });
  }

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return WindowMousePosition;
}
