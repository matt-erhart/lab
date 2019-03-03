import * as React from "react";
import { useLayoutEffect, useState, useRef, useEffect } from "react";
import { Portal } from "./Portal";

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
    onClose: () => {}
  },
  state: {
    popup: { left: 0, top: 0, width: 0, height: 0 },
    show: false,
    clientHeight: 0,
    clientWidth: 0,
    translateX: 0,
    translateY: 0,
    dragStart: { x: null, y: null },
    pin: false
  }
};
export class Tooltip extends React.Component<
  typeof TooltipDefaults.props,
  typeof TooltipDefaults.state
> {
  static defaultProps = TooltipDefaults.props;
  state = TooltipDefaults.state;
  intervalId;

  componentDidMount() {
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
      x = mouseX -25 - popupWidth;
    }
    return {
      popup: { width: popupWidth, height: popupHeight+22, left: x, top: y }
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
    if (this.state.show) {
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
              }px)`
            }}
            onMouseOver={e => {
              clearTimeout(this.intervalId);
            }}
            onMouseLeave={e => {
              if (!this.state.pin) {
                this.selfDestruct();
              }
            }}
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

// export const _Tooltip = ({
//   open = false,
//   mouseX = NaN,
//   mouseY = NaN,
//   width = 200,
//   height = 200,
//   children = null as React.ReactNode
// }) => {
//   let tooltipRef = useRef<HTMLDivElement>(null);
//   const [viewportDims, setViewportDims] = useState({ width: 0, height: 0 });

//   const [popup, setPopup] = useState({
//     style: {
//       left: 0,
//       top: 0,
//       width,
//       height
//     }
//   });
//   const [show, setShow] = useState(false);
//   let { x: windowX, y: windowY } = useWindowMousePosition();

//   const intervalRef = useRef(null);
//   useEffect(() => {
//     if ([mouseX, mouseY].includes(NaN)) return undefined;
//     const { width: popupWidth, height: popupHeight } = popup.style;
//     const { width: viewportWidth, height: viewportHeight } = viewportDims;
//     const moreSpaceDown = windowY < viewportHeight / 2;
//     const moreSpaceRight = windowX < viewportWidth / 2;
//     let x, y;
//     if (moreSpaceDown) {
//       y = windowY + 15;
//     } else {
//       y = windowY - 5 - popupHeight;
//     }

//     if (moreSpaceRight) {
//       x = windowX + 15;
//     } else {
//       x = windowX - 5 - popupWidth;
//     }
//     setPopup({ style: { ...popup.style, left: x, top: y } });
//   }, [mouseX, mouseY]);

//   useEffect(() => {
//     if (!open) {
//       selfDestruct();
//       return () => clearTimeout(intervalRef.current);
//     } else {
//       setShow(true);
//       return undefined;
//     }
//   }, [open]);

//   const selfDestruct = () => {
//     intervalRef.current = setTimeout(() => {
//       setShow(false);
//     }, 1000);
//   };

//   useLayoutEffect(() => {
//     const {
//       // doesn't include scroll bars
//       clientHeight,
//       clientWidth
//     } = document.documentElement;
//     setViewportDims({ width: clientWidth, height: clientHeight });
//   }, []);

//   if (show) {
//     return (
//       <Portal>
//         <div
//           style={{
//             position: "absolute",
//             ...popup.style,
//             backgroundColor: "lightgrey",
//             maxWidth: viewportDims.width,
//             maxHeight: viewportDims.height,
//             zIndex: 10
//           }}
//           // onMouseOver={e => {
//           //   clearTimeout(intervalRef.current);
//           // }}
//           // onMouseLeave={e => {
//           //   selfDestruct();
//           // }}
//         >
//           {children}
//         </div>
//       </Portal>
//     );
//   } else {
//     return null;
//   }
// };

// // https://github.com/rehooks/window-mouse-position/blob/master/index.js
// function useWindowMousePosition() {
//   let [WindowMousePosition, setWindowMousePosition] = useState({
//     x: null,
//     y: null
//   });

//   function handleMouseMove(e) {
//     setWindowMousePosition({
//       x: e.pageX,
//       y: e.pageY
//     });
//   }

//   useEffect(() => {
//     window.addEventListener("mousemove", handleMouseMove);

//     return () => {
//       window.removeEventListener("mousemove", handleMouseMove);
//     };
//   }, []);

//   return WindowMousePosition;
// }

// const [bbox, setBbox] = useState({
//   bottom: 0,
//   height: 0,
//   left: 0,
//   right: 0,
//   top: 0,
//   width: 0,
//   x: 0,
//   y: 0
// } as DOMRect | ClientRect);
// setBbox(tooltipRef.current.getBoundingClientRect());
