import fs = require("fs-extra");
import os = require("os");
import path = require("path");
import glob = require("glob");
import uuidv1 = require("uuid/v1");
import jsonfile = require("jsonfile");
import * as _pdfjs from "pdfjs-dist";
var PdfjsWorker = require("pdfjs-dist/lib/pdf.worker.js");
if (typeof window !== "undefined" && "Worker" in window) {
  (_pdfjs as any).GlobalWorkerOptions.workerPort = new PdfjsWorker();
}
import {
  PDFJSStatic,
  PDFDocumentProxy,
  PDFInfo,
  PDFMetadata,
  PDFTreeNode
} from "pdfjs-dist";
const pdfjs: PDFJSStatic = _pdfjs as any;

interface FileInfo {
  pdfPath: string;
  pdfName: string;
  dataDir: string;
}

export const listPdfs = (fullPath: string): Promise<FileInfo[]> =>
  new Promise(resolve => {
    glob(fullPath + "/*.pdf", { nodir: true }, (err, files) => {
      const fileInfo = files.map(f => {
        return {
          pdfPath: f,
          pdfName: path.basename(f),
          dataDir: f.replace(".pdf", "")
        };
      });
      resolve(fileInfo);
    });
  });

export const listDirs = (fullpath: string): Promise<string[]> => {
  return new Promise(resolve => {
    glob(fullpath + "/*/", {}, (err, files) => {
      resolve(files);
    });
  });
};

export const ls = (fullpath: string, options = {}): Promise<string[]> => {
  return new Promise(resolve => {
    glob(fullpath, options, (err, files) => {
      resolve(files);
    });
  });
};

export const setupDirFromPdfs = async () => {
  const { homedir, username } = os.userInfo();
  const pdfDir = path.join(homedir, "pdfs");
  const infos = await listPdfs(pdfDir);

  for (let info of infos) {
    const dirExists = fs.pathExists(info.dataDir);
    const postFix = dirExists ? "_" + uuidv1() : "";
    const dataDir = dirExists ? info.dataDir + postFix : info.dataDir;
    await fs.ensureDir(dataDir);
    await fs.move(
      info.pdfPath,
      path.join(dataDir, info.pdfName.replace(".pdf", postFix + ".pdf"))
    );
  }

  const dirs = await listDirs(pdfDir);
  await preprocessPdfs(dirs);
};

setupDirFromPdfs();

const existsElseMake = async (path, promise) => {
  const fileExists = await fs.pathExists(path);
  if (!fileExists) {
    const data = await promise;
    await jsonfile.writeFile(path, data);
  }
};

const preprocessPdfs = async (pdfDirs: string[]) => {
  console.time("time");
  const scale = 1;
  

  //   const dir = pdfDirs[0];
  for (let dir of pdfDirs) {
    const files = await ls(dir + "/*");
    const [pdfPath] = files.filter(x => x.endsWith(".pdf"));
    const pdf = await pdfjs.getDocument(pdfPath);
    const allPageNumbers = [...Array(pdf.numPages).keys()].map(x => x + 1);

    await existsElseMake(path.join(dir, "meta.json"), pdf.getMetadata());
    await existsElseMake(path.join(dir, "outline.json"), pdf.getOutline());

    for (const pageNumber of allPageNumbers) {
      const outFile = path.join(dir, `text-page${pageNumber}.json`);
      const fileExists = await fs.pathExists(outFile);
      if (!fileExists) {
        const page = await pdf.getPage(pageNumber);
        const text = await page.getTextContent();
        await jsonfile.writeFile(outFile, text);
      }
    }
  }

  console.timeEnd("time");
};

const loadPdfJson = async () => {
  //   let loopState = [];
  //   for (let jsonFile of files.filter(x => x.endsWith(".json"))) {
  //     const next = jsonfile.readFile(jsonFile);
  //     loopState.push(next);
  //   }
  //   const json = await Promise.all(loopState);
};
