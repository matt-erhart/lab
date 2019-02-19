import * as React from "react";
import konva, { Circle } from "konva";
// import { interval } from "rxjs";
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

import { useRef, useEffect, useLayoutEffect } from "react";

import Konva from "konva";

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
  state = {};

  componentDidMount() {
    this.stage = new Konva.Stage({
      container: this.canvasRef.current, // id of container <div>
      width: window.innerWidth,
      height: window.innerHeight,
      draggable: true
    });

    // then create layer
    var layer = new Konva.Layer();
    let lineLayer = new Konva.Layer();
    var line = new Konva.Line({
      dash: [10, 10, 0, 10],
      strokeWidth: 3,
      stroke: "black",
      lineCap: "round",
      id: "line",
      opacity: 0.3,
      points: [10, 10, 20, 20]
    });

    nodes.forEach((node, key, map) => {
      layer.add(new Konva.Circle(node));
    });

    links.forEach((link, key, map) => {
      const line = new Konva.Line(link.line);
      const source = nodes.get(link.source);
      const target = nodes.get(link.target);
      line.setPoints([source.x, source.y, target.x, target.y]);
      lineLayer.add(line);
    });

    this.stage.add(layer);
    this.stage.add(lineLayer);
    layer.on("dragmove", e => {
      // todo make updateLines(){}
      const movingId = e.target.id();
      const movingNode = layer.findOne("#" + movingId);
      const { x, y } = movingNode.attrs;
      
      for (let link of links.values()) {
        if (link.target === movingId || link.source === movingId) {
          const line = lineLayer.findOne("#" + link.line.id);

          if (link.target === movingId) {
            const target = layer.findOne("#" + link.target);
            const points = [
              line.attrs.points[0],
              line.attrs.points[1],
              target.x(),
              target.y()
            ]
            console.log('target', points)
            
            line.setPoints(points);
          }
          if (link.source === movingId) {
            const source = layer.findOne("#" + link.source);
            const points = [
              source.x(),
              source.y(),
              line.attrs.points[2],
              line.attrs.points[3]
            ]
            console.log('source', points)

            line.setPoints(points);
          }
        }
      }
      lineLayer.draw();
    });
    // draw the image
    layer.draw();
    lineLayer.draw();
  }

  componentWillUnmount() {}

  render() {
    return <div ref={this.canvasRef} />;
  }
}
