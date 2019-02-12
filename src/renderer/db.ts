// https://github.com/typicode/lowdb
// https://github.com/typicode/lodash-id
import low from "lowdb";
import fs = require("fs");
import os = require("os");
import path = require("path");
import { ls, listDirs } from "./io";
import lodashId = require("lodash-id");
import { withUid } from "./utils";
import { spawn } from "child_process";

const initDb = async (path: string) => {
  const FileSync = require("lowdb/adapters/FileSync");
  const adapter = new FileSync(path.normalize());
  let db = await low(adapter);
  return db;
};

type dbPaths = "viewBoxes";
const getById = (
  db: low.LowdbAsync<any>,
  id: string,
  dbPath = "viewBoxes" as dbPaths
) => {
  return db.get(dbPath).find({ id: id });
};

const lowExamples = async () => {
  // 20ms setup
  const db = await initDb("C:\\Users\\merha\\pdfs\\db.json");
  await db.defaults({ viewBoxes: [] }).write();
  await db.read();

  // 1.5ms write
  const newVb = withUid(makeViewbox());
  const vb = await db
    .get("viewBoxes")
    .push(newVb)
    .write();

  let post = getById(db, "aa565760-2c03-11e9-845d-ad518f25e251");
  db.get("viewBoxes")
    .remove({ id: "aa565760-2c03-11e9-845d-ad518f25e251" })
    .write();
  post.assign({ left: "11111" }).write();
  post.assign({ height: 123 }).write();

  db.write();
};

type SourceTypes = "pdf";
type NodeTypes =
  | "userDoc/plain"
  | "userDoc/quote"
  | "userDoc/unit"
  | "viewbox/pdf"
  | "textRange/pdf"
  | "publication/pdf"
  | "user"
  | "venue";

  const ViewboxDefault = {
    id: "",
    left: 0,
    top: 0,
    height: 0,
    width: 0,
    type: "viewbox/pdf" as NodeTypes,
    userId: "default",
    pdfPathInfo: {} as  PdfPathInfo,
    pageNumber: 0
  };

export type Viewbox = typeof ViewboxDefault;
export const makeViewbox = (viewbox = {} as Partial<Viewbox>) => {
  const key = withUid("viewbox").id;
  const vb = {
    key,
    attributes: {
      ...ViewboxDefault,
      id: key,
      ...viewbox
    } as Viewbox
  };
  return vb
};

const UserDefault = { id: "", name: "default" };
type User = typeof UserDefault;
const makeUser = (user = {} as Partial<User>) => {
  return {
    ...UserDefault,
    id: withUid("user").id,
    ...user
  };
};

const PublicationDefault = {
  id: "",
  title: "default",
  format: "pdf" as "pdf" | "html",
  idType: "" as "doi" | "random" | "isbn"
};
type Publication = typeof PublicationDefault;
const makePublication = (publication = {} as Partial<Publication>) => {
  // todo get id from pdf for cross user merging
  return { ...PublicationDefault, id: withUid("pub").id, ...publication };
};

// todo create span for each unique linkids combo
const TextEntityDefault = {
  // text entity can link to anything
  // can contain text entities
  // can be inserted into docs with autocomplete
  // either get all or non of the text
  id: "",
  type: "textEntity" as NodeTypes,
  text: "",
  spans: "" // serialized slate doc?
};

type TextEntity = typeof TextEntityDefault;
const makeTextEntity = (textEntity = {} as Partial<TextEntity>) => {
  // todo get id from pdf for cross user merging
  return { ...TextEntityDefault, id: withUid("textEntity").id, ...textEntity };
};

// todo on make textRange either just hightlight or also create a textEntity
const TextRangeDefault = {
  // ranges are in immutable docs like publications
  // we point to a start node / charNum - end node / char num
  // and it's always there
  id: "",
  range: {} as Range,
  type: "textRange" as NodeTypes,
  text: "",
  source: {
    type: "pdf",
    userId: "default",
    pubId: "default",
    pageNumber: 0
  } as any
};

type TextRange = typeof TextRangeDefault;
const makeTextRange = (textRange = {} as Partial<TextRange>) => {
  // todo get id from pdf for cross user merging
  return { ...TextEntityDefault, id: withUid("textRange").id, ...textRange };
};

const test = () => {
  console.time("do stuff");
  graph.on("nodeAdded", ({ key }) => {
    console.log(key);
  });
  // const graph = new Graph({ multi: true });

  const user = makeUser();
  graph.addNode(user.id, user);

  const pub = makePublication();
  graph.addNode(pub.id, pub);

  const vb = makeViewbox({ top: 123 });
  graph.addNode(vb.id, vb);
  graph.addEdge(user.id, vb.id, { type: "createdBy" });
  graph.addEdge(pub.id, vb.id, { type: "createdIn" });

  const vb2 = makeViewbox({ left: 10 });
  graph.addNode(vb2.id, vb2);
  graph.addEdge(user.id, vb2.id, { type: "createdBy" });
  graph.addEdge(pub.id, vb2.id, { type: "createdIn" });

  const pub2 = makePublication({ title: "a pub title" });
  graph.addNode(pub2.id, pub2);
  graph.addEdge(user.id, vb2.id, { type: "createdBy" });

  const textRange = makeTextRange();
  graph.addNode(textRange.id, textRange);

  const textEnt = makeTextEntity();
  graph.addNode(textEnt.id, textEnt);
  graph.addEdge(user.id, textEnt.id, { type: "createdBy" });

  if (textRange.text.length > textRange.text.length) {
    graph.addEdge(textEnt.id, textRange.id, { type: "more" });
  } else if (textRange.text.length === textRange.text.length) {
    graph.addEdge(textEnt.id, textRange.id, { type: "similar" });
  } else {
    // note order flipped
    graph.addEdge(textRange.id, textEnt.id, { type: "more" });
  }

  let count = 0;

  // graph.forEachEdge((edge, attr) => {
  //   console.log(edge, attr, count++);
  // });

  // graph.forEachNode((node, attr) => {
  //   console.log(node, attr, count++);
  // });

  // // With options:
  console.timeEnd("do stuff");
  // console.log(graph.inspect());
};
/*
user, pub, venue, ent, range, viewbox
*/

