import * as React from "react";
import { Spring, animated } from "react-spring";
import { dndContainer } from "./rx";
import { Subscription } from "rxjs";
import { PageOfText } from "./io";
import {
  getRectCoords,
  flatten,
  get,
  getRectEdges,
  mode,
  NestedPartial
} from "./utils";
import { LineOfText } from "./PdfViewer";
import produce from "immer";
import { Image } from "./PdfViewer";
import { iRootState, iDispatch } from "../store/createStore";
import { connect } from "react-redux";
import {
  makePdfSegmentViewbox,
  PdfSegmentViewbox,
  makeLink,
  makeUserDoc
} from "../store/creators";
import { MdDeleteForever } from "react-icons/md";
// todo consistant CAPS
import { getNeighborhood } from "./graphUtils";
import styled from "styled-components";
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
    // onAddViewbox: viewbox => {},
    viewboxes: [] as PdfSegmentViewbox[],
    isMainReader: false,
    scale: 1,
    pageNumber: 1
  },
  state: {
    selectionRect: { height: 0, width: 0, left: 0, x1: 0, top: 0, y1: 0 },
    lineGroups: [] as { id: number; lines: LineOfText[] }[],
    showTextLineBoxes: false,
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
    nodes: state.graph.nodes,
    links: state.graph.links,
    portals: state.app.portals,
    pdfDir: state.app.panels.mainPdfReader.pdfDir,
    nextNodeLoc: state.app.nextNodeLocation
  };
};

