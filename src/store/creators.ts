import { mergeDefaults } from "../renderer/utils";
import { number } from "prop-types";
import uuidv1 = require("uuid/v1");
import fs = require("fs-extra");
import path = require("path");
import Plain from "slate-plain-serializer";
import convertBase64 from "slate-base64-serializer";

export type NodeDataTypes =
  | "empty"
  | "userDoc" // document made by user after writing
  | "pdf.segment.viewbox" //
  | "pdf.segment.text"
  | "pdf.publication" //
  | "user"
  | "person"
  | "venue"
  | "query" // queries have style overrides, combine subqueries to reuse, ooo
  | "projection/map/affinity/dimension/coordinates matter"
  | "autograb";

export interface NodeMeta {
  createdBy: string;
  timeCreated: number;
  timeUpdated: number;
  editors?: string[];
}

import { Box } from "../renderer/utils";
type corners = "nw" | "ne" | "sw" | "se";
type modes = "min" | "max";
export interface NodeBase {
  id: string;
  data: { type: NodeDataTypes };
  style: {
    min: Box;
    max: Box;
    modes: modes[];
    modeIx: 0;
    lockedCorner: corners;
  };
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
      min: { ..._style, ...style, width: 220, height: 60 },
      max: { ..._style, ...style, width: width + 100, height: height + 100 },
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
    style: { ...PdfPublicationDefaults.style, ...style, id: dirName }
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
  data = {},
  style = {}
) => {
  // console.log("inside makeAutoGrabNode " + fulldirName);
  const metadataToHighlight = JSON.parse(
    fs.readFileSync(fulldirName + "metadataToHighlight.json").toString()
  );

  const normDir = path.normalize(fulldirName);
  const pathParts = normDir.split(path.sep);
  const fileName = pathParts[pathParts.length - 1];
  const pdfDir = fileName === "" ? pathParts[pathParts.length - 2] : fileName;

  return {
    ...AutoGrabDefaults,
    id: pdfDir + "-autograb",
    data: { ...AutoGrabDefaults.data, ...metadataToHighlight }, // deserialize metadataToHighlight data
    style: { ...AutoGrabDefaults.style, ...style, id: pdfDir + "-autograb" }
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
    min: { ...defaultUserDocBox, width: 300, height: 110 },
    max: defaultUserDocBox,
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
      min: { ...UserDocDefaults.style.min, ...props.style.min },
      max: { ...UserDocDefaults.style.max, ...props.style.max }
    }
  };
};

export type aNode = PdfSegmentViewbox | Empty | PdfPublication | AutoGrab;
export type aLink = LinkBase;
export type Nodes = { [id: string]: aNode }; // or...
export type Links = { [id: string]: aLink }; // or...
