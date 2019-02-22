import { mergeDefaults } from "../renderer/utils";

export type NodeDataTypes =
  | "empty"
  | "userMedia.text"
  | "userMedia.quote"
  | "userMedia.semanticUnit"
  | "pdf.segment.viewbox"
  | "pdf.segment.textRange"
  | "pdf.publication"
  | "user"
  | "person"
  | "venue"
  | "query" // queries have style overrides, combine subqueries to reuse, oop
  | "projection/map/affinity/dimension/coordinates matter";

export interface NodeMeta {
  createdBy: string;
  timeCreated: number;
  timeUpdated: number;
  editors?: string[]
}

export interface NodeBase {
  id: string;
  data: Object;
  style: Object;
  meta: NodeMeta;
}

export interface Empty extends NodeBase {
  data: {};
  style: {};
  meta: NodeMeta;
}

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
  pdfPathInfo: {} as PdfPathInfo,
  pageNumber: 0,
  type: "pdf.segment.viewbox" as NodeDataTypes
};
export type Viewbox = typeof ViewboxDefault;
export interface PdfSegmentViewbox extends NodeBase {
  data: Viewbox;
}
export const makePdfSegmentViewbox = (viewbox = {} as Partial<Viewbox>) => {
  const data = mergeDefaults(ViewboxDefault, viewbox);
  const now = Date.now()
  return {
    id: data.id,
    data,
    style: {},
    meta: {
      createdBy: "defaultUserId",
      timeCreated: now,
      timeUpdated: now
    } as NodeMeta
  } as PdfSegmentViewbox;
};

export type Nodes = PdfSegmentViewbox | Empty; // or...
export type Links = LinkBase; // or...
