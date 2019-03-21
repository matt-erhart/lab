import { Links, aLink, aNode, Nodes } from "../store/creators";
import { unique } from "./utils";

// const nodes = {
//   a: { id: "a" },
//   b: { id: "b" },
//   c: { id: "c" }
// };

// const links = {
//   "1": { id: "1", source: "a", target: "b" },
//   "2": { id: "2", source: "a", target: "c" }
// };

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

// const res = getNeighborhood(["c"], nodes, links);
// console.log(res);
