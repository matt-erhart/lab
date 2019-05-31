import * as React from "react";
import { getElementScale, getBrowserZoom } from "./geometryFromHtml";
import styled from "styled-components";
import { useState, useRef, useLayoutEffect, useEffect, useCallback } from "react";
import interact from "interactjs";
import "@interactjs/types";
import { useDispatch } from "react-redux";
import { iRootState, iDispatch } from "../store/createStore";
const _ViewboxDiv = styled.div`
  position: absolute;
  border: 2px solid green;
  background-color: transparent;
  
  div {
    opacity: 0;
    cursor: pointer;
    :hover {
      color: red;
    }
  }

  &:hover {
    div {
      opacity: 1;
    }
  }
`;

export const ViewboxDiv = props => {
  const divRef = useRef(null);
  const { left, top, width, height } = props.style;
  const [box, setBox] = useState({ left, top, width, height });
  const dispatch = useDispatch();
  const updateBox = useCallback(() => {
    dispatch({type: 'graph/updateBatch', payload: {
        nodes: [{id: props.id, data: box}]
    }})
  },[dispatch, props, box])
  // useEffect(() => {
  //   const { left, top, width, height } = props.style;
  //   setBox({ left, top, width, height });
  // }, [props.style]);

  useLayoutEffect(() => {
    const { left, top, width, height } = props.style;
    setBox({ left, top, width, height });
    interact(divRef.current)
      .draggable(true)
      .resizable({
        edges: { left: true, right: true, bottom: true, top: true }
      })
      .on("dragmove", (e: Interact.DragEvent) => {
        e.
        e.stopPropagation();
        const { scaleX, scaleY } = getElementScale(e.target as HTMLElement);
        const { dx, dy } = e;
        setBox(box => ({
          ...box,
          left: box.left + dx / scaleX,
          top: box.top + dy / scaleY
        }));
      })
      .on("resizemove" as Interact.OnEventName, (e: Interact.ResizeEvent) => {
        const { scaleX, scaleY } = getElementScale(e.target as HTMLElement);
        e.stopPropagation();

        setBox(box => ({
          width: box.width + e.deltaRect.width / scaleX,
          height: box.height + e.deltaRect.height / scaleY,
          left: box.left + e.deltaRect.left / scaleX,
          top: box.top + e.deltaRect.top / scaleY
        }));
      })
      .on("resizeend" as Interact.OnEventName, () => {
        // props.updateBatch({ nodes: [{ id: props.id, data: box }] });
        updateBox()
      });
    return () => interact(divRef.current).unset();
  }, [props.style]);
  const { style, ...rest } = props;
  return (
    <_ViewboxDiv
      id="viewbox"
      ref={divRef}
      style={{ ...style, ...box }}
      {...rest}
      onMouseDown={e => e.stopPropagation()}
    />
  );
};
