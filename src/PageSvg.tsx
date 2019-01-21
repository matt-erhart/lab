import * as React from "react";
import { Spring, animated } from "react-spring";
import { dndContainer } from "./rx";
import { Subscription } from "rxjs";
import { TextItem } from "./PageText";
var rbush = require("rbush");
var knn = require("rbush-knn");
import Flatbush from "flatbush";
import {
  histogram,
  extent,
  mean,
  median,
  variance,
  deviation,
  rollup
} from "d3-array";
import {getRectCoords} from './utils'

const title = {
  height: 0,
  width: 0,
  x: 89,
  x1: 89,
  y: 53,
  y1: 53
};

const lefts = [] as number[];

/**
 * @class **PageSvg**
 *
 */
const PageSvgDefaults = {
  props: {
    svgWidth: 0,
    svgHeight: 0,
    text: [] as TextItem[],
    columnLefts: [] as number[]
  },
  state: {
    selectionRect: title
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
    // this.getText(this.state.selectionRect);
    this.snap(this.state.selectionRect);
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



  snap = (selectionRect: typeof PageSvgDefaults.state.selectionRect) => {
    const { x, y, width, height } = this.state.selectionRect;
    const textCoords = this.props.text.map(t => {
      const { left, top, width } = t;
      const fontHeight = t.transform[0];
      return getRectCoords(left, top, width, fontHeight);
    });
    // const rectCoords = this.getRectCoords(x, y, width, height);

    // const makeHistogram = histogram();
    // const leftXHist = makeHistogram(textCoords.map(x=>x.lb[0]))
    // const leftXBinCounts = leftXHist.map(x=>x.length)
    // const leftXMean = mean(leftXBinCounts)
    // const leftXStd = deviation(leftXBinCounts)
    // const leftXZscore = leftXBinCounts.map(x => (x-leftXMean)/leftXStd)
    // console.log(leftXZscore)
    // const zThresh = 1
    // const coords = leftXBinCounts.reduce((all,val, ix) => {
    //   if (leftXZscore[ix] > zThresh) {
    //     // console.log(rollup(leftXHist[ix]))
    //     all.push(Math.round(median(leftXHist[ix])))
    //     return all
    //   } else {
    //     return all
    //   }
    // },[])

    // this.setState({lefts: coords})

    // const ltDists = textCoords.map(t => {
    //   const [x2, y2] = t.lt
    //   const [x1, y1] = rectCoords.lt
    //   return Math.hypot(x2 - x1, y2 - y1);
    // });
    // const ltNN = this.props.text[this.min(ltDists).index]

    // const rtDists = textCoords.map(t => {
    //   const [x2, y2] = t.rt
    //   const [x1, y1] = [rectCoords.rt[0], ltNN.top]
    //   if (y2 > ltNN.top + ltNN.transform[0]) return Infinity
    //   return Math.hypot(x2 - x1, y2 - y1);
    // });
    // const rtNN = this.props.text[this.min(rtDists).index]

    // const lbDists = textCoords.map(t => {
    //   const [x2, y2] = t.rt
    //   const [x1, y1] = [rectCoords.rt[0], ltNN.top]
    //   if (y2 > ltNN.top + ltNN.transform[0]) return Infinity
    //   return Math.hypot(x2 - x1, y2 - y1);
    // });
    // const lbNN = this.props.text[this.min(rtDists).index]

    // const concatStr = this.props.text
    //   .slice(ids2[0])
    //   .reduce((acc, val) => {
    //     return acc + val.str.replace(/\s+/g, " ");
    //   }, "");
    //   console.log(this.props.text[ids2[0]])
  };

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
        {this.props.text.map(t => {
          return (
            <rect
              x={t.left}
              y={t.top}
              width={t.width}
              height={t.transform[0]}
              style={{
                stroke: "black",
                fill: "none",
                strokeWidth: 1,
                opacity: 0.5
              }}
            />
          );
        })}

        {this.props.columnLefts && (
          <>
            {this.props.columnLefts.map(left => {
              return (
                <line
                  x1={left}
                  x2={left}
                  y1={0}
                  y2={this.props.svgHeight}
                  style={{ stroke: "lightblue" }}
                />
              );
            })}
          </>
        )}

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
