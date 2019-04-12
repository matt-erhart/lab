import * as React from "react";
import styled from "styled-components";
import produce from "immer";
var equal = require("fast-deep-equal");
import { dragData } from "./rx";
import { Subscription } from "rxjs";
import { Rectangle, removeOverlaps } from "webcola";
import { ResizableFrame, updateOneFrame, frame } from "./ResizableFrame";
import { getBoxEdges, isBoxInBox, isBoxPartlyInBox, unique } from "./utils";
import { iRootState, iDispatch } from "../store/createStore";
import { connect } from "react-redux";
import PdfViewer from "./PdfViewer";
import {
  ViewboxData,
  NodeDataTypes,
  aNode,
  makeUserHtml,
  makeLink,
  aLink,
  Links,
  Nodes,
  PdfPublication
} from "../store/creators";
import TextEditor from "./TextEditor";
import { oc } from "ts-optchain";
import { FileIcon } from "./Icons";

const frames = [
  { id: "1", left: 100, top: 300, height: 100, width: 100 },
  { id: "2", left: 101, top: 100, height: 100, width: 100 }
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
    zoom: .65
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
  graph: { addBatch, removeBatch, updateBatch, toggleSelections },
  app: { setMainPdfReader }
}: iDispatch) => ({
  addBatch,
  removeBatch,
  updateBatch,
  toggleSelections,
  setMainPdfReader
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

  onTransformStart = (transProps: frame) => {
    const { id } = transProps;
    //todo select with redux
  };

  onTransforming = (transProps: frame) => {
    // todo if zoom
    // const zoomed = { ...transProps, top: transProps.top / this.state.zoom };
    // const updatedWindows = updateOneFrame(this.state.frames)(zoomed);
    //@ts-ignore
    this.setState(state => {
      const updatedWindows = updateOneFrame(state.frames)(transProps);
      return { frames: updatedWindows };
    });
  };

  onTransformEnd = (transProps: frame) => {
    const { id, left, top, width, height } = transProps;
    this.props.updateBatch({
      nodes: [{ id, style: { left, top, width, height } }]
    });
  };

  componentDidUpdate(prevProps, prevState) {
    // todo perf. use patches
    if (
      Object.values(prevProps.nodes).length !==
        Object.values(this.props.nodes).length ||
      Object.values(prevProps.links).length !==
        Object.values(this.props.links).length
    ) {
      this.getFramesInView(this.state.containerBounds);
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

  getFramesInView = containerBounds => {
    const { width, height } = containerBounds;
    const pad = 200;
    const view = getBoxEdges(
      this.state.scrollLeft - pad,
      this.state.scrollTop - pad,
      (width + pad) / this.state.zoom,
      (height + pad) / this.state.zoom
    );

    const isInView = isBoxPartlyInBox(view);
    const framesInView = Object.values(this.props.nodes).reduce((all, node) => {
      const { left, top, width, height } = node.style;
      const edges = getBoxEdges(left, top, width, height);
      const inView = true || isInView(edges);
      if (inView) {
        const isSelected = this.props.selectedNodes.includes(node.id);
        all.push({ id: node.id, left, top, width, height, isSelected });
      }
      return all;
    }, []);
    //1234

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

    this.setState(state => {
      return { frames: framesInView, links };
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

  onKey = e => {  //key shortcut trick 
    if (e.target.id !== 'GraphScrollContainer') return null  
    //Wrapper around div. Inside is a Slate component?
    //Huge pain: event bubbling?? ID trick to prevent 
    console.log(e.key) // Delete 
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
    if (!e.shiftKey && e.target.id === "SvgLayer")
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
      const targetId = this.makeUserHtmlNode(e);
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
      const userHtml = makeUserHtml({
        data: { html: "<p></p>", text: "" },
        style: {
          left: (clientX - left) / this.state.zoom,
          top: (clientY - top) / this.state.zoom
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
      case "userHtml":
        return (
          <div
            key={node.id}
            style={{ flex: 1 }}
            // onMouseEnter={e => this.setState({ editingId: node.id })}
          >
            <TextEditor
              key={node.id}
              width={frame.width - 13}
              height={frame.height - 23}
              id={node.id}
              // readOnly={this.state.editingId !== node.id}
            />
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

        const pagenum = [pageNumber];

        return (
          <PdfViewer
            key={node.id}
            pageNumbersToLoad={pagenum}
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
    // const bbox = e.target.getBoundingClientRect()
    // console.log(e.clientX - bbox.left)
    e.persist();
    if (e.ctrlKey && "SvgLayer" === e.target.id) {
      e.preventDefault();
      const wheelDefault = 120;
      this.setState(state => {
        const newZoom =
          state.zoom + (e.nativeEvent.wheelDelta / wheelDefault) * 0.2;
        return { zoom: newZoom > 0 ? newZoom : state.zoom };
      });
      this.getFramesInView(this.state.containerBounds);
    }
  };

  render() {
    const { width, height } = this.state.containerBounds;
    const f1 = this.state.frames[0];
    const f2 = this.state.frames[1];

    return (
      <ScrollContainer
        id="GraphScrollContainer"
        ref={this.scrollRef}
        onScroll={this.onScroll}
        onKeyUp={this.onKey}
        tabIndex={0}
        onClick={this.deselectAll}
        onWheel={this.onWheel}
      >
        <MapContainer
          id="GraphMapContainer"
          ref={this.mapRef}
          zoom={this.state.zoom}
          height={4000}
          width={4000}
        >
          {width && height && (
            <svg
              id="SvgLayer"
              viewBox={`0 0 ${4000} ${4000}`}
              width={4000}
              height={4000}
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
            const { left, top, width, height } = frame;
            const isSelected = this.isSelected(frame.id);
            return (
              <ResizableFrame
                key={frame.id}
                id={frame.id}
                {...{ left, top, width, height }}
                onTransforming={this.onTransforming}
                onTransformEnd={this.onTransformEnd}
                isSelected={isSelected}
                zoom={this.state.zoom}
                dragHandle={
                  <DragHandle
                    isSelected={isSelected}
                    onClick={this.onMouseSelect(frame.id, "Nodes")}
                    onContextMenu={this.rightClickNodeToLink(frame.id)}
                  />
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
    sourceFrame: undefined as frame,  // get to know when it is defined or undefined still ? means optional type
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
  --height: calc(100vh - 150px - var(--margin) - var(--padding) * 2);
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
  width: ${p => (p.width ? p.width : 4000)}px;
  height: ${p => (p.height ? p.height : 4000)}px;
  position: relative;
  transform-origin: top left;
  transform: scale(${p => p.zoom});
`;
// calc(var(--width) / var(--zoom)),
// calc(var(--height) / var(--zoom))
const DragHandle = styled.div<{ isSelected: boolean }>`
  min-height: 10px;
  background-color: ${props => (props.isSelected ? "lightblue" : "grey")};
  flex: 0;
  user-select: none;
  &:hover {
    cursor: all-scroll;
  }
`;
