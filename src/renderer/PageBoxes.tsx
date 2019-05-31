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
import { ViewboxDiv } from "./ViewboxDiv";
import { useDispatch } from "react-redux";
import { iRootState, iDispatch } from "../store/createStore";
import { useDrag, useDragPoints, useDrawBox } from "./sequenceUtils";
import { pointsToBox } from "./geometry";

const OuterMostDiv = styled.div<{ pageWidth: number; pageHeight: number }>`
  position: absolute;
  width: ${p => p.pageWidth}px;
  height: ${p => p.pageHeight}px;
  z-index: 2;
`;

interface Props {
  pageWidth: number;
  pageHeight: number;
  boxes: any[];
}
export const PageBoxes: React.FC<Props> = (props) => {
  const outerRef = useRef<HTMLDivElement>(null);
  const { box, points } = useDrawBox(outerRef);
  useEffect(() => {
    if (points.second.type === "mouseup") {
      console.log("create viewbox");
    }
  }, [points]);

  return (
    <>
      <OuterMostDiv
        ref={outerRef}
        draggable={false}
        pageWidth={props.pageWidth}
        pageHeight={props.pageHeight}
      >
        {!!box && (
          <div
            style={{ ...box, border: "1px solid blue", position: "absolute" }}
          />
        )}
        {props.boxes.length > 0 &&
          props.boxes.map(box => {
            const { top, left, width, height } = box.data;

            return (
              <ViewboxDiv
                draggable={false}
                key={box.id}
                id={box.id}
                style={{
                  top: top,
                  left: left - 5,
                  width: width + 5,
                  height: height
                }}
              />
            );
          })}
      </OuterMostDiv>
    </>
  );
};
