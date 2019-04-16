import { init, RematchRootState, createModel } from "@rematch/core";
import produce, { original } from "immer";
const pino = require("pino");
const logger = pino({ base: null }, "./patches.log"); //142k default, 700k extreme
// logger.info({ patch: { b: 1 } });
import { Nodes, Links, aNode, aLink, LinkBase } from "./creators";
import jsonfile = require("jsonfile");
import { NestedPartial } from "../renderer/utils";
import path = require("path");
import { oc } from "ts-optchain";
import { frame } from "../renderer/ResizableFrame";
const settings = require("electron-settings");
const { clientWidth } = document.documentElement;
// stored in user/data.
// todo add userId?
const pdfRootDir = settings.get("pdfRootDir");
export let defaultApp = {
  current: {
    userId: "",
    pdfRootDir: pdfRootDir
  },
  settings: {
    appearance: {
      windowStyleOnOpen: { x: 0, y: 0, width: 1000, height: 1000 },
      panels: {}
    },
    keyboardShortcuts: {}
  },
  panels: {
    mainPdfReader: {
      // todo should be scrollto
      left: 0,
      top: 0,
      width: clientWidth / 2,
      height: "100%",
      scale: 2,
      scrollToPageNumber: 0,
      pdfDir: ""
    },
    graphContainer: {
      // todo should be scrollto
      left: 0,
      top: 0,
      width: "50vw",
      height: "100%",
      scale: 1
    },
    rightPanel: "graphContainer" as "graphContainer" | "listview" | "synthesisOutlineEditor"
    // rightPanel: "graphContainer" as "graphContainer" | "listview" | "docEditor"

  },
  portals: [] as frame[]
};

let defaultGraph = {
  nodes: {} as Nodes,
  links: {} as Links,
  selectedNodes: [] as string[],
  selectedLinks: [] as string[],
  patches: [] //todo ts
};

const stateJsonPath = path.join(pdfRootDir, "./state.json"); // init in main/index.ts
type state = { app: typeof defaultApp; graph: typeof defaultGraph };
let savedModelsJson;
try {
  savedModelsJson = jsonfile.readFileSync(stateJsonPath) as state;
} catch (err) {
  savedModelsJson = {};
}

export const app = createModel({
  state: { ...defaultApp, ...savedModelsJson.app } as typeof defaultApp,
  reducers: {
    setRightPanel(state, panelName: typeof defaultApp.panels.rightPanel) {
      return { ...state, panels: { ...state.panels, rightPanel: panelName } };
    },
    setCurrent(
      state,
      payload: { userId?: string; pdfDir?: string; pdfRootDir?: string }
    ) {
      return produce(state, draft => {
        draft.current = { ...draft.current, ...payload };
      });
    },
    setMainPdfReader(
      state,
      payload: Partial<typeof defaultApp.panels.mainPdfReader>
    ) {
      return produce(state, draft => {
        draft.panels.mainPdfReader = {
          ...draft.panels.mainPdfReader,
          ...payload
        };
      });
    },
    setGraphContainer(
      state,
      payload: Partial<typeof defaultApp.panels.graphContainer>
    ) {
      // todo one set* function
      return produce(state, draft => {
        draft.panels.graphContainer = {
          ...draft.panels.graphContainer,
          ...payload
        };
      });
    },
    addPortals(state, payload: frame[]) {
      return produce(state, draft => {
        draft.portals.push(...payload);
      });
    },
    removePortals(state, ids: string[]) {
      return produce(state, draft => {
        ids.forEach(id => {
          draft.portals.splice(draft.portals.findIndex(p => p.id === id), 1);
        });
      });
    },
    updatePortals(state, frames: frame[]) {
      return produce(state, draft => {
        frames.forEach(frame => {
          const ix = draft.portals.findIndex(p => p.id === frame.id);
          if (ix === -1) {
            draft.portals.push(frame);
          } else {
            draft.portals[ix] = { ...draft.portals[ix], ...frame };
          }
        });
      });
    },
    setPortals(state, payload = []) {
      return { ...state, portals: payload };
    }
  }
});

