import * as React from "react";
import konva, { Circle } from "konva";
// import { interval } from "rxjs";
import styled from "styled-components";
import { useRef, useEffect, useLayoutEffect } from "react";
import Konva from "konva";

const ScrollContainer = styled.div`
  width: calc(100% - 22px);
  height: calc(100vh - 22px);
  overflow: auto;
  margin: 10;
  border: 1px solid grey;
`;

let nodes = {
  node1: {
    x: 150,
    y: 150,
    radius: 30,
    fill: "red",
    stroke: "red",
    strokeWidth: 10,
    draggable: true,
    id: "node1"
  },
  node2: {
    x: 200,
    y: 200,
    radius: 30,
    fill: "green",
    stroke: "green",
    strokeWidth: 10,
    draggable: true,
    id: "node2"
  },
  node3: {
    x: 150,
    y: 250,
    radius: 30,
    fill: "blue",
    stroke: "blue",
    strokeWidth: 10,
    draggable: true,
    id: "node3"
  }
};

let links = {
  link1: {
    line: {
      strokeWidth: 3,
      stroke: "black",
      lineCap: "round",
      id: "link1",
      opacity: 0.3,
      points: [0, 0]
    },
    source: "node1",
    target: "node2",
    id: "link1"
  },
  link2: {
    line: {
      strokeWidth: 3,
      stroke: "black",
      lineCap: "round",
      id: "link2",
      opacity: 0.3,
      points: [0, 0]
    },
    source: "node1",
    target: "node3",
    id: "link2"
  },
  link3: {
    line: {
      strokeWidth: 3,
      stroke: "black",
      lineCap: "round",
      id: "link3",
      opacity: 0.3,
      points: [0, 0]
    },
    source: "node2",
    target: "node3",
    id: "link3"
  }
};

export default class App extends React.Component {
  canvasRef = React.createRef<HTMLDivElement>();
  stage: konva.Stage;
  state = {
    canvasSize: { width: 3000, height: 3000 },
    scroll: { dx: 0, dy: 0 },
    selected: { nodes: [], links: [] }
  };

  componentDidUpdate() {
    console.log(this.state.selected.nodes);
  }

  componentDidMount() {
    this.stage = new Konva.Stage({
      container: this.canvasRef.current, // id of container <div>
      width: window.innerWidth,
      height: window.innerHeight,
      draggable: true
    });
    // this.stage.on("wheel", zoomWheel(this.stage));

    let nodeLayer = new Konva.Layer();
    let linkLayer = new Konva.Layer();

    Object.values(nodes).forEach(node => {
      nodeLayer.add(new Konva.Circle(node));
    });

    Object.values(links).forEach(link => {
      const line = new Konva.Line(link.line);
      const source = nodes[link.source];
      const target = nodes[link.target];
      line.points([source.x, source.y, target.x, target.y]);
      linkLayer.add(line);
    });

    this.stage.add(nodeLayer);
    this.stage.add(linkLayer);
    nodeLayer.on("dragmove", e => updateLinks(nodeLayer, linkLayer)(e));
    // draw the image
    nodeLayer.setZIndex(1);
    linkLayer.setZIndex(0);
    this.stage.on("click dblclick", e => {
      const coords = this.stage.getPointerPosition();
      const { dx, dy } = this.state.scroll;
      const { x, y } = { x: coords.x + dx, y: coords.y + dy };
      const button = ["left", "middle", "right"][e.evt.button];
      if (button === "left" && e.type === "dblclick") {
        if (e.target.getType() === "Stage") {
          // ADD NODE
          addNode(nodes, nodeLayer, { x, y });
        } else if (e.target.getClassName() === "Circle") {
          //REMOVE NODE and LINKS
          const id = e.target.getAttrs().id;
          const delNode = nodes[id];

          delete nodes[id];

          nodeLayer.findOne("#" + id).destroy();

          const linksToDelete = getLinksIdsOnNode(delNode, links);
          console.log(linksToDelete);

          linksToDelete.forEach(linkId => {
            delete links[linkId];
            linkLayer.findOne("#" + linkId).destroy();
          });
          linkLayer.draw();
          nodeLayer.draw();
        }
      }
      if (button === "left" && e.type === "click") {
        if (e.target.getClassName() === "Circle") {
          const id = e.target.getAttrs().id;
          const { selected } = this.state;
          const ix = selected.nodes.findIndex(x => x === id);

          let newSelected;
          if (ix < 0) {
            // select
            newSelected = [...selected.nodes, id];
            nodeLayer
              .findOne("#" + id)
              .shadowEnabled(true)
              .setAttrs({
                shadowColor: "black",
                shadowBlur: 15,
                shadowOffset: { x: 10, y: 10 },
                shadowOpacity: 0.5
              });
          } else {
            // deselect
            newSelected = [
              ...selected.nodes.slice(0, ix),
              ...selected.nodes.slice(ix + 1)
            ];
            const node = nodeLayer.findOne("#" + id);
            const fillColor = node.getAttr("fill");
            console.log(fillColor);
            nodeLayer.findOne("#" + id).shadowEnabled(false);
          }
          nodeLayer.draw();
          this.setState(state => ({
            selected: { links: state.selected.links, nodes: newSelected }
          }));

          // add node to selected
        }
      } else if (
        button === "right" &&
        e.target.getClassName() === "Circle"
      ) {
        linkSelectedToNode(
          nodes,
          this.state.selected.nodes,
          e.target.getAttrs().id,
          linkLayer,
          nodeLayer
        );
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

    const linkId = Math.random() * 1000;
    links[linkId] = {
      line: {
        strokeWidth: 3,
        stroke: "black",
        lineCap: "round",
        id: linkId,
        opacity: 0.3,
        points: [sourceNode.x(), sourceNode.y(), targetNode.x(), targetNode.y()]
      },
      source: nodeId,
      target: targetId,
      id: linkId
    };
    const line = new Konva.Line(links[linkId].line);
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

const addNode = (nodes: Map<string, any>, nodeLayer, nodeConfig) => {
  const id = Math.random() * 1000 + "";
  const node = {
    ...nodeConfig,
    radius: 30,
    fill: "blue",
    stroke: "blue",
    strokeWidth: 4,
    draggable: true,
    id
  };
  nodes[id] = node;
  nodeLayer.add(new Konva.Circle(node));
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
  console.log(x, y);

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

        const points = [source.x(), source.y(), p[2], p[3]];
        console.log("source", points);

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
