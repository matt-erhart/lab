import { Links, aLink, aNode, Nodes, NodeBase } from "../store/creators";
import { unique } from "./utils";
import { dispatch, getState } from "../store/createStore";
import { makePdfSegmentViewbox } from "../store/creators";
import { NestedPartial } from "../renderer/utils";
import { get } from "./utils";
const nodes = getState().graph.nodes;
const links = getState().graph.links;

export const getNeighborhood = (
  nodeIds: string[],
  nodes: Nodes,
  links: Links
): { links: aLink[]; nodes: NodeBase[] } => {
  let res = { links: [], nodes: [] };
  Object.values(links).forEach(link => {
    const sourceMatches = nodeIds.includes(link.source);
    const targetMatches = nodeIds.includes(link.target);
    if (sourceMatches || targetMatches) {
      res.links.push(link);
    }
    if (sourceMatches) res.nodes.push(nodes[link.target]);
    if (targetMatches) res.nodes.push(nodes[link.source]);
  });
  //   res.nodes = unique(res.nodes);
  return res;
};

const testNode = Object.values(nodes).find(n =>
  get(n, n => {
    return n.data.text === "compression";
  })
);
// type neighborhood = { [nodeId: string]: { nodes: string[]; links: string[] } };
// let neighborhood: neighborhood = {}

// for (let node of Object.values(nodes)) {
//   const res = getNeighborhood([node.id], nodes, links);
//   const neighborNodes = res.nodes.map(n => get(n, n => n.id));
//   const neighborLinks = res.links.map(n => get(n, n => n.id));
//   neighborhood[node.id] = { nodes: neighborNodes, links: neighborLinks };
// }
// console.log('neighborhood: ', neighborhood);
const mapToCola = (_nodes: Nodes, _links: Links) => {
  const nodes = Object.values(_nodes).map(n => {
    return {
      id: n.id,
      x: n.style.left,
      y: n.style.top,
      width: n.style.width,
      height: n.style.height
    };
  });
  const links = Object.values(_links).map(link => {
    const sourceIx = nodes.findIndex(n => n.id === link.source);
    const targetIx = nodes.findIndex(n => n.id === link.target);
    return { id: link.id, source: sourceIx, target: targetIx };
  });
  return { nodes, links };
};
// import * as d3 from "d3";
import * as cola from "webcola";
// var d3cola = cola
//   .d3adaptor(d3)
//   .linkDistance(30)
//   .size([1000, 1000]);

let graph = mapToCola(nodes, links);
// d3cola
//   .nodes(graph.nodes)
//   .links(graph.links)
//   .jaccardLinkLengths(40, 0.7)
//   .avoidOverlaps(true)
//   .start(20, 0, 10)
//   .on("tick", function() {
//     console.log(this);
//     console.log("d3cola.nodes(): ", d3cola.nodes()[0]);
//   });

const nodeSize = 20,
  threshold = 0.01;
let starts = 0,
  ticks = 0,
  ends = 0,
  layout = new cola.Layout()
    .linkDistance(1)
    .size([1000, 1000])
    .nodes(graph.nodes)
    .links(graph.links)
    .handleDisconnected(false) // handle disconnected repacks the components which would hide any drift
    .avoidOverlaps(true)
    .start(20, 0, 10)
    .avoidOverlaps(true) // force non-overlap
    .on(cola.EventType.start, e => starts++)
    .on(cola.EventType.tick, e => {
      ticks++;
      console.log("node: ", layout.nodes());
    })
    .on(cola.EventType.end, e => ends++);
layout.start(); // first layout

setTimeout(() => {
  console.log("stop");
  layout.stop();
  console.log('graph.nodes: ', graph.nodes);
  layout.nodes()
  console.log("resume");
  layout.alpha(.1).start();
}, 3000);
