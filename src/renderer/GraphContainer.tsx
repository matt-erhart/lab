import * as React from "react";
import styled from "styled-components";
import produce from "immer";

import { ResizableFrame, updateOneFrame, frame } from "./ResizableFrame";
import {
  getBoxEdges,
  isBoxInBox,
  isBoxPartlyInBox,
  unique,
  get,
  collision,
  sortBy
} from "./utils";
import { iRootState, iDispatch } from "../store/createStore";
import { connect } from "react-redux";
import PdfViewer from "./PdfViewer";
import {
  ViewboxData,
  NodeDataTypes,
  aNode,
  makeLink,
  aLink,
  Links,
  Nodes,
  PdfPublication,
  AutoGrab,
  makeUserDoc,
  PdfSegmentViewbox,
  NodeBase
} from "../store/creators";
import { oc } from "ts-optchain";
import { FileIcon } from "./Icons";
import DocEditor from "./DocEditor";
import { devlog } from "../store/featureToggle";
import { MdZoomOutMap } from "react-icons/md";
import { dragData } from "./rx";
const frames = [
  { id: "1", left: 100, top: 300, height: 100, width: 100, isSelected: false },
  { id: "2", left: 101, top: 100, height: 100, width: 100, isSelected: false }
];

/**
 * @class **GraphContainer**
 */
const GraphContainerDefaults = {
  props: {},
  state: {
    frames: frames,
    links: [] as { source: ""; target: ""; id: "" }[],
    containerBounds: {} as ClientRect | DOMRect,
    scrollLeft: 0,
    scrollTop: 0,
    editingId: "",
    zoom: 1,
    hideViewboxes: false,
    dragCoords: { x1: NaN, x2: NaN, y1: NaN, y2: NaN },
    nextNodeLocation: undefined
  }
};
const mapState = (state: iRootState) => ({
  nodes: state.graph.nodes,
  links: state.graph.links,
  selectedNodes: state.graph.selectedNodes,
  selectedLinks: state.graph.selectedLinks,
  patches: state.graph.patches,
  pdfRootDir: state.app.current.pdfRootDir,
  pdfDir: state.app.panels.mainPdfReader.pdfDir,
  graphPanel: state.app.panels.graphContainer
});

const mapDispatch = ({
  graph: {
    addBatch,
    removeBatch,
    updateBatch,
    toggleSelections,
    toggleStyleMode
  },
  app: { setMainPdfReader, setNextNodeLocation }
}: iDispatch) => ({
  addBatch,
  removeBatch,
  updateBatch,
  toggleSelections,
  setMainPdfReader,
  toggleStyleMode,
  setNextNodeLocation
});

type connectedProps = ReturnType<typeof mapState> &
  ReturnType<typeof mapDispatch>;

type props = typeof GraphContainerDefaults.props & connectedProps;

export class GraphContainer extends React.Component<
  props,
  typeof GraphContainerDefaults.state
