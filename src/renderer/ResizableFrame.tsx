import * as React from "react";
import styled from "styled-components";
import produce from "immer";
var equal = require("fast-deep-equal");
import { dragData } from "./rx";
import { Subscription } from "rxjs";

// example updateOneFrane which you could import and use

export type frame = Partial<{
  id: string;
  left: number;
  top: number;
  width: number;
  height: number;
}>;
export const updateOneFrame = (frames: frame[]) => (
  newDims = { id: "", left: -1, width: -1, height: -1, top: -1 } as frame
): frame[] => {
  const { id, left, top, width, height } = newDims;

  const updatedFrames = produce(frames, draft => {
    const ix = draft.findIndex(w => w.id === id);
    draft[ix].height = height > -1 ? height : draft[ix].height;
    draft[ix].left = left > -1 ? left : draft[ix].left;
    draft[ix].top = top > -1 ? top : draft[ix].top;
    draft[ix].width = width > -1 ? width : draft[ix].width;
  });
  return updatedFrames;
};

/**
 * @class **ResizableFrame**
 * can drag sides/corner to resize
 * will call onTransform* on mousedownmoveup which will return new dims
 * can move by dragging top bar
 */
const mouseDownDefault = {
  isDown: false,
  mx: NaN,
  my: NaN,
  left: NaN,
  top: NaN,
  width: NaN,
  height: NaN,
  id: ""
};
type onTrans = (newDims: frame) => void;
const ResizableFrameDefaults = {
  props: {
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    id: "",
    onTransformStart: undefined as onTrans,
    onTransformEnd: undefined as onTrans,
    onTransforming: undefined as onTrans,
    children: <span /> as React.ReactNode
  },
  state: {
    resizeInfo: { location: "default", cursor: "default" } as hoverInfo
  }
};
export class ResizableFrame extends React.Component<
  typeof ResizableFrameDefaults.props,
  typeof ResizableFrameDefaults.state
> {
  static defaultProps = ResizableFrameDefaults.props;
  state = ResizableFrameDefaults.state;
  isMouseDown = false;
  cache = { left: 0, top: 0, width: 0, height: 0, dx: 0, dy: 0 };

  shouldComponentUpdate(props, state) {
    for (let dim of ["left", "top", "width", "height"]) {
      if (this.props[dim] !== props[dim]) {
        return true;
      }
    }
    if (state.resizeInfo !== this.state.resizeInfo) return true;
    return false;
  }

  componentDidMount() {
    const { left, top, width, height } = this.props;
    this.cache = { ...this.cache, left, top, width, height };
  }

  onHover = e => {
    if (!this.isMouseDown) {
      const resizeInfo = getResizeInfo(e);
      this.setState(state => {
        if (!equal(resizeInfo, state.resizeInfo)) {
          return { resizeInfo };
        } else {
          return null;
        }
      });
    }
  };

  resize = (dx, dy) => {
    const updateSides = {
      right: { width: this.cache.width + dx },
      bottom: { height: this.cache.height + dy },
      top: { top: this.cache.top + dy, height: this.cache.height - dy },
      left: { left: this.cache.left + dx, width: this.cache.width - dx }
    };

    const update = {
      ...updateSides,
      topLeft: { ...updateSides.top, ...updateSides.left },
      topRight: { ...updateSides.top, ...updateSides.right },
      bottomRight: { ...updateSides.bottom, ...updateSides.right },
      bottomLeft: { ...updateSides.bottom, ...updateSides.left }
    };

    if (this.props.onTransforming) {
      this.props.onTransforming({
        id: this.props.id,
        ...update[this.state.resizeInfo.location]
      });
    }

    // else {
    //   // let this component handle it
    //   this.setState(state => {
    //     const {
    //       resizeInfo: { location }
    //     } = state;
    //     if (update.hasOwnProperty(location)) {
    //       return update[location]; // e.g. {left, top, width, height}
    //     } else {
    //       return null;
    //     }
    //   });
    // }
  };

  onMouseUp = () => {
    const { left, top, width, height } = this.props;
    this.cache = { ...this.cache, left, top, width, height };
    this.isMouseDown = false;
    if (this.props.onTransformEnd) {
      const { id } = this.props;
      this.props.onTransformEnd({ id, left, top, width, height });
    }
  };

  // todo this actually would make a good hook
  sub: Subscription;
  onMouseDownResize = e => {
    this.isMouseDown = true;
    this.sub = dragData(e).subscribe(mData => {
      switch (mData.type) {
        case "mousemove":
          this.resize(mData.dx, mData.dy);
          break;
        case "mouseup":
          this.onMouseUp();
          break;
      }
    });
  };

  onMouseDownMove = e => {
    e.stopPropagation();
    this.isMouseDown = true;
    this.sub = dragData(e).subscribe(mData => {
      switch (mData.type) {
        case "mousemove":
          const update = {
            top: this.cache.top + mData.dy,
            left: this.cache.left + mData.dx
          };
          if (this.props.onTransforming) {
            // controlled
            this.props.onTransforming({ id: this.props.id, ...update });
          }
          //   else {
          //     this.setState(update);
          //   }

          break;
        case "mouseup":
          this.onMouseUp();
          break;
      }
    });
  };

  componentWillUnmount() {
    if (this.sub) this.sub.unsubscribe();
  }

  render() {
    const { left, top, width, height } = this.props;

    return (
      <div
        style={{
          position: "absolute",
          left,
          top,
          width,
          height,
          //   border: "1px solid black",
          backgroundColor: "#fff",
          padding: 5,
          cursor: this.state.resizeInfo.cursor,
          userSelect: "none",
          display: "flex",
          flexDirection: "column",
          margin: 0,
          boxSizing: "border-box",
          //   outline: "1px solid black",
          boxShadow: "0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23)",
          borderRadius: 2
        }}
        onMouseDown={this.onMouseDownResize}
        onMouseMove={this.onHover}
      >
        <DragHandle draggable={false} onMouseDown={this.onMouseDownMove} />
        <div
          draggable={false}
          style={{
            userSelect: "text",
            width: "100%",
            height: "100%",
            // outline: "1px solid lightgrey",
            margin: 0,
            flex: 1,
            backgroundColor: "white"
          }}
        >
          {this.props.children}
        </div>
      </div>
    );
  }
}

