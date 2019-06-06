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
  border: 1px solid green;
  background-color: transparent;
  transition: opacity 0.5s;

  div {
    transition: opacity 0.5s;

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

type AdjustTypes = "moved" | "resized";
interface AdjustAction {
  type: AdjustTypes;
  payload: { id: string; box: Box };
}

export type MenuTypes = "delete" | "comment" | "scrollToInGraph";
type MenuAction = { type: MenuTypes; payload: { id: string } };

interface RequiredProps {
  id: string;
  initBox: Box;
  onChange: (props: AdjustAction | MenuAction) => void;
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

  type onMenuChange = React.ComponentProps<typeof HoverMenu>["onChange"];

  const onMenu: onMenuChange = useCallback(type => {
    props.onChange({ type, payload: { id: props.id } });
  }, []);

  const menuHeight = 20;
  const { side, height } = useNearestSide(divRef) || { side: "", height: 0 };
  const top = side === "top" ? -menuHeight : height - 2;

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
      <HoverMenu top={top} height={menuHeight} onChange={onMenu} />
    </_AdjustableBox>
  );
}, shouldMemo);

interface HoverMenuProps {
  top: number;
  height: number;
  onChange: (props: MenuTypes) => void;
}

const HoverMenu: React.FC<HoverMenuProps> = props => {
  return (
    <div
      id="segmentBoxMenu"
      style={{
        position: "relative",
        top: props.top,
        display: "flex",
        justifyContent: "space-around",
        alignContent: "center",
        height: props.height
      }}
    >
      <MdDeleteForever
        size={props.height - 1}
        id="delete"
        onClick={e => {
          e.stopPropagation();
          props.onChange("delete");
        }}
      />
      <MdComment
        size={props.height - 1}
        id="comment"
        onClick={e => {
          e.stopPropagation();
          props.onChange("comment");
        }}
      />
    </div>
  );
};
