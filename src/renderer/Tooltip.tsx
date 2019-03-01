import * as React from "react";
import { useLayoutEffect, useState, useRef } from "react";
export const Tooltip = (props) => {
  //   const [bbox, setBbox] = useState({left})
  let tooltipRef = useRef<HTMLDivElement>(null);
  const [bbox, setBbox] = useState({
    bottom: 0,
    height: 0,
    left: 0,
    right: 0,
    top: 0,
    width: 0,
    x: 0,
    y: 0
  } as DOMRect | ClientRect);

  useLayoutEffect(() => {
    setBbox(tooltipRef.current.getBoundingClientRect());
  }, []);

  return (
    <div
      ref={tooltipRef}
      style={{ backgroundColor: "lightgrey", display: "inline-block" }}
    >
      stuff
    </div>
  );
};
