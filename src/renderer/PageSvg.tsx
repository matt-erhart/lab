import * as React from "react";
import { Spring, animated } from "react-spring";
import { dndContainer } from "./rx";
import { Subscription } from "rxjs";
import { TextItem } from "./PageText";
import {
  getRectCoords,
  flatten,
  get,
  getRectEdges,
  mode,
  unique,
  brewer12
} from "./utils";
import { LineOfText } from "./PdfViewer";
import produce from "immer";
import PopupPortal from "./PopupPortal";
import { Image } from "./PdfViewer";

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
    linesOfText: [] as LineOfText[],
    images: [] as Image[],
    height2color: {} as any,
    fontNames2color: {} as any,
    scale: 1
  },
  state: {
    selectionRect: title,
    lineGroups: [] as { id: number; lines: LineOfText[] }[],
    showTextLineBoxes: false,
    showTextBBoxes: true,
    duration: 0,
    div: { text: "", style: { fontFamily: "" as string, fontSize: 0 } }
  }
};
export default class PageSvg extends React.Component<
  typeof PageSvgDefaults.props,
  typeof PageSvgDefaults.state
> {
  static defaultProps = PageSvgDefaults.props;
  state = PageSvgDefaults.state;
  divRef = React.createRef<HTMLDivElement>();
  selectionRectRef = React.createRef<HTMLDivElement>();
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
            div: { ...this.state.div, text: "" },
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

    const text = selectedLines.map(sl => {
      return sl.textIds.map(id => {
        const {
          transform,
          style: { fontFamily },
          str,
          top,
          height
        } = this.props.text[id];

        return { fontHeight: transform[0], fontFamily, str, top, height };
      });
    });
    const fontSize = mode(flatten(text).map<any>(t => (t as any).fontHeight));
    const fontFamily = mode(flatten(text).map<any>(t => (t as any).fontFamily));
    const extractedText = flatten(text)
      .reduce((res, t) => {
        return res + (t as any).str.replace(/-$/, ""); // end with dash
      }, "")
      .replace(/\s+/g, " ");

    //@ts-ignore
    this.setState({
      div: { text: extractedText, style: { fontFamily, fontSize } }
    });

    // // adapt styles here
    // const elements = flatten(text).reduce<
    //   { element: string; style: { fontSize: string; fontFamily: string } }[]
    // >((res, t, ix) => {
    //   if (ix === 0){
    //     res.push({element: 'span', style: {fontFamily: t.fontFamily, fontSize: t.fontSize}})
    //   }
    //   return res;
    // }, []);

    // console.log(flatten(text));

    // // todo util?
    // const extractedText = this.props.text.filter(lt => {
    //   const yInRange =
    //     lt.top >= newSelect.y && lt.top <= newSelect.y + newSelect.height;
    //   const xInRange =
    //     lt.left >= newSelect.x && lt.left <= newSelect.x + newSelect.width;
    //   return xInRange && yInRange;
    // });

    // const text = extractedText
    //   .reduce((res, t) => {
    //     return res + t.str.replace(/-$/, ""); // end with dash
    //   }, "")
    //   .replace(/\s+/g, " ");
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
    const { scale } = this.props;
    return (
      <>
        <svg
          style={{ position: "absolute" }}
          width={this.props.svgWidth}
          height={this.props.svgHeight}
        >
          {this.props.images.length > 0 &&
            this.props.images.map((img, i) => {
              const { x, y, width, height } = img;
              const mat = img.gTransform
                .replace("matrix(", "")
                .replace(")", "")
                .split(" ");

              return (
                <image
                  key={i}
                  x={parseInt(mat[4]) * scale + "px"}
                  y={
                    this.props.svgHeight -
                    (parseInt(mat[5]) * scale + parseInt(mat[3]) * scale) -
                    3 +
                    "px"
                  }
                  width={parseInt(mat[0]) * scale + "px"}
                  height={parseInt(mat[3]) * scale + "px"}
                  href={img["xlink:href"]}
                  style={{ outline: "2px solid pink" }}
                  // transform={
                  //   img.transform
                  // }
                />
              );
            })}
          {this.state.showTextBBoxes &&
            this.props.text.map((t, i) => {
              const color = this.props.height2color[t.transform[0] + ""];
              const fill = this.props.fontNames2color[t.style.fontFamily];

              return (
                <rect
                  key={i}
                  x={t.left}
                  y={t.top}
                  width={t.width}
                  height={t.transform[0]}
                  style={{
                    stroke: color,
                    fill: fill,
                    strokeWidth: 2,
                    opacity: 0.5
                  }}
                />
              );
            })}

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
                    style={{ stroke: "blue" }}
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
              const color = this.props.height2color[line.height + ""];

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
                      ? "2px solid " + color
                      : "none"
                  }}
                  onClick={this.clickLine(line)}
                />
              );
            })}
          {/* {this.state.lineGroups.length > 0 &&
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
            })} */}
          <Spring
            native
            to={{ x, y, width, height }}
            config={{ duration: this.state.duration }}
          >
            {props => (
              <animated.div
                ref={this.selectionRectRef}
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
          {this.state.div.text.length > 0 && (
            <>
              <div
                style={{
                  position: "absolute",
                  top: y,
                  left: x,
                  width: width + 5,
                  height: height,
                  border: "1px solid grey",
                  background: "white",
                  lineHeight: "1em",
                  ...this.state.div.style,
                  fontSize: (this.state.div.style.fontSize * scale) * .92
                }}
              >
                {this.state.div.text}
              </div>
              <PopupPortal
                referenceElement={this.selectionRectRef.current}
                boundariesElement={this.divRef.current}
              >
                <textarea
                  ref={input =>
                    input &&
                    input.focus({
                      preventScroll: true
                    })
                  }
                  style={{
                    width,
                    height,
                    minHeight: 50,
                    minWidth: 200,
                    fontFamily: this.state.div.style.fontFamily,
                    fontSize: 10*scale,
                    boxShadow: "0 2px 12px -6px #777"
                  }}
                />
              </PopupPortal>
            </>
          )}
        </div>
      </>
    );
  }
}
