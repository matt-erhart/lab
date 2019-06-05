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
import { AdjustableBox } from "./ViewboxDiv";
import { useSelector } from "react-redux";
import { iRootState } from "../store/createStore";
import { useDrawBox } from "./sequenceUtils";
import { Box } from "./geometry";

const OuterMostDiv = styled.div<{ pageWidth: number; pageHeight: number }>`
  position: absolute;
  width: ${p => p.pageWidth}px;
  height: ${p => p.pageHeight}px;
  z-index: 2;
`;

type onChangeEvents =
  | { type: "updated" | "deleted"; payload: { id: string; box: Box } }
  | { type: "added"; payload: Box };
``;
interface Props {
  id: string;
  pageWidth: number;
  pageHeight: number;
  boxes: any[];
  onChange: (event: onChangeEvents) => void;
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

  type onChange = React.ComponentProps<typeof AdjustableBox>["onChange"];
  const onChange = useCallback<onChange>(
    action => {
      props.onChange({
        type: "updated",
        payload: { id: action.payload.id, box: action.payload.box }
      });
      console.log('action.payload.box : ', action.payload.box );

    },
    [props.onChange]
  );

  return (
    <>
      <OuterMostDiv
        id={outerId}
        ref={outerRef}
        draggable={false}
        pageWidth={props.pageWidth}
        pageHeight={props.pageHeight}
      >
        {!!box && startedDrawing && (
          <div
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
                key={box.id}
                id={box.id}
                initBox={{
                  top: top,
                  left: left - 5,
                  width: width + 5,
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
