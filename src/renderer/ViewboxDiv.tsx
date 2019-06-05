import * as React from "react";
import { getElementScale, getBrowserZoom } from "./geometryFromHtml";
import styled from "styled-components";
import {
  useState,
  useRef,
  useLayoutEffect,
  useEffect,
  useCallback
} from "react";
import interact from "interactjs";
import "@interactjs/types";
import { useDispatch } from "react-redux";
import { iRootState, iDispatch } from "../store/createStore";
import { Box } from "./geometry";
import { useMoveResize } from "./sequenceUtils";
import { MdDeleteForever, MdComment, MdLabel } from "react-icons/md";
import { useNearestSide } from "./geometryFromHtml";
const _AdjustableBox = styled.div`
  position: absolute;
  border: 2px solid green;
  background-color: transparent;

  div {
    opacity: 0;
    cursor: pointer;
    pointer-events: none;

    #delete:hover {
      transform: scale(1.2);
      color: red;
    }
    #comment:hover {
      transform: scale(1.2);
    }
  }

  &:hover {
    div {
      pointer-events: all;
      opacity: 1;
    }
    background-color: "lightblue";
    opacity: 1;
  }

  &:active {
    div {
      opacity: 0;
    }
  }
`;

interface RequiredProps {
  id: string;
  initBox: Box;
  onChange: (props: {
    type: "moved" | "resized" | "delete";
    payload: { id: string; box: Box };
  }) => void;
}
// ViewboxDiv = React.memo(props => {}, shouldMemo)
const shouldMemo = (prevProps: RequiredProps, newProps: RequiredProps) => {
  const keysToCheck = ["left", "top", "width", "height"];
  for (let key of keysToCheck) {
    if (prevProps.initBox[key] !== newProps.initBox[key]) {
      return false;
    }
  }
  return true;
};
export const AdjustableBox: React.FC<RequiredProps> = React.memo(props => {
  /**
   * Pass in a box from e.g. redux, this will move/resize with a preview, and then emit
   * an event on mouseup
   */
  const divRef = useRef<HTMLDivElement>(null);
  const { type, payload: box } = useMoveResize(divRef, props.initBox);
  useEffect(() => {
    const payload = { id: props.id, box };
    if (type === "moved") props.onChange({ type: "moved", payload });
    if (type === "resized") props.onChange({ type: "resized", payload });
  }, [type]);

  const { side, top } = useNearestSide(divRef) || { side: "", top: 0 };
  console.log("side, top: ", side, top);

  const { initBox, ...rest } = props;
  return (
    <_AdjustableBox
      draggable={false}
      id="viewbox"
      ref={divRef}
      style={{ ...initBox, ...box }}
      {...rest}
      onMouseDown={e => e.stopPropagation()}
      onDragStart={e => e.preventDefault()}
    >
      <HoverMenu side={side} top={top} />
    </_AdjustableBox>
  );
}, shouldMemo);

interface RequiredProps {
  side: "top" | "bottom";
  top: number;
}

const HoverMenu: React.FC<RequiredProps> = props => {
  return (
    <div
      id="segmentBoxMenu"
      style={{
        position: "relative",
        top: props.top,
        display: "flex",
        justifyContent: "space-around",
        alignContent: "center",
        height: 28
      }}
    >
      <MdDeleteForever
        size={26}
        id="delete"
        onClick={e => {
          e.stopPropagation();
          console.log("delete");
        }}
      />
      <MdComment
        size={26}
        id="comment"
        onClick={e => {
          e.stopPropagation();
          console.log("comment");
        }}
      />
    </div>
  );
};
