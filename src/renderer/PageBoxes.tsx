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
import { AdjustableBox, MenuActions } from "./ViewboxDiv";
import { useSelector } from "react-redux";
import { iRootState } from "../store/createStore";
import { useDrawBox } from "./sequenceUtils";
import { Box } from "./geometry";

const OuterMostDiv = styled.div`
  position: absolute;
  top: 0px;
  left: 0px;
  z-index: 3;
  transform-origin: left top;
`;

type onChangeEvents =
  | { type: "updated" | "deleted"; payload: { id: string; box: Box } }
  | { type: "added"; payload: Box }
  | MenuActions;
``;
interface Props {
  id: string;
  pageWidth: number;
  pageHeight: number;
  boxes: any[];
  onChange: (event: onChangeEvents) => void;
  scale: number;
}
/**
 * draws boxes on pdf pages
 * calls function on box creation/update
 */
export const PageBoxes: React.FC<Props> = props => {
  const outerRef = useRef<HTMLDivElement>(null);
  const outerId = "OuterMostDiv";
  const { box, points } = useDrawBox(outerRef); // snap to in here
  const startedDrawing = points.first.id === outerId;
  useEffect(() => {
    const notJustClick = box.width > 3 && box.height > 3;
    if (points.second.type === "mouseup" && startedDrawing && notJustClick) {
      props.onChange({ type: "added", payload: box });
    }
  }, [points]);

  //
  type onChange = React.ComponentProps<typeof AdjustableBox>["onChange"];
  const onChange = useCallback<onChange>(
    action => {
      if (action.type === "moved" || action.type === "resized") {
        props.onChange({
          type: "updated",
          payload: { id: action.payload.id, box: action.payload.box }
        });
      } else {
        props.onChange(action);
      }
    },
    [props.onChange]
  );

  return (
    <>
      <OuterMostDiv
        draggable={false}
        onDrag={e => e.preventDefault()}
        id={outerId}
        ref={outerRef}
        style={{
          transform: `scale(${props.scale})`,
          width: props.pageWidth,
          height: props.pageHeight
        }}
      >
        {!!box && startedDrawing && (
          <div
            draggable={false}
            onDragStart={e => e.preventDefault()}
            style={{
              ...box,
              border: "1px solid blue",
              position: "absolute"
            }}
          />
        )}
        {props.boxes.length > 0 &&
          props.boxes.map(box => {
            const { top, left, width, height, type } = box.data;
            console.log("type: ", type);

            return (
              <AdjustableBox
                draggable={false}
                onDragStart={e => e.preventDefault()}
                key={box.id}
                id={box.id}
                initBox={{
                  top: top,
                  left: left,
                  width: width,
                  height: height
                }}
                onChange={onChange}
              />
            );
          })}
      </OuterMostDiv>
    </>
  );
};

// {showComment && <BoxComment id="boxComment" box={commentBox} />}
interface BoxCommentProps {
  id: "boxComment";
  box: Box;
}

const BoxComment: React.FC<BoxCommentProps> = props => {
  const { box, ...rest } = props;
  return (
    <div
      style={{
        ...props.box,
        border: "1px solid black",
        position: "absolute",
        backgroundColor: "white",
        opacity: 0.95
      }}
      {...rest}
    />
  );
};
