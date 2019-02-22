import { init, RematchRootState, createModel } from "@rematch/core";
import produce from "immer";
import { withUid } from "../renderer/utils";
import { PdfPathInfo } from "../store/createStore";
const pino = require("pino");
const logger = pino({ base: null }, "./patches.log"); //142k default, 700k extreme
// logger.info({ patch: { b: 1 } });
import { Nodes, Links } from "./creators";
import { node } from "prop-types";
import { linkSync } from "fs";

const defaultApp = {
  userId: "default",
  pdfPathInfo: {} as PdfPathInfo,
  nodes: {} as { [id: string]: Nodes },
  links: {} as { [id: string]: Links },
  selectedNodes: [] as string[],
  selectedLinks: [] as string[]
};

export const app = createModel({
  state: defaultApp,
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
              console.log(item, "already exists. maybe you want update");
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
        nodes: { id: string; data: {} }[];
        links: { id: string; data: {} }[];
      }
    ) {
      return produce(state, draft => {
        for (let key of Object.keys(payload)) {
          for (let item of payload[key]) {
            const { id, data } = item;
            draft[key][id].data = {
              ...draft[key][id].data,
              ...data
            };
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
            const ix = draft[key].findIndex(id)
            if (ix > -1) {
              draft[key].splice(ix,1)
            } else {
              draft[key].push(id)
            }
          }
        }
      });
    },
  }
});

const models = {
  app
};

const store = init({
  models
});

export default store;
export const { dispatch, getState } = store;
export type iStore = typeof store;
export type iDispatch = typeof store.dispatch;
export type iRootState = RematchRootState<typeof models>;
