import * as React from "react";
import { useLayoutEffect, useState, useRef, useEffect } from "react";
import { Portal } from "../Portal";

/**
 * @class **Tooltip**
 */
const TooltipDefaults = {
  props: {
    close: false,
    width: 0,
    height: 0,
    mouseX: 0,
    mouseY: 0,
    onClose: () => {},
    delay: 600
  },
  state: {
    popup: { left: 0, top: 0, width: 0, height: 0 },
    show: false,
    clientHeight: 0,
    clientWidth: 0,
    translateX: 0,
    translateY: 0,
    dragStart: { x: null, y: null },
    pin: false,
    delayOver: false
  }
};
export class Tooltip extends React.Component<
  typeof TooltipDefaults.props,
  typeof TooltipDefaults.state
> {
  static defaultProps = TooltipDefaults.props;
  state = TooltipDefaults.state;
  intervalId;
  delayRender;

  componentDidMount() {
    this.delayRender = setTimeout(() => {
      this.setState({ delayOver: true });
    }, this.props.delay);
    const {
      // doesn't include scroll bars
      clientHeight,
      clientWidth
    } = document.documentElement;
    this.setState({ clientHeight, clientWidth, show: this.props.width > 2 });
  }

  static getDerivedStateFromProps(props, state) {
    const { width: popupWidth, height: popupHeight, mouseX, mouseY } = props;
    const { clientHeight, clientWidth } = state;
    const moreSpaceRight = mouseX < clientWidth / 2;
    const moreSpaceDown = mouseY < clientHeight / 2;
    let x, y;
    if (moreSpaceDown) {
      y = mouseY + 10;
    } else {
      y = mouseY - 5 - popupHeight;
    }

    if (moreSpaceRight) {
      x = mouseX + 15;
    } else {
      x = mouseX - 25 - popupWidth;
    }
    return {
      popup: { width: popupWidth, height: popupHeight + 22, left: x, top: y }
    };
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.close === false && this.props.close && !this.state.pin) {
      this.selfDestruct();
    }

    if (prevProps.close && this.props.close === false) {
      this.setState({ show: true });
    }
  }

  selfDestruct = (ms = 200) => {
    this.intervalId = setTimeout(() => {
      this.close();
    }, ms);
  };

  close = () => {
    this.setState({ show: false });
    this.props.onClose();
  };

  componentWillUnmount() {
    clearTimeout(this.intervalId);
    clearTimeout(this.delayRender);
  }

  onDragEnd = e => {
    clearTimeout(this.intervalId);

    e.persist();
    this.setState(state => {
      const dragX = e.clientX - state.dragStart.x;
      const dragY = e.clientY - state.dragStart.y;
      return {
        translateX: state.translateX + dragX,
        translateY: state.translateY + dragY,
        show: true
      };
    });
  };

  onPinButton = e => {
    this.setState(state => {
      if (state.pin === true) {
        this.close();
        return null;
      } else {
        return { pin: true };
      }
    });
  };

  render() {
    const {
      close,
      width,
      height,
      mouseX,
      mouseY,
      onClose,
      delay,
      ...restProps
    } = this.props;
    if (this.state.show && this.state.delayOver) {
      return (
        <Portal>
          <div
            style={{
              border: "5px solid black",
              borderRadius: "7px",
              position: "absolute",
              ...this.state.popup,
              backgroundColor: "lightgrey",
              // maxWidth: document.documentElement.clientWidth,
              // maxHeight: viewportDims.height,
              zIndex: 10,
              transform: `translate(${this.state.translateX}px, ${
                this.state.translateY
              }px)`,
              resize: "both",
              overflow: "auto"
            }}
            onMouseOver={e => {
              clearTimeout(this.intervalId);
            }}
            onMouseLeave={e => {
              if (!this.state.pin) {
                this.selfDestruct();
              }
            }}
            {...restProps}

          >
            <div
              style={{ backgroundColor: "lightblue" }}
              draggable
              onDragStart={e => {
                clearTimeout(this.intervalId);
                this.setState({
                  dragStart: { x: e.clientX, y: e.clientY },
                  show: true
                });
              }}
              onDragEnd={this.onDragEnd}
            >
              <button onClick={this.onPinButton}>
                {this.state.pin ? "UnPin" : "Pin"}
              </button>
            </div>
            <div draggable={false}>{this.props.children}</div>
          </div>
        </Portal>
      );
    } else {
      return null;
    }
  }
}
