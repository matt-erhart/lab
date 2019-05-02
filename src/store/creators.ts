// lib
import uuidv1 = require("uuid/v1");
import fs = require("fs-extra");
import path = require("path");
import convertBase64 from "slate-base64-serializer";

// custom
import { Box } from "../renderer/utils";

export type NodeDataTypes =
  | "empty"
  | "user"
  | "userDoc" // document made by user after writing
  | "pdf.segment.viewbox" //
  | "pdf.segment.text"
  | "pdf.publication" //
  | "person"
  | "venue"
  | "query" // queries have style overrides, combine subqueries to reuse, ooo
  | "projection/map/affinity/dimension/coordinates matter"
  | "autograb";

type corners = "nw" | "ne" | "sw" | "se"; // north, south, west, east
type modes = "min" | "max";

export interface PdfPathInfo {
  pdfPath: string;
  pdfName: string;
  dir: string;
}
const clampLeftTop = obj => {
  return {
    ...obj,
    left: obj.left < 1 ? 1 : obj.left,
    top: obj.top < 1 ? 1 : obj.top
  };
};
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
export interface PdfSegmentViewbox {
  data: ViewboxData;
  style: {};
}
import { CircleConfig, LineConfig } from "konva";
import console = require("console");
import { fstat } from "fs-extra";
import { Editor } from "slate-react";
import { initKeySafeSlate } from "../renderer/EditorUtils";
export const makePdfSegmentViewbox = (
  viewbox = {} as Partial<ViewboxData>,
  style = {}
) => {
  const now = Date.now();
  const id = uuidv1();
  const { width, height } = viewbox;
  const _style = {
    id: id,
    left: Math.random() * 200 + 20,
    top: Math.random() * 200 + 20
  };
  return {
    id: id,
    data: { ...ViewboxDataDefault, ...viewbox },
    style: {
      min: clampLeftTop({ ..._style, ...style, width: 220, height: 60 }),
      max: clampLeftTop({
        ..._style,
        ...style,
        width: width + 100,
        height: height + 100
      }),
      modes: ["min", "max"],
      modeIx: 0,
      lockedCorner: "nw"
    },
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
    left: Math.random() * 200 + 20,
    top: Math.random() * 200 + 20,
    width: 200,
    height: 200,
    fill: "grey",
    stroke: "red",
    modes: ["min", "max"],
    modeIx: 0,
    lockedCorner: "nw"
  },
  meta: makeNodeMeta()
};
export type PdfPublication = typeof PdfPublicationDefaults;

export const makePdfPublication = (dirName: string, data = {}, style = {}) => {
  return {
    ...PdfPublicationDefaults,
    id: dirName,
    data: { ...PdfPublicationDefaults.data, ...data },
    style: clampLeftTop({
      ...PdfPublicationDefaults.style,
      ...style,
      id: dirName
    })
  };
};

const AutoGrabDefaults = {
  id: "",
  data: {
    type: "autograb" as NodeDataTypes
  },
  style: {
    id: "",
    left: Math.random() * 200 + 20,
    top: Math.random() * 200 + 20,
    width: 200,
    height: 200,
    fill: "grey",
    stroke: "red",
    modes: ["min", "max"],
    modeIx: 0,
    lockedCorner: "nw"
  },
  meta: makeNodeMeta()
};

export type AutoGrab = typeof AutoGrabDefaults;

export const makeAutograbNode = (
  fulldirName: string,
  dataPath: string, //"metadataToHighlight.json",
  nodeSuffix: string, //"-autograb"
  style = {}
) => {
  // console.log("inside makeAutoGrabNode " + fulldirName);
  const metadataToHighlight = JSON.parse(
    fs.readFileSync(fulldirName + dataPath).toString()
  );

  const normDir = path.normalize(fulldirName);
  const pathParts = normDir.split(path.sep);
  const fileName = pathParts[pathParts.length - 1];
  const pdfDir = fileName === "" ? pathParts[pathParts.length - 2] : fileName;

  return {
    ...AutoGrabDefaults,
    id: pdfDir + nodeSuffix,
    data: { ...AutoGrabDefaults.data, ...metadataToHighlight }, // deserialize metadataToHighlight data
    style: clampLeftTop({
      ...AutoGrabDefaults.style,
      ...style,
      id: pdfDir + "-autograb"
    })
  };
};

const LinkDefaults = {
  id: "",
  data: { text: "", html: "" },
  style: {
    stroke: "lightgrey"
  },
  meta: makeNodeMeta(),
  source: "",
  target: "",
  isDirected: true
};

export type LinkBase = typeof LinkDefaults;

export const makeLink = (sourceId: string, targetId: string, data = {}) => {
  const id = "link-" + uuidv1();
  return {
    ...LinkDefaults,
    id,
    source: sourceId,
    target: targetId,
    style: { ...LinkDefaults.style },
    data: { ...LinkDefaults.data, ...data }
  };
};

const defaultUserDocBox = {
  left: 0,
  top: 0,
  width: 300,
  height: 110
};
const UserDocDefaults = {
  id: "",
  data: {
    type: "userDoc" as NodeDataTypes,
    base64: convertBase64.serialize(initKeySafeSlate()),
    text: "",
    useTextForAutocomplete: true
  },
  meta: makeNodeMeta(),
  style: {
    min: clampLeftTop({ ...defaultUserDocBox, width: 300, height: 110 }),
    max: clampLeftTop(defaultUserDocBox),
    modes: ["max", "min"],
    modeIx: 0,
    lockedCorner: "nw",
    fontSize: 26
  }
};
export type UserDoc = typeof UserDocDefaults;
export const makeUserDoc = (
  props = { data: {}, style: { min: {}, max: {} } }
) => {
  const data = { ...props.data };
  const id = uuidv1();
  return {
    ...UserDocDefaults,
    id,
    data: { ...UserDocDefaults.data, ...data },
    style: {
      ...UserDocDefaults.style,
      min: clampLeftTop({ ...UserDocDefaults.style.min, ...props.style.min }),
      max: clampLeftTop({ ...UserDocDefaults.style.max, ...props.style.max })
    }
  };
};


export type NodeData = {
  id: string;
} & Partial<
  UserDoc["data"] & PdfPublication["data"] & PdfSegmentViewbox["data"]
>;

export type NodeStyle = {
  id: string;
} & Partial<
  UserDoc["style"] & PdfPublication["style"] & PdfSegmentViewbox["style"]
>;

export interface NodeMeta {
  createdBy: string;
  timeCreated: number;
  timeUpdated: number;
  editors?: string[];
}

export interface NodeBase {
  id: string;
  data: NodeData;
  style: NodeStyle;
  meta: NodeMeta;
}

export type aNode = PdfSegmentViewbox | PdfPublication | AutoGrab;
export type aLink = LinkBase;
export type Nodes = { [id: string]: NodeBase }; // or...
export type Links = { [id: string]: aLink }; // or...