> {
  static defaultProps = GraphContainerDefaults.props;
  state = GraphContainerDefaults.state;
  scrollRef = React.createRef<HTMLDivElement>();
  mapRef = React.createRef<HTMLDivElement>();
  scroll = { left: 0, top: 0 };

  componentDidMount() {
    this.setSize();
    window.addEventListener("resize", this.setSize);
  }

  onTransformStart = ({ event, id }) => {
    if (event.button === 0) {
      this.onMouseSelect(id, "Nodes")(event);
    }
  };

  onTransforming = (transProps: any) => {
    // todo ts
    // const zoomed = { ...transProps, top: transProps.top / this.state.zoom };
    // const updatedWindows = updateOneFrame(this.state.frames)(zoomed);
    //@ts-ignore
    const { movementX, movementY } = transProps;
    // const
    const idsToMove = this.props.selectedNodes.includes(transProps.id)
      ? this.props.selectedNodes
      : [...this.props.selectedNodes, transProps.id];

    this.setState(state => {
      let updatedFrames;
      if (transProps.type === "move") {
        updatedFrames = produce(state.frames, frames => {
          idsToMove.forEach(id => {
            const ix = frames.findIndex(w => w.id === id);
            const { left, top } = frames[ix];
            frames[ix] = {
              ...frames[ix],
              left: left + movementX / this.state.zoom,
              top: top + movementY / this.state.zoom
            };
          });
        });
      } else {
        updatedFrames = updateOneFrame(state.frames)(transProps);
      }
      return { frames: updatedFrames };
    });
  };

  onTransformEnd = (transProps: frame) => {
    // const { id, left, top, width, height } = transProps;
    const selected = this.state.frames
      .filter(frame => this.props.selectedNodes.includes(frame.id))
      .map(x => {
        const { isSelected, id, ...style } = x;
        const node = this.props.nodes[id] as PdfSegmentViewbox;
        const mode = node.style.modes[node.style.modeIx];

        return { id, style: { ...node.style, [mode]: style } };
      });
    const { scrollLeft, scrollTop } = this.state;
    const nextNodeLocation = this.nextNodeLocation({
      framesInView: this.state.frames,
      containerBounds: this.state.containerBounds,
      scrollLeft,
      scrollTop
    });

    this.props.updateBatch({
      nodes: selected
    });
    const { x: left, y: top, ...wh } = nextNodeLocation;
    this.props.setNextNodeLocation({ left, top, ...wh });
    this.setState({ nextNodeLocation });
  };

  componentDidUpdate(prevProps, prevState) {
    const hasModeIx = get(this.props.patches, p =>
      p[0].path.includes("modeIx")
    );
    const relevantPatch = this.props.patches !== prevProps.patches && hasModeIx;

    // todo perf. use patches
    if (
      Object.values(prevProps.nodes).length !==
        Object.values(this.props.nodes).length ||
      Object.values(prevProps.links).length !==
        Object.values(this.props.links).length ||
      relevantPatch
    ) {
      this.getFramesInView(this.state.containerBounds);
    }

    const { x: x1, y: y1 } = prevState.nextNodeLocation || { x: 0, y: 0 };
    const { x: x2, y: y2 } = this.state.nextNodeLocation || { x: 0, y: 0 };

    if (x1 !== x2 || y1 !== y2) {
      const { scrollLeft, scrollTop } = this.state;
      const nextNodeLocation = this.nextNodeLocation({
        framesInView: this.state.frames,
        containerBounds: this.state.containerBounds,
        scrollLeft,
        scrollTop
      });
      const { x: left, y: top, ...wh } = nextNodeLocation;
      this.props.setNextNodeLocation({ left, top, ...wh });
    }

    if (prevProps.graphPanel !== this.props.graphPanel) {
      const { left, top } = this.props.graphPanel;
      this.scrollRef.current.scrollTo(left, top);
    }
  }

  getLinksIdsOnNode = (nodeId: string, links: Links) => {
    let linksOnNode = [] as string[];
    Object.values(links).forEach((link, key) => {
      if ([link.source, link.target].includes(nodeId)) {
        linksOnNode.push(link.id);
      }
    });
    return linksOnNode;
  };

  getScreenEdges = (containerBounds, pad = 200) => {
    const { width, height } = containerBounds;
    const zoomedIn = this.state.zoom > 1 ? this.state.zoom : 1;
    const view = getBoxEdges({
      left: (this.state.scrollLeft - pad) / zoomedIn,
      top: (this.state.scrollTop - pad) / zoomedIn,
      width: (width + pad * 2) / this.state.zoom,
      height: (height + pad * 2) / this.state.zoom
    });
    return view;
  };

  // this function transforms the component inherited Redux state.nodes into the many frames
  getFramesInView = containerBounds => {
    const view = this.getScreenEdges(containerBounds);

    const isInView = collision(view);
    const nodesFiltered = Object.values(this.props.nodes).filter(n =>
      ["pdf.segment.viewbox", "userDoc"].includes(n.data.type)
    );

    const framesInView = nodesFiltered.reduce((all, node) => {
      const nodeStyle = node.style as NodeBase["style"];
      const mode = nodeStyle.modes[nodeStyle.modeIx];
      const { left, top, width, height } = node.style[mode];
      const edges = getBoxEdges({ left, top, width, height });
      const inView = isInView(edges);
      if (inView || this.isSelected(node.id)) {
        const isSelected = this.props.selectedNodes.includes(node.id);
        all.push({ id: node.id, left, top, width, height, isSelected });
      }
      return all;
    }, []);

    const linkIds = framesInView.reduce((all, frame) => {
      const linkIds = this.getLinksIdsOnNode(frame.id, this.props.links);
      return unique([...all, ...linkIds]);
    }, []);

    const links = linkIds.map(id => {
      const { source, target } = this.props.links[id] || {
        source: "",
        target: ""
      };
      return { source, target, id };
    });

    const { scrollLeft, scrollTop } = this.state;
    const nextNodeLocation = this.nextNodeLocation({
      framesInView,
      containerBounds,
      scrollLeft,
      scrollTop
    });

    this.setState(state => {
      return { frames: framesInView, links, nextNodeLocation };
    });
  };

  onScroll = e => {
    var scrollLeft = e.nativeEvent.target.scrollLeft;
    var scrollTop = e.nativeEvent.target.scrollTop;

    this.setState({ scrollLeft, scrollTop });
    this.getFramesInView(this.state.containerBounds);
  };

  componentWillUnmount() {
    window.removeEventListener("resize", this.setSize);
  }

  setSize = () => {
    let bounds = this.scrollRef.current.getBoundingClientRect();
    this.getFramesInView(bounds);
    this.setState({ containerBounds: bounds });
  };

  onKey = e => {
    //key shortcut trick
    if (e.target.id !== "GraphScrollContainer") return null;
    //Wrapper around div. Inside is a Slate component?
    //Huge pain: event bubbling?? ID trick to prevent
    switch (e.key) {
      case "Delete":
        if (
          this.props.selectedNodes.length > 0 ||
          this.props.selectedLinks.length > 0
        ) {
          this.props.removeBatch({
            nodes: this.props.selectedNodes,
            links: this.props.selectedLinks
          });
          this.props.toggleSelections({
            selectedNodes: [],
            selectedLinks: [],
            clearFirst: true
          });
        }
      case "h":
        if (e.ctrlKey)
          this.setState(state => {
            return { hideViewboxes: !state.hideViewboxes };
          });
      default:
        return null;
    }
  };

  isSelected = id => {
    return (
      this.props.selectedNodes.includes(id) ||
      this.props.selectedLinks.includes(id)
    );
  };

  onMouseSelect = (id, nodesOrLinks: "Nodes" | "Links") => e => {
    devlog("onmousedown");
    e.stopPropagation();

    const isSelected = this.isSelected(id);
    if (typeof id === "string") {
      if (!isSelected && !e.shiftKey) {
        this.props.toggleSelections({
          selectedNodes: [],
          selectedLinks: [],
          [`selected${nodesOrLinks}`]: [id],
          clearFirst: true
        });
      }

      if (e.shiftKey) {
        this.props.toggleSelections({ [`selected${nodesOrLinks}`]: [id] });
      }
    }
    // this.getFramesInView(this.state.containerBounds);
  };

  deselectAll = e => {
    if (
      !e.shiftKey &&
      e.target.id === "SvgLayer" &&
      !!this.dragCoordsToRect(this.state.dragCoords, this.state.zoom)
    )
      this.props.toggleSelections({
        selectedNodes: [],
        selectedLinks: [],
        clearFirst: true
      });
  };

  makeNodeAndLinkIt = e => {
    if (
      !e.shiftKey &&
      e.target.id === "SvgLayer" &&
      this.props.selectedNodes.length > 0
    ) {
      const targetId = this.makeUserHtmlNode(e); //!todo
      if (targetId.length > 0) {
        const newLinks = this.linkSelectedToNode(
          this.props.nodes,
          this.props.links,
          this.props.selectedNodes,
          targetId
        );
        this.props.addBatch({ links: newLinks });
      }
    }
  };

  makeUserHtmlNode = (e: React.MouseEvent<SVGElement, MouseEvent>) => {
    const { clientX, clientY } = e;
    const { left, top } = e.currentTarget.getBoundingClientRect();
    const allowId = oc(e).currentTarget.id("") === "SvgLayer"; //todo unmagic string
    if (allowId) {
      const xy = {
        left: (clientX - left) / this.state.zoom,
        top: (clientY - top) / this.state.zoom
      };
      const userHtml = makeUserDoc({
        data: {},
        style: {
          min: xy,
          max: xy
        }
      });
      this.props.addBatch({ nodes: [userHtml] });
      return userHtml.id;
    }
    return "";
  };

  rightClickNodeToLink = targetId => e => {
    const { nodes, links, selectedNodes } = this.props;
    const newLinks = this.linkSelectedToNode(
      nodes,
      links,
      selectedNodes,
      targetId
    );

    this.props.addBatch({ links: newLinks });
  };

  linkSelectedToNode = (
    nodes: Nodes,
    links: Links,
    selectedNodes: string[],
    targetId: string
  ) => {
    return selectedNodes.reduce((all, sourceId) => {
      const isUnique =
        Object.values(links).findIndex(
          link => link.source === sourceId && link.target === targetId
        ) === -1;

      if (isUnique) {
        all.push(makeLink(sourceId, targetId));
      } else {
        console.log("link already exists");
      }
      return all;
    }, []) as aLink[];
  };

  renderGraphNodes = (frame: frame) => {
    const node = this.props.nodes[frame.id] as aNode;
    if (!node) return null;
    switch (node.data.type as NodeDataTypes) {
      case "pdf.publication":
        return (
          <div
            id="pub-node"
            key={node.id}
            style={{
              backgroundColor: "white",
              padding: 5,
              color: "black",
              fontWeight: "bold"
            }}
            draggable={false}
          >
            <span>
              <FileIcon
                stroke={"#CD594A"}
                style={{ marginBottom: 0, marginTop: 10, cursor: "alias" }}
                onClick={e =>
                  this.props.setMainPdfReader({
                    pdfDir: (node as PdfPublication).data.pdfDir,
                    top: 0,
                    left: 0,
                    scrollToPageNumber: 0
                  })
                }
              />{" "}
              {(node as PdfPublication).data.pdfDir.replace(/-/g, " ")}
            </span>
          </div>
        );
      case "userDoc":
        return (
          <DocEditor
            key={node.id}
            id={node.id}
            // readOnly={this.state.editingId !== node.id}
          />
        );
      case "autograb":
        const data = (node as AutoGrab).data["participant_detail"];
        var scoredTextList = data.map(function(d) {
          return (
            <li>
              {d.text}:{d.score}
            </li>
          );
        });
        return (
          <div
            key={node.id}
            style={{
              backgroundColor: "orange",
              padding: 5,
              color: "black",
              fontWeight: "bold"
              // height: "10px",
              // width: "10px"
            }}
            draggable={false}
          >
            <span style={{ fontSize: "12px" }}>
              {/* <FileIcon
                stroke={"#CD594A"}
                style={{ marginBottom: 0, marginTop: 10, cursor: "alias" }}
                onClick={e =>
                  this.props.setMainPdfReader({
                    pdfDir: (node as PdfPublication).data.pdfDir,
                    top: 0,
                    left: 0,
                    scrollToPageNumber: 0
                  })
                }
              />{" "} */}
              <ul>{scoredTextList}</ul>
              {/* {JSON.stringify((node as AutoGrab).data["participant_detail"])} */}
            </span>
          </div>
        );
      case "pdf.segment.viewbox":
        const { pdfRootDir } = this.props;
        const {
          pdfDir,
          left,
          top,
          width,
          height,
          scale,
          pageNumber
        } = node.data as ViewboxData;

        const { modeIx, modes } = node.style as NodeBase["style"];
        const isMin = modes[modeIx] === "min";

        const pagenum = [pageNumber];
        if (isMin) {
          return <div style={{ color: "green", fontSize: 16 }}>{pdfDir}</div>;
        }

        return (
          <PdfViewer
            id="pdf.segment.viewbox"
            key={node.id}
            pageNumbersToLoad={pagenum}
            scrollAfterClick
            {...{
              pdfRootDir,
              pdfDir,
              left: left - 50,
              top: top - 50,
              width: width + 100,
              height: height + 100,
              scale
            }}
          />
        );
      default:
        return null;
    }
  };

  onWheel = e => {
    const wheelDefault = 120;

    // const bbox = e.target.getBoundingClientRect()
    // console.log(e.clientX - bbox.left)
    // this.scrollRef.current.scrollTop += e.nativeEvent.wheelDelta

    e.persist();
    if (e.ctrlKey && ["SvgLayer"].includes(e.target.id)) {
      e.preventDefault();
      this.setState(state => {
        const newZoom =
          state.zoom + (e.nativeEvent.wheelDelta / wheelDefault) * 0.2;
        return { zoom: newZoom > 0.1 ? newZoom : state.zoom };
      });
      this.getFramesInView(this.state.containerBounds);
    }
  };

  startSelect = e => {
    if (e.target.id !== "SvgLayer" || e.button !== 0) return null;
    const {
      left: bbLeft,
      top: bbTop
    } = this.mapRef.current.getBoundingClientRect();

    dragData(e).subscribe(data => {
      const x = data.clientX - bbLeft;
      const y = data.clientY - bbTop;
      switch (data.type) {
        case "mousedown":
          this.setState(state => ({
            dragCoords: {
              x1: x / state.zoom,
              y1: y / state.zoom,
              x2: NaN,
              y2: NaN
            }
          }));
          break;
        case "mousemove":
          this.setState(state => ({
            dragCoords: {
              ...state.dragCoords,
              x2: x / state.zoom,
              y2: y / state.zoom
            }
          }));
          break;
        case "mouseup":
          const { x: left, y: top, width, height } = this.dragCoordsToRect(
            this.state.dragCoords,
            this.state.zoom
          ) || { x: 0, y: 0, width: 0, height: 0 };
          const selection = getBoxEdges({ left, top, width, height });
          const isInSelection = collision(selection);

          const selectedIds = this.state.frames.reduce((all, frame) => {
            const frameEdges = getBoxEdges(frame);
            if (isInSelection(frameEdges)) {
              all.push(frame.id);
            }
            return all;
          }, []);

          if (selectedIds.length > 0) {
            this.props.toggleSelections({
              selectedNodes: selectedIds,
              clearFirst: true
            });
          } else {
            this.props.toggleSelections({
              selectedNodes: [],
              selectedLinks: [],
              clearFirst: true
            });
          }

          this.setState({
            dragCoords: GraphContainerDefaults.state.dragCoords
          });
          break;
      }
    });
  };

  dragCoordsToRect = (
    dragCoords: typeof GraphContainerDefaults.state.dragCoords,
    zoom: number
  ) => {
    const x = Math.min(dragCoords.x1, dragCoords.x2);
    const y = Math.min(dragCoords.y1, dragCoords.y2);
    const width = Math.abs(dragCoords.x1 - dragCoords.x2);
    const height = Math.abs(dragCoords.y1 - dragCoords.y2);
    if ([x, y, width, height].includes(NaN)) {
      return undefined;
    }
    return { x, y, width, height };
  };

  nextNodeLocation = ({
    framesInView,
    containerBounds: { width, height },
    scrollLeft,
    scrollTop
  }) => {
    // figure out where to put stuff
    //
    if (!framesInView) return undefined;

    const inView = isBoxInBox(this.getScreenEdges({ width, height }, 0));

    const wh = { height: 200, width: 300 };
    const pad = 20;
    const topLeftEmptySpace = getBoxEdges({
      left: (this.state.scrollLeft + 30) / this.state.zoom,
      top: (this.state.scrollTop + 30) / this.state.zoom,
      ...wh
    });
    // if (framesInView.length === 0) return topLeftEmptySpace;
    let possibleSpaces = [topLeftEmptySpace];
    for (let f1 of framesInView) {
      const bellow = getBoxEdges({
        left: f1.left,
        top: f1.top + f1.height + pad,
        ...wh
      });
      if (inView(bellow)) {
        possibleSpaces.push(bellow);
      }

      const above = getBoxEdges({
        left: f1.left,
        top: f1.top - wh.height - pad,
        ...wh
      });

      if (inView(above)) {
        possibleSpaces.push(above);
      }

      const right = getBoxEdges({
        left: f1.left + f1.width + pad,
        top: f1.top,
        ...wh
      });

      if (inView(right)) {
        possibleSpaces.push(right);
      }

      const left = getBoxEdges({
        left: f1.left - wh.width - pad,
        top: f1.top,
        ...wh
      });

      if (inView(left)) {
        possibleSpaces.push(left);
      }
    }

    possibleSpaces = possibleSpaces.sort(
      (a, b) => a.minY + a.minX - b.minX - b.minY
    ); // i.e. more left, more top is first
    for (let possibleSpace of possibleSpaces) {
      const checkCollision = collision(possibleSpace);
      let noCollide = [];
      for (let f2 of framesInView) {
        const edges = getBoxEdges(f2);
        noCollide.push(!checkCollision(edges));
      }
      if (noCollide.every(x => x)) {
        const { minX, minY, maxX, maxY } = possibleSpace;
        return {
          x: minX,
          y: minY,
          width: maxX - minX,
          height: maxY - minY
        };
      }
    }
    const { minX, minY, maxX, maxY } = topLeftEmptySpace;
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  };

  setNextLoc = e => {
    const { x: left, y: top, ...wh } = this.state.nextNodeLocation;
    this.props.setNextNodeLocation({ left, top, ...wh });
  };

  render() {
    const { width, height } = this.state.containerBounds;
    const rectCoords = this.dragCoordsToRect(
      this.state.dragCoords,
      this.state.zoom
    );
    console.log(this.state.zoom);

    return (
      <ScrollContainer
        id="GraphScrollContainer"
        ref={this.scrollRef}
        onScroll={this.onScroll}
        onKeyUp={this.onKey}
        tabIndex={0}
        onClick={this.deselectAll}
        onWheel={this.onWheel}
        style={{ userSelect: "none" }}
        onMouseLeave={this.setNextLoc}
      >
        <MapContainer
          id="GraphMapContainer"
          ref={this.mapRef}
          zoom={this.state.zoom}
          height={8000}
          width={8000}
          onMouseDown={this.startSelect}
        >
          {width && height && (
            <svg
              id="SvgLayer"
              viewBox={`0 0 ${8000} ${8000}`}
              width={8000}
              height={8000}
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                height: "100%",
                width: "100%"
              }}
              onDoubleClick={this.makeUserHtmlNode}
              onClick={this.deselectAll}
              onContextMenu={this.makeNodeAndLinkIt}
            >
              {rectCoords && (
                <rect {...rectCoords} stroke="black" fill="none" />
              )}
              {this.state.nextNodeLocation && (
                <rect
                  {...this.state.nextNodeLocation}
                  stroke="lightgrey"
                  fill="white"
                  strokeDasharray="4 2"
                  style={{ userSelect: "none" }}
                />
              )}
              {this.state.links.length > 0 &&
                this.state.links.map(link => {
                  const sourceFrame = this.state.frames.find(
                    f => f.id === link.source
                  );
                  const targetFrame = this.state.frames.find(
                    f => f.id === link.target
                  );
                  return (
                    <LinkLine
                      isSelected={this.isSelected(link.id)}
                      key={link.source + link.target}
                      targetFrame={targetFrame}
                      sourceFrame={sourceFrame}
                      onClick={this.onMouseSelect(link.id, "Links")}
                    />
                  );
                })}
              }
            </svg>
          )}
          {this.state.frames.map(frame => {
            // let dockedStyle = {};
            // const isDocked =
            //   frame.id === "09dee610-6468-11e9-892e-2530020548cf";
            // if (isDocked) {
            //   dockedStyle = this.props.nodes[
            //     "51ec70d0-6472-11e9-a866-c13e6a44da9a"
            //   ].style;
            //   dockedStyle = {
            //     ...dockedStyle,
            //     top: dockedStyle.top + dockedStyle.height
            //   };
            // }

            const { left, top, width, height } = frame;
            const isSelected = this.isSelected(frame.id);
            const node = this.props.nodes[frame.id] as aNode;
            const hide =
              this.state.hideViewboxes &&
              oc(node).data.type() === "pdf.segment.viewbox";

            return (
              <ResizableFrame
                key={frame.id}
                id={frame.id}
                {...{ left, top, width, height }}
                onTransformStart={this.onTransformStart}
                onTransforming={this.onTransforming}
                onTransformEnd={this.onTransformEnd}
                isSelected={isSelected}
                zoom={this.state.zoom}
                hide={hide}
                mode={get(node, (n: any) => n.style.modes[n.style.modeIx])}
                dragHandle={
                  <DragHandle
                    id="drag-handle"
                    isSelected={isSelected}
                    onContextMenu={this.rightClickNodeToLink(frame.id)}
                    color="white"
                  >
                    <DragHandleButton
                      id="drag-handle-button"
                      onClick={e => {
                        e.stopPropagation();
                        //@ts-ignore
                        if (e.target.id === "drag-handle-button") {
                          this.props.toggleSelections({
                            selectedNodes: [frame.id],
                            clearFirst: true
                          });
                          this.props.toggleStyleMode({ id: frame.id });
                        }
                      }}
                    >
                      min/max
                    </DragHandleButton>
                  </DragHandle>
                }
              >
                {this.renderGraphNodes(frame)}
              </ResizableFrame>
            );
          })}
        </MapContainer>
      </ScrollContainer>
    );
  }
}

