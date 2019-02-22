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
  | "venue";

export interface NodeBase {
  id: string;
}

export interface Empty extends NodeBase {
  data: {};
}

interface LinkBase {
  id: string;
  data: {
    type: "unset" | "more" | "similar";
  };
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
  return {
    id: data.id,
    data
  } as PdfSegmentViewbox;
};

export type Nodes = PdfSegmentViewbox | Empty; // or...
export type Links = LinkBase; // or...
