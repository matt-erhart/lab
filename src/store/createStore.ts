import { init, RematchRootState, createModel } from "@rematch/core";
import produce from "immer";
import { PdfPathInfo } from "../store/createStore";
const pino = require("pino");
const logger = pino({ base: null }, "./patches.log"); //142k default, 700k extreme
// logger.info({ patch: { b: 1 } });
import { Nodes, Links } from "./creators";
import jsonfile = require("jsonfile");
// todo add undo/redo by 3rd arg to product
let patches = [];
let inversePatches = [];

let defaultGraph = {
  nodes: {} as { [id: string]: Nodes },
  links: {} as { [id: string]: Links },
  selectedNodes: [] as string[],
  selectedLinks: [] as string[]
};

let defaultApp = {
  current: {
    userId: "",
    openPdfs: [] as PdfPathInfo[],
    openQueries: [],
    visbleTabs: [],
    focusedElementId: ""
  },
  settings: {
    appearance: {
      windowStyleOnOpen: { x: 0, y: 0, width: 1000, height: 1000 },
      panels: {}
    },
    fileSystem: {
      pdfLibraryPath: ""
    },
    keyboardShortcuts: {}
  }
};
export const app = createModel({
  state: defaultApp
});

export const graph = createModel({
  state: defaultGraph,
  reducers: {
    addBatch(
      state,
      payload: {
        nodes?: Nodes[];
        links?: Links[];
      }
    ) {
      return produce(state, draft => {
        for (let key of Object.keys(payload)) {
          for (let item of payload[key]) {
            const isUnique = !state[key].hasOwnProperty(item.id);
            if (isUnique) {
              draft[key][item.id] = item;
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
        for (let key of Object.keys(payload)) {
          for (let id of payload[key]) {
            const exists = state[key].hasOwnProperty(id);
            if (exists) {
              delete draft[key][id];
            } else {
              console.log(id, " no such item to remove");
            }

            const selectedName =
              "selected" + key.charAt(0).toUpperCase() + key.slice(1);
            if (draft[selectedName].findIndex(id) >= 0) {
              // also remove from selected*
              delete draft[selectedName][id];
            }

            if (key === "nodes") {
              // also remove connected links
              Object.values(draft.links).forEach(link => {
                if ([link.source, link.target].includes(id)) {
                  delete draft.links[link.id];
                }
              });
            }
          }
        }
        return;
      });
    },
    updateData(
      state,
      payload: {
        nodes?: { id: string; data: {} }[];
        links?: { id: string; data: {} }[];
      }
    ) {
      // 400 items = 9ms, 300 items = 7ms
      return produce(state, draft => {
        for (let key of Object.keys(payload)) {
          for (let item of payload[key]) {
            const { id, data } = item;
            for (let upKey of Object.keys(data)) {
              draft[key][id].data[upKey] = data[upKey];
            }
          }
        }
      });
    },
    updateLink(
      state,
      payload: {
        id: string;
        source?: string;
        target?: string;
        undirected?: boolean;
      }
    ) {
      return produce(state, draft => {
        const exists = draft.links.hasOwnProperty(payload.id);
        if (exists) {
          draft.links[payload.id] = { ...draft.links[payload.id], ...payload };
        }
      });
    },
    toggleSelections(
      state,
      payload: {
        selectedNodes: string[];
        selectedLinks: string[];
      }
    ) {
      return produce(state, draft => {
        for (let key of Object.keys(payload)) {
          for (let id of payload[key]) {
            const ix = draft[key].findIndex(id);
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
    const saveIf = ["graph/addBatch", "graph/updateData"];
    const result = next(action);
    if (saveIf.includes(action.type)) {
      // todo add requestidealcallback if window
      jsonfile.writeFile("./state.json", store.getState()).then(err => {});
    }
    return result;
  }
};

const initializeStateFromJson = {
  async onStoreCreated(store) {
    try {
      const savedStore = await jsonfile.readFile("./state.json");
      return { ...store, ...savedStore };
    } catch (err) {
      console.log(err)
      
      return store;
    }
  }
};

const store = init({
  models,
  plugins: [logit, saveToJson, initializeStateFromJson]
});

export default store;
export const { dispatch, getState } = store;
export type iStore = typeof store;
export type iDispatch = typeof store.dispatch;
export type iRootState = RematchRootState<typeof models>;
