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
const settings = require("electron-settings");
import { existsElseMake } from "../renderer/io";
// todo add undo/redo by 3rd arg to product
let patches = [];
let inversePatches = [];
const pdfRootDir = settings.get("pdfRootDir");
console.log("create store", pdfRootDir);

let defaultApp = {
  current: {
    userId: "",
    pdfDir: "",
    pdfRootDir: pdfRootDir //C:\\Users\\merha\\pdfs
  },
  settings: {
    appearance: {
      windowStyleOnOpen: { x: 0, y: 0, width: 1000, height: 1000 },
      panels: {}
    },
    keyboardShortcuts: {}
  }
};

let defaultGraph = {
  nodes: {} as Nodes,
  links: {} as Links,
  selectedNodes: [] as string[],
  selectedLinks: [] as string[],
  patches: []
};

const stateJsonPath = path.join(pdfRootDir, "./state.json"); // init in main/index.ts
type state = { app: typeof defaultApp; graph: typeof defaultGraph };
const savedModelsJson = jsonfile.readFileSync(stateJsonPath) as state;

export const app = createModel({
  state: { ...defaultApp, ...savedModelsJson.app } as typeof defaultApp,
  reducers: {
    setCurrent(
      state,
      payload: { userId?: string; pdfDir?: string; pdfRootDir?: string }
    ) {
      return produce(state, draft => {
        draft.current = { ...draft.current, ...payload };
      });
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
        for (let key of Object.keys(payload)) {
          for (let item of payload[key]) {
            const isUnique = !state[key].hasOwnProperty(item.id);
            if (isUnique) {
              draft[key][item.id] = item;
              draft.patches.push({
                op: "add",
                path: [key, item.id],
                value: item
              });
            } else {
              console.log(item, "already exists. maybe you want updateData()");
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
            const { id, data, style, source, target, undirected } = nodeOrLink;
            draft[payloadKey][id].meta.timeUpdated = Date.now();

            for (let keyToUpdate of Object.keys(data || {})) {
              draft[payloadKey][id].data[keyToUpdate] = data[keyToUpdate];
            }
            for (let keyToUpdate of Object.keys(style || {})) {
              draft[payloadKey][id].style[keyToUpdate] = style[keyToUpdate];
            }
            if (source) draft.links[id].source = source;
            if (target) draft.links[id].target = target;
            if (undirected !== undefined)
              draft.links[id].undirected = undirected;

            if (source)
              draft.patches.push({
                op: "replace",
                path: ["links", id],
                value: draft.links[id]
              });
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
    },
    effects: dispatch => ({
      async saveStateToDisk(_, rootState) {
        // await jsonfile.writeFile("./state.json", rootState.app);
      }
    })
  }
});

const models = {
  app,
  graph
};

const logit = {
  middleware: store => next => action => {
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
      console.time("write to disk");
      jsonfile.writeFileSync(path.join(pdfRootDir, "state.json"), store.getState(), { spaces: 2 });
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
