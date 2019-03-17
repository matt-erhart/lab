import * as React from "react";
import styled from "styled-components";
import produce from "immer";
var equal = require("fast-deep-equal");
import { dragData } from "./rx";
import { Subscription } from "rxjs";
import { Rectangle, removeOverlaps } from "webcola";
import { ResizableFrame, updateOneFrame, frame } from "./ResizableFrame";
import { getBoxEdges, isBoxInBox } from "./utils";
import { iRootState, iDispatch } from "../store/createStore";
import { connect } from "react-redux";
import PdfViewer from "./PdfViewer";
import { ViewboxData, NodeDataTypes, aNode } from "../store/creators";
import { TextEditor } from "./TextEditor";

// window container for...
// portal
// main layout
// virtualized map with svg layer

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
    containerBounds: {} as ClientRect | DOMRect,
    scrollLeft: 0,
    scrollTop: 0,
    editingId: ""
  }
};
const mapState = (state: iRootState) => ({
  nodes: state.graph.nodes,
  links: state.graph.links,
  selectedNodes: state.graph.selectedNodes,
  selectedLinks: state.graph.selectedLinks,
  patches: state.graph.patches,
  pdfRootDir: state.app.current.pdfRootDir,
  pdfDir: state.app.current.pdfDir
});

const mapDispatch = ({
  graph: { addBatch, removeBatch, updateBatch, toggleSelections }
}: iDispatch) => ({
  addBatch,
  removeBatch,
  updateBatch,
  toggleSelections
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
    // todo here is where svg lines could be updated
    const updatedWindows = updateOneFrame(this.state.frames)(transProps);
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

  getFramesInView = containerBounds => {
    const { width, height } = containerBounds;
    console.log(width, height);
    const pad = 20;
    const view = getBoxEdges(
      this.scroll.left - pad,
      this.scroll.top - pad,
      width + pad,
      height + pad
    );
    const isInView = isBoxInBox(view);
    const framesInView = Object.values(this.props.nodes).reduce((all, node) => {
      const { left, top, width, height } = node.style;
      const edges = getBoxEdges(left, top, width, height);
      if (isInView(edges)) {
        all.push({ id: node.id, left, top, width, height });
      }
      return all;
    }, []);

    this.setState(state => {
      return { frames: framesInView };
    });
  };

  onScroll = e => {
    var scrollLeft = e.nativeEvent.target.scrollLeft;
    var scrollTop = e.nativeEvent.target.scrollTop;
    this.scroll = { left: scrollLeft, top: scrollTop };
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
    // const key2cmd = {
    //   Delete: () => {
    //     this.props.removeBatch({ nodes: this.props.selectedNodes });
    //     this.props.toggleSelections({ selectedNodes: [], clearFirst: true });
    //   }
    // };
    // key2cmd[e.key]();
    // console.log(e.key);
  };

  deselectAll = e => {
    // if (!e.shiftKey)
    //   this.props.toggleSelections({ selectedNodes: [], clearFirst: true });
  };

  renderGraphNodes = (frame: frame) => {
    const node = this.props.nodes[frame.id];
    if (!node) return null;
    switch (node.data.type as NodeDataTypes) {
      case "pdf.publication":
        return (
          <div
            style={{ backgroundColor: "white", padding: 5 }}
            draggable={false}
          >
            {node.data.pdfDir.replace("-", " ")}
          </div>
        );
      case "userHtml":
        return (
          <div
            style={{ backgroundColor: "white", padding: 5, maxWidth: 300 }}
            // onMouseLeave={this.onLeaveEditor}
          >
            {node.data.html}
            {/* <TextEditor
              key={node.id}
              id={node.id}
              readOnly={this.state.editingId !== node.id}
            /> */}
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

  render() {
    const { width, height } = this.state.containerBounds;
    const f1 = this.state.frames[0];
    const f2 = this.state.frames[1];
    return (
      <ScrollContainer
        ref={this.scrollRef}
        onScroll={this.onScroll}
        onKeyUp={this.onKey}
        tabIndex={0}
      >
        <MapContainer ref={this.mapRef} onClick={this.deselectAll}>
          {width && height && (
            <svg
              viewBox={`0 0 ${width} ${height}`}
              width={width}
              height={height}
              style={{ position: "absolute", left: 0, top: 0 }}
            >
              <LinkLine sourceFrame={f1} targetFrame={f2} />
            </svg>
          )}
          {this.state.frames.map(frame => {
            const { left, top, width, height } = frame;
            return (
              <ResizableFrame
                key={frame.id}
                id={frame.id}
                {...{ left, top, width, height }}
                onTransforming={this.onTransforming}
                onTransformEnd={this.onTransformEnd}
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
  props: { sourceFrame: undefined as frame, targetFrame: undefined as frame },
  state: {}
};
export class LinkLine extends React.PureComponent<
  typeof LinkLineDefaults.props,
  typeof LinkLineDefaults.state
> {
  static defaultProps = LinkLineDefaults.props;
  state = LinkLineDefaults.state;
  render() {
    const { sourceFrame, targetFrame } = this.props;
    if (!!sourceFrame && !!targetFrame) {
      return (
        <line
          key="1"
          x1={sourceFrame.left + sourceFrame.width / 2}
          y1={sourceFrame.top + sourceFrame.height / 2}
          x2={targetFrame.left + targetFrame.width / 2}
          y2={targetFrame.top + targetFrame.height / 2}
          stroke="lightgrey"
          strokeWidth={3}
        />
      );
    } else {
      return null;
    }
  }
}

export default connect(
  mapState,
  mapDispatch
)(GraphContainer);

const ScrollContainer = styled.div`
  --padding: 20px;
  --margin: 3px;
  --height: calc(100vh - 5px - var(--margin) - var(--padding) * 2);
  margin: var(--margin);
  padding: var(--padding);
  height: var(--height);
  border: 1px solid lightgrey;
  border-radius: 5px;
  font-size: 30px;
  overflow: none;
  overflow: auto;
`;

const MapContainer = styled.div`
  width: 10000px;
  height: 10000px;
  position: relative;
`;