const mapDispatch = ({
  graph: { addBatch, removeBatch, toggleSelections },
  app: {
    addPortals,
    removePortals,
    updatePortals,
    setMainPdfReader,
    setCurrent,
    setGraphContainer
  }
}: iDispatch) => ({
  addBatch,
  removeBatch,
  addPortals,
  removePortals,
  updatePortals,
  setMainPdfReader,
  setGraphContainer,
  setCurrent,
  toggleSelections
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
  onAddViewbox = (viewboxCoords: { left; top; width; height }) => {
    // each svg page gets this func with pagenum/scale
    // each page calls it on mouseup with the coords
    // this adds the node to redux, which gets passed in as props to svg
    const { left, top, width, height } = viewboxCoords;
    if ([left, top, width, height].includes(Infinity)) {
      this.setState({ selectionRect: PageSvgDefaults.state.selectionRect });
      return null;
    }
    const source = this.props.nodes[this.props.pdfDir];
    const hw = { width: 220, height: 60 }; //pulled from creators.ts

    let lt = {};
    if (!!this.props.nextNodeLoc) {
      const { left: l, top: t, width: w, height: h } = this.props.nextNodeLoc;
      lt = { left: l, top: t + h - hw.height };
    }
    let {
      left: gLeft,
      top: gTop,
      width: gWidth,
      height: gHeight
    } = source.style as any;
    const style = {
      left: gLeft + Math.random() * 60,
      top: gTop + gHeight + Math.random() * 60,
      ...lt,
      ...hw
    };

    // note we save with scale = 1
    const vb = makePdfSegmentViewbox(
      {
        left: left,
        top: top,
        width: width,
        height: height,
        scale: this.props.scale,
        pageNumber: this.props.pageNumber,
        pdfDir: this.props.pdfDir
      },
      style
    );

    const linkToPdf = makeLink(source.id, vb.id, { type: "more" });

    //10ms update with just a div
    this.props.addBatch({ nodes: [vb], links: [linkToPdf] });
    this.props.toggleSelections({ selectedNodes: [vb.id], clearFirst: true });
    return vb;
  };
  isShift = false;
  isCtrl = false;
  clientX = 0;
  clientY = 0;
  mouseButton = -1;
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
          this.isShift = mouse.shiftKey;
          this.isCtrl = mouse.ctrlKey;
          this.clientX = mouse.x;
          this.clientY = mouse.y;
          this.mouseButton = mouse.button;
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
          this.clientX = mouse.x;
          this.clientY = mouse.y;
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
          const { width, height } = this.state.selectionRect;

          // if ((this.isCtrl, this.isShift)) {
          //   this.makeSegmentAndComment(
          //     this.state.selectionRect,
          //     this.clientX,
          //     this.clientY
          //   );
          //   break;
          // }
          if (height > 30 || width > 30) {
            if (this.mouseButton === 0) {
              this.makeViewbox(this.state.selectionRect);
            } else if (this.mouseButton === 2) {
              this.makeSegmentAndComment(
                this.state.selectionRect,
                this.clientX,
                this.clientY
              );
            }
            // this.makeViewbox(this.state.selectionRect);
            // if (!mouse.ctrlKey) {
            //   this.inferMakeViewbox(this.state.selectionRect);
            // } else {
            //   this.makeViewbox(this.state.selectionRect);
            // }
          } else {
            this.setState({
              selectionRect: PageSvgDefaults.state.selectionRect
            });
          }

          break;
      }
    });
  }

  inferMakeViewbox = selectionRect => {
    const newSelect = this.snapToColumn(selectionRect);
    this.makeViewbox(newSelect);
  };

  makeViewbox = selectionRect => {
    this.onAddViewbox(selectionRect);
    this.setState({ selectionRect: { ...selectionRect, x1: 0, y1: 0 } });
  };

  snap = (selectionRect: typeof PageSvgDefaults.state.selectionRect) => {
    const { width, height } = this.state.selectionRect;
    const textCoords = this.props.pageOfText.text.map(t => {
      const { left, top, width, fontHeight } = t;
      return getRectCoords(left, top, width, fontHeight);
    });
  };

  snapToColumn = (
    selectionRect: typeof PageSvgDefaults.state.selectionRect
  ) => {
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
    return newSelect;

    // todo get text from viewbox from bellow
    // if (
    //   bbox.left === Infinity ||
    //   bbox.top === Infinity ||
    //   bbox.width < 3 ||
    //   bbox.height < 3
    // ) {
    //   return;
    // }

    // this.props.onAddViewbox(newSelect);
    // this.setState({ selectionRect: { ...newSelect, x1: 0, y1: 0 } });

    // const text = selectedLines.map(sl => {
    //   return sl.textIds.map(id => {
    //     const {
    //       fontHeight,
    //       str,
    //       style: { fontFamily },
    //       top
    //     } = this.props.pageOfText.text.find(x => x.id === id);

    //     return { fontHeight, fontFamily, str, top };
    //   });
    // });

    // const fontSize = mode(flatten(text).map<any>(t => (t as any).fontHeight));
    // const fontFamily = mode(flatten(text).map<any>(t => (t as any).fontFamily));
    // const extractedText = (flatten(text).reduce((res, t) => {
    //   return res + (t as any).str.replace(/-$/, ""); // end with dash
    // }, "") as string).replace(/\s+/g, " ");

    // //@ts-ignore
    // this.setState({
    //   div: { text: extractedText, style: { fontFamily, fontSize } },
    //   showText: true,
    //   value: ""
    // });

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
    if (this.sub) this.sub.unsubscribe();
  }

  onTextChange = e => {
    this.setState({ value: e.target.value });
  };

  closeText = e => {
    // if (e.nativeEvent.key === "Escape") {
    //   this.setState({ showText: false });
    //   const hasText = this.state.value.length > 0;
    //   if (hasText) {
    //     const viewboxId = this.props.selectedNodes[0]; // selected on creation
    //     const source = this.props.nodes[viewboxId];
    //     let { x, y } = source.style;
    //     const shiftedX = x + Math.random() * 50 - 40;
    //     const style = {
    //       x: shiftedX < 20 ? 20 + Math.random() * 50 : shiftedX,
    //       y: y + Math.random() * 50 + 40
    //     };
    //     const textNode = makeUserMediaText(this.state.value, style);
    //     const link = makeLink(source, textNode, { type: "more" });
    //     this.props.addBatch({ nodes: [textNode], links: [link] });
    //     //add edge from selected to userdoc
    //   }
    // }
  };

  onOpenText = e => {
    this.setState({ value: e.target.value });
  };

  makeSegmentAndComment = (selectionRect, mouseX, mouseY) => {
    // const newSelect = this.snapToColumn(selectionRect); // use when pdf parsing better
    const newSelect = selectionRect;
    const anyInfinite = Object.values(newSelect).some(x => x === Infinity);

    let viewbox;
    if (!!newSelect && !anyInfinite) {
      viewbox = this.onAddViewbox(newSelect);
      this.setState({ selectionRect: { ...newSelect, x1: 0, y1: 0 } });
    } else {
      viewbox = this.onAddViewbox(selectionRect);
    }

    const segStyle = (this.props.nodes[viewbox.id] as PdfSegmentViewbox).style
      .min;
    const tHeight = 120;
    const newTextStyle = {
      left: segStyle.left,
      top: segStyle.top - tHeight,
      height: tHeight,
      width: 250
    };
    const htmlNode = makeUserDoc({
      data: {},
      style: { min: newTextStyle, max: newTextStyle }
    });
    const newLink = makeLink(viewbox.id, htmlNode.id, {
      text: "compress",
      html: "<p>compress</p>"
    });
    this.props.addBatch({ nodes: [htmlNode], links: [newLink] });
    this.props.addPortals([
      {
        id: htmlNode.id,
        left: mouseX + 15,
        top: mouseY + 15,
        width: 300,
        height: 100
      }
    ]);
  };

  openTextPortal = segmentId => (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>
  ) => {
    const { nodes, links } = getNeighborhood(
      [segmentId],
      this.props.nodes,
      this.props.links
    );

    let htmlNodes = nodes.filter(node => node.data.type === "userDoc");
    if (htmlNodes.length === 0) {
      const segStyle = (this.props.nodes[segmentId] as PdfSegmentViewbox).style
        .min;
      const tHeight = 120;
      const newTextStyle = {
        left: segStyle.left,
        top: segStyle.top - tHeight,
        height: tHeight,
        width: segStyle.width
      };

      htmlNodes.push(
        //@ts-ignore
        makeUserDoc({
          style: { min: newTextStyle, max: newTextStyle }
        })
      );
      const newLink = makeLink(segmentId, htmlNodes[0].id, {
        text: "compress",
        html: "<p>compress</p>"
      });
      this.props.addBatch({ nodes: htmlNodes, links: [newLink] });
    }

    const bounding = e.currentTarget.getBoundingClientRect();
    const { clientX, clientY } = e;
    // todo util for closest edge of div
    const dists = {
      up: clientY - bounding.top,
      down: bounding.top + bounding.height - clientY,
      left: clientX - bounding.left,
      right: bounding.right - clientX
    };

    const minDist = Object.entries(dists).reduce(
      (all, dist) => {
        const [key, val] = dist;
        if (Math.abs(val) < Math.abs(all.val)) {
          return { key, val };
        } else {
          return all;
        }
      },
      { key: "", val: Infinity }
    );

    const {
      // doesn't include scroll bars
      clientHeight,
      clientWidth
    } = document.documentElement;
    const spaceUp = bounding.top;
    const spaceDown = clientHeight - bounding.top + bounding.height;
    const spaceLeft = bounding.left;
    const spaceRight = clientWidth - bounding.right;

    const isOneNode = htmlNodes.length === 1;
    const defaultWidth = isOneNode
      ? (htmlNodes[0] as PdfSegmentViewbox).style.max.width
      : 300;
    const defaultHeight = isOneNode
      ? (htmlNodes[0] as PdfSegmentViewbox).style.max.height
      : 100;

    let frames = [];
    let shift = 0;
    htmlNodes.forEach((node, ix) => {
      let frame = { id: node.id, left: 0, top: 0, width: 0, height: 0 };
      switch (minDist.key) {
        case "up":
          frame = {
            ...frame,
            left: bounding.left,
            top: bounding.top - Math.min(defaultHeight, spaceUp) - shift,
            height: Math.min(defaultHeight, spaceUp),
            width: Math.min(clientWidth, bounding.width)
          };
          shift += frame.height;
          break;
        case "down":
          frame = {
            ...frame,
            left: bounding.left,
            top: bounding.top + bounding.height + shift,
            height: Math.min(defaultHeight, spaceDown),
            width: Math.min(clientWidth, bounding.width)
          };
          shift += frame.height;
          break;
        case "left":
          frame = {
            ...frame,
            left: bounding.left - Math.min(spaceLeft, defaultWidth),
            top: bounding.top + shift,
            height: Math.min(defaultHeight, clientHeight),
            width: Math.min(spaceLeft, defaultWidth)
          };
          shift += frame.height;
          break;
        case "right":
          frame = {
            ...frame,
            left: bounding.left + bounding.width,
            top: bounding.top + shift,
            height: Math.min(defaultHeight, clientHeight),
            width: Math.min(spaceRight, defaultWidth)
          };
          shift += frame.height;
          break;
      }

      frames.push(frame);
    });
    this.props.updatePortals(frames);
  };
  deleteViewbox = id => {
    this.props.removeBatch({ nodes: [id] });
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

          {this.props.columnLefts && false && (
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
          draggable={false}
          ref={this.divRef}
          style={{
            position: "absolute",
            width: this.props.svgWidth,
            height: this.props.svgHeight,
            userSelect: "none"
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
                  onDoubleClick={this.clickLine(line)}
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
                draggable={false}
                ref={this.selectionRectRef}
                style={{
                  position: "absolute",
                  top: top === Infinity ? 0 : top,
                  left: left === Infinity ? 0 : left,
                  width: width === Infinity ? 0 : width,
                  height: height === Infinity ? 0 : height,
                  border: "1px solid grey"
                }}
              />
            )}
          </Spring>
          {this.props.viewboxes.length > 0 &&
            this.props.viewboxes.map(vb => {
              const { top, left, width, height } = vb.data;

              return (
                <ViewboxDiv
                  draggable={false}
                  key={vb.id}
                  style={{
                    position: "absolute",
                    top: top,
                    left: left - 5,
                    width: width + 5,
                    height: height,
                    border: "2px solid green",
                    lineHeight: "1em",
                    backgroundColor: "transparent",
                    overflow: ""
                  }}
                  onClick={this.openTextPortal(vb.id)}
                  onContextMenu={e => {
                    if (!this.props.isMainReader) {
                      e.preventDefault();
                      this.props.setMainPdfReader({
                        scrollToPageNumber: vb.data.pageNumber,
                        left: left / vb.data.scale,
                        top: top / vb.data.scale + Math.random(), // update everytime
                        pdfDir: vb.data.pdfDir
                      });
                    } else {
                      this.props.setGraphContainer({
                        left: vb.style.min.left,
                        top: vb.style.min.top
                      });
                    }
                  }}
                >
                  <div
                    id="delete-icon"
                    style={{ position: "absolute", top: -30 }}
                    onClick={e => {
                      e.stopPropagation()
                      this.deleteViewbox(vb.id)}}
                  >
                    <MdDeleteForever />
                  </div>
                </ViewboxDiv>
              );
            })}
          {/* {this.state.showText && (
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
          )} */}
        </div>
      </>
    );
  }
}

export default connect(
  mapState,
  mapDispatch
)(PageSvg);

const ViewboxDiv = styled.div`
  div {
    opacity: 0;
    cursor: pointer;
    :hover {
      color: red;
    }
  }

  &:hover {
    div {
      opacity: 1;
    }
  }
`;
