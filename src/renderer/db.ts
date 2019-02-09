// https://github.com/typicode/lowdb
// https://github.com/typicode/lodash-id
import low from "lowdb";
import fs = require("fs");
import os = require("os");
import path = require("path");
import { ls, listDirs } from "./io";
import lodashId = require("lodash-id");
import { withUid } from "./utils";

const initDb = async (path: string) => {
  const FileSync = require("lowdb/adapters/FileSync");
  const adapter = new FileSync(path.normalize());
  let db = await low(adapter);
  return db;
};

const makeViewbox = (viewBox = { left: 0, top: 0, height: 0, width: 0 }) => {
  return { ...viewBox };
};
type dbPaths = "viewBoxes";
const getById = (
  db: low.LowdbAsync<any>,
  id: string,
  dbPath = "viewBoxes" as dbPaths
) => {
  return db.get(dbPath).find({ id: id });
};

const test = async () => {
  // 20ms setup
  const db = await initDb("C:\\Users\\merha\\pdfs\\db.json");
  await db.defaults({ viewBoxes: [] }).write();
  await db.read();

  console.time("do stuff");
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

  console.timeEnd("do stuff");
};

test();
