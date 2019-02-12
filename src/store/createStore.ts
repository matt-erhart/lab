import { init, RematchRootState, createModel } from "@rematch/core";
import produce from "immer";
import Graph = require("graphology");
import { withUid } from "../renderer/utils";
import { PdfPathInfo } from "../store/createStore";

const generator = function({ undirected, source, target, attributes }) {
  return withUid().id;
};

export const graph = new Graph({ multi: true, edgeKeyGenerator: generator });

interface GraphNode {
  key: string;
  attributes: {};
}

interface GraphEdge {
  key: string;
  attributes: {};
  source: string;
  target: string;
  undirected: boolean;
}

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
  pdfPathInfo: {} as PdfPathInfo,
  pageNumber: 0
};
export type Viewbox = typeof ViewboxDefault;
export const makeViewbox = (viewbox = {} as Partial<Viewbox>, graph) => {
  return {
    ...ViewboxDefault,
    id: withUid("viewbox").id,
    ...viewbox
  };
}

export interface PdfPathInfo {
  pdfPath: string;
  pdfName: string;
  dir: string;
}

const defaultInfo = {
  userId: "default",
  pdfPathInfo: {} as PdfPathInfo,
  nodes: [] as GraphNode[],
  edges: [] as GraphEdge[]
};

export const info = createModel({
  state: defaultInfo,
  reducers: {
    updateState(state, payload: Partial<typeof defaultInfo>) {
      // like this.setState
      return { ...state, ...payload };
    },
    addNode(state, node: GraphNode) {
      const isUnique = state.nodes.findIndex(n => n.key === node.key) === -1;
      if (!isUnique) {
        console.log("node already exists", node);
        return state;
      }
      return produce(state, draft => {
        return draft.nodes.push(node);
      });
    },
    updateNode(state, node: GraphNode) {
      return produce(state, draft => {
        const ix = draft.nodes.findIndex(n => n.key === node.key);
        if (ix === -1) return draft;
        return (draft.nodes[ix] = { ...draft.nodes[ix], ...node });
      });
    },
    updateAttributes(
      state,
      payload: { key: string; type: "node" | "edge"; attributes: {} }
    ) {
      const { key, type, attributes } = payload;
      return produce(state, draft => {
        const ix = draft[type].findIndex(n => n.key === payload.key);
        if (ix === -1) return draft;
        return (draft[type][ix].attributes = {
          ...draft[type][ix].attributes,
          ...attributes
        });
      });
    },
    deleteNode(state, nodeId) {
      const ix = state.nodes.findIndex(n => n.key === nodeId);
      return produce(state, draft => {
        draft.nodes.splice(ix, 1);
        console.log("deleteing node and connecting edges");
        draft.edges.filter(e => e.source !== nodeId && e.target !== nodeId);
      });
    },
    addEdge(state, edge: GraphEdge) {
      const isUnique = state.edges.findIndex(x => x.key === edge.key) === -1;
      if (!isUnique) {
        console.log("edge already exists", edge);
        return state;
      }
      return produce(state, draft => {
        return draft.edges.push(edge);
      });
    },
    updateEdge(state, edge: GraphEdge) {
      return produce(state, draft => {
        const ix = draft.edges.findIndex(n => n.key === edge.key);
        if (ix === -1) return draft;
        return (draft.edges[ix] = { ...draft.nodes[ix], ...edge });
      });
    },
    deleteEdge(state, edge: GraphNode) {
      const ix = state.nodes.findIndex(n => n.key === edge.key);
      return produce(state, draft => {
        delete draft.edges[ix];
      });
    }
  }
});

const models = {
  info
};

const store = init({
  models
});

export default store;
export const { dispatch, getState } = store;
export type iStore = typeof store;
export type iDispatch = typeof store.dispatch;
export type iRootState = RematchRootState<typeof models>;
