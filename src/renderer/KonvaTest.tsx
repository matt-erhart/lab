import * as React from "react";
import konva, { Circle, Stage } from "konva";
// import { interval } from "rxjs";
import styled from "styled-components";
import { useRef, useEffect, useLayoutEffect } from "react";
import Konva from "konva";
import store, { iRootState, iDispatch } from "../store/createStore";
import {
  makePdfSegmentViewbox,
  Nodes,
  Links,
  makeLink
} from "../store/creators";
import { connect } from "react-redux";
const ScrollContainer = styled.div`
  width: calc(100% - 22px);
  height: calc(100vh - 22px);
  overflow: auto;
  margin: 10;
  border: 1px solid grey;
`;

const AppDefaults = {
  props: {},
  state: {}
};

// import {pubs} from '@src/constants/pubs'
const mapState = (state: iRootState) => ({
  nodes: state.graph.nodes,
  links: state.graph.links,
  selectedNodes: state.graph.selectedNodes,
  selectedLinks: state.graph.selectedLinks
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

export class App extends React.Component<
  connectedProps,
  typeof AppDefaults.state
> {
  canvasRef = React.createRef<HTMLDivElement>();
  stage: konva.Stage;
  state = {
    canvasSize: { width: 3000, height: 3000 },
    scroll: { dx: 0, dy: 0 }
  };
  nodes: { [id: string]: Nodes };
  links: { [id: string]: Links };

  componentDidUpdate() {
    // todo if new stuff comes in update fast and draw
  }

  componentDidMount() {
    this.stage = new Konva.Stage({
      container: this.canvasRef.current, // id of container <div>
      width: window.innerWidth,
      height: window.innerHeight,
      draggable: false
    });
    // this.stage.on("wheel", zoomWheel(this.stage));

    let nodeLayer = new Konva.Layer();
    let linkLayer = new Konva.Layer();
    this.nodes = this.props.nodes;
    console.log("nodes", this.nodes);

    Object.values(this.nodes).forEach(node => {
      nodeLayer.add(
        new Konva.Circle({
          id: node.id,
          radius: 5,
          x: Math.random() * 500,
          y: Math.random() * 500,
          fill: "black",
          draggable: true,
          ...node.style
        })
      );
    });

    // Object.values(links).forEach(link => {
    //   const line = new Konva.Line(link.line);
    //   const source = nodes[link.source];
    //   const target = nodes[link.target];
    //   line.points([source.x, source.y, target.x, target.y]);
    //   linkLayer.add(line);
    // });

    this.stage.add(nodeLayer);
    // this.stage.add(linkLayer);

    // nodeLayer.on("dragmove dragend", e => {
    //   if (e.type === "dragmove") {
    //     updateLinks(nodeLayer, linkLayer)(e);
    //   } else if (e.type === "dragend") {
    //     console.log("dragend");
    //     updateLinks(nodeLayer, linkLayer)(e);
    //   }
    // });

    // draw the image
    nodeLayer.setZIndex(1);
    // linkLayer.setZIndex(0);
    // this.stage.on("mouseover mouseout", e => {
    //   let node = e.target;
    //   if (e.type === "mouseover") {
    //     node.strokeWidth(10);
    //   } else {
    //     node.strokeWidth(4);
    //   }
    //   if (e.target.getClassName() === "Circle") {
    //     nodeLayer.draw();
    //   }
    //   if (e.target.getClassName() === "Line") {
    //     linkLayer.draw();
    //   }
    // });

    this.stage.on("click dblclick", e => {
      const coords = this.stage.getPointerPosition();
      const { dx, dy } = this.state.scroll;
      const { x, y } = { x: coords.x + dx, y: coords.y + dy };
      const button = ["left", "middle", "right"][e.evt.button];
      if (button === "left" && e.type === "dblclick") {
        if (e.target.getType() === "Stage") {
          // ADD NODE
          let newNode = makePdfSegmentViewbox();
          newNode.style = { ...newNode.style, x, y };
          this.props.addBatch({ nodes: [newNode] });
          addNodeToLayer(newNode, nodeLayer, newNode.style);
        } else if (e.target.getClassName() === "Circle") {
          //REMOVE NODE and LINKS
          const id = e.target.getAttrs().id;
          this.props.removeBatch({ nodes: [id] });
          nodeLayer.findOne("#" + id).destroy();
          // todo remove links
          // const linksToDelete = getLinksIdsOnNode(delNode, links);
          // linksToDelete.forEach(linkId => {
          //   delete links[linkId];
          //   linkLayer.findOne("#" + linkId).destroy();
          // });
          // linkLayer.draw();
          nodeLayer.draw();
        }
      }
      if (button === "left" && e.type === "click") {
        // deselect all
        if (e.target.getType() === "Stage") {
          const selectedNodes = this.props.selectedNodes;
          selectedNodes.forEach(id => {
            const n = nodeLayer.findOne("#" + id);
            if (n) n.shadowEnabled(false);
          });

          // todo deselect all links
          // this.state.selected.links.forEach(id => {
          //   const n = linkLayer.findOne("#" + id);
          //   if (n) n.shadowEnabled(false);
          // });
          nodeLayer.draw();
          // linkLayer.draw();
          this.props.toggleSelections({ selectedNodes }); // add links to toggle here
        }
        if (e.target.getClassName() === "Line") {
          // todo combined line and circle cases
          const id = e.target.getAttrs().id;

          // todo link selection render
          // linkLayer
          //   .findOne("#" + id)
          //   .shadowEnabled(true)
          //   .setAttrs({
          //     shadowColor: "blue",
          //     shadowBlur: 10,
          //     shadowOffset: { x: 0, y: 0 },
          //     shadowOpacity: 1
          //   });

          // const node = linkLayer.findOne("#" + id);
          // nodeLayer.findOne("#" + id).shadowEnabled(false);
        }
        // linkLayer.draw();
      }
      if (button === "left" && e.target.getClassName() === "Circle") {
        const id = e.target.getAttrs().id;
        const isSelected = this.props.selectedNodes.includes(id);
        const clickedNode = nodeLayer.findOne("#" + id);
        if (!isSelected) {
          if (clickedNode)
            clickedNode.shadowEnabled(true).setAttrs({
              shadowColor: "blue",
              shadowBlur: 20,
              shadowOffset: { x: 0, y: 0 },
              shadowOpacity: 1
            });
        } else {
          if (clickedNode) clickedNode.shadowEnabled(false);
        }
        this.props.toggleSelections({ selectedNodes: [id] });
        nodeLayer.draw();

        // add node to selected
      } else if (button === "right" && e.target.getClassName() === "Circle") {
        //todo links
        linkSelectedToNode(
          this.props.nodes,
          this.props.selectedNodes,
          e.target.getAttrs().id,
          linkLayer,
          nodeLayer
        );
        console.log('todo links are in there but not rendered', linkLayer)

      }
    });
    nodeLayer.draw();
    linkLayer.draw();
  }

  onScroll = e => {
    // todo fast scrolling ghosting, maybe css transition?
    // or just put them on one layer
    var dx = e.nativeEvent.target.scrollLeft;
    var dy = e.nativeEvent.target.scrollTop;
    this.setState({ scroll: { dx, dy } });
    this.stage.x(-dx);
    this.stage.y(-dy);
    this.stage.batchDraw();
  };

  componentWillUnmount() {}

  render() {
    const { dx, dy } = this.state.scroll;
    return (
      <div>
        <ScrollContainer onScroll={this.onScroll}>
          <div
            style={{
              width: this.state.canvasSize.width,
              height: this.state.canvasSize.height,
              overflow: "hidden"
            }}
          >
            <div
              ref={this.canvasRef}
              style={{ transform: "translate(" + dx + "px, " + dy + "px)" }}
            />
          </div>
        </ScrollContainer>
      </div>
    );
  }
}

export default connect(
  mapState,
  mapDispatch
)(App);

const linkSelectedToNode = (
  nodes,
  selectedNodeIds,
  nodeId,
  linkLayer,
  nodeLayer
) => {
  const sourceNode = nodeLayer.findOne("#" + nodeId);
  selectedNodeIds.forEach(targetId => {
    const targetNode = nodeLayer.findOne("#" + targetId);
    const newLink = makeLink(nodes[nodeId], nodes[targetId])

    const line = new Konva.Line(newLink.style);
    linkLayer.add(line);
  });
  linkLayer.draw();
};

const getLinksIdsOnNode = (node, links) => {
  let linksOnNode = [] as string[];
  Object.values(links).forEach((link, key) => {
    if (link.source === node.id || link.target === node.id) {
      linksOnNode.push(link.id);
    }
  });
  return linksOnNode;
};

const addNodeToLayer = (node, nodeLayer, style = {}) => {
  // const id = Math.random() * 1000 + "";
  const config = {
    radius: 10,
    fill: "blue",
    stroke: "blue",
    strokeWidth: 4,
    draggable: true,
    id: node.id,
    ...style
  };
  nodeLayer.add(new Konva.Circle({ ...config }));
  nodeLayer.draw();
};

const updateLinks = (
  nodeLayer: konva.Layer<konva.Node>,
  linkLayer: konva.Layer<konva.Node>
) => (e: konva.KonvaEventObject<DragEvent>) => {
  /**
   *
   */
  const movingId = e.target.id();
  const movingNode = nodeLayer.findOne("#" + movingId) as konva.Shape;
  const { x, y } = movingNode.getAttrs();

  for (let link of Object.values(links)) {
    if (link.target === movingId || link.source === movingId) {
      const line = linkLayer.findOne("#" + link.line.id) as konva.Line;
      if (link.target === movingId) {
        const target = nodeLayer.findOne("#" + link.target);
        const p = line.points();
        const points = [p[0], p[1], target.x(), target.y()];
        line.points(points);
      }

      if (link.source === movingId) {
        const source = nodeLayer.findOne("#" + link.source) as konva.Line;
        const p = line.points();
        const midX = (p[2] + source.x()) / 2;
        const midY = (p[3] + source.y()) / 2;
        const points = [source.x(), source.y(), p[2], p[3]];
        line.points(points);
      }
    }
  }
  linkLayer.draw();
};

const zoomWheel = (stage, scaleBy = 1.2) => e => {
  e.evt.preventDefault();
  var oldScale = stage.scaleX();

  var mousePointTo = {
    x: stage.getPointerPosition().x / oldScale - stage.x() / oldScale,
    y: stage.getPointerPosition().y / oldScale - stage.y() / oldScale
  };

  var newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
  stage.scale({ x: newScale, y: newScale });

  var newPos = {
    x: -(mousePointTo.x - stage.getPointerPosition().x / newScale) * newScale,
    y: -(mousePointTo.y - stage.getPointerPosition().y / newScale) * newScale
  };
  stage.position(newPos);
  stage.batchDraw();
};

export const makeGridOfBoxes = (nRows, nCols, width, height, gap) => {
  const rows = [...Array(nRows).keys()];
  const cols = [...Array(nCols).keys()];
  let x = 0;
  let y = 0;
  let boxes = [];
  let id = 0;
  for (let rowNum of rows) {
    if (rowNum > 0) x += width + gap;
    y = 0;
    for (let colNum of cols) {
      if (colNum > 0) y += height + gap;
      boxes.push({ id: rowNum + "" + colNum + "" + id++, x, y, width, height });
    }
  }
  return boxes;
};
