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
console.log('+++++++++++++++++++++++++++++++++++++++')

import {
  PDFJSStatic,
  PDFDocumentProxy,
  PDFInfo,
  PDFMetadata,
  PDFTreeNode
} from "pdfjs-dist";
const pdfjs: PDFJSStatic = _pdfjs as any;

import {
  flatten,
  zeroPad,
  unique,
  brewer12,
  roundedToFixed,
  sortBy
} from "./utils";

import { histogram, mean, median, deviation } from "d3-array";
import console = require("console");
import axios from "axios";

interface FileInfo {
  fullFilePath: string;
  fileNameWithExt: string;
}
// todo no spaces for pdfdirs

export const listPdfs = (fullPath: string): Promise<FileInfo[]> =>
  new Promise(resolve => {
    glob(fullPath + "/*.pdf", { nodir: true }, (err, files) => {
      const fileInfo = files.map(f => {
        return {
          fullFilePath: f,
          fileNameWithExt: path.basename(f)
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

export const setupDirFromPdfs = async (pdfRootDir = "") => {
  // let pdfDir;
  // if (pdfDirPath.length === 0) {
  //   const { homedir, username } = os.userInfo();
  //   pdfDir = path.join(homedir, "pdfs");
  // } else {
  //   pdfDir = pdfDirPath;
  // }

  const pdfPathInfo = await listPdfs(pdfRootDir);

  for (let info of pdfPathInfo) {
    let neededDir = info.fileNameWithExt
      .replace(/\.pdf/, "")
      .replace(/\s/g, "-")
      .replace(/%/g, "-");
    let dirNameExists;
    let count = 0;
    let dataDir;

    do {
      count++;
      dirNameExists = await fs.pathExists(path.join(pdfRootDir, neededDir));
      const postFix = dirNameExists ? "_" + count : "";
      neededDir = dirNameExists ? neededDir + postFix : neededDir;
      console.log(neededDir);

      if (count > 100) debugger;
    } while (dirNameExists);

    await fs.ensureDir(path.join(pdfRootDir, neededDir));
    await fs.move(
      info.fullFilePath,
      path.join(pdfRootDir, neededDir, neededDir + ".pdf")
    );
  }

  const dirs = await listDirs(pdfRootDir);
  await preprocessPdfs(dirs)();
  return dirs;
};

export const existsElseMake = async (
  path: string,
  promise: _pdfjs.PDFPromise<any> | Promise<any> | {},
  overwrite = false
) => {
  const fileExists = await fs.pathExists(path);

  if (!fileExists || overwrite) {
    console.log("making ", path);
    const data = await promise;
    await jsonfile.writeFile(path, data);
    return true;
  } else {
    return false;
  }
};

export const createAutoGrabInfo = async (
  pages: any[], // textToDisplay Pages
  path: string,
  pdf: any, // to be deleted, not necessary
  overwrite = false
) => {
  // TODO (Xin): here we grab info for the pdf from calling python service
  console.log("Inside createAutoGrabInfo, reading pages[0] in below");
  // const obj = JSON.parse(fs.readFileSync("file", "utf8"));
  // console.log(obj);

  // Sending and grabbing data from python Flask API, using axios
  // https://www.andreasreiterer.at/connect-react-app-rest-api/
  // test API as this one: https://jsonplaceholder.typicode.com/users

  // (test code, to delete later) Post PDF data to local or remote python service
  axios
    .post("http://localhost:5000/empdb/employee", {
      // TODO: change to remote URL instead
      id: "666",
      title: "Technical Leader 2",
      name: "Sriram H Duoduo"
    })
    .then(function(response) {
      console.log(response);
    })
    .catch(function(error) {
      console.log(error);
    });

  // (test code, to delete later) Receive auto-grab data to render
  axios
    .get("http://localhost:5000/empdb/employee/666")
    .then(employeeResult => {
      console.log(
        "Test data being received by reciving the 666 employee data again"
      );
      console.log(employeeResult);
    })
    .catch(error => console.log(error));

  // Auto-grab from local python Flask service, code in ../../python-service/hello.py
  let autoGrabDetails = {};
  await axios
    .post("http://localhost:5000/autograb/pdfdata", { pages })
    .then(result => {
      autoGrabDetails = result;
    })
    .catch(error => {
      console.log(error);

      //Fake data if service request failed ...
      autoGrabDetails = {
        note:
          "Below are a list of (key, value) for metadata.Each key is the metadata type, the value is a list of top-scored sentences for that metadata type. These sentences were parsed and concatenated with an external tool (spacy). ",
        participant_detail: [
          {
            text:
              "We interviewed industry researchers with academic training, who shared how they have used academic research to inform their work.",
            score: 0.9181269407272339
          },
          {
            text:
              "In the second interview stage, we broadened recruiting criteria and interviewed 37 participants engaged in HCI-related research and practice fields.",
            score: 0.8893097639083862
          }
        ]
      };
    });

  // Test visiting an arbitrary existing web service ...
  // axios
  //   .get('https://jsonplaceholder.typicode.com/users')
  //   .then(response => {
  //     // create an array of contacts only with relevant data
  //     const newContacts = response.data.map(c => {
  //       return {
  //         id: c.id,
  //         name: c.name
  //       };
  //     });
  //     // create a new "State" object without mutating
  //     // the original State object.
  //     console.log("Reading jsonplaceholder.typicode.com/users: newContacts")
  //     console.log(newContacts)
  //     // store the new state object in the component's state
  //     // this.setState(newState);
  //   })
  //   .catch(error => console.log(error));

  // console.log(pages[0])
  // const emptyJSON = {"hello":"world"}; // TODO
  const fileExists = await fs.pathExists(path);

  if (!fileExists || overwrite) {
    console.log("making ", path);
    // const data = await promise;
    await jsonfile.writeFile(path, autoGrabDetails);
    return true;
  } else {
    return false;
  }
};

export const preprocessPdfs = (
  pdfDirs: string[],
  overwrite = false
) => async () => {
  // todo return new pdf nodes from this function
  console.log("preprocessing pdfs");
  // console.time("time");
  const scale = 1;
  //   const dir = pdfDirs[0];
  for (let dir of pdfDirs) {
    const files = await ls(dir + "/*");
    const [pdfPath] = files.filter(x => x.endsWith(".pdf"));
    let pdf;
    try {
      var data = new Uint8Array(fs.readFileSync(pdfPath));
      pdf = await pdfjs.getDocument({ data });
      // pdf = await pdfjs.getDocument(pdfPath);
    } catch (err) {
      console.log(err);
      debugger;
    }
    const allPageNumbers = [...Array(pdf.numPages).keys()].map(x => x + 1);

    await existsElseMake(
      path.join(dir, "meta.json"),
      pdf.getMetadata(), // API defined in https://github.com/mozilla/pdf.js/blob/2a9d195a4350d75e01fafb2c19194b7d02d0a0a5/src/display/api.js#L737
      overwrite
    );

    await existsElseMake(
      path.join(dir, "outline.json"),
      pdf.getOutline(),
      overwrite
    );

    for (const pageNumber of allPageNumbers) {
      const pageId = zeroPad(pageNumber, 4);
      // console.log(pageNumber)

      const textToDisplayFile = path.join(
        dir,
        `textToDisplay-page${pageId}.json`
      );

      const fileExists = await fs.pathExists(textToDisplayFile);

      if (!fileExists || overwrite) {
        const page = await pdf.getPage(pageNumber);
        const viewport = page.getViewport(scale);
        const text = await page.getTextContent();

        const [xMin, yMin, xMax, yMax] = (viewport as any).viewBox;
        const { width, height } = viewport;
        const textToDisplay = await Promise.all(
          text.items.map(async (tc, i) => {
            const fontData = await (page as any).commonObjs.ensureObj(
              tc.fontName
            );

            const [, , , offsetY, x, y] = tc.transform;
            const top = yMax - (y + offsetY);
            const left = x - xMin;
            const fontHeight = tc.transform[3];

            return {
              ...tc,
              id: pageId + "-" + zeroPad(i, 4),
              top: top * scale,
              left: left * scale,
              width: tc.width * scale,
              height: tc.height * scale,
              fontHeight: tc.transform[3],
              fontWidth: tc.transform[0],
              scaleX: tc.transform[0] / tc.transform[3],
              fallbackFontName: fontData.data
                ? fontData.data.fallbackName
                : "sans-serif",
              style: text.styles[tc.fontName]
            };
          })
        );

        await jsonfile.writeFile(textToDisplayFile, {
          pageNumber,
          text: textToDisplay,
          // maybe use this to detect rotation?
          viewportFlat: { width, height, xMin, yMin, xMax, yMax }
        });
        console.log("making ", textToDisplayFile);
      }
    }
    // use this to know if processing is done
    await existsElseMake(path.join(dir, "textToDisplay.json"), {
      numberOfPages: pdf.numPages,
      createdOn: new Date()
    });

    let pagesOfText = await loadPageJson(dir, "textToDisplay");

    // TODO (Xin): after parsing per-page textToDisplay from PDF pages,
    // auto-grab info from the pdf, including two steps:
    // 1) API communication to python
    // and 2) write to "metadataToHighlight.json"
    await createAutoGrabInfo(
      pagesOfText,
      path.join(dir, "metadataToHighlight.json"),
      pdf,
      true //TODO (Xin) later, change to variable overwrite
    );

    const columnLefts = getLeftEdgeOfColumns(pagesOfText);
    await existsElseMake(path.join(dir, `columnLefts.json`), columnLefts);

    for (let page of pagesOfText) {
      const pageId = zeroPad(page.pageNumber, 4);
      await existsElseMake(
        path.join(dir, `linesOfText-page${pageId}.json`),
        getLines(columnLefts, page.text, page.pageNumber)
      );

      // also add a blank file to save user segments
      await existsElseMake(path.join(dir, `userSegments-page${pageId}.json`), {
        pageNumber: page.pageNumber,
        viewBoxes: [],
        textRanges: []
      });
    }
    // use this to know if processing is done
    await existsElseMake(path.join(dir, "userSegments.json"), {
      numberOfPages: pdf.numPages,
      createdOn: new Date()
    });
    // use this to know if processing is done
    await existsElseMake(path.join(dir, "linesOfText.json"), {
      numberOfPages: pdf.numPages,
      createdOn: new Date()
    });
  }
  // console.timeEnd("time");
};

// export const fontStats = (pages: []) => {
//   //PageToDisplay
//   // todo use this for better line detection threshold. uses page median now.
//   const makeHistogram = histogram();
//   let _fontHeights = flatten<any>(pages.map(p => p)).map(t =>
//     roundedToFixed(t.fontHeight, 2)
//   );
//   let fontHeights = unique(_fontHeights).sort();
//   let height2color = fontHeights.reduce((res, height, ix) => {
//     return { ...res, [height + ""]: brewer12[ix % 12] };
//   }, {});

//   let _fontNames = flatten<TextItemToDisplay>(
//     (pages as TextItemToDisplay[]).map(p => p.fontName) //was p.text
//   ).map(t => t.style.fontFamily);

//   let fontNames = unique(_fontNames).sort();
//   let fontNames2color = fontNames.reduce((res, name, ix) => {
//     return { ...res, [name + ""]: brewer12[ix % 12] };
//   }, {});
// };

export const getLeftEdgeOfColumns = (pages: PageOfText[]) => {
  const leftXs = flatten<TextItemToDisplay>(pages.map(p => p.text)).map(
    t => t.left
  );
  const makeHistogram = histogram();
  const leftXHist = makeHistogram(leftXs);
  const leftXBinCounts = leftXHist.map(x => x.length);
  if (leftXBinCounts) {
    const leftXMean = mean(leftXBinCounts) || NaN;
    const leftXStd = deviation(leftXBinCounts) || NaN;
    const leftXZscore = leftXBinCounts.map(x => (x - leftXMean) / leftXStd);
    const zThresh = 1;
    const columnLefts = leftXBinCounts.reduce((all, _val, ix) => {
      if (leftXZscore[ix] > zThresh) {
        all.push(median(leftXHist[ix]));
        return all;
      } else {
        return all;
      }
    }, []);
    return columnLefts;
  }
  return [NaN];
};

export const loadPageJson = async (
  dir: string,
  filePrefix: "textToDisplay" | "linesOfText" | "userSegments",
  pageNumbersToLoad: number[] = []
) => {
  // todo: make sure filePrefix + ".json" gets made when all pages are done
  await existsElseMake(
    path.join(dir, filePrefix + ".json"),
    preprocessPdfs([dir])
  );
  const finalFile = await jsonfile.readFile(
    path.join(dir, filePrefix + ".json")
  );
  const numberOfPages = finalFile.numberOfPages;
  const pageNumbers = checkGetPageNumsToLoad(numberOfPages, pageNumbersToLoad);

  let pages = [];
  for (let pageNum of pageNumbers) {
    const pageId = zeroPad(pageNum, 4);
    const page = await jsonfile.readFile(
      `${dir}/${filePrefix}-page${pageId}.json`
    ); //todo PageToDisplay type
    pages.push(page);
  }
  return pages; // sorted by page number
};

export const getLines = (
  columnLefts: number[],
  textItems: TextItemToDisplay[],
  pageNumber: number
) => {
  // so we've got the left side of columns detected by now
  // in a column we get all y values of text items
  // then sort the y vals, and combine y vals within some dist of eachother
  // then sort by x coord to get text order for items in a line

  const nCols = columnLefts.length;
  const textByColumn = columnLefts.map((left, i) => {
    const rightEdge = i < nCols - 1 ? columnLefts[i + 1] : Infinity;
    return textItems.filter(t => {
      const textLeft = Math.round(t.left);
      return left <= textLeft && textLeft < rightEdge && t.str !== " ";
    }); // removing spaces here, may need these for later formating
  });

  const medianFontHeight = Math.round(
    // @ts-ignore
    median(
      textItems.map(t => {
        return t.fontHeight;
      })
    )
  );

  let columnsLinesTextItems = [];
  for (var col of textByColumn) {
    const uniqueTops = [...new Set(col.map(t => Math.round(t.top)))].sort();
    let firstLine = col.find(x => Math.round(x.top) === uniqueTops[0]);
    let loopState = { count: 0, lines: [[firstLine]] };

    // combine tops within threshold
    const threshold = medianFontHeight / 2;
    for (let i = 1; i < uniqueTops.length; i++) {
      const prev = uniqueTops[i - 1];
      const current = uniqueTops[i];
      const textItems = col.filter(x => Math.round(x.top) === current);
      if (Math.abs(prev - current) < threshold) {
        loopState.lines[loopState.count].push(...textItems);
      } else {
        loopState.lines[loopState.count].sort(sortBy("left"));
        // if need performance, combine textitems here
        loopState.count++;
        loopState.lines.push([]);
        loopState.lines[loopState.count].push(...textItems);
      }
    }
    columnsLinesTextItems.push(loopState.lines);
  }

  // combine text items into a line with bounding box
  const linesInColumns: LineOfText[][] = columnsLinesTextItems.map(
    (col, colIx) => {
      return col.map((line, lineIndex) => {
        const nTextItems = line.length;
        return line.reduce(
          (all, text, i) => {
            if (!text) return all;
            if (i === 0) {
              // first
              return {
                id: `line${lineIndex}-col${colIx}`,
                pageNumber: pageNumber,
                columnIndex: colIx,
                lineIndex: lineIndex,
                left: text.left,
                top: text.top,
                height: text.transform[0],
                width: text.width,
                text: text.str,
                textIds: [text.id]
              };
            } else if (i === nTextItems - 1 && nTextItems > 1) {
              return {
                ...all,
                width: text.left + text.width - all.left,
                text: all.text + text.str,
                textIds: all.textIds.concat(text.id)
              };
            } else {
              // middle
              return {
                ...all,
                top: Math.min(text.top, all.top),
                height: Math.max(text.transform[0], all.height),
                text: all.text + text.str,
                textIds: all.textIds.concat(text.id)
              };
            }
          },
          {} as LineOfText
        );
      });
    }
  );

  linesInColumns.forEach(col => {
    col.sort(sortBy("top"));
  });

  return flatten<LineOfText>(linesInColumns);
};

// export const getImageFiles = async (page, viewport, scale = 1) => {
//   const opList = await page.getOperatorList();
//   let svgGfx = new pdfjs.SVGGraphics(page.commonObjs, page.objs);
//   svgGfx.embedFonts = true;
//   const svg = await svgGfx.getSVG(opList, viewport); //in svg:img elements

//   const imgs = svg.querySelectorAll("svg image") as HTMLOrSVGImageElement[];
//   // document.body.append(svg)
//   let images = [] as Image[];
//   for (let img of imgs) {
//     if (!img) continue;
//     images.push({
//       x: img.getAttribute("x") * scale,
//       y: img.getAttribute("y") * scale,
//       width: img.getAttribute("width") * scale,
//       height: img.getAttribute("height") * scale,
//       "xlink:href": img.getAttribute("xlink:href"),
//       transform: img.getAttribute("transform"),
//       gTransform: img.parentNode.getAttribute("transform")
//     });
//   }
// };

export const checkGetPageNumsToLoad = (
  numPages,
  pageNumbersToLoad: number[]
) => {
  const allPageNumbers = [...Array(numPages).keys()].map(x => x + 1);
  const willLoadAllPages = pageNumbersToLoad.length === 0;
  const pageNumPropsOk =
    !willLoadAllPages &&
    Math.min(...pageNumbersToLoad) >= 0 &&
    Math.max(...pageNumbersToLoad) <= Math.max(...allPageNumbers);

  let pageNumbers;
  if (willLoadAllPages) {
    pageNumbers = allPageNumbers;
  } else {
    pageNumbers = pageNumPropsOk ? pageNumbersToLoad : allPageNumbers;
  }

  return pageNumbers;
};

export const loadPdfPages = async (
  path: string,
  pageNumbersToLoad: number[] = [],
  scale = 1
) => {
  // note this way doesn't work with osx+pdfjs+electron
  //          const pdf = await pdfjs.getDocument(path);
  var data = new Uint8Array(fs.readFileSync(path));
  const pdf = await pdfjs.getDocument({ data });

  const pageNumbers = checkGetPageNumsToLoad(pdf.numPages, pageNumbersToLoad);
  let pages = [] as _pdfjs.PDFPageProxy[];
  for (const pageNumber of pageNumbers) {
    const page = await pdf.getPage(pageNumber);
    pages.push(page);
  }
  return pages;
};

export interface Image {
  x: string;
  y: string;
  width: string;
  height: string;
  "xlink:href": string;
  transform: string;
  gTransform: string;
}

export type PageOfText = {
  pageNumber: number;
  text: TextItemToDisplay[];
  viewportFlat: {
    width: number;
    height: number;
    xMin: number;
    yMin: number;
    xMax: number;
    yMax: number;
  };
};

export type TextItemToDisplay = {
  str: string; // the text
  dir: string; // text direction
  width: number;
  transform: number[]; // [fontheight, rotation?, rotation?, fontwidth, x, y ]
  id: string; // we made this
  top: number;
  left: number;
  fallbackFontName: string;
  style: { fontFamily: string; ascent: number; descent: number };
  fontHeight: number;
  fontWidth: number;
  fontName: string;
  scaleX: number;
};

export interface LineOfText {
  id: string;
  // pageId: number;
  lineIndex: number;
  columnIndex: number;
  left: number;
  top: number;
  width: number;
  height: number;
  text: string;
  textIds: string[];
}
