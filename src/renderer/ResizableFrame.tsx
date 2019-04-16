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
  newDims = {
    id: "",
    left: -1,
    width: -1,
    height: -1,
    top: -1,
    isSelected: false
  } as frame
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
    isSelected: false,
    onTransformStart: undefined as onTrans,
    onTransformEnd: undefined as onTrans,
    onTransforming: undefined as onTrans,
    children: <div /> as React.ReactNode,
    dragHandle: <div /> as React.ReactElement,
    zoom: 1, // i.e. applies to all
    scale: 1, // todo sometimes we want one node to scale up/down
    style: {} as React.CSSProperties,
    hide: false
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
  cache = { left: 0, top: 0, width: 0, height: 0 };

  shouldComponentUpdate(props, state) {
    for (let dim of ["left", "top", "width", "height", "isSelected"]) {
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

  // applyZoom = (box: { left?; top?; width?; height? }) => {
  //   return Object.keys(box).reduce((all, key) => {
  //     all = { ...all, [key]: box[key] * this.props.zoom };
  //     return all;
  //   }, {});
  // };

  resize = (dx, dy) => {
    const zoomDx = dx / this.props.zoom;
    const zoomDy = dy / this.props.zoom;

    const updateSides = {
      right: { width: this.cache.width + zoomDx },
      bottom: { height: this.cache.height + zoomDy },
      top: { top: this.cache.top + zoomDy, height: this.cache.height - zoomDy },
      left: { left: this.cache.left + zoomDx, width: this.cache.width - zoomDx }
    };

    const update = {
      ...updateSides,
      topLeft: { ...updateSides.top, ...updateSides.left },
      topRight: { ...updateSides.top, ...updateSides.right },
      bottomRight: { ...updateSides.bottom, ...updateSides.right },
      bottomLeft: { ...updateSides.bottom, ...updateSides.left }
    };

    // console.log(
    //   update[this.state.resizeInfo.location],
    //   this.applyZoom(update[this.state.resizeInfo.location])
    // );

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
    if (e.target.id !== "frame") return null;

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
      const { zoom } = this.props;
      switch (mData.type) {
        case "mousemove":
          const update = {
            top: this.cache.top + mData.dy / this.props.zoom,
            left: this.cache.left + mData.dx / this.props.zoom
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
      <OuterContainer
        id="frame"
        {...{ left, top, width, height }}
        cursor={this.state.resizeInfo.cursor}
        hide={this.props.hide}
        style={this.props.style}
        onMouseDown={this.onMouseDownResize}
        onMouseMove={this.onHover}
        onScroll={e => e.stopPropagation()}
      >
        {/* <DragHandle draggable={false} onMouseDown={this.onMouseDownMove} /> */}
        {React.cloneElement(this.props.dragHandle, {
          ...this.props.dragHandle.props,
          draggable: false,
          onMouseDown: this.onMouseDownMove
        })}
        <div
          draggable={false}
          style={{
            userSelect: "text",
            // outline: "1px solid lightgrey",
            margin: 0,
            flex: 1,
            backgroundColor: "white"
          }}
        >
          {this.props.children}
        </div>
      </OuterContainer>
    );
  }
}
interface Outer {
  cursor: string;
  left: number;
  top: number;
  width: number;
  height: number;
  hide: boolean;
}
const _outer = styled.div<Outer>``;
const OuterContainer = styled(_outer)`
  position: absolute;
  background-color: #fff;
  left: 0px;
  top: 0px;
  width: ${p => p.width}px;
  height: ${p => p.height}px;
  padding: 5px;
  cursor: ${p => p.cursor};
  user-select: none;
  display: flex;
  flex-direction: column;
  margin: 0px;
  box-sizing: border-box;
  box-shadow: 0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23);
  border-radius: 2px,
  overflow: auto
  transition: opacity 300ms;
  transform: translate(${p => p.left}px, ${p => p.top}px);
  opacity: ${p => (p.hide ? 0 : 1)};
  &:hover {
    opacity: 1;
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
