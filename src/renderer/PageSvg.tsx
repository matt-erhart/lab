import * as React from "react";
import { Spring, animated } from "react-spring";
import { dndContainer } from "./rx";
import { Subscription } from "rxjs";
import { PageOfText } from "./io";
import { getRectCoords, flatten, get, getRectEdges, mode } from "./utils";
import { LineOfText } from "./PdfViewer";
import produce from "immer";
import PopupPortal from "./PopupPortal";
import { Image } from "./PdfViewer";
import { iRootState, iDispatch } from "../store/createStore";
import { connect } from "react-redux";
import {
  makePdfSegmentViewbox,
  PdfSegmentViewbox,
  makeUserMediaText,
  makeLink
} from "../store/creators";
// todo consistant CAPS

/**
 * @class **PageSvg**
 *
 */
const PageSvgDefaults = {
  props: {
    svgWidth: 0,
    svgHeight: 0,
    pageOfText: {} as PageOfText,
    columnLefts: [] as number[],
    linesOfText: [] as LineOfText[],
    images: [] as Image[],
    height2color: {} as any,
    fontNames2color: {} as any,
    onAddViewbox: viewbox => {},
    viewboxes: [] as PdfSegmentViewbox[]
  },
  state: {
    selectionRect: { height: 0, width: 0, left: 0, x1: 0, top: 0, y1: 0 },
    lineGroups: [] as { id: number; lines: LineOfText[] }[],
    showTextLineBoxes: true,
    showTextBBoxes: false,
    duration: 0,
    div: { text: "", style: { fontFamily: "" as string, fontSize: 0 } },
    value: "",
    showText: false
  }
};

const mapState = (state: iRootState, props) => {
  return {
    selectedNodes: state.graph.selectedNodes,
    nodes: state.graph.nodes
  };
};

const mapDispatch = ({ graph: { addBatch, removeBatch } }: iDispatch) => ({
  addBatch,
  removeBatch
});

type connectedProps = ReturnType<typeof mapState> &
  ReturnType<typeof mapDispatch>;

class PageSvg extends React.Component<
  typeof PageSvgDefaults.props & connectedProps,
  typeof PageSvgDefaults.state
