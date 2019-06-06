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
import { AdjustableBox, MenuTypes } from "./ViewboxDiv";
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
  | { type: MenuTypes; payload: { id: string } };
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
    if (points.second.type === "mouseup" && startedDrawing) {
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
        props.onChange({
          type: action.type,
          payload: { id: action.payload.id }
        });
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
            const { top, left, width, height } = box.data;

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
