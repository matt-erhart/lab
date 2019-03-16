import * as React from "react";
import styled from "styled-components";
import produce from "immer";
var equal = require("fast-deep-equal");
import { dragData } from "./rx";
import { Subscription } from "rxjs";
import { Rectangle, removeOverlaps } from "webcola";

const windows = [
  { id: "1", left: 100, top: 100, height: 100, width: 100 },
  { id: "2", left: 101, top: 100, height: 100, width: 100 }
];

/**
 * @class **WindowContainer**
 */
const WindowContainerDefaults = {
  props: {},
  state: { windows: windows }
};
export class WindowContainer extends React.Component<
  typeof WindowContainerDefaults.props,
  typeof WindowContainerDefaults.state
> {
  static defaultProps = WindowContainerDefaults.props;
  state = WindowContainerDefaults.state;

  onChange = (props = { id: "", left: -1, width: -1, height: -1, top: -1 }) => {
    const { id, left, top, width, height } = props;
    this.setState(state => {
      const windows = produce(state.windows, draft => {
        const ix = draft.findIndex(w => w.id === id);
        draft[ix].height = height > -1 ? height : draft[ix].height;
        draft[ix].left = left > -1 ? left : draft[ix].left;
        draft[ix].top = top > -1 ? top : draft[ix].top;
        draft[ix].width = width > -1 ? width : draft[ix].width;
      });
      return { windows };
    });
  };

  componentDidMount() {
    let rects = this.state.windows.map(w => {
      const { left, top, width, height } = w;
      return new Rectangle(left, left + width, top, top + height);
    });
    removeOverlaps(rects);
    const windows = rects.map((r, ix) => {
      const left = r.x;
      const width = r.X - r.x;
      const height = r.Y - r.y;
      const top = r.y;
      return { id: ix+'', left, width, height, top };
    });

    this.setState({ windows });
    console.log(rects);
  }

  render() {
    return (
      <ViewportContainer>
        {this.state.windows.map(w => {
          const { left, top, width, height } = w;
          return (
            <ResizeableFrame
              key={w.id}
              id={w.id}
              {...{ left, top, width, height }}
              onChange={this.onChange}
            >
              {" "}
              {w.id}{" "}
            </ResizeableFrame>
          );
        })}
      </ViewportContainer>
    );
  }
}

/**
 * @class **ResizeableFrame**
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
const ResizeableFrameDefaults = {
  props: {
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    id: "",
    onChange: newDims => {}
  },
  state: {
    resizeInfo: { location: "default", cursor: "default" } as hoverInfo,
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    dx: 0,
    dy: 0
  }
};
export class ResizeableFrame extends React.Component<
  typeof ResizeableFrameDefaults.props,
  typeof ResizeableFrameDefaults.state
> {
  static defaultProps = ResizeableFrameDefaults.props;
  state = ResizeableFrameDefaults.state;
  isMouseDown = false;
  componentDidMount() {
    // well show the resize with this comps state,
    // then call onChange only on mouseup
    const { left, top, width, height } = this.props;
    this.setState({ left, top, width, height });
  }

  componentDidUpdate(prevProps, prevState) {
    // calling onChange will change the incoming props
    // or if you just want to controll the window from the outside,
    // e.g. collision detection or force dirrected layout
    if (!equal(prevProps, this.props)) {
      const { left, top, width, height } = this.props;
      this.setState({ left, top, width, height });
    }
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
    this.setState(state => {
      const {
        resizeInfo: { location }
      } = state;
      const updateSides = {
        right: { width: this.props.width + dx },
        bottom: { height: this.props.height + dy },
        top: { top: this.props.top + dy, height: this.props.height - dy },
        left: { left: this.props.left + dx, width: this.props.width - dx }
      };

      const update = {
        ...updateSides,
        topLeft: { ...updateSides.top, ...updateSides.left },
        topRight: { ...updateSides.top, ...updateSides.right },
        bottomRight: { ...updateSides.bottom, ...updateSides.right },
        bottomLeft: { ...updateSides.bottom, ...updateSides.left }
      };

      if (update.hasOwnProperty(location)) {
        console.log(location);

        return update[location];
      } else {
        return null;
      }
    });
  };

  onMouseUp = () => {
    this.isMouseDown = false;
    const { left, top, width, height } = this.state;
    const { id } = this.props;
    this.props.onChange({ id, left, top, width, height });
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
    this.isMouseDown = true;
    this.sub = dragData(e).subscribe(mData => {
      switch (mData.type) {
        case "mousemove":
          this.setState({
            top: this.props.top + mData.dy,
            left: this.props.left + mData.dx
          });
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
    const { left, top, width, height, ...rest } = this.state;
    return (
      <div
        style={{
          position: "absolute",
          left,
          top,
          width,
          height,
          border: "1px solid black",
          padding: 5,
          cursor: this.state.resizeInfo.cursor,
          userSelect: "none",
          display: "flex",
          flexDirection: "column",
          margin: 0,
          boxSizing: 'border-box'
        }}
        onMouseDown={this.onMouseDownResize}
        onMouseMove={this.onHover}
        {...rest}
      >
        <DragHandle draggable={false} onMouseDown={this.onMouseDownMove} />
        <div
          draggable={false}
          style={{
            userSelect: "text",
            width: "100%",
            height: "100%",
            outline: "1px solid lightgrey",
            margin: 0,
            flex: 1
          }}
        >
          hey
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

const ViewportContainer = styled.div`
  --padding: 20px;
  --margin: 3px;
  --height: calc(100vh - 5px - var(--margin) - var(--padding) * 2);
  margin: var(--margin);
  padding: var(--padding);
  height: var(--height);
  border: 1px solid lightgrey;
  border-radius: 5px;
  font-size: 30px;
  overflow: none;
`;