export const graph = createModel({
  state: { ...defaultGraph, ...savedModelsJson.graph } as typeof defaultGraph,
  reducers: {
    addBatch(
      state,
      payload: {
        nodes?: Nodes[] | any;
        links?: Links[] | any;
      }
    ) {
      return produce(state, draft => {
        draft.patches = [];
        for (let nodesOrLinks of Object.keys(payload)) {
          for (let arrItem of payload[nodesOrLinks]) {
            const isUnique = !state[nodesOrLinks].hasOwnProperty(arrItem.id);

            if (isUnique) {
              draft[nodesOrLinks][arrItem.id] = arrItem;
              draft.patches.push({
                op: "add",
                path: [nodesOrLinks, arrItem.id],
                value: arrItem
              });
            } else {
              console.log(
                arrItem,
                "already exists. maybe you want updateData()"
              );
            }
          }
        }
        return;
      });
    },
    removeBatch(
      state,
      payload: {
        nodes?: string[];
        links?: string[];
      }
    ) {
      return produce(state, draft => {
        draft.patches = [];
        for (let payloadKey of Object.keys(payload)) {
          for (let id of payload[payloadKey]) {
            const exists = state[payloadKey].hasOwnProperty(id);
            if (exists) {
              draft.patches.push({
                op: "remove",
                path: [payloadKey, id],
                value: draft[payloadKey][id]
              });
              delete draft[payloadKey][id];
            } else {
              console.log(id, " no such item to remove");
            }

            const selectedName =
              "selected" +
              payloadKey.charAt(0).toUpperCase() +
              payloadKey.slice(1);
            // console.log(draft[selectedName]);
            const ix = draft[selectedName].findIndex(x => x === id);
            if (ix >= 0) {
              delete draft[selectedName][ix];
            }

            if (payloadKey === "nodes") {
              // also remove connected links

              (Object.values(draft.links) as LinkBase[]).forEach(link => {
                // todo changed without checking
                if ([link.source, link.target].includes(id)) {
                  const linkId = link.id as string;
                  draft.patches.push({
                    op: "remove",
                    path: ["links", linkId],
                    value: draft.links[linkId]
                  });
                  delete draft.links[linkId];
                }
              });
            }
          }
        }
        return;
      });
    },
    updateBatch(
      state,
      payload: {
        nodes?: NestedPartial<aNode>[];
        links?: NestedPartial<aLink>[];
      }
    ) {
      // todo updatetime
      // 400 items = 9ms, 300 items = 7ms
      return produce(state, draft => {
        draft.patches = [];
        for (let payloadKey of Object.keys(payload)) {
          for (let nodeOrLink of payload[payloadKey]) {
            // like spread but faster
            const { id, data, style, source, target, isDirected } = nodeOrLink;
            draft[payloadKey][id].meta.timeUpdated = Date.now();

            for (let keyToUpdate of Object.keys(data || {})) {
              draft[payloadKey][id].data[keyToUpdate] = data[keyToUpdate];
            }
            for (let keyToUpdate of Object.keys(style || {})) {
              draft[payloadKey][id].style[keyToUpdate] = style[keyToUpdate];
            }
            if (source) draft.links[id].source = source;
            if (target) draft.links[id].target = target;
            if (isDirected !== undefined)
              draft.links[id].isDirected = isDirected;

            if (source) {
              draft.patches.push({
                op: "replace",
                path: ["links", id],
                value: draft.links[id]
              });
            } else {
              draft.patches.push({
                op: "replace",
                path: ["nodes", id],
                value: draft.nodes[id]
              });
            }
          }
        }
      });
    },
    toggleSelections(
      state,
      payload: {
        selectedNodes?: string[];
        selectedLinks?: string[];
        clearFirst?: boolean;
      }
    ) {
      return produce(state, draft => {
        const { clearFirst, ...lists } = payload;
        for (let key of Object.keys(lists)) {
          if (payload.clearFirst) draft[key] = [];
          for (let id of lists[key]) {
            const ix = draft[key].findIndex(x => x === id);
            if (ix > -1) {
              draft[key].splice(ix, 1);
            } else {
              draft[key].push(id);
            }
          }
        }
      });
    }
  }
});

const models = {
  app,
  graph
};

const logit = {
  middleware: store => next => action => {
    if (!["app/updatePortals"].includes(action.type))
      console.log("REDUX: ", action.type, Object.keys(action.payload));
    return next(action);
  }
};

const saveToJson = {
  middleware: store => next => action => {
    const saveIf = ["graph/addBatch", "graph/updateBatch", "graph/removeBatch"];
    const result = next(action);
    if (saveIf.includes(action.type)) {
      // if need perf: requestidealcallback if window
      // todo promises can race and corrupt file.
      // todo save on idle with cancel
      console.time("write to disk");
      jsonfile.writeFileSync(
        path.join(pdfRootDir, "state.json"),
        store.getState(),
        { spaces: 2 }
      );
      console.timeEnd("write to disk");
    }
    return result;
  }
};

// const initializeStateFromJson = {
//   onStoreCreated(store) {

//     try {
//       const savedStore = jsonfile.readFileSync(path.join("E:", "lab", "state.json"))
//       return savedStore

//     } catch (err) {
//       console.log(err)
//       return store;
//     }
//   }
// };

const store = init({
  models,
  plugins: [logit, saveToJson]
});

export default store;
export const { dispatch, getState } = store;
export type iStore = typeof store;
export type iDispatch = typeof store.dispatch;
export type iRootState = RematchRootState<typeof models>;
