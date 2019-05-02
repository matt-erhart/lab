import { Links, aLink, aNode, Nodes } from "../store/creators";
import { unique } from "./utils";
import { dispatch, getState } from "../store/createStore";
import { makePdfSegmentViewbox } from "../store/creators";
import { NestedPartial } from "../renderer/utils";
import {get} from './utils'
const nodes = getState().graph.nodes
const links = getState().graph.links


export const getNeighborhood = (
  nodeIds: string[],
  nodes: Nodes,
  links: Links
): { links: aLink[]; nodes: aNode[] } => {
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

// const testNode = Object.values(nodes).find(n => get(n, n => {
//   // n.style.


// }))

const res = getNeighborhood(['76003d20-6adb-11e9-b08d-f1ad86ade95f'], nodes, links);
console.log(res);
