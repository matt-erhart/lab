import * as React from "react";
import { Spring, animated } from "react-spring";
import { dndContainer } from "./rx";
import { Subscription } from "rxjs";
import { TextItem } from "./PageText";
import { getRectCoords, flatten, get, getRectEdges } from "./utils";
import { LineOfText } from "./PdfViewer";
import produce from "immer";

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
    columnLefts: [] as number[],
    linesOfText: [] as LineOfText[]
  },
  state: {
    selectionRect: title,
    lineGroups: [] as { id: number; lines: LineOfText[] }[],
    showTextLineBoxes: false,
    duration: 0
  }
};
export default class PageSvg extends React.Component<
  typeof PageSvgDefaults.props,
  typeof PageSvgDefaults.state
> {
  static defaultProps = PageSvgDefaults.props;
  state = PageSvgDefaults.state;
  divRef = React.createRef<HTMLDivElement>();
  sub: Subscription;
  componentDidMount() {
    // this.getText(this.state.selectionRect);
    this.snap(this.state.selectionRect);
    const dnd = dndContainer(this.divRef);
    this.sub = dnd.subscribe(mouse => {
      const { selectionRect } = this.state;
      const {
        left: bbLeft,
        top: bbTop
      } = this.divRef.current.getBoundingClientRect();
      const mx = mouse.x - bbLeft;
      const my = mouse.y - bbTop;

      switch (mouse.type) {
        case "mousedown":
          this.setState({
            duration: 0,
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
          const text = this.getText(this.state.selectionRect);
          this.setState({ duration: 200 });
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
  };

  getText = (selectionRect: typeof PageSvgDefaults.state.selectionRect) => {
    const { x, y, width, height } = selectionRect;
    const edge = getRectEdges(x, y, width, height);

    const selectedColumnIx = this.props.columnLefts.reduce(
      // todo util: betweenRanges
      (res, colLeft, ix) => {
        return edge.maxX > colLeft ? ix : res;
      },
      0
    );

    // todo util
    const selectedLines = this.props.linesOfText.filter(lt => {
      const inCol = lt.columnIndex === selectedColumnIx;
      const isUnderSelectionTop = lt.top + lt.height > edge.minY;
      const isAboveSelectionBottom = lt.top < edge.maxY;
      return inCol && isUnderSelectionTop && isAboveSelectionBottom;
    });

    const bbox = selectedLines.reduce(
      (res, sl) => {
        const newY = Math.min(sl.top, res.y);
        const newBottom = Math.max(sl.top + sl.height, res.bottom);
        const bbox = {
          x: Math.min(sl.left, res.x),
          y: newY,
          width: Math.max(sl.width, res.width),
          bottom: newBottom,
          height: newBottom - newY
        };
        return bbox;
      },
      { x: Infinity, y: Infinity, width: 0, bottom: 0, height: 0 }
    );
    const { bottom, ...newSelect } = bbox;
    this.setState({ selectionRect: { ...newSelect, x1: 0, y1: 0 } });
    // return this.props.linesOfText.filter(lt => {

    //   // const textX = lt.left;
    //   // const textY = lt.top;
    //   // const yInRange = textY > top && textY < bottom;
    //   // const xInRange = textX > left && textX < right;

    // });
  };

  clickLine = (line: LineOfText) => e => {
    this.setState(state =>
      produce(state, draft => {
        const nGroups = draft.lineGroups.length;
        const ix = this.props.linesOfText.findIndex(l => l.id === line.id);
        const lines = this.props.linesOfText.slice(ix - 1, ix + 2);

        if (nGroups === 0) {
          draft.lineGroups.push({ id: 0, lines: [...lines] });
        } else {
          draft.lineGroups[0].lines.push(...lines);
        }
      })
    );
  };

  componentWillUnmount() {
    this.sub.unsubscribe();
  }

  render() {
    const { x, y, width, height } = this.state.selectionRect;
    return (
      <>
        <svg
          style={{ position: "absolute" }}
          width={this.props.svgWidth}
          height={this.props.svgHeight}
        >
          {/* {this.props.text.map(t => {
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
        })} */}

          {this.props.columnLefts && (
            <>
              {this.props.columnLefts.map((left, i) => {
                return (
                  <line
                    key={i}
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
        </svg>
        <div
          ref={this.divRef}
          style={{
            position: "absolute",
            width: this.props.svgWidth,
            height: this.props.svgHeight
          }}
        >
          {this.props.linesOfText.length > 0 &&
            this.props.linesOfText.map((line, i) => {
              return (
                <div
                  draggable={false}
                  key={line.id}
                  style={{
                    position: "absolute",
                    left: line.left,
                    top: line.top,
                    width: line.width,
                    height: line.height,
                    outline: this.state.showTextLineBoxes
                      ? "1px solid lightgreen"
                      : "none"
                  }}
                  onClick={this.clickLine(line)}
                />
              );
            })}
          {this.state.lineGroups.length > 0 &&
            this.state.lineGroups[0].lines.map((line, i) => {
              return (
                <div
                  draggable={false}
                  key={i}
                  style={{
                    position: "absolute",
                    left: line.left,
                    top: line.top,
                    width: line.width,
                    height: line.height,
                    outline: "1px solid blue"
                  }}
                />
              );
            })}
          <Spring
            native
            to={{ x, y, width, height }}
            config={{ duration: this.state.duration }}
          >
            {props => (
              <animated.div
                style={{
                  position: "absolute",
                  top: props.y,
                  left: props.x,
                  width: props.width,
                  height: props.height,
                  border: "1px solid grey"
                }}
              />
            )}
          </Spring>
        </div>
      </>
    );
  }
}
