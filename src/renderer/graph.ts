import Graph = require("graphology");
import { withUid } from "./utils";
import { PdfPathInfo } from "../store/createStore";

const generator = function({ undirected, source, target, attributes }) {
  return withUid().id;
};

export const graph = new Graph({ multi: true, edgeKeyGenerator: generator });

type NodeTypes =
  | "userDoc/plain"
  | "userDoc/quote"
  | "userDoc/unit"
  | "viewbox/pdf"
  | "textRange/pdf"
  | "publication/pdf"
  | "user"
  | "venue";

const ViewboxDefault = {
  id: "",
  left: 0,
  top: 0,
  height: 0,
  width: 0,
  type: "viewbox/pdf" as NodeTypes,
  userId: "default",
  pdfPathInfo: {} as  PdfPathInfo,
  pageNumber: 0
};

export type Viewbox = typeof ViewboxDefault;
export const addViewbox = (viewbox = {} as Partial<Viewbox>, graph) => {
  const vb = {
    ...ViewboxDefault,
    id: withUid("viewbox").id,
    ...viewbox
  };
  // make sure we got our nodes
  graph.mergeNode(vb.pdfPathInfo.dir)
  graph.mergeNode(vb.userId)
  graph.mergeNode(vb.id, vb); // unique

  graph.mergeEdge(vb.userId, vb.id);
  graph.mergeEdge(vb.pdfPathInfo.pdfName, vb.id);

  return vb;
};