/**
 * @class **LinkLine**
 */
const LinkLineDefaults = {
  props: {
    sourceFrame: undefined as frame, // get to know when it is defined or undefined still ? means optional type
    targetFrame: undefined as frame,
    isSelected: false
  },
  state: {}
};
export class LinkLine extends React.PureComponent<
  typeof LinkLineDefaults.props & any, // help initialize props/state, otherwise warning pops up
  typeof LinkLineDefaults.state
> {
  static defaultProps = LinkLineDefaults.props;
  state = LinkLineDefaults.state;
  render() {
    const { sourceFrame, targetFrame, isSelected, ...rest } = this.props;
    // ...rest any other stuff in props
    if (!!sourceFrame && !!targetFrame) {
      return (
        <HoverLine
          key="1"
          x1={sourceFrame.left + sourceFrame.width / 2}
          y1={sourceFrame.top + sourceFrame.height / 2}
          x2={targetFrame.left + targetFrame.width / 2}
          y2={targetFrame.top + targetFrame.height / 2}
          stroke={isSelected ? "lightblue" : "lightgrey"}
          strokeWidth={3}
          {...rest}
        />
      );
    } else {
      return null;
    }
  }
}

const HoverLine = styled.line`
  stroke-width: 5;
  &:hover {
    stroke-width: 10;
  }
`;