> {
  static defaultProps = PageSvgDefaults.props;
  state = PageSvgDefaults.state;
  divRef = React.createRef<HTMLDivElement>();
  selectionRectRef = React.createRef<HTMLDivElement>();
  sub: Subscription;

  // componentDidUpdate(prevProps, state){
  //   console.log(this.props )

  // }

  async componentDidMount() {
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
              ...{ x1: mx, y1: my, left: mx, top: my, width: 0, height: 0 }
            },
            showText: false,
            value: ""
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
                left: newX,
                top: newY,
                width: Math.abs(width),
                height: Math.abs(height)
              }
            };
            return out;
          });
          break;

        case "mouseup":
          if (!mouse.ctrlKey) {
            const text = this.getText(this.state.selectionRect); // todo take out the snaps part
          } else {
            this.props.onAddViewbox(this.state.selectionRect);
            this.setState({ showText: true, value: "" });
          }
          break;
      }
    });
  }

  snap = (selectionRect: typeof PageSvgDefaults.state.selectionRect) => {
    const { width, height } = this.state.selectionRect;
    const textCoords = this.props.pageOfText.text.map(t => {
      const { left, top, width, fontHeight } = t;
      return getRectCoords(left, top, width, fontHeight);
    });
  };

  getText = (selectionRect: typeof PageSvgDefaults.state.selectionRect) => {
    const { left, top, width, height } = selectionRect;
    const edge = getRectEdges(left, top, width, height);

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
        const newY = Math.min(sl.top, res.top);
        const newBottom = Math.max(sl.top + sl.height, res.bottom);
        const bbox = {
          left: Math.min(sl.left, res.left),
          top: newY,
          width: Math.max(sl.width, res.width),
          bottom: newBottom,
          height: newBottom - newY
        };
        return bbox;
      },
      { left: Infinity, top: Infinity, width: 0, bottom: 0, height: 0 }
    );
    const { bottom, ...newSelect } = bbox;

    if (
      bbox.left === Infinity ||
      bbox.top === Infinity ||
      bbox.width < 3 ||
      bbox.height < 3
    ) {
      return;
    }
    
    this.props.onAddViewbox(newSelect);
    this.setState({ selectionRect: { ...newSelect, x1: 0, y1: 0 } });

    const text = selectedLines.map(sl => {
      return sl.textIds.map(id => {
        const {
          fontHeight,
          str,
          style: { fontFamily },
          top
        } = this.props.pageOfText.text.find(x => x.id === id);

        return { fontHeight, fontFamily, str, top };
      });
    });

    const fontSize = mode(flatten(text).map<any>(t => (t as any).fontHeight));
    const fontFamily = mode(flatten(text).map<any>(t => (t as any).fontFamily));
    const extractedText = (flatten(text).reduce((res, t) => {
      return res + (t as any).str.replace(/-$/, ""); // end with dash
    }, "") as string).replace(/\s+/g, " ");

    //@ts-ignore
    this.setState({
      div: { text: extractedText, style: { fontFamily, fontSize } },
      showText: true,
      value: ""
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

  onTextChange = e => {
    this.setState({ value: e.target.value });
  };

  closeText = e => {
    if (e.nativeEvent.key === "Escape") {
      this.setState({ showText: false });
      const hasText = this.state.value.length > 0;
      if (hasText) {
        const viewboxId = this.props.selectedNodes[0]; // selected on creation
        const source = this.props.nodes[viewboxId];
        let { x, y } = source.style;
        const shiftedX = x + Math.random() * 50 - 40
        const style = {
          x: shiftedX < 20 ? 20 + Math.random() * 50 : shiftedX,
          y: y + Math.random() * 50 + 40
        };

        const textNode = makeUserMediaText(this.state.value, style);
        const link = makeLink(source, textNode, { type: "more" });
        this.props.addBatch({ nodes: [textNode], links: [link] });
        //add edge from selected to userdoc
      }
    }
  };

  onOpenText = e => {
    this.setState({ value: e.target.value });
  };

  render() {
    const { left, top, width, height } = this.state.selectionRect;

    return (
      <>
        <svg
          style={{ position: "absolute" }}
          width={this.props.svgWidth}
          height={this.props.svgHeight}
        >
          {/* {this.props.images.length > 0 &&
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
            })} */}
          {this.state.showTextBBoxes &&
            this.props.pageOfText.text.map((t, i) => {
              // const color = this.props.height2color[t.transform[0] + ""];
              const fill = this.props.fontNames2color[t.style.fontFamily];

              return (
                <rect
                  key={i}
                  x={t.left}
                  y={t.top}
                  width={t.width}
                  height={t.fontHeight}
                  style={{
                    stroke: "lightblue",
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
              // const color = this.props.height2color[line.height + ""];
              const color = "lightgrey";
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
          <Spring
            native
            to={{ left, top, width, height }}
            config={{ duration: this.state.duration }}
          >
            {props => (
              <animated.div
                ref={this.selectionRectRef}
                style={{
                  position: "absolute",
                  top: top,
                  left: left,
                  width: width,
                  height: height,
                  border: "1px solid grey"
                }}
              />
            )}
          </Spring>
          {this.props.viewboxes.length > 0 &&
            this.props.viewboxes.map(vb => {
              const { top, left, width, height } = vb.data;

              return (
                <div
                  key={vb.id}
                  style={{
                    position: "absolute",
                    top: top,
                    left: left - 5,
                    width: width + 5,
                    height: height,
                    border: "2px solid green",
                    lineHeight: "1em",
                    backgroundColor: "transparent"
                  }}
                />
              );
            })}
          {this.state.showText && (
            <>
              <div
                style={{
                  position: "absolute",
                  top: top,
                  left: left - 5,
                  width: width + 5,
                  height: height,
                  border: "2px solid lightblue",
                  lineHeight: "1em",
                  backgroundColor: "transparent"
                }}
              />
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
                  value={this.state.value}
                  onChange={this.onTextChange}
                  onKeyDown={this.closeText}
                  // todo make node on type then make edge to selected viewbox node
                  style={{
                    width,
                    height,
                    minHeight: 50,
                    minWidth: 200,
                    fontFamily: this.state.div.style.fontFamily,
                    fontSize: 20,
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

export default connect(
  mapState,
  mapDispatch
)(PageSvg);
