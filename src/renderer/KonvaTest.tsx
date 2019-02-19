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

let nodes = new Map([
  [
    "node1",
    {
      x: 150,
      y: 150,
      radius: 30,
      fill: "red",
      stroke: "red",
      strokeWidth: 4,
      draggable: true,
      id: "node1"
    }
  ],
  [
    "node2",
    {
      x: 200,
      y: 200,
      radius: 30,
      fill: "green",
      stroke: "green",
      strokeWidth: 4,
      draggable: true,
      id: "node2"
    }
  ],
  [
    "node3",
    {
      x: 150,
      y: 250,
      radius: 30,
      fill: "blue",
      stroke: "blue",
      strokeWidth: 4,
      draggable: true,
      id: "node3"
    }
  ]
]);

let links = new Map([
  [
    "link1",
    {
      line: {
        strokeWidth: 3,
        stroke: "black",
        lineCap: "round",
        id: "link1",
        opacity: 0.3,
        points: [0, 0]
      },
      source: "node1",
      target: "node2"
    }
  ],
  [
    "link2",
    {
      line: {
        strokeWidth: 3,
        stroke: "black",
        lineCap: "round",
        id: "link2",
        opacity: 0.3,
        points: [0, 0]
      },
      source: "node1",
      target: "node3"
    }
  ],
  [
    "link3",
    {
      line: {
        strokeWidth: 3,
        stroke: "black",
        lineCap: "round",
        id: "link3",
        opacity: 0.3,
        points: [0, 0]
      },
      source: "node2",
      target: "node3"
    }
  ]
]);

export default class App extends React.Component {
  canvasRef = React.createRef<HTMLDivElement>();
  stage: konva.Stage;
  state = {
    canvasSize: { width: 3000, height: 3000 },
    scroll: { dx: 0, dy: 0 }
  };

  componentDidMount() {
    this.stage = new Konva.Stage({
      container: this.canvasRef.current, // id of container <div>
      width: window.innerWidth,
      height: window.innerHeight,
      draggable: true
    });
    // this.stage.on("wheel", zoomWheel(this.stage));

    var nodeLayer = new Konva.Layer();
    let linkLayer = new Konva.Layer();

    nodes.forEach((node, key, map) => {
      nodeLayer.add(new Konva.Circle(node));
    });

    links.forEach((link, key, map) => {
      const line = new Konva.Line(link.line);
      const source = nodes.get(link.source);
      const target = nodes.get(link.target);
      line.points([source.x, source.y, target.x, target.y]);
      linkLayer.add(line);
    });

    this.stage.add(nodeLayer);
    this.stage.add(linkLayer);
    nodeLayer.on("dragmove", e => updateLinks(nodeLayer, linkLayer)(e));
    // draw the image
    nodeLayer.setZIndex(1);
    linkLayer.setZIndex(0);
    nodeLayer.draw();
    linkLayer.draw();
  }

  onScroll = e => {
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
    );
  }
}

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

  for (let link of links.values()) {
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
