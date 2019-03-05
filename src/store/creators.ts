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
  data: { type: NodeDataTypes };
  style: {x: number, y: number};
  meta: NodeMeta;
}

export interface Empty extends NodeBase {
  data: {
    type: "empty";
  };
  meta: NodeMeta;
}

export interface PdfPathInfo {
  pdfPath: string;
  pdfName: string;
  dir: string;
}

const ViewboxDataDefault = {
  left: 0,
  top: 0,
  height: 0,
  width: 0,
  userId: "default",
  pdfDir: "",
  pageNumber: 0,
  type: "pdf.segment.viewbox" as NodeDataTypes,
  scale: 1
};
export type ViewboxData = typeof ViewboxDataDefault;
export interface PdfSegmentViewbox extends NodeBase {
  data: ViewboxData;
}
import { CircleConfig, LineConfig } from "konva";
export const makePdfSegmentViewbox = (
  viewbox = {} as Partial<ViewboxData>,
  style = {} as Partial<CircleConfig>
) => {
  const now = Date.now();
  const id = uuidv1()
  console.log({...ViewboxDataDefault, ...viewbox})
  
  return {
    id: id,
    data: {...ViewboxDataDefault, ...viewbox},
    style: {
      id: id,
      type: "circle",
      x: Math.random() * 200 + 20,
      y: Math.random() * 200 + 20,
      fill: "blue",
      draggabled: true,
      radius: 5,
      stroke: "blue",
      strokeWidth: 4,
      ...style
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
    x: Math.random() * 200 + 20,
    y: Math.random() * 200 + 20,
    fill: "grey",
    stroke: "red"
  },
  meta: makeNodeMeta()
};
export type PdfPublication = typeof PdfPublicationDefaults;

export const makePdfPublication = (dirName: string, data = {}, style = {}) => {  
  return {
    ...PdfPublicationDefaults,
    id: dirName,
    data: { ...PdfPublicationDefaults.data, ...data },
    style: { ...PdfPublicationDefaults.style, ...style, id: dirName }
  };
};

export interface LinkBase {
  id: string;
  data: {
    type: "unset" | "more" | "similar" | string;
  };
  style: {};
  meta: NodeMeta;
  source: string;
  target: string;
  undirected: boolean;
}

const LinkDefaults = {
  id: "",
  data: { type: "" },
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

export const makeLink = (sourceNode: aNode, targetNode: aNode, data ={}) => {
  const { x: x1, y: y1 } = sourceNode.style as Partial<CircleConfig>;
  const { x: x2, y: y2 } = targetNode.style as Partial<CircleConfig>;
  const id = uuidv1();
  return {
    ...LinkDefaults,
    id,
    source: sourceNode.id,
    target: targetNode.id,
    style: { ...LinkDefaults.style, id, points: [x1, y1, x2, y2] },
    data: {...LinkDefaults.data, ...data}
  };
};

const UserMediaTextDefaults = {
  id: "",
  data: {type: 'userMedia.text', text: ''},
  meta: makeNodeMeta(),
  style: {
    id: "",
    x: 0,
    y: 0,
    stroke: 'black',
    fill: "black"
  } as Partial<LineConfig>,
}
export type UserMediaText = typeof UserMediaTextDefaults
export const makeUserMediaText = (text='', style={}) => {
  const id = uuidv1();
  return {
    ...UserMediaTextDefaults,
    id,
    data: {...UserMediaTextDefaults.data, text},
    style: {...UserMediaTextDefaults.style, ...style, id}
  }
}

export type aNode = PdfSegmentViewbox | Empty | UserMediaText
export type aLink = LinkBase;
export type Nodes = { [id: string]: aNode }; // or...
export type Links = { [id: string]: aLink }; // or...