export default connect(
  mapState,
  mapDispatch
)(GraphContainer);

export const ScrollContainer = styled.div`
  --padding: 20px;
  --margin: 0px;
  margin: var(--margin);
  padding: var(--padding);
  height: auto;
  border: 1px solid lightgrey;
  border-radius: 5px;
  font-size: 30px;
  overflow: none;
  overflow: auto;
  font-size: 25px;
  box-sizing: border-box;
  margin-left: 5px;
  border: 4px solid grey;
  border-radius: 5px;
  width: "auto";
`;
const ZoomDiv = styled.div<{ zoom: number; width?: number; height?: number }>``;
const MapContainer = styled(ZoomDiv)`
  width: ${p => (p.width ? p.width : 8000)}px;
  height: ${p => (p.height ? p.height : 8000)}px;
  position: relative;
  transform-origin: top left;
  transform: scale(${p => p.zoom});
`;

const DragHandle = styled.div<{ isSelected: boolean; color: string }>`
  min-height: 16px;
  font-size: 12px;
  background-color: ${props => (props.isSelected ? "lightblue" : props.color)};
  flex: 0;
  user-select: none;
  &:hover {
    cursor: all-scroll;
  }
`;

const DragHandleButton = styled.span`
  background: white;
  cursor: pointer;
  vertical-align: middle;
  margin: 3px;
  margin-top: 1px;
  color: lightgrey;
`;
