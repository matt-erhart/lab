import { mergeDefaults } from "../renderer/utils";
import { number } from "prop-types";
import uuidv1 = require("uuid/v1");

export type NodeDataTypes =
  | "empty"
  | "userMedia.text" //
  | "userMedia.quote"
  | "userMedia.semanticUnit"
  | "pdf.segment.viewbox" //
  | "pdf.segment.textRange"
  | "pdf.publication" //
  | "user"
  | "person"
  | "venue"
  | "query" // queries have style overrides, combine subqueries to reuse, ooo
  | "projection/map/affinity/dimension/coordinates matter";

export interface NodeMeta {
  createdBy: string;
  timeCreated: number;
  timeUpdated: number;
  editors?: string[];
}

export interface NodeBase {
  id: string;
  data: {type: NodeDataTypes};
  style: Object;
  meta: NodeMeta;
}

export interface Empty extends NodeBase {
  data: {
    type: "empty";
  };
  style: {};
  meta: NodeMeta;
}

export interface PdfPathInfo {
  pdfPath: string;
  pdfName: string;
  dir: string;
}

const ViewboxDefault = {
  id: "",
  left: 0,
  top: 0,
  height: 0,
  width: 0,
  userId: "default",
  pdfDir: '',
  pageNumber: 0,
  type: "pdf.segment.viewbox" as NodeDataTypes
};
export type Viewbox = typeof ViewboxDefault;
export interface PdfSegmentViewbox extends NodeBase {
  data: Viewbox;
}
import { CircleConfig, LineConfig } from "konva";
export const makePdfSegmentViewbox = (
  viewbox = {} as Partial<Viewbox>,
  style = {} as Partial<CircleConfig>
) => {
  const data = mergeDefaults(ViewboxDefault, viewbox);
  const now = Date.now();
  return {
    id: data.id,
    data,
    style: {
      type: "circle",
      x: Math.random() * 200,
      y: Math.random() * 200,
      fill: "blue",
      draggabled: true,
      radius: 10,
      stroke: "blue",
      strokeWidth: 4
    } as Partial<CircleConfig>,
    meta: makeNodeMeta()
  } as PdfSegmentViewbox;
};

const makeNodeMeta = (meta = {}): NodeMeta => {
  // pass in existing meta to updatetime
  const now = Date.now();
  return {
    createdBy: "defaultUser",
    timeCreated: now,
    ...meta,
    timeUpdated: now
  };
};

const PdfPublicationDefaults = {
  id: "",
  data: {
    type: "pdf.publication" as NodeDataTypes,
    publicationType: "", // Journal Article, Conference proceedings, book
    pdfDir: "sameAsId",
    fileExt: ".pdf", // saveAsId.pdf
    title: "",
    venue: "",
    authors: [] as string[],
    year: NaN as number,
    volume: "" as string | number,
    issue: "" as string | number,
    url: "",
    arxivId: "",
    pmid: "",
    doi: "",
    isbn: "",
    issn: "",
    published: true
  },
  style: {
    id: "",
    x: Math.random() * 200,
    y: Math.random() * 200,
    fill: "grey",
    stroke: "red"
  },
  meta: makeNodeMeta()
};
export type PdfPublication = typeof PdfPublicationDefaults

export const makePdfPublication = (dirName: string, data = {}) => {
  return {
    ...PdfPublicationDefaults,
    id: dirName,
    data: { ...PdfPublicationDefaults.data, ...data }
  };
};

interface LinkBase {
  id: string;
  data: {
    type: "unset" | "more" | "similar";
  };
  style: {};
  meta: NodeMeta;
  source: string;
  target: string;
  undirected: boolean;
}

const LinkDefaults = {
  id: "",
  data: { type: "unset" },
  style: {
    id: "",
    points: [10, 10, 20, 20],
    stroke: "black",
    strokeWidth: 3,
    opacity: 0.5,
    fill: "black"
  } as Partial<LineConfig>,
  meta: makeNodeMeta(),
  source: "",
  target: "",
  undirected: true
};

export const makeLink = (sourceNode: Nodes, targetNode: Nodes) => {
  const { x: x1, y: y1 } = sourceNode.style as CircleConfig;
  const { x: x2, y: y2 } = targetNode.style as CircleConfig;
  const id = uuidv1();
  return {
    ...LinkDefaults,
    id,
    source: sourceNode.id,
    target: targetNode.id,
    style: { ...LinkDefaults.style, id, points: [x1, y1, x2, y2] }
  };
};
export type aNode = PdfSegmentViewbox | Empty;
export type aLink = LinkBase;
export type Nodes = { [id: string]: aNode }; // or...
export type Links = { [id: string]: aLink }; // or...