const DragHandle = styled.div`
  min-height: 10px;
  background-color: lightblue;
  flex: 0;
  user-select: none;
  &:hover {
    cursor: all-scroll;
  }
`;

type loc =
  | "left"
  | "top"
  | "right"
  | "bottom"
  | "topLeft"
  | "topRight"
  | "bottomLeft"
  | "bottomRight"
  | "default";
type cursor =
  | "nwse-resize"
  | "nesw-resize"
  | "ew-resize"
  | "ns-resize"
  | "move"
  | "default";
type hoverInfo = { location: loc; cursor: cursor };

const getResizeInfo = (
  e: React.MouseEvent<HTMLDivElement, MouseEvent>
): hoverInfo => {
  // edge or corner locations with matching cursors
  let element = e.nativeEvent.target as HTMLDivElement;
  var style = window.getComputedStyle(element, null);
  var padTop = parseInt(style.getPropertyValue("padding-top"));
  var padRight = parseFloat(style.getPropertyValue("padding-right"));
  var padLeft = parseFloat(style.getPropertyValue("padding-left"));
  var padBottom = parseFloat(style.getPropertyValue("padding-bottom"));
  var width = element.offsetWidth;
  var height = element.offsetHeight;
  var mouseX = e.nativeEvent.offsetX;
  var mouseY = e.nativeEvent.offsetY;
  const isLeft = mouseX < padLeft;
  const isRight = mouseX > width - padRight;
  const isTop = mouseY < padTop;
  const isBottom = mouseY > height - padBottom;
  const isTopLeft = isLeft && isTop;
  const isTopRight = isRight && isTop;
  const isBottomLeft = isLeft && isBottom;
  const isBottomRight = isRight && isBottom;

  // check corners first
  if (isTopLeft) return { location: "topLeft", cursor: "nwse-resize" };
  if (isBottomRight) return { location: "bottomRight", cursor: "nwse-resize" };
  if (isBottomLeft) return { location: "bottomLeft", cursor: "nesw-resize" };
  if (isTopRight) return { location: "topRight", cursor: "nesw-resize" };

  // else edge
  if (isLeft) return { location: "left", cursor: "ew-resize" };
  if (isRight) return { location: "right", cursor: "ew-resize" };
  if (isTop) return { location: "top", cursor: "ns-resize" };
  if (isBottom) return { location: "bottom", cursor: "ns-resize" };

  return { location: "default", cursor: "default" };
};
