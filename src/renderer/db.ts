// https://github.com/typicode/lowdb
// https://github.com/typicode/lodash-id
// todo delete this file
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