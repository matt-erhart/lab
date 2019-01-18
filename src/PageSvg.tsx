import * as React from "react";
import { Spring, animated } from "react-spring";
import { dndContainer } from "./rx";
import { Subscription } from "rxjs";
import { TextItem } from "./PageText";
// some example mouse coordinates

/**
 * @class **PageSvg**
 *
 */
const PageSvgDefaults = {
  props: { svgWidth: 0, svgHeight: 0, text: [] as TextItem[] },
  state: {
    selectionRect: { x1: 0, y1: 0, x: 0, y: 0, width: 0, height: 0, show: true }
  }
};
export default class PageSvg extends React.Component<
  typeof PageSvgDefaults.props,
  typeof PageSvgDefaults.state
> {
  static defaultProps = PageSvgDefaults.props;
  state = PageSvgDefaults.state;
  svgRef = React.createRef<SVGSVGElement>();
  sub: Subscription;
  componentDidMount() {
    const dnd = dndContainer(this.svgRef);
    this.sub = dnd.subscribe(mouse => {
      const { selectionRect } = this.state;
      const {
        left: bbLeft,
        top: bbTop
      } = this.svgRef.current.getBoundingClientRect();
      const mx = mouse.x - bbLeft;
      const my = mouse.y - bbTop;

      switch (mouse.type) {
        case "mousedown":
          this.setState({
            selectionRect: {
              ...selectionRect,
              ...{ x1: mx, y1: my, x: mx, y: my, width: 0, height: 0 }
            }
          });
          break;
        case "mousemove":
          this.setState(state => {
            const width = mx - state.selectionRect.x1;
            const height = my - state.selectionRect.y1;
            const newX =
              width < 0
                ? state.selectionRect.x1 - Math.abs(width)
                : state.selectionRect.x1;
            const newY =
              height < 0
                ? state.selectionRect.y1 - Math.abs(height)
                : state.selectionRect.y1;

            const out = {
              selectionRect: {
                ...state.selectionRect,
                x: newX,
                y: newY,
                width: Math.abs(width),
                height: Math.abs(height)
              }
            };
            return out;
          });
          break;

        case "mouseup":
          this.getText(this.state.selectionRect);
          break;
      }
    });
  }

  getText = (selectionRect: typeof PageSvgDefaults.state.selectionRect) => {
    const text = this.props.text.filter(tc => {
      const top = selectionRect.y;
      const bottom = selectionRect.y + selectionRect.height;
      const left = selectionRect.x;
      const right = selectionRect.x + selectionRect.width;

      const textX = tc.left;
      const textY = tc.top;
      const yInRange = textY > top && textY < bottom;
      const xInRange = textX > left && textX < right;
      return yInRange && xInRange;
    });
    const concatStr = text.reduce((acc, val) => {
      return acc + val.str.replace(/\s+/g, " ");
    }, "");
    console.log(concatStr);

    //l 102 top 61
  };

  componentWillUnmount() {
    this.sub.unsubscribe();
  }

  render() {
    const { x, y, width, height, show } = this.state.selectionRect;

    return (
      <svg
        ref={this.svgRef}
        style={{ position: "absolute" }}
        width={this.props.svgWidth}
        height={this.props.svgHeight}
      >
        <Spring
          native
          to={{ x, y, width, height }}
          config={{ tension: 0, friction: 0, precision: 1 }}
        >
          {props => (
            <animated.rect
              {...props}
              style={{ stroke: "black", fill: "none", strokeWidth: 4 }}
            />
          )}
        </Spring>
      </svg>
    );
  }
}
